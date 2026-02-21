// DOM Elements
const loader = document.getElementById('loader');
const authSection = document.getElementById('auth-section');
const dashboardSection = document.getElementById('dashboard-section');
const loginForm = document.getElementById('login-form');
const registerForm = document.getElementById('register-form');
const reportModal = document.getElementById('report-modal');

// Map & Sockets
let map;
let socket;
let reportMarkers = {};
let currentPos = { lat: 0, lng: 0 };

// Initialize App
document.addEventListener('DOMContentLoaded', () => {
    initMap();
    checkAuth();
    setupListeners();
});

// Auth Logic
function checkAuth() {
    if (authToken && currentUser) {
        authSection.classList.add('hidden');
        dashboardSection.classList.remove('hidden');
        document.getElementById('user-name-display').innerText = currentUser.name;
        document.getElementById('user-role-badge').innerText = currentUser.role;
        initAppLogic();
    } else {
        authSection.classList.remove('hidden');
        dashboardSection.classList.add('hidden');
    }
    setTimeout(() => loader.classList.remove('active'), 800);
}

function switchTab(tab) {
    if (tab === 'login') {
        loginForm.classList.add('active'); loginForm.classList.remove('hidden');
        registerForm.classList.remove('active'); registerForm.classList.add('hidden');
    } else {
        registerForm.classList.add('active'); registerForm.classList.remove('hidden');
        loginForm.classList.remove('active'); loginForm.classList.add('hidden');
    }
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.toggle('active'));
}

// Set Up Listeners
function setupListeners() {
    document.getElementById('logout-btn').addEventListener('click', () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.reload();
    });

    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        loader.classList.add('active');
        try {
            const data = await loginUser(
                document.getElementById('login-email').value,
                document.getElementById('login-password').value
            );
            authToken = data.token; currentUser = data.user;
            localStorage.setItem('token', authToken); localStorage.setItem('user', JSON.stringify(currentUser));
            checkAuth();
        } catch (err) { }
        loader.classList.remove('active');
    });

    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        loader.classList.add('active');
        try {
            const data = await registerUser(
                document.getElementById('reg-name').value,
                document.getElementById('reg-email').value,
                document.getElementById('reg-password').value,
                document.getElementById('reg-role').value
            );
            authToken = data.token; currentUser = data.user;
            localStorage.setItem('token', authToken); localStorage.setItem('user', JSON.stringify(currentUser));
            checkAuth();
        } catch (err) { }
        loader.classList.remove('active');
    });

    document.getElementById('btn-report').addEventListener('click', () => {
        reportModal.classList.remove('hidden');
        navigator.geolocation.getCurrentPosition(
            pos => {
                currentPos.lat = pos.coords.latitude; currentPos.lng = pos.coords.longitude;
                document.getElementById('req-loc').value = `${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)}`;
            },
            err => alert("Location permission required.")
        );
    });

    document.getElementById('report-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const payload = {
            title: document.getElementById('req-title').value,
            description: document.getElementById('req-desc').value,
            type: document.getElementById('req-type').value,
            severity: document.getElementById('req-severity').value,
            coordinates: [currentPos.lng, currentPos.lat]
        };
        try {
            await submitReport(payload);
            closeReportModal();
            document.getElementById('report-form').reset();
            alert("Report submitted successfully!");
        } catch (e) { alert(e.message); }
    });
}

function closeReportModal() { reportModal.classList.add('hidden'); }

// Map Initialization
function initMap() {
    map = L.map('map', { zoomControl: false }).setView([20.5937, 78.9629], 5); // Default to India roughly
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors'
    }).addTo(map);
    L.control.zoom({ position: 'bottomright' }).addTo(map);

    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(pos => {
            currentPos = { lat: pos.coords.latitude, lng: pos.coords.longitude };
            map.flyTo([currentPos.lat, currentPos.lng], 12);
        });
    }
}

// Full App Logic (Post Login)
async function initAppLogic() {
    socket = io('http://localhost:5000');

    socket.on('newReport', (report) => {
        console.log('New report received:', report);
        addReportToMap(report);
        addFeedItem(report);
        loadStats();
    });

    socket.on('reportVerified', (report) => loadStats());
    socket.on('newDangerZone', (zone) => loadZones());
    socket.on('volunteerMoved', (vol) => updateVolunteerMarker(vol));
    socket.on('newResource', (res) => loadInitialData());

    loadStats();
    loadInitialData();

    // If I am a volunteer, broadcast my location every 15 seconds
    if (currentUser.role === 'volunteer') {
        setInterval(() => {
            navigator.geolocation.getCurrentPosition(async pos => {
                try {
                    await fetch(`${BASE_URL}/advanced/location`, {
                        method: 'POST',
                        headers: getHeaders(),
                        body: JSON.stringify({ coordinates: [pos.coords.longitude, pos.coords.latitude] })
                    });
                } catch (e) { }
            });
        }, 15000);
    }
}

async function loadStats() {
    try {
        const stats = await fetchStats();
        document.getElementById('stat-total').innerText = stats.totalReports || 0;
        document.getElementById('stat-active').innerText = stats.activeIncidents || 0;
    } catch (e) { }
}

async function loadInitialData() {
    try {
        const reports = await fetchReports();
        document.getElementById('feed-container').innerHTML = '';
        reports.forEach(r => {
            addReportToMap(r);
            addFeedItem(r);
        });
        loadZones();
        loadVolunteers();
        loadResources();
    } catch (e) { }
}

let volunteerMarkers = {};
async function loadVolunteers() {
    if (currentUser.role === 'citizen') return; // Citizens don't see raw volunteers
    try {
        const res = await fetch(`${BASE_URL}/advanced/volunteers`);
        const volunteers = await res.json();
        volunteers.forEach(v => updateVolunteerMarker(v));
    } catch (e) { }
}

function updateVolunteerMarker(vol) {
    if (currentUser.role === 'citizen') return;
    if (volunteerMarkers[vol.userId._id || vol.userId]) {
        map.removeLayer(volunteerMarkers[vol.userId._id || vol.userId]);
    }
    const color = 'green';
    const icon = L.divIcon({
        className: 'custom-div-icon',
        html: `<div style='background-color:${color}; width:15px; height:15px; border-radius:50%; border:2px solid white; box-shadow: 0 0 10px ${color};'></div>`,
        iconSize: [15, 15],
    });
    const marker = L.marker([vol.location.coordinates[1], vol.location.coordinates[0]], { icon }).addTo(map);
    marker.bindPopup(`<b>Volunteer</b><br>${vol.userId.name || 'Responder'}`);
    volunteerMarkers[vol.userId._id || vol.userId] = marker;
}

async function loadResources() {
    try {
        const res = await fetch(`${BASE_URL}/advanced/resource`);
        const resources = await res.json();
        resources.forEach(r => {
            const icon = L.divIcon({
                className: 'custom-div-icon',
                html: `<div style='background-color:#4V7A; width:18px; height:18px; border-radius:4px; border:2px solid black; display:flex; justify-content:center; align-items:center; color:white; font-size:10px;'>+</div>`,
            });
            L.marker([r.location.coordinates[1], r.location.coordinates[0]], { icon }).addTo(map)
                .bindPopup(`<b>Resource: ${r.name}</b><br>Type: ${r.type}<br>Quantity: ${r.quantity}`);
        });
    } catch (e) { }
}

async function loadZones() {
    try {
        const zones = await fetchZones();
        zones.forEach(z => {
            if (z.area && z.area.coordinates) {
                const latlngs = z.area.coordinates[0].map(coord => [coord[1], coord[0]]);
                const color = z.type === 'safe' ? '#10b981' : '#f03';
                L.polygon(latlngs, {
                    color: color,
                    fillColor: color,
                    fillOpacity: 0.3
                }).addTo(map).bindPopup(`<b>${z.type === 'safe' ? 'SAFE ZONE' : 'DANGER ZONE'}</b><br>${z.name}`);
            }
        });
    } catch (e) { }
}

function addReportToMap(report) {
    if (!report.location || !report.location.coordinates) return;
    const [lng, lat] = report.location.coordinates;
    const color = report.severity === 'critical' ? 'red' : report.severity === 'high' ? 'orange' : 'blue';

    // Create custom icon
    const icon = L.divIcon({
        className: 'custom-div-icon',
        html: `<div style='background-color:${color}; width:20px; height:20px; border-radius:50%; border:2px solid white; box-shadow: 0 0 10px ${color};'></div>`,
        iconSize: [20, 20],
        iconAnchor: [10, 10]
    });

    const marker = L.marker([lat, lng], { icon }).addTo(map);
    marker.bindPopup(`<b>${report.title}</b><br>${report.description}<br><i>Type: ${report.type}</i>`);
    reportMarkers[report._id] = marker;
}

function addFeedItem(report) {
    const feed = document.getElementById('feed-container');
    const div = document.createElement('div');
    div.className = `feed-item ${report.severity}`;
    div.innerHTML = `
        <h5>${report.title} <span class="status-badge status-${report.status}">${report.status}</span></h5>
        <p>${report.description}</p>
        <p style="margin-top: 5px; font-size: 0.75rem; color: #888;">Type: ${report.type} | Dupes: ${report.duplicateCount || 0}</p>
    `;
    div.onclick = () => {
        if (report.location && report.location.coordinates) {
            map.flyTo([report.location.coordinates[1], report.location.coordinates[0]], 15);
        }
    };
    feed.prepend(div);
}

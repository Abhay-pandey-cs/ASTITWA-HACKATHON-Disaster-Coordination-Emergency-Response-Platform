const BASE_URL = 'http://localhost:5000/api';
let authToken = localStorage.getItem('token');
let currentUser = JSON.parse(localStorage.getItem('user'));

const getHeaders = () => {
    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
    };
};

async function loginUser(email, password) {
    try {
        const res = await fetch(`${BASE_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        if (!res.ok) {
            const err = await res.json();
            throw new Error(err.message || 'Login failed');
        }
        return res.json();
    } catch (e) {
        alert(e.message);
        throw e;
    }
}

async function registerUser(name, email, password, role) {
    try {
        const res = await fetch(`${BASE_URL}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, email, password, role })
        });
        if (!res.ok) {
            const err = await res.json();
            throw new Error(err.message || 'Registration failed');
        }
        return res.json();
    } catch (e) {
        alert(e.message);
        throw e;
    }
}

async function fetchStats() {
    const res = await fetch(`${BASE_URL}/analytics/stats`, { headers: getHeaders() });
    return res.json();
}

async function fetchReports() {
    const res = await fetch(`${BASE_URL}/reports`, { headers: getHeaders() });
    return res.json();
}

async function fetchZones() {
    const res = await fetch(`${BASE_URL}/zones`, { headers: getHeaders() });
    return res.json();
}

async function submitReport(reportData) {
    const res = await fetch(`${BASE_URL}/reports`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(reportData)
    });
    if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || 'Failed to report');
    }
    return res.json();
}

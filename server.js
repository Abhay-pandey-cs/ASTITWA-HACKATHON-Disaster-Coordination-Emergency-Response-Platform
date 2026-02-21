require('dotenv').config();
const express = require('express');
const http = require('http');
const mongoose = require('mongoose');
const cors = require('cors');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
    cors: { origin: '*' }
});

// Middleware
app.use(express.json());
app.use(cors());

// Make io accessible to routers
app.set('io', io);

// Database Connection
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/disasterDB')
    .then(() => console.log('MongoDB Connected...'))
    .catch(err => console.error('MongoDB Connection Error:', err));

// Sockets
io.on('connection', (socket) => {
    console.log(`New client connected: ${socket.id}`);
    socket.on('disconnect', () => {
        console.log(`Client disconnected: ${socket.id}`);
    });
});

// Routes
app.use('/api/auth', require('./src/routes/authRoutes'));
app.use('/api/reports', require('./src/routes/reportRoutes'));
app.use('/api/zones', require('./src/routes/zoneRoutes'));
app.use('/api/analytics', require('./src/routes/analyticsRoutes'));
app.use('/api/advanced', require('./src/routes/advancedRoutes'));

app.get('/', (req, res) => {
    res.send('Disaster Response API is running...');
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));

# CrisisSync: Disaster Coordination & Emergency Response

This project contains the complete, integrated Backend and Frontend for a real-time Disaster Coordination platform. 

## Features Integrated
1. **Real-time Map Integration**: Leaflet maps via CDN with location auto-detection.
2. **WebSockets (Socket.io)**: Live incident feed without refreshing the page.
3. **Authentication**: JWT & Role-Based access (Citizen, Volunteer, Authority).
4. **Intelligent Routing**: Auto-assignment mechanism picking nearest volunteers.
5. **Glassmorphism UI**: High-end premium dark mode design.

## Prerequisites
Since `node` or `npm` was not found in your terminal environment during the setup, you must ensure you have Node.js installed to run this project.

1. Download and install Node.js from [nodejs.org](https://nodejs.org/) (if you haven't already).
2. You also need MongoDB running locally OR set a `MONGO_URI` environment variable pointing to MongoDB Atlas.

## How to Run the Backend
1. Open a new terminal / command prompt.
2. Navigate to this directory: `cd project-folder-name`
3. Install dependencies:
   ```bash
   npm install express mongoose socket.io dotenv bcryptjs jsonwebtoken cors
   ```
4. Start the server:
   ```bash
   node server.js
   ```
   *The server will run on `http://localhost:5000`*

## How to Run the Frontend
The frontend is built with pure, highly optimized HTML/CSS/JS (Vanilla). No build step required!
1. Simply navigate to the `frontend` folder: `cd frontend`
2. Double-click **`index.html`** to open it in your web browser.
3. Once opened, you can create a user, login, and start interacting with the real-time map!

## Test the Integration
1. Register a new user as an `authority`.
2. Keep the page open. Open an "Incognito" window and register another user as a `citizen`.
3. From the citizen window, click **"Report Emergency"**.
4. Watch the `authority` window update its Map and Live Feed instantly without refreshing!

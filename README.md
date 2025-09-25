# Tea Plantation Management System

A web-based management system for tea plantation operations, built as part of our ITP coursework. The system helps manage different aspects of tea plantation operations from field supervision to production and inventory management.

## What This System Does

This project manages tea plantation operations through different user roles:

**Admin Dashboard**
- Manage system users and their roles
- Configure plantation fields
- Send notifications to workers

**Field Supervisor Functions**
- Track worker attendance with QR code scanning
- Assign daily tasks to workers
- Record field incidents and pest problems
- Monitor plucking records

**Production Manager Tools**
- Create and track production batches
- Manage transport and vehicle tracking
- Generate production reports
- Monitor quality metrics

**Inventory Manager Features**
- Track tools and equipment
- Manage fertilizer and nutrient supplies
- Monitor stock levels
- Generate inventory reports

**Worker Interface**
- View assigned tasks
- Submit field reports
- Check attendance records

## Key Features

- **User Authentication**: Secure login system with different roles
- **Attendance System**: QR code-based attendance tracking
- **GPS Tracking**: Real-time vehicle location monitoring
- **Mobile Support**: Works on phones and tablets for field use
- **Report Generation**: PDF reports for production and inventory
- **Network Access**: Can be accessed from multiple devices on same network

## Technologies Used

**Frontend**: React.js, Tailwind CSS, Vite
**Backend**: Node.js, Express.js
**Database**: MongoDB
**Maps**: Leaflet for GPS tracking
**Authentication**: JWT tokens

## Setup Instructions

**Prerequisites**
- Node.js installed
- MongoDB running
- Git

**Installation Steps**

1. Clone this project
```bash
git clone https://github.com/DilshaPrathibha/Tea-Plantation-Management-System.git
```

2. Setup Backend
```bash
cd BACKEND
npm install
npm run dev
```

3. Setup Frontend (new terminal)
```bash
cd FRONTEND
npm install
npm run dev
```

4. Access the application
- Main app: http://localhost:5173
- API server: http://localhost:5001

## Network Access

For testing on mobile devices or accessing from other computers:

1. Run `node network-info.js` to see network URLs
2. Or use `setup-lan.bat` on Windows
3. Connect devices to same WiFi network
4. Use the network IP address (e.g., http://192.168.1.100:5173)

## Project Structure

```
BACKEND/         - Node.js API server
  src/
    controllers/ - Business logic
    models/      - Database models
    routes/      - API endpoints
    server.js    - Main server file

FRONTEND/        - React application
  src/
    components/  - Reusable UI components
    pages/       - Application pages
    layouts/     - Page layouts for different roles
    App.jsx      - Main app component
```

## Testing the System

1. Start both backend and frontend servers
2. Create admin user through database or registration
3. Login and create other user types
4. Test different role functionalities
5. Try mobile access using network URLs

## Known Issues

- GPS tracking requires HTTPS in production
- Some features need proper MongoDB setup
- Mobile UI works best on newer devices

## Future Improvements

- Add more detailed analytics
- Implement push notifications
- Add data export features
- Improve mobile GPS accuracy

This system demonstrates full-stack web development skills including database design, API development, user authentication, and responsive UI design.

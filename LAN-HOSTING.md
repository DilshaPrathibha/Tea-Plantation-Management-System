# Network Access Guide

This guide explains how to access the Tea Plantation Management System from mobile devices and other computers on your network.

## Why Use Network Access?

- Test the system on real mobile devices
- Multiple people can access the system simultaneously 
- Field supervisors can use tablets in the plantation
- Production managers can track vehicles on mobile phones

## Setup Steps

1. **Start the servers**
```bash
# Backend server
cd BACKEND
npm run dev

# Frontend server (new terminal)
cd FRONTEND  
npm run dev
```

2. **Get your network IP address**
```bash
node network-info.js
```

3. **Access from other devices**
- Connect phone/tablet to same WiFi network
- Open browser and go to the network URL
- Example: `http://192.168.1.100:5173`

## Quick Setup (Windows)

Double-click `setup-lan.bat` to see your network URLs automatically.

## Troubleshooting

**Can't access from phone?**
- Check if Windows Firewall is blocking ports 5173 and 5001
- Make sure phone is on same WiFi network
- Try different network IP shown in network-info.js

**Port already in use?**
```bash
netstat -ano | findstr :5173
taskkill /PID [PID_NUMBER] /F
```

## Technical Details

The system is configured to:
- Accept connections from any device on local network
- Automatically detect correct API endpoints
- Work with common network configurations (192.168.x.x, 10.x.x.x)

This setup is perfect for testing mobile responsiveness and multi-user scenarios during development.
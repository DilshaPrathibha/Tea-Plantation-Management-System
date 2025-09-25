# Tea Plantation Management System
ITP Project

## 🌐 Network Access (NEW!)

This application now supports **LAN hosting** - access from any device on your network!

### Quick Start
```bash
# Check your network URLs
node network-info.js

# Or use the setup script
setup-lan.bat
```

### Access from Other Devices
- **Phones, Tablets, Other PCs** - all supported!
- Connect to same WiFi network
- Use the network URLs shown by `network-info.js`
- Example: `http://192.168.1.100:5173`

📖 **Full Documentation**: See [LAN-HOSTING.md](LAN-HOSTING.md) for complete setup guide.

---

## Development Setup

### Prerequisites
- Node.js
- MongoDB
- npm

### Installation
```bash
# Backend
cd BACKEND
npm install
npm run dev

# Frontend  
cd FRONTEND
npm install
npm run dev
```

### Local Access
- Frontend: http://localhost:5173
- Backend: http://localhost:5001

### Network Access
- Run `node network-info.js` to see all available URLs
- Perfect for mobile testing and team collaboration

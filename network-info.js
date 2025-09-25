#!/usr/bin/env node

const os = require('os');

console.log('\n🌐 Tea Plantation Management System - Network Access Information\n');

const frontendPort = 5173;
const backendPort = 5001;

// Get network interfaces
const networkInterfaces = os.networkInterfaces();

console.log('📱 Frontend (React App) Access URLs:');
console.log(`   Local: http://localhost:${frontendPort}`);
console.log(`   Local: http://127.0.0.1:${frontendPort}`);

Object.keys(networkInterfaces).forEach((interfaceName) => {
  const interfaces = networkInterfaces[interfaceName];
  interfaces.forEach((interface) => {
    if (interface.family === 'IPv4' && !interface.internal) {
      console.log(`   Network: http://${interface.address}:${frontendPort}`);
    }
  });
});

console.log('\n🔧 Backend (API Server) Access URLs:');
console.log(`   Local: http://localhost:${backendPort}`);
console.log(`   Local: http://127.0.0.1:${backendPort}`);

Object.keys(networkInterfaces).forEach((interfaceName) => {
  const interfaces = networkInterfaces[interfaceName];
  interfaces.forEach((interface) => {
    if (interface.family === 'IPv4' && !interface.internal) {
      console.log(`   Network: http://${interface.address}:${backendPort}`);
    }
  });
});

console.log('\n📋 How to Access from Other Devices:');
console.log('   1. Make sure all devices are on the same network (WiFi/LAN)');
console.log('   2. Use the "Network" URLs shown above on other devices');
console.log('   3. Make sure Windows Firewall allows the ports 5173 and 5001');
console.log('   4. Start both frontend and backend servers first');
console.log('\n💡 Tips:');
console.log('   • Frontend: npm run dev (in FRONTEND folder)');
console.log('   • Backend: npm run dev (in BACKEND folder)');
console.log('   • Access from phone/tablet using the Network URLs');
console.log('');
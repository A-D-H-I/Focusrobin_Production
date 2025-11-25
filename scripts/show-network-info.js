const os = require('os');

function getLocalIP() {
  const interfaces = os.networkInterfaces();
  
  // Check all network interfaces
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      // Skip internal (loopback) and non-IPv4 addresses
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  
  // Fallback to localhost if no network interface found
  return 'localhost';
}

const port = process.env.PORT || 9002;
const localIP = getLocalIP();

console.log('\n' + '='.repeat(50));
console.log('🚀 Next.js Dev Server');
console.log('='.repeat(50));
console.log(`📱 Local:        http://localhost:${port}`);
console.log(`🌐 Network:      http://${localIP}:${port}`);
console.log('='.repeat(50) + '\n');


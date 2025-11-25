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

console.log(getLocalIP());


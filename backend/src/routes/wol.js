import express from 'express';
import dgram from 'dgram';

export const wolRouter = express.Router();

// Create magic packet for Wake on LAN
function createMagicPacket(macAddress) {
  const mac = macAddress.replace(/[:-]/g, '').toLowerCase();
  if (mac.length !== 12) {
    throw new Error('Invalid MAC address format');
  }
  
  const macBytes = [];
  for (let i = 0; i < 12; i += 2) {
    macBytes.push(parseInt(mac.substr(i, 2), 16));
  }
  
  // Magic packet: 6 bytes of 0xFF followed by 16 repetitions of the MAC address
  const packet = Buffer.alloc(6 + 16 * 6);
  for (let i = 0; i < 6; i++) {
    packet[i] = 0xFF;
  }
  
  for (let i = 0; i < 16; i++) {
    for (let j = 0; j < 6; j++) {
      packet[6 + i * 6 + j] = macBytes[j];
    }
  }
  
  return packet;
}

// Send Wake on LAN packet
wolRouter.post('/:id', async (req, res) => {
  try {
    const storage = req.app.locals.storage;
    const machine = await storage.getMachine(req.params.id);
    
    if (!machine) {
      return res.status(404).json({ error: 'Machine not found' });
    }
    
    if (!machine.macAddress) {
      return res.status(400).json({ error: 'MAC address not configured for this machine' });
    }
    
    const magicPacket = createMagicPacket(machine.macAddress);
    const client = dgram.createSocket('udp4');
    const address = machine.wolAddress || '255.255.255.255';
    const port = machine.wolPort || 9;
    
    client.send(magicPacket, 0, magicPacket.length, port, address, (err) => {
      client.close();
      
      if (err) {
        console.error('WOL error:', err);
        return res.status(500).json({ error: 'Failed to send WOL packet: ' + err.message });
      }
      
      res.json({ 
        success: true, 
        message: `Wake on LAN packet sent to ${machine.name}`,
        macAddress: machine.macAddress,
        timestamp: new Date().toISOString()
      });
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

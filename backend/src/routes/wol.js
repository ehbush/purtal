import express from 'express';
import { logError } from '../utils/logger.js';
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
    const client = await storage.getClient(req.params.id);
    
    if (!client) {
      return res.status(404).json({ error: 'Client not found' });
    }
    
    if (!client.macAddress) {
      return res.status(400).json({ error: 'MAC address not configured for this client' });
    }
    
    const magicPacket = createMagicPacket(client.macAddress);
    const socket = dgram.createSocket('udp4');
    const address = client.wolAddress || '255.255.255.255';
    const port = client.wolPort || 9;
    
    socket.send(magicPacket, 0, magicPacket.length, port, address, (err) => {
      socket.close();
      
      if (err) {
        logError(err, {
          route: '/api/wol/:id',
          method: 'POST',
          clientId: req.params.id
        });
        return res.status(500).json({ error: 'Failed to send WOL packet: ' + err.message });
      }
      
      res.json({ 
        success: true, 
        message: `Wake on LAN packet sent to ${client.name}`,
        macAddress: client.macAddress,
        timestamp: new Date().toISOString()
      });
    });
  } catch (error) {
    logError(error, {
      route: '/api/wol/:id',
      method: 'POST',
      clientId: req.params.id
    });
    res.status(500).json({ error: error.message });
  }
});

import { Client } from 'ssh2';

export function setupSSHRoutes(app) {
  // WebSocket endpoint for SSH connections
  app.ws('/api/ssh/:id/connect', async (ws, req) => {
    const machineId = req.params.id;
    const storage = req.app.locals.storage;
    
    try {
      const machine = await storage.getMachine(machineId);
      
      if (!machine) {
        ws.close(1008, 'Machine not found');
        return;
      }
      
      if (!machine.ssh || !machine.ssh.enabled) {
        ws.close(1008, 'SSH not enabled for this machine');
        return;
      }
      
      const sshConfig = {
        host: machine.ssh.host || machine.ipAddress,
        port: machine.ssh.port || 22,
        username: machine.ssh.username,
        ...(machine.ssh.password && { password: machine.ssh.password }),
        ...(machine.ssh.privateKey && { privateKey: machine.ssh.privateKey }),
        ...(machine.ssh.passphrase && { passphrase: machine.ssh.passphrase }),
        readyTimeout: 20000
      };
      
      const conn = new Client();
      
      conn.on('ready', () => {
        console.log(`SSH connection established to ${machine.name}`);
        ws.send(JSON.stringify({ type: 'connected', message: 'SSH connection established' }));
        
        conn.shell((err, stream) => {
          if (err) {
            ws.send(JSON.stringify({ type: 'error', message: err.message }));
            conn.end();
            return;
          }
          
          // Forward terminal data
          stream.on('data', (data) => {
            ws.send(JSON.stringify({ type: 'data', data: data.toString() }));
          });
          
          stream.on('close', () => {
            ws.send(JSON.stringify({ type: 'close' }));
            conn.end();
          });
          
          // Handle incoming WebSocket messages
          ws.on('message', (message) => {
            try {
              const msg = JSON.parse(message);
              if (msg.type === 'input' && stream.writable) {
                stream.write(msg.data);
              } else if (msg.type === 'resize') {
                // Resize terminal window
                try {
                  stream.setWindow(msg.rows, msg.cols, null, null);
                } catch (err) {
                  // setWindow might not be available, ignore
                }
              }
            } catch (error) {
              console.error('Error handling WebSocket message:', error);
            }
          });
          
          ws.on('close', () => {
            stream.end();
            conn.end();
          });
        });
      });
      
      conn.on('error', (err) => {
        console.error('SSH connection error:', err);
        ws.send(JSON.stringify({ type: 'error', message: err.message }));
        ws.close();
      });
      
      conn.connect(sshConfig);
      
    } catch (error) {
      console.error('SSH setup error:', error);
      ws.send(JSON.stringify({ type: 'error', message: error.message }));
      ws.close();
    }
  });
}

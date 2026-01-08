import { useEffect, useRef, useState } from 'react';
import { Terminal as XTerm } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';
import 'xterm/css/xterm.css';

export default function SSHTerminal({ clientId, clientName }) {
  const terminalRef = useRef(null);
  const wsRef = useRef(null);
  const xtermRef = useRef(null);
  const fitAddonRef = useRef(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (!terminalRef.current) return;

    // Initialize xterm
    const xterm = new XTerm({
      cursorBlink: true,
      fontSize: 14,
      fontFamily: 'Consolas, "Courier New", monospace',
      theme: {
        background: '#1e1e1e',
        foreground: '#d4d4d4',
        cursor: '#aeafad',
        selection: '#264f78'
      }
    });

    const fitAddon = new FitAddon();
    xterm.loadAddon(fitAddon);
    xterm.open(terminalRef.current);
    fitAddon.fit();

    xtermRef.current = xterm;
    fitAddonRef.current = fitAddon;

    // Connect WebSocket
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/api/ssh/${clientId}/connect`;
    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      console.log('SSH WebSocket connected');
      setConnected(true);
    };

    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        
        if (message.type === 'connected') {
          xterm.writeln(`\r\n${message.message}\r\n`);
        } else if (message.type === 'data') {
          xterm.write(message.data);
        } else if (message.type === 'error') {
          xterm.writeln(`\r\n\x1b[31mError: ${message.message}\x1b[0m\r\n`);
        } else if (message.type === 'close') {
          xterm.writeln('\r\n\x1b[33mConnection closed\x1b[0m\r\n');
          setConnected(false);
        }
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      xterm.writeln('\r\n\x1b[31mConnection error\x1b[0m\r\n');
      setConnected(false);
    };

    ws.onclose = () => {
      console.log('SSH WebSocket closed');
      setConnected(false);
    };

    // Handle terminal input
    xterm.onData((data) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: 'input', data }));
      }
    });

    // Handle window resize
    const handleResize = () => {
      if (fitAddonRef.current) {
        fitAddonRef.current.fit();
        if (ws.readyState === WebSocket.OPEN && xtermRef.current) {
          const { cols, rows } = xtermRef.current;
          ws.send(JSON.stringify({ type: 'resize', cols, rows }));
        }
      }
    };

    window.addEventListener('resize', handleResize);
    wsRef.current = ws;

    return () => {
      window.removeEventListener('resize', handleResize);
      if (ws.readyState === WebSocket.OPEN) {
        ws.close();
      }
      xterm.dispose();
    };
  }, [clientId]);

  return (
    <div className="bg-black rounded-lg p-4 border border-gray-700">
      <div className="flex items-center justify-between mb-2">
        <span className="text-gray-400 text-sm">SSH Terminal - {clientName}</span>
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${connected ? 'bg-green-500' : 'bg-red-500'}`}></div>
          <span className="text-gray-400 text-xs">{connected ? 'Connected' : 'Disconnected'}</span>
        </div>
      </div>
      <div ref={terminalRef} className="w-full" style={{ minHeight: '400px' }}></div>
    </div>
  );
}

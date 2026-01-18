import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { Terminal as XTerm } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';
import 'xterm/css/xterm.css';

export default function SSHTerminalModal({ clientId, clientName, isOpen, onClose }) {
  const terminalRef = useRef(null);
  const wsRef = useRef(null);
  const xtermRef = useRef(null);
  const fitAddonRef = useRef(null);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!isOpen || !terminalRef.current) return;

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
    
    // Fit terminal to container - use multiple attempts to ensure proper sizing
    const fitTerminal = () => {
      if (fitAddon && terminalRef.current) {
        fitAddon.fit();
      }
    };
    
    // Fit immediately and after a short delay to handle any layout delays
    fitTerminal();
    setTimeout(fitTerminal, 100);
    setTimeout(fitTerminal, 300);

    xtermRef.current = xterm;
    fitAddonRef.current = fitAddon;

    // Connect WebSocket
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/api/ssh/${clientId}/connect`;
    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      console.log('SSH WebSocket connected');
      setConnected(true);
      setError(null);
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
          setError(message.message);
        } else if (message.type === 'close') {
          xterm.writeln('\r\n\x1b[33mConnection closed\x1b[0m\r\n');
          setConnected(false);
        }
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
        setError('Failed to parse server message');
      }
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      xterm.writeln('\r\n\x1b[31mConnection error\x1b[0m\r\n');
      setConnected(false);
      setError('WebSocket connection error');
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
      if (fitAddonRef.current && terminalRef.current) {
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
      if (xtermRef.current) {
        xtermRef.current.dispose();
      }
    };
  }, [isOpen, clientId]);

  if (!isOpen) return null;

  const modalContent = (
    <div className="fixed inset-0 z-[9999] bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div 
        className="absolute inset-4 bg-dark-bg rounded-lg shadow-2xl flex flex-col border border-dark-border"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-700 flex-shrink-0">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-semibold text-white">SSH Terminal - {clientName}</h2>
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${connected ? 'bg-green-500' : 'bg-red-500'}`}></div>
              <span className="text-gray-400 text-sm">{connected ? 'Connected' : 'Disconnected'}</span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-dark-surface rounded-lg text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Error message */}
        {error && (
          <div className="px-4 py-2 bg-red-900/50 border-b border-red-700 flex-shrink-0">
            <p className="text-red-300 text-sm">{error}</p>
          </div>
        )}

        {/* Terminal */}
        <div className="flex-1 p-4 overflow-hidden min-h-0">
          <div ref={terminalRef} className="w-full h-full"></div>
        </div>
      </div>
    </div>
  );

  // Render modal at document body level using portal to escape any parent container constraints
  return createPortal(modalContent, document.body);
}

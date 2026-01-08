import { Power, Terminal, Server } from 'lucide-react';
import { useState } from 'react';
import api from '../utils/api';
import SSHTerminal from './SSHTerminal';

export default function MachineCard({ machine }) {
  const [wolLoading, setWolLoading] = useState(false);
  const [showSSH, setShowSSH] = useState(false);

  const handleWakeOnLAN = async () => {
    setWolLoading(true);
    try {
      const response = await api.post(`/wol/${machine.id}`);
      alert(response.data.message || 'Wake on LAN packet sent successfully!');
    } catch (error) {
      alert('Error sending WOL packet: ' + (error.response?.data?.error || error.message));
    } finally {
      setWolLoading(false);
    }
  };

  return (
    <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-6 border-2 border-gray-700">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-lg bg-blue-600 flex items-center justify-center text-white">
            <Server className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-white font-semibold text-lg">{machine.name}</h3>
            {machine.ipAddress && (
              <span className="text-gray-400 text-sm">{machine.ipAddress}</span>
            )}
            {machine.category && (
              <span className="text-gray-400 text-sm ml-2">• {machine.category}</span>
            )}
          </div>
        </div>
      </div>
      
      {machine.description && (
        <p className="text-gray-300 text-sm mb-4">{machine.description}</p>
      )}
      
      <div className="flex gap-2 flex-wrap">
        {machine.macAddress && (
          <button
            onClick={handleWakeOnLAN}
            disabled={wolLoading}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 disabled:cursor-not-allowed text-white rounded-lg flex items-center gap-2 text-sm transition-colors"
          >
            <Power className="w-4 h-4" />
            {wolLoading ? 'Sending...' : 'Wake on LAN'}
          </button>
        )}
        
        {machine.ssh && machine.ssh.enabled && (
          <button
            onClick={() => setShowSSH(!showSSH)}
            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg flex items-center gap-2 text-sm transition-colors"
          >
            <Terminal className="w-4 h-4" />
            {showSSH ? 'Close SSH' : 'Open SSH'}
          </button>
        )}
      </div>
      
      {showSSH && machine.ssh && machine.ssh.enabled && (
        <div className="mt-4">
          <SSHTerminal machineId={machine.id} machineName={machine.name} />
        </div>
      )}
    </div>
  );
}

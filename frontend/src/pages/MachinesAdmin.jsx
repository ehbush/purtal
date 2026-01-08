import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Save, X } from 'lucide-react';
import api from '../utils/api';

export default function MachinesAdmin() {
  const [machines, setMachines] = useState([]);
  const [editingMachine, setEditingMachine] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    ipAddress: '',
    description: '',
    category: '',
    macAddress: '',
    wolAddress: '255.255.255.255',
    wolPort: 9,
    ssh: {
      enabled: false,
      host: '',
      port: 22,
      username: '',
      password: '',
      privateKey: '',
      passphrase: ''
    }
  });
  const [sshEnabled, setSshEnabled] = useState(false);

  useEffect(() => {
    loadMachines();
  }, []);

  const loadMachines = async () => {
    try {
      const data = await api.get('/machines');
      setMachines(data);
    } catch (error) {
      console.error('Error loading machines:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingMachine) {
        await api.put(`/machines/${editingMachine.id}`, formData);
      } else {
        await api.post('/machines', formData);
      }
      await loadMachines();
      resetForm();
    } catch (error) {
      console.error('Error saving machine:', error);
      alert('Error saving machine: ' + error.message);
    }
  };

  const handleEdit = (machine) => {
    setEditingMachine(machine);
    setFormData({
      name: machine.name || '',
      ipAddress: machine.ipAddress || '',
      description: machine.description || '',
      category: machine.category || '',
      macAddress: machine.macAddress || '',
      wolAddress: machine.wolAddress || '255.255.255.255',
      wolPort: machine.wolPort || 9,
      ssh: machine.ssh || {
        enabled: false,
        host: '',
        port: 22,
        username: '',
        password: '',
        privateKey: '',
        passphrase: ''
      }
    });
    setSshEnabled(machine.ssh?.enabled || false);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this machine?')) {
      return;
    }
    try {
      await api.delete(`/machines/${id}`);
      await loadMachines();
    } catch (error) {
      console.error('Error deleting machine:', error);
      alert('Error deleting machine: ' + error.message);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      ipAddress: '',
      description: '',
      category: '',
      macAddress: '',
      wolAddress: '255.255.255.255',
      wolPort: 9,
      ssh: {
        enabled: false,
        host: '',
        port: 22,
        username: '',
        password: '',
        privateKey: '',
        passphrase: ''
      }
    });
    setEditingMachine(null);
    setShowForm(false);
    setSshEnabled(false);
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-white">Machines</h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Add Machine
        </button>
      </div>

      {/* Machine Form */}
      {showForm && (
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-6 border border-gray-700">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-semibold text-white">
              {editingMachine ? 'Edit Machine' : 'Add New Machine'}
            </h3>
            <button
              onClick={resetForm}
              className="text-gray-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  IP Address
                </label>
                <input
                  type="text"
                  value={formData.ipAddress}
                  onChange={(e) => setFormData({ ...formData, ipAddress: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white"
                  placeholder="192.168.1.100"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white"
                rows="2"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Category
                </label>
                <input
                  type="text"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white"
                  placeholder="e.g., Servers, Workstations"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  MAC Address (for WOL)
                </label>
                <input
                  type="text"
                  value={formData.macAddress}
                  onChange={(e) => setFormData({ ...formData, macAddress: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white"
                  placeholder="00:11:22:33:44:55"
                />
              </div>
            </div>

            {formData.macAddress && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-900/50 p-4 rounded-lg">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    WOL Broadcast Address
                  </label>
                  <input
                    type="text"
                    value={formData.wolAddress}
                    onChange={(e) => setFormData({ ...formData, wolAddress: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    WOL Port
                  </label>
                  <input
                    type="number"
                    value={formData.wolPort}
                    onChange={(e) => setFormData({ ...formData, wolPort: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white"
                  />
                </div>
              </div>
            )}

            {/* SSH Configuration */}
            <div className="border-t border-gray-700 pt-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white">SSH Configuration</h3>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={sshEnabled}
                    onChange={(e) => {
                      setSshEnabled(e.target.checked);
                      setFormData({
                        ...formData,
                        ssh: { ...formData.ssh, enabled: e.target.checked }
                      });
                    }}
                    className="w-4 h-4"
                  />
                  <span className="text-gray-300">Enable SSH</span>
                </label>
              </div>

              {sshEnabled && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-900/50 p-4 rounded-lg">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      SSH Host
                    </label>
                    <input
                      type="text"
                      value={formData.ssh.host}
                      onChange={(e) => setFormData({
                        ...formData,
                        ssh: { ...formData.ssh, host: e.target.value }
                      })}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white"
                      placeholder={formData.ipAddress || '192.168.1.100'}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      SSH Port
                    </label>
                    <input
                      type="number"
                      value={formData.ssh.port}
                      onChange={(e) => setFormData({
                        ...formData,
                        ssh: { ...formData.ssh, port: parseInt(e.target.value) }
                      })}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Username
                    </label>
                    <input
                      type="text"
                      value={formData.ssh.username}
                      onChange={(e) => setFormData({
                        ...formData,
                        ssh: { ...formData.ssh, username: e.target.value }
                      })}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Password
                    </label>
                    <input
                      type="password"
                      value={formData.ssh.password}
                      onChange={(e) => setFormData({
                        ...formData,
                        ssh: { ...formData.ssh, password: e.target.value }
                      })}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white"
                      placeholder="Leave empty if using key"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Private Key (optional)
                    </label>
                    <textarea
                      value={formData.ssh.privateKey}
                      onChange={(e) => setFormData({
                        ...formData,
                        ssh: { ...formData.ssh, privateKey: e.target.value }
                      })}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white font-mono text-xs"
                      rows="4"
                      placeholder="-----BEGIN RSA PRIVATE KEY-----..."
                    />
                  </div>
                  {formData.ssh.privateKey && (
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Key Passphrase (optional)
                      </label>
                      <input
                        type="password"
                        value={formData.ssh.passphrase}
                        onChange={(e) => setFormData({
                          ...formData,
                          ssh: { ...formData.ssh, passphrase: e.target.value }
                        })}
                        className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white"
                      />
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="flex justify-end gap-4">
              <button
                type="button"
                onClick={resetForm}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg flex items-center gap-2"
              >
                <Save className="w-5 h-5" />
                {editingMachine ? 'Update' : 'Create'} Machine
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Machines List */}
      <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-6 border border-gray-700">
        <h3 className="text-xl font-semibold text-white mb-4">Machines ({machines.length})</h3>
        {machines.length === 0 ? (
          <p className="text-gray-400">No machines configured. Add your first machine above.</p>
        ) : (
          <div className="space-y-4">
            {machines.map(machine => (
              <div
                key={machine.id}
                className="bg-gray-900/50 rounded-lg p-4 border border-gray-700 flex items-center justify-between"
              >
                <div className="flex items-center gap-4 flex-1">
                  <div className="w-12 h-12 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold">
                    {machine.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-white font-semibold">{machine.name}</h3>
                    <p className="text-gray-400 text-sm">
                      {machine.ipAddress && `${machine.ipAddress} • `}
                      {machine.macAddress && `MAC: ${machine.macAddress}`}
                    </p>
                    <div className="flex gap-2 mt-1">
                      {machine.macAddress && (
                        <span className="inline-block px-2 py-1 bg-blue-900/50 text-blue-300 text-xs rounded">
                          WOL
                        </span>
                      )}
                      {machine.ssh?.enabled && (
                        <span className="inline-block px-2 py-1 bg-green-900/50 text-green-300 text-xs rounded">
                          SSH
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEdit(machine)}
                    className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
                  >
                    <Edit className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => handleDelete(machine.id)}
                    className="p-2 bg-red-600 hover:bg-red-700 text-white rounded-lg"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

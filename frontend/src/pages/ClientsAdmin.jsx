import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Save, X, Upload } from 'lucide-react';
import api from '../utils/api';

export default function ClientsAdmin() {
  const [clients, setClients] = useState([]);
  const [editingClient, setEditingClient] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    ipAddress: '',
    description: '',
    category: '',
    type: '',
    tags: [],
    icon: '',
    customIcon: '',
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
  const [tagInput, setTagInput] = useState('');

  useEffect(() => {
    loadClients();
  }, []);

  const loadClients = async () => {
    try {
      const response = await api.get('/clients');
      const data = response.data || response;
      setClients(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error loading clients:', error);
      setClients([]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingClient) {
        await api.put(`/clients/${editingClient.id}`, formData);
      } else {
        await api.post('/clients', formData);
      }
      await loadClients();
      resetForm();
    } catch (error) {
      console.error('Error saving client:', error);
      alert('Error saving client: ' + error.message);
    }
  };

  const handleEdit = (client) => {
    setEditingClient(client);
    setFormData({
      name: client.name || '',
      ipAddress: client.ipAddress || '',
      description: client.description || '',
      category: client.category || '',
      type: client.type || '',
      tags: client.tags || [],
      icon: client.icon || '',
      customIcon: client.customIcon || '',
      macAddress: client.macAddress || '',
      wolAddress: client.wolAddress || '255.255.255.255',
      wolPort: client.wolPort || 9,
      ssh: client.ssh || {
        enabled: false,
        host: '',
        port: 22,
        username: '',
        password: '',
        privateKey: '',
        passphrase: ''
      }
    });
    setSshEnabled(client.ssh?.enabled || false);
    setTagInput('');
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this client?')) {
      return;
    }
    try {
      await api.delete(`/clients/${id}`);
      await loadClients();
    } catch (error) {
      console.error('Error deleting client:', error);
      alert('Error deleting client: ' + error.message);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      ipAddress: '',
      description: '',
      category: '',
      type: '',
      tags: [],
      icon: '',
      customIcon: '',
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
    setTagInput('');
    setEditingClient(null);
    setShowForm(false);
    setSshEnabled(false);
  };

  const handleIconUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({ ...formData, customIcon: reader.result });
      };
      reader.readAsDataURL(file);
    }
  };

  const addTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData({
        ...formData,
        tags: [...formData.tags, tagInput.trim()]
      });
      setTagInput('');
    }
  };

  const removeTag = (tagToRemove) => {
    setFormData({
      ...formData,
      tags: formData.tags.filter(tag => tag !== tagToRemove)
    });
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Clients</h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Add Client
        </button>
      </div>

      {/* Client Form */}
      {showForm && (
        <div className="bg-white/80 dark:bg-dark-surface/50 backdrop-blur-sm rounded-lg p-6 border border-gray-200 dark:border-dark-border">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-semibold text-white">
              {editingClient ? 'Edit Client' : 'Add New Client'}
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
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md text-gray-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  IP Address
                </label>
                <input
                  type="text"
                  value={formData.ipAddress}
                  onChange={(e) => setFormData({ ...formData, ipAddress: e.target.value })}
                  className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md text-gray-900 dark:text-white"
                  placeholder="192.168.1.100"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md text-gray-900 dark:text-white"
                rows="2"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Category
                </label>
                <input
                  type="text"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md text-gray-900 dark:text-white"
                  placeholder="e.g., Servers, Workstations"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Type
                </label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md text-gray-900 dark:text-white"
                >
                  <option value="">None</option>
                  <option value="health-check">Health Check (Ping)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Tags (optional, for filtering)
              </label>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                  className="flex-1 px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md text-gray-900 dark:text-white"
                  placeholder="Enter tag and press Enter"
                />
                <button
                  type="button"
                  onClick={addTag}
                  className="px-4 py-2 bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 text-gray-900 dark:text-white rounded-lg"
                >
                  Add
                </button>
              </div>
              {formData.tags && formData.tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {formData.tags.map(tag => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-1 px-2 py-1 bg-gradient-purtal text-white text-sm rounded shadow-md shadow-primary-500/50"
                    >
                      {tag}
                      <button
                        type="button"
                        onClick={() => removeTag(tag)}
                        className="hover:text-red-300"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Icon URL
                </label>
                <input
                  type="url"
                  value={formData.icon}
                  onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                  className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md text-gray-900 dark:text-white"
                  placeholder="https://example.com/icon.png"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Custom Icon (Upload)
                </label>
                <div className="flex items-center gap-4">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleIconUpload}
                    className="hidden"
                    id="client-icon-upload"
                  />
                  <label
                    htmlFor="client-icon-upload"
                    className="px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-900 dark:text-white rounded-lg cursor-pointer flex items-center gap-2"
                  >
                    <Upload className="w-5 h-5" />
                    Upload Icon
                  </label>
                  {formData.customIcon && (
                    <img
                      src={formData.customIcon}
                      alt="Preview"
                      className="w-12 h-12 rounded-lg object-cover"
                    />
                  )}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  MAC Address (for WOL)
                </label>
                <input
                  type="text"
                  value={formData.macAddress}
                  onChange={(e) => setFormData({ ...formData, macAddress: e.target.value })}
                  className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md text-gray-900 dark:text-white"
                  placeholder="00:11:22:33:44:55"
                />
              </div>
            </div>

            {formData.macAddress && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50 dark:bg-dark-bg/50 p-4 rounded-lg">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    WOL Broadcast Address
                  </label>
                  <input
                    type="text"
                    value={formData.wolAddress}
                    onChange={(e) => setFormData({ ...formData, wolAddress: e.target.value })}
                    className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md text-gray-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    WOL Port
                  </label>
                  <input
                    type="number"
                    value={formData.wolPort}
                    onChange={(e) => setFormData({ ...formData, wolPort: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md text-gray-900 dark:text-white"
                  />
                </div>
              </div>
            )}

            {/* SSH Configuration */}
            <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">SSH Configuration</h3>
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
                  <span className="text-gray-700 dark:text-gray-300">Enable SSH</span>
                </label>
              </div>

              {sshEnabled && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50 dark:bg-dark-bg/50 p-4 rounded-lg">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      SSH Host
                    </label>
                    <input
                      type="text"
                      value={formData.ssh.host}
                      onChange={(e) => setFormData({
                        ...formData,
                        ssh: { ...formData.ssh, host: e.target.value }
                      })}
                      className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md text-gray-900 dark:text-white"
                      placeholder={formData.ipAddress || '192.168.1.100'}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      SSH Port
                    </label>
                    <input
                      type="number"
                      value={formData.ssh.port}
                      onChange={(e) => setFormData({
                        ...formData,
                        ssh: { ...formData.ssh, port: parseInt(e.target.value) }
                      })}
                      className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md text-gray-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Username
                    </label>
                    <input
                      type="text"
                      value={formData.ssh.username}
                      onChange={(e) => setFormData({
                        ...formData,
                        ssh: { ...formData.ssh, username: e.target.value }
                      })}
                      className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md text-gray-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Password
                    </label>
                    <input
                      type="password"
                      value={formData.ssh.password}
                      onChange={(e) => setFormData({
                        ...formData,
                        ssh: { ...formData.ssh, password: e.target.value }
                      })}
                      className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md text-gray-900 dark:text-white"
                      placeholder="Leave empty if using key"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Private Key (optional)
                    </label>
                    <textarea
                      value={formData.ssh.privateKey}
                      onChange={(e) => setFormData({
                        ...formData,
                        ssh: { ...formData.ssh, privateKey: e.target.value }
                      })}
                      className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md text-gray-900 dark:text-white font-mono text-xs"
                      rows="4"
                      placeholder="-----BEGIN RSA PRIVATE KEY-----..."
                    />
                  </div>
                  {formData.ssh.privateKey && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Key Passphrase (optional)
                      </label>
                      <input
                        type="password"
                        value={formData.ssh.passphrase}
                        onChange={(e) => setFormData({
                          ...formData,
                          ssh: { ...formData.ssh, passphrase: e.target.value }
                        })}
                        className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md text-gray-900 dark:text-white"
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
                {editingClient ? 'Update' : 'Create'} Client
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Clients List */}
      <div className="bg-white/80 dark:bg-dark-surface/50 backdrop-blur-sm rounded-lg p-6 border border-gray-200 dark:border-dark-border">
        <h3 className="text-xl font-semibold text-white mb-4">Clients ({Array.isArray(clients) ? clients.length : 0})</h3>
        {!Array.isArray(clients) || clients.length === 0 ? (
          <p className="text-gray-400 dark:text-gray-400 light:text-gray-600">No clients configured. Add your first client above.</p>
        ) : (
          <div className="space-y-4">
            {clients.map(client => (
              <div
                key={client.id}
                className="bg-gray-50 dark:bg-dark-bg/50 rounded-lg p-4 border border-gray-200 dark:border-dark-border flex items-center justify-between"
              >
                <div className="flex items-center gap-4 flex-1">
                  <div className="w-12 h-12 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold">
                    {client.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-white dark:text-white light:text-gray-900 font-semibold">{client.name}</h3>
                    <p className="text-gray-400 dark:text-gray-400 light:text-gray-600 text-sm">
                      {client.ipAddress && `${client.ipAddress} • `}
                      {client.macAddress && `MAC: ${client.macAddress}`}
                    </p>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {client.macAddress && (
                        <span className="inline-block px-2 py-1 bg-blue-900/50 text-blue-300 text-xs rounded">
                          WOL
                        </span>
                      )}
                      {client.type === 'health-check' && (
                        <span className="inline-block px-2 py-1 bg-green-900/50 text-green-300 text-xs rounded">
                          Health Check
                        </span>
                      )}
                      {client.ssh?.enabled && (
                        <span className="inline-block px-2 py-1 bg-green-900/50 text-green-300 text-xs rounded">
                          SSH
                        </span>
                      )}
                      {client.tags && client.tags.length > 0 && client.tags.map(tag => (
                        <span key={tag} className="inline-block px-2 py-1 bg-gradient-purtal-subtle text-primary-600 dark:text-primary-300 text-xs rounded border border-primary-500/30">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEdit(client)}
                    className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
                  >
                    <Edit className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => handleDelete(client.id)}
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

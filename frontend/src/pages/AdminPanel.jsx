import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Save, X, Upload } from 'lucide-react';
import api from '../utils/api';
import { useSettings } from '../context/SettingsContext';
import ClientsAdmin from './ClientsAdmin';
import ErrorLogViewer from '../components/ErrorLogViewer';

export default function AdminPanel() {
  const [services, setServices] = useState([]);
  const [editingService, setEditingService] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    url: '',
    description: '',
    category: '',
    icon: '',
    customIcon: '',
    healthCheck: {
      enabled: false,
      url: '',
      method: 'GET',
      timeout: 5000,
      expectedStatus: 200
    }
  });
  const [advancedMode, setAdvancedMode] = useState(false);
  const [tagInput, setTagInput] = useState('');
  const { settings, updateSettings } = useSettings();
  const [settingsForm, setSettingsForm] = useState({
    title: 'Purtal',
    theme: 'default',
    layout: 'grid'
  });

  // Update settingsForm when settings are loaded
  useEffect(() => {
    if (settings && Object.keys(settings).length > 0) {
      setSettingsForm(settings);
    }
  }, [settings]);

  useEffect(() => {
    loadServices();
  }, []);

  const loadServices = async () => {
    try {
      const response = await api.get('/services');
      const data = response.data || response;
      setServices(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error loading services:', error);
      setServices([]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingService) {
        await api.put(`/services/${editingService.id}`, formData);
      } else {
        await api.post('/services', formData);
      }
      await loadServices();
      resetForm();
    } catch (error) {
      console.error('Error saving service:', error);
      alert('Error saving service: ' + error.message);
    }
  };

  const handleEdit = (service) => {
    setEditingService(service);
    setFormData({
      name: service.name || '',
      url: service.url || '',
      description: service.description || '',
      category: service.category || '',
      tags: service.tags || [],
      icon: service.icon || '',
      customIcon: service.customIcon || '',
      healthCheck: service.healthCheck || {
        enabled: false,
        url: '',
        method: 'GET',
        timeout: 5000,
        expectedStatus: 200
      }
    });
    setShowForm(true);
    setAdvancedMode(service.healthCheck?.enabled || false);
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this service?')) {
      return;
    }
    try {
      await api.delete(`/services/${id}`);
      await loadServices();
    } catch (error) {
      console.error('Error deleting service:', error);
      alert('Error deleting service: ' + error.message);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      url: '',
      description: '',
      category: '',
      tags: [],
      icon: '',
      customIcon: '',
      healthCheck: {
        enabled: false,
        url: '',
        method: 'GET',
        timeout: 5000,
        expectedStatus: 200
      }
    });
    setTagInput('');
    setEditingService(null);
    setShowForm(false);
    setAdvancedMode(false);
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

  const handleIconUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setFormData({ ...formData, customIcon: event.target.result });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSettingsSave = async () => {
    try {
      await updateSettings(settingsForm);
      alert('Settings saved successfully!');
    } catch (error) {
      alert('Error saving settings: ' + error.message);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Admin Panel</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Add Service
        </button>
      </div>

      {/* Settings Section */}
      <div className="bg-white/80 dark:bg-gray-800/50 backdrop-blur-sm rounded-lg p-6 border border-gray-200 dark:border-gray-700">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Portal Settings</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Portal Title
            </label>
            <input
              type="text"
              value={settingsForm.title || ''}
              onChange={(e) => setSettingsForm({ ...settingsForm, title: e.target.value })}
              className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md text-gray-900 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Layout
            </label>
            <select
              value={settingsForm.layout || 'grid'}
              onChange={(e) => setSettingsForm({ ...settingsForm, layout: e.target.value })}
              className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md text-gray-900 dark:text-white"
            >
              <option value="grid">Grid</option>
              <option value="list">List</option>
            </select>
          </div>
        </div>
        
        <div className="mt-4 pt-4 border-t border-gray-700 dark:border-gray-700 light:border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Health Check Configuration</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Service Check Frequency (seconds)
              </label>
              <input
                type="number"
                min="10"
                value={settingsForm.healthCheck?.serviceFrequency || 30}
                onChange={(e) => setSettingsForm({
                  ...settingsForm,
                  healthCheck: {
                    ...settingsForm.healthCheck,
                    serviceFrequency: parseInt(e.target.value) || 30
                  }
                })}
                className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md text-gray-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Service Timeout (milliseconds)
              </label>
              <input
                type="number"
                min="1000"
                value={settingsForm.healthCheck?.serviceTimeout || 5000}
                onChange={(e) => setSettingsForm({
                  ...settingsForm,
                  healthCheck: {
                    ...settingsForm.healthCheck,
                    serviceTimeout: parseInt(e.target.value) || 5000
                  }
                })}
                className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md text-gray-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Client Check Frequency (seconds)
              </label>
              <input
                type="number"
                min="10"
                value={settingsForm.healthCheck?.clientFrequency || 60}
                onChange={(e) => setSettingsForm({
                  ...settingsForm,
                  healthCheck: {
                    ...settingsForm.healthCheck,
                    clientFrequency: parseInt(e.target.value) || 60
                  }
                })}
                className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md text-gray-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Client Ping Timeout (seconds)
              </label>
              <input
                type="number"
                min="1"
                value={settingsForm.healthCheck?.clientTimeout || 3}
                onChange={(e) => setSettingsForm({
                  ...settingsForm,
                  healthCheck: {
                    ...settingsForm.healthCheck,
                    clientTimeout: parseInt(e.target.value) || 3
                  }
                })}
                className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md text-gray-900 dark:text-white"
              />
            </div>
          </div>
        </div>
        
        <button
          onClick={handleSettingsSave}
          className="mt-4 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg flex items-center gap-2"
        >
          <Save className="w-5 h-5" />
          Save Settings
        </button>
      </div>

      {/* Service Form */}
      {showForm && (
        <div className="bg-white/80 dark:bg-gray-800/50 backdrop-blur-sm rounded-lg p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              {editingService ? 'Edit Service' : 'Add New Service'}
            </h2>
            <button
              onClick={resetForm}
              className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
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
                  URL *
                </label>
                <input
                  type="url"
                  required
                  value={formData.url}
                  onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                  className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md text-gray-900 dark:text-white"
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
                />
              </div>
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
                      className="inline-flex items-center gap-1 px-2 py-1 bg-primary-600 text-white text-sm rounded"
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
                  id="icon-upload"
                />
                <label
                  htmlFor="icon-upload"
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

            {/* Advanced Configuration */}
            <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Advanced Configuration</h3>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={advancedMode}
                    onChange={(e) => {
                      setAdvancedMode(e.target.checked);
                      if (!e.target.checked) {
                        setFormData({
                          ...formData,
                          healthCheck: { ...formData.healthCheck, enabled: false }
                        });
                      }
                    }}
                    className="w-4 h-4"
                  />
                  <span className="text-gray-700 dark:text-gray-300">Enable Health Checking</span>
                </label>
              </div>

              {advancedMode && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50 dark:bg-gray-900/50 p-4 rounded-lg">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Health Check URL
                    </label>
                    <input
                      type="url"
                      value={formData.healthCheck.url}
                      onChange={(e) => setFormData({
                        ...formData,
                        healthCheck: { ...formData.healthCheck, url: e.target.value, enabled: true }
                      })}
                      className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md text-gray-900 dark:text-white"
                      placeholder="https://example.com/health"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      HTTP Method
                    </label>
                    <select
                      value={formData.healthCheck.method}
                      onChange={(e) => setFormData({
                        ...formData,
                        healthCheck: { ...formData.healthCheck, method: e.target.value }
                      })}
                      className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md text-gray-900 dark:text-white"
                    >
                      <option value="GET">GET</option>
                      <option value="POST">POST</option>
                      <option value="HEAD">HEAD</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Timeout (ms)
                    </label>
                    <input
                      type="number"
                      value={formData.healthCheck.timeout}
                      onChange={(e) => setFormData({
                        ...formData,
                        healthCheck: { ...formData.healthCheck, timeout: parseInt(e.target.value) }
                      })}
                      className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md text-gray-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Expected Status Code
                    </label>
                    <input
                      type="number"
                      value={formData.healthCheck.expectedStatus}
                      onChange={(e) => setFormData({
                        ...formData,
                        healthCheck: { ...formData.healthCheck, expectedStatus: parseInt(e.target.value) }
                      })}
                      className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md text-gray-900 dark:text-white"
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-4">
              <button
                type="button"
                onClick={resetForm}
                className="px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-900 dark:text-white rounded-lg"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg flex items-center gap-2"
              >
                <Save className="w-5 h-5" />
                {editingService ? 'Update' : 'Create'} Service
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Clients Section */}
      <ClientsAdmin />

      {/* Services List */}
      <div className="bg-white/80 dark:bg-gray-800/50 backdrop-blur-sm rounded-lg p-6 border border-gray-200 dark:border-gray-700">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Services ({Array.isArray(services) ? services.length : 0})</h2>
        {!Array.isArray(services) || services.length === 0 ? (
          <p className="text-gray-600 dark:text-gray-400">No services configured. Add your first service above.</p>
        ) : (
          <div className="space-y-4">
            {services.map(service => (
              <div
                key={service.id}
                className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4 border border-gray-200 dark:border-gray-700 flex items-center justify-between"
              >
                <div className="flex items-center gap-4 flex-1">
                  {service.customIcon || service.icon ? (
                    <img
                      src={service.customIcon || service.icon}
                      alt={service.name}
                      className="w-12 h-12 rounded-lg object-cover"
                      onError={(e) => {
                        e.target.style.display = 'none';
                      }}
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-lg bg-primary-600 flex items-center justify-center text-white font-bold">
                      {service.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="flex-1">
                    <h3 className="text-gray-900 dark:text-white font-semibold">{service.name}</h3>
                    <p className="text-gray-600 dark:text-gray-400 text-sm">{service.url}</p>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {service.healthCheck?.enabled && (
                        <span className="inline-block px-2 py-1 bg-blue-900/50 text-blue-300 text-xs rounded">
                          Health Check Enabled
                        </span>
                      )}
                      {service.tags && service.tags.length > 0 && service.tags.map(tag => (
                        <span key={tag} className="inline-block px-2 py-1 bg-primary-600/20 text-primary-700 dark:text-primary-300 text-xs rounded">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEdit(service)}
                    className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
                  >
                    <Edit className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => handleDelete(service.id)}
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

      {/* Error Log Viewer */}
      <div className="mt-8">
        <ErrorLogViewer />
      </div>
    </div>
  );
}

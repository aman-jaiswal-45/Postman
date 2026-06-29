import React, { useState, useEffect } from 'react';
import { X, Trash2, Plus, Check } from 'lucide-react';

interface EnvVar {
  id?: number;
  key: string;
  value: string;
  enabled: boolean;
}

interface Environment {
  id: number;
  name: string;
  variables: EnvVar[];
}

interface EnvironmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRefresh: () => void;
}

export default function EnvironmentModal({ isOpen, onClose, onRefresh }: EnvironmentModalProps) {
  const [environments, setEnvironments] = useState<Environment[]>([]);
  const [selectedEnvId, setSelectedEnvId] = useState<number | null>(null);
  const [envName, setEnvName] = useState('');
  const [variables, setVariables] = useState<EnvVar[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  let API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';
  if (API_BASE && !API_BASE.includes('/api')) {
    API_BASE = API_BASE.replace(/\/$/, '') + '/api';
  }

  useEffect(() => {
    if (isOpen) {
      fetchEnvironments();
    }
  }, [isOpen]);

  const fetchEnvironments = async () => {
    try {
      const res = await fetch(`${API_BASE}/environments`);
      if (res.ok) {
        const data = await res.json();
        setEnvironments(data);
        if (data.length > 0 && selectedEnvId === null) {
          selectEnvironment(data[0]);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const selectEnvironment = (env: Environment) => {
    setSelectedEnvId(env.id);
    setEnvName(env.name);
    setVariables(env.variables.map(v => ({ ...v })));
  };

  const handleAddNewEnv = async () => {
    try {
      const res = await fetch(`${API_BASE}/environments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'New Environment', variables: [] })
      });
      if (res.ok) {
        const newEnv = await res.json();
        await fetchEnvironments();
        selectEnvironment(newEnv);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteEnv = async (id: number) => {
    if (!confirm("Are you sure you want to delete this environment?")) return;
    try {
      const res = await fetch(`${API_BASE}/environments/${id}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        setSelectedEnvId(null);
        setEnvName('');
        setVariables([]);
        await fetchEnvironments();
        onRefresh();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleVariableChange = (index: number, field: keyof EnvVar, val: any) => {
    const updated = [...variables];
    updated[index] = { ...updated[index], [field]: val };
    
    if (index === variables.length - 1 && (field === 'key' || field === 'value') && val !== '') {
      updated.push({ key: '', value: '', enabled: true });
    }
    
    setVariables(updated);
  };

  const handleAddVariableRow = () => {
    setVariables([...variables, { key: '', value: '', enabled: true }]);
  };

  const handleDeleteVariableRow = (index: number) => {
    const updated = variables.filter((_, idx) => idx !== index);
    setVariables(updated);
  };

  const handleSave = async () => {
    if (!selectedEnvId) return;
    setIsSaving(true);
    try {
      const cleanVars = variables.filter(v => v.key.trim() !== '');
      
      const res = await fetch(`${API_BASE}/environments/${selectedEnvId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: envName,
          variables: cleanVars
        })
      });
      if (res.ok) {
        await fetchEnvironments();
        onRefresh();
        alert("Environment saved successfully!");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ width: '750px', maxWidth: '95vw' }}>
        <div className="modal-header">
          <div className="modal-title">Manage Environments</div>
          <button className="btn-modal-close" onClick={onClose}>
            <X size={18} />
          </button>
        </div>
        
        <div className="modal-body" style={{ padding: '0' }}>
          <div className="env-layout-container">
            <div className="env-sidebar" style={{ padding: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <span className="sidebar-section-title" style={{ padding: '0' }}>Environments</span>
                <button className="btn-sidebar-add" onClick={handleAddNewEnv} title="Add Environment">
                  <Plus size={14} />
                </button>
              </div>
              {environments.map(env => (
                <div 
                  key={env.id} 
                  className={`env-sidebar-item ${selectedEnvId === env.id ? 'active' : ''}`}
                  onClick={() => selectEnvironment(env)}
                >
                  {env.name}
                </div>
              ))}
              {environments.length === 0 && (
                <div style={{ color: 'var(--text-dark)', fontSize: '11px', textAlign: 'center', marginTop: '16px' }}>
                  No environments
                </div>
              )}
            </div>
            
            <div className="env-variables-section" style={{ padding: '16px', flex: 1 }}>
              {selectedEnvId ? (
                <>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '16px' }}>
                    <div className="form-group" style={{ flex: 1, margin: 0 }}>
                      <input 
                        type="text" 
                        className="form-input" 
                        value={envName} 
                        onChange={(e) => setEnvName(e.target.value)} 
                        placeholder="Environment Name"
                      />
                    </div>
                    <button 
                      className="btn-save" 
                      style={{ color: 'var(--color-delete)', borderColor: 'var(--color-delete)' }}
                      onClick={() => handleDeleteEnv(selectedEnvId)}
                    >
                      Delete
                    </button>
                  </div>
                  
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <span className="sidebar-section-title" style={{ padding: '0' }}>Variables</span>
                    <button className="btn-sidebar-add" onClick={handleAddVariableRow} style={{ padding: '4px 8px', fontSize: '11px', gap: '4px' }}>
                      <Plus size={12} /> Add Row
                    </button>
                  </div>
                  
                  <div style={{ flex: 1, overflowY: 'auto', border: '1px solid var(--border-color)', borderRadius: '4px' }}>
                    <table className="keyvalue-table" style={{ margin: 0 }}>
                      <thead>
                        <tr>
                          <th style={{ width: '40px', textAlign: 'center' }}>Active</th>
                          <th>Variable Name</th>
                          <th>Current Value</th>
                          <th style={{ width: '40px' }}></th>
                        </tr>
                      </thead>
                      <tbody>
                        {variables.map((v, idx) => (
                          <tr key={idx}>
                            <td className="checkbox-center">
                              <input 
                                type="checkbox" 
                                className="checkbox-input" 
                                checked={v.enabled} 
                                onChange={(e) => handleVariableChange(idx, 'enabled', e.target.checked)}
                              />
                            </td>
                            <td>
                              <input 
                                type="text" 
                                className="keyvalue-input" 
                                placeholder="variable_key"
                                value={v.key}
                                onChange={(e) => handleVariableChange(idx, 'key', e.target.value)}
                              />
                            </td>
                            <td>
                              <input 
                                type="text" 
                                className="keyvalue-input" 
                                placeholder="value"
                                value={v.value}
                                onChange={(e) => handleVariableChange(idx, 'value', e.target.value)}
                              />
                            </td>
                            <td>
                              <button className="btn-row-action" onClick={() => handleDeleteVariableRow(idx)}>
                                <Trash2 size={13} />
                              </button>
                            </td>
                          </tr>
                        ))}
                        {variables.length === 0 && (
                          <tr>
                            <td colSpan={4} style={{ textAlign: 'center', color: 'var(--text-dark)', padding: '16px' }}>
                              No variables. Click "Add Row" to start.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-dark)' }}>
                  Select or create an environment on the left to edit variables.
                </div>
              )}
            </div>
          </div>
        </div>
        
        <div className="modal-footer">
          <button className="btn-save" onClick={onClose} style={{ border: 'none' }}>
            Cancel
          </button>
          <button 
            className="btn-send" 
            onClick={handleSave} 
            disabled={isSaving || !selectedEnvId}
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            {isSaving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}

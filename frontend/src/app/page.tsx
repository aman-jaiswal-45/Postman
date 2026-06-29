'use client';

import React, { useState, useEffect } from 'react';
import { Plus, Settings, X, Globe, Save, HelpCircle, Folder, History as HistoryIcon, LogOut } from 'lucide-react';

import Sidebar from '../components/Sidebar';
import RequestForm from '../components/RequestForm';
import RequestEditors from '../components/RequestEditors';
import ResponseViewer from '../components/ResponseViewer';
import EnvironmentModal from '../components/EnvironmentModal';

interface KeyValuePair {
  key: string;
  value: string;
  enabled: boolean;
}

interface ResponseData {
  status_code: number;
  status_text: string;
  time_ms: number;
  size_bytes: number;
  headers: Record<string, string>;
  body: string;
}

interface Tab {
  id: string; 
  savedId?: number; 
  name: string;
  method: string;
  url: string;
  params: KeyValuePair[];
  headers: KeyValuePair[];
  auth_type: string;
  auth_config: Record<string, string>;
  body_type: string;
  body_raw: string;
  body_form_data: KeyValuePair[];
  body_urlencoded: KeyValuePair[];
  response: ResponseData | null;
  isLoading: boolean;
}

interface Collection {
  id: number;
  name: string;
  description?: string;
  requests: any[];
}

interface Environment {
  id: number;
  name: string;
  variables: any[];
}

export default function WorkspacePage() {
  const [tabs, setTabs] = useState<Tab[]>([]);
  const [activeTabId, setActiveTabId] = useState<string | null>(null);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  const [environments, setEnvironments] = useState<Environment[]>([]);
  const [selectedEnvId, setSelectedEnvId] = useState<number | null>(null);
  const [isEnvModalOpen, setIsEnvModalOpen] = useState(false);
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [saveRequestName, setSaveRequestName] = useState('');
  const [saveCollectionId, setSaveCollectionId] = useState<number | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  let API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';
  if (API_BASE && !API_BASE.includes('/api')) {
    API_BASE = API_BASE.replace(/\/$/, '') + '/api';
  }

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    fetchCollections();
    fetchHistory();
    fetchEnvironments();
    
    const initialTab = createDefaultTab();
    setTabs([initialTab]);
    setActiveTabId(initialTab.id);
  }, []);

  const createDefaultTab = (overrides: Partial<Tab> = {}): Tab => {
    const randomId = 'new_' + Math.random().toString(36).substring(2, 9);
    return {
      id: randomId,
      name: 'Untitled Request',
      method: 'GET',
      url: 'https://httpbin.org/get',
      params: [{ key: '', value: '', enabled: true }],
      headers: [{ key: '', value: '', enabled: true }],
      auth_type: 'none',
      auth_config: {},
      body_type: 'none',
      body_raw: '',
      body_form_data: [{ key: '', value: '', enabled: true }],
      body_urlencoded: [{ key: '', value: '', enabled: true }],
      response: null,
      isLoading: false,
      ...overrides
    };
  };

  const fetchCollections = async () => {
    try {
      const res = await fetch(`${API_BASE}/collections`);
      if (res.ok) {
        const data = await res.json();
        setCollections(data);
        if (data.length > 0 && !saveCollectionId) {
          setSaveCollectionId(data[0].id);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchHistory = async () => {
    try {
      const res = await fetch(`${API_BASE}/history`);
      if (res.ok) {
        setHistory(await res.json());
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchEnvironments = async () => {
    try {
      const res = await fetch(`${API_BASE}/environments`);
      if (res.ok) {
        setEnvironments(await res.json());
      }
    } catch (err) {
      console.error(err);
    }
  };

  const parseUrlParams = (urlString: string): KeyValuePair[] => {
    try {
      const parts = urlString.split('?');
      if (parts.length < 2) return [{ key: '', value: '', enabled: true }];
      
      const searchParams = new URLSearchParams(parts[1]);
      const parsed: KeyValuePair[] = [];
      searchParams.forEach((value, key) => {
        parsed.push({ key, value, enabled: true });
      });
      parsed.push({ key: '', value: '', enabled: true });
      return parsed;
    } catch (e) {
      return [{ key: '', value: '', enabled: true }];
    }
  };

  const stringifyUrlParams = (urlString: string, paramsList: KeyValuePair[]): string => {
    try {
      const base = urlString.split('?')[0];
      const searchParams = new URLSearchParams();
      paramsList.forEach(p => {
        if (p.enabled && p.key.trim() !== '') {
          searchParams.append(p.key, p.value);
        }
      });
      const qs = searchParams.toString();
      return qs ? `${base}?${qs}` : base;
    } catch (e) {
      return urlString;
    }
  };

  const updateActiveTab = (updates: Partial<Tab>) => {
    if (!activeTabId) return;
    setTabs(prev => prev.map(t => {
      if (t.id === activeTabId) {
        const merged = { ...t, ...updates };
        
        if (updates.params && !updates.url) {
          merged.url = stringifyUrlParams(t.url, updates.params);
        }
        else if (updates.url && !updates.params) {
          merged.params = parseUrlParams(updates.url);
        }
        
        return merged;
      }
      return t;
    }));
  };

  const getActiveTab = (): Tab | undefined => {
    return tabs.find(t => t.id === activeTabId);
  };

  const handleCreateNewTab = () => {
    const newTab = createDefaultTab();
    setTabs([...tabs, newTab]);
    setActiveTabId(newTab.id);
  };

  const handleCloseTab = (e: React.MouseEvent, idToClose: string) => {
    e.stopPropagation();
    const remaining = tabs.filter(t => t.id !== idToClose);
    
    if (remaining.length === 0) {
      const newTab = createDefaultTab();
      setTabs([newTab]);
      setActiveTabId(newTab.id);
    } else {
      setTabs(remaining);
      if (activeTabId === idToClose) {
        setActiveTabId(remaining[remaining.length - 1].id);
      }
    }
  };

  const handleSendRequest = async () => {
    const tab = getActiveTab();
    if (!tab) return;

    setTabs(prev => prev.map(t => t.id === tab.id ? { ...t, isLoading: true } : t));

    try {
      const payload = {
        method: tab.method,
        url: tab.url,
        headers: JSON.stringify(tab.headers.filter(h => h.key.trim() !== '')),
        params: JSON.stringify(tab.params.filter(p => p.key.trim() !== '')),
        body_type: tab.body_type,
        body_raw: tab.body_raw,
        body_form_data: JSON.stringify(tab.body_form_data.filter(f => f.key.trim() !== '')),
        body_urlencoded: JSON.stringify(tab.body_urlencoded.filter(u => u.key.trim() !== '')),
        auth_type: tab.auth_type,
        auth_config: JSON.stringify(tab.auth_config),
        environment_id: selectedEnvId,
        save_to_history: true
      };

      const res = await fetch(`${API_BASE}/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        const responseData = await res.json();
        setTabs(prev => prev.map(t => t.id === tab.id ? { 
          ...t, 
          isLoading: false, 
          response: {
            status_code: responseData.status_code,
            status_text: responseData.status_text,
            time_ms: responseData.time_ms,
            size_bytes: responseData.size_bytes,
            headers: responseData.headers,
            body: responseData.body
          } 
        } : t));
        
        showToast("Request finished successfully!");
        fetchHistory();
      } else {
        const errText = await res.text();
        throw new Error(errText || "Request execution failed");
      }
    } catch (err: any) {
      console.error(err);
      setTabs(prev => prev.map(t => t.id === tab.id ? { 
        ...t, 
        isLoading: false, 
        response: {
          status_code: 0,
          status_text: 'Error',
          time_ms: 0,
          size_bytes: 0,
          headers: {},
          body: `Failed to execute: ${err.message || err}`
        }
      } : t));
      showToast("Request failed to complete.", "error");
    }
  };

  const handleOpenSaveModal = () => {
    const tab = getActiveTab();
    if (!tab) return;

    if (tab.id.startsWith('saved_') && tab.savedId) {
      handleSaveRequestDirectly(tab.savedId, tab);
    } else {
      setSaveRequestName(tab.name);
      setIsSaveModalOpen(true);
    }
  };

  const handleSaveRequestDirectly = async (reqId: number, tab: Tab) => {
    try {
      const res = await fetch(`${API_BASE}/requests/${reqId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: tab.name,
          method: tab.method,
          url: tab.url,
          headers: JSON.stringify(tab.headers.filter(h => h.key.trim() !== '')),
          params: JSON.stringify(tab.params.filter(p => p.key.trim() !== '')),
          body_type: tab.body_type,
          body_raw: tab.body_raw,
          body_form_data: JSON.stringify(tab.body_form_data.filter(f => f.key.trim() !== '')),
          body_urlencoded: JSON.stringify(tab.body_urlencoded.filter(u => u.key.trim() !== '')),
          auth_type: tab.auth_type,
          auth_config: JSON.stringify(tab.auth_config)
        })
      });
      if (res.ok) {
        showToast("Request updated successfully!");
        fetchCollections();
      }
    } catch (err) {
      console.error(err);
      showToast("Error updating request.", "error");
    }
  };

  const handleSaveRequestAs = async () => {
    const tab = getActiveTab();
    if (!tab || !saveCollectionId || !saveRequestName.trim()) return;

    try {
      const payload = {
        name: saveRequestName,
        method: tab.method,
        url: tab.url,
        headers: JSON.stringify(tab.headers.filter(h => h.key.trim() !== '')),
        params: JSON.stringify(tab.params.filter(p => p.key.trim() !== '')),
        body_type: tab.body_type,
        body_raw: tab.body_raw,
        body_form_data: JSON.stringify(tab.body_form_data.filter(f => f.key.trim() !== '')),
        body_urlencoded: JSON.stringify(tab.body_urlencoded.filter(u => u.key.trim() !== '')),
        auth_type: tab.auth_type,
        auth_config: JSON.stringify(tab.auth_config),
        collection_id: saveCollectionId
      };

      const res = await fetch(`${API_BASE}/collections/${saveCollectionId}/requests`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        const savedReq = await res.json();
        setIsSaveModalOpen(false);
        showToast("Request saved to collection!");
        
        setTabs(prev => prev.map(t => t.id === tab.id ? {
          ...t,
          id: `saved_${savedReq.id}`,
          savedId: savedReq.id,
          name: saveRequestName
        } : t));
        setActiveTabId(`saved_${savedReq.id}`);
        
        fetchCollections();
      }
    } catch (err) {
      console.error(err);
      showToast("Error saving request.", "error");
    }
  };

  const handleSelectRequestFromSidebar = (req: any, type: 'saved' | 'history') => {
    const existingTabId = type === 'saved' ? `saved_${req.id}` : `history_${req.id}`;
    const alreadyOpen = tabs.find(t => t.id === existingTabId);
    
    if (alreadyOpen) {
      setActiveTabId(existingTabId);
      return;
    }

    const deserialize = (str: string) => {
      try {
        const parsed = JSON.parse(str || '[]');
        if (parsed.length === 0 || parsed[parsed.length - 1].key !== '') {
          parsed.push({ key: '', value: '', enabled: true });
        }
        return parsed;
      } catch {
        return [{ key: '', value: '', enabled: true }];
      }
    };

    const deserializeObj = (str: string) => {
      try {
        return JSON.parse(str || '{}');
      } catch {
        return {};
      }
    };

    const newTab: Tab = {
      id: existingTabId,
      savedId: type === 'saved' ? req.id : undefined,
      name: req.name || `${req.method} Request`,
      method: req.method,
      url: req.url,
      params: deserialize(req.params),
      headers: deserialize(req.headers),
      auth_type: req.auth_type || 'none',
      auth_config: deserializeObj(req.auth_config),
      body_type: req.body_type || 'none',
      body_raw: req.body_raw || '',
      body_form_data: deserialize(req.body_form_data),
      body_urlencoded: deserialize(req.body_urlencoded),
      response: type === 'history' && req.response_status ? {
        status_code: req.response_status,
        status_text: req.response_status >= 200 && req.response_status < 300 ? 'OK' : 'Error',
        time_ms: req.response_time_ms || 0,
        size_bytes: req.response_size_bytes || 0,
        headers: deserializeObj(req.response_headers),
        body: req.response_body || ''
      } : null,
      isLoading: false
    };

    const activeTab = getActiveTab();
    if (activeTab && activeTab.id.startsWith('new_') && activeTab.url === 'https://httpbin.org/get' && activeTab.response === null) {
      setTabs(prev => prev.map(t => t.id === activeTab.id ? newTab : t));
    } else {
      setTabs([...tabs, newTab]);
    }
    setActiveTabId(newTab.id);
  };

  const activeTab = getActiveTab();

  return (
    <div className="app-container">
      <header className="top-navbar">
        <div className="brand-section">
          <div className="brand-logo">
            <Globe size={22} style={{ fill: 'rgba(255, 108, 55, 0.2)' }} />
          </div>
          <span className="brand-title">Scalar API Client</span>
          <span className="brand-subtitle">Professional Edition</span>
        </div>

        <div className="env-selector-container">
          <select 
            className="env-select"
            value={selectedEnvId || ''}
            onChange={(e) => setSelectedEnvId(e.target.value ? Number(e.target.value) : null)}
          >
            <option value="">No Environment</option>
            {environments.map(env => (
              <option key={env.id} value={env.id}>
                {env.name}
              </option>
            ))}
          </select>
          <button 
            className="btn-icon-setting" 
            onClick={() => setIsEnvModalOpen(true)}
            title="Manage Environments"
          >
            <Settings size={16} />
          </button>
        </div>
      </header>

      <div className="workspace-layout">
        <Sidebar 
          activeTabId={activeTabId}
          onSelectRequest={handleSelectRequestFromSidebar}
          collections={collections}
          history={history}
          fetchCollections={fetchCollections}
          fetchHistory={fetchHistory}
        />

        <main className="main-workspace">
          <div className="tabs-container">
            <div className="tabs-list">
              {tabs.map(tab => (
                <div 
                  key={tab.id}
                  className={`tab ${activeTabId === tab.id ? 'active' : ''}`}
                  onClick={() => setActiveTabId(tab.id)}
                >
                  <span className={`verb-badge ${tab.method.toLowerCase()}`} style={{ width: '28px', fontSize: '8px' }}>
                    {tab.method}
                  </span>
                  <span className="tab-title-text" title={tab.name}>{tab.name}</span>
                  <button className="btn-tab-close" onClick={(e) => handleCloseTab(e, tab.id)}>
                    <X size={10} />
                  </button>
                </div>
              ))}
            </div>
            <button className="btn-tab-new" onClick={handleCreateNewTab} title="New Tab">
              <Plus size={16} />
            </button>
          </div>

          {activeTab ? (
            <div className="active-workspace-panel">
              <RequestForm 
                method={activeTab.method}
                url={activeTab.url}
                onChangeMethod={(method) => updateActiveTab({ method })}
                onChangeUrl={(url) => updateActiveTab({ url })}
                onSend={handleSendRequest}
                onSave={handleOpenSaveModal}
                isSending={activeTab.isLoading}
              />

              <RequestEditors 
                params={activeTab.params}
                onChangeParams={(params) => updateActiveTab({ params })}
                headers={activeTab.headers}
                onChangeHeaders={(headers) => updateActiveTab({ headers })}
                authType={activeTab.auth_type}
                onChangeAuthType={(auth_type) => updateActiveTab({ auth_type })}
                authConfig={activeTab.auth_config}
                onChangeAuthConfig={(auth_config) => updateActiveTab({ auth_config })}
                bodyType={activeTab.body_type}
                onChangeBodyType={(body_type) => updateActiveTab({ body_type })}
                bodyRaw={activeTab.body_raw}
                onChangeBodyRaw={(body_raw) => updateActiveTab({ body_raw })}
                bodyFormData={activeTab.body_form_data}
                onChangeBodyFormData={(body_form_data) => updateActiveTab({ body_form_data })}
                bodyUrlEncoded={activeTab.body_urlencoded}
                onChangeBodyUrlEncoded={(body_urlencoded) => updateActiveTab({ body_urlencoded })}
              />

              <ResponseViewer 
                response={activeTab.response}
                isLoading={activeTab.isLoading}
              />
            </div>
          ) : (
            <div className="response-empty-state">
              <HelpCircle size={32} />
              <div className="response-empty-title">Select a request</div>
              <div style={{ fontSize: '11px' }}>Open a request tab or select an item from history to start working.</div>
            </div>
          )}
        </main>
      </div>

      {toast && (
        <div className="toast-container">
          <div className={`toast ${toast.type}`}>
            <span style={{ fontSize: '12px' }}>{toast.message}</span>
          </div>
        </div>
      )}

      <EnvironmentModal 
        isOpen={isEnvModalOpen}
        onClose={() => setIsEnvModalOpen(false)}
        onRefresh={() => {
          fetchEnvironments();
        }}
      />

      {isSaveModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <div className="modal-title">Save Request</div>
              <button className="btn-modal-close" onClick={() => setIsSaveModalOpen(false)}>
                <X size={18} />
              </button>
            </div>
            
            <div className="modal-body">
              <div className="form-group">
                <label>Request Name</label>
                <input 
                  type="text"
                  className="form-input"
                  value={saveRequestName}
                  onChange={(e) => setSaveRequestName(e.target.value)}
                  placeholder="e.g. Get User Posts"
                />
              </div>

              <div className="form-group">
                <label>Save to Collection</label>
                <select 
                  className="env-select"
                  style={{ width: '100%' }}
                  value={saveCollectionId || ''}
                  onChange={(e) => setSaveCollectionId(Number(e.target.value))}
                >
                  {collections.map(col => (
                    <option key={col.id} value={col.id}>
                      {col.name}
                    </option>
                  ))}
                </select>
                {collections.length === 0 && (
                  <div style={{ color: 'var(--color-delete)', fontSize: '11px', marginTop: '4px' }}>
                    You need to create a collection in the sidebar first.
                  </div>
                )}
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn-save" onClick={() => setIsSaveModalOpen(false)} style={{ border: 'none' }}>
                Cancel
              </button>
              <button 
                className="btn-send" 
                onClick={handleSaveRequestAs}
                disabled={collections.length === 0 || !saveRequestName.trim()}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

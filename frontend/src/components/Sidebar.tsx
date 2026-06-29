import React, { useState, useEffect } from 'react';
import { Folder, FileText, Plus, Trash2, Search, Edit2, ChevronDown, ChevronRight, Play } from 'lucide-react';

interface RequestItem {
  id: number;
  collection_id?: number;
  name: string;
  method: string;
  url: string;
  headers: string;
  params: string;
  body_type: string;
  body_raw?: string;
  body_form_data: string;
  body_urlencoded: string;
  auth_type: string;
  auth_config: string;
}

interface Collection {
  id: number;
  name: string;
  description?: string;
  requests: RequestItem[];
}

interface HistoryItem {
  id: number;
  name?: string;
  method: string;
  url: string;
  headers: string;
  params: string;
  body_type: string;
  body_raw?: string;
  body_form_data: string;
  body_urlencoded: string;
  auth_type: string;
  auth_config: string;
  response_status?: number;
  response_time_ms?: number;
  response_size_bytes?: number;
  response_headers?: string;
  response_body?: string;
  sent_at: string;
}

interface SidebarProps {
  activeTabId: number | string | null;
  onSelectRequest: (request: any, type: 'saved' | 'history') => void;
  collections: Collection[];
  history: HistoryItem[];
  fetchCollections: () => void;
  fetchHistory: () => void;
}

export default function Sidebar({
  activeTabId,
  onSelectRequest,
  collections,
  history,
  fetchCollections,
  fetchHistory
}: SidebarProps) {
  const [sidebarTab, setSidebarTab] = useState<'collections' | 'history'>('collections');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedCollections, setExpandedCollections] = useState<Record<number, boolean>>({});

  const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

  useEffect(() => {
    fetchCollections();
    fetchHistory();
  }, []);

  const toggleCollection = (id: number) => {
    setExpandedCollections(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleCreateCollection = async () => {
    const name = prompt("Enter Collection Name:");
    if (!name) return;
    try {
      const res = await fetch(`${API_BASE}/collections`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, description: '' })
      });
      if (res.ok) {
        fetchCollections();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleRenameCollection = async (e: React.MouseEvent, id: number, currentName: string) => {
    e.stopPropagation();
    const name = prompt("Rename Collection To:", currentName);
    if (!name) return;
    try {
      const res = await fetch(`${API_BASE}/collections/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name })
      });
      if (res.ok) {
        fetchCollections();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteCollection = async (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    if (!confirm("Are you sure you want to delete this collection and all its requests?")) return;
    try {
      const res = await fetch(`${API_BASE}/collections/${id}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        fetchCollections();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddRequestToCollection = async (e: React.MouseEvent, collectionId: number) => {
    e.stopPropagation();
    const name = prompt("Enter Request Name:");
    if (!name) return;
    try {
      const res = await fetch(`${API_BASE}/collections/${collectionId}/requests`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          method: 'GET',
          url: 'https://httpbin.org/get',
          headers: '[]',
          params: '[]',
          body_type: 'none',
          auth_type: 'none',
          auth_config: '{}'
        })
      });
      if (res.ok) {
        fetchCollections();
        setExpandedCollections(prev => ({ ...prev, [collectionId]: true }));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteRequest = async (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    if (!confirm("Are you sure you want to delete this request?")) return;
    try {
      const res = await fetch(`${API_BASE}/requests/${id}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        fetchCollections();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteHistoryItem = async (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    try {
      const res = await fetch(`${API_BASE}/history/${id}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        fetchHistory();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleClearHistory = async () => {
    if (!confirm("Clear all execution history?")) return;
    try {
      const res = await fetch(`${API_BASE}/history`, {
        method: 'DELETE'
      });
      if (res.ok) {
        fetchHistory();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const filteredCollections = collections.map(col => {
    const matchedRequests = col.requests.filter(req => 
      req.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      req.url.toLowerCase().includes(searchQuery.toLowerCase())
    );
    const matchesCollectionName = col.name.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (matchesCollectionName || matchedRequests.length > 0) {
      return {
        ...col,
        requests: matchedRequests
      };
    }
    return null;
  }).filter(Boolean) as Collection[];

  const filteredHistory = history.filter(item => 
    item.url.toLowerCase().includes(searchQuery.toLowerCase()) || 
    item.method.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="sidebar">
      <div className="sidebar-tabs">
        <button 
          className={`sidebar-tab-btn ${sidebarTab === 'collections' ? 'active' : ''}`}
          onClick={() => setSidebarTab('collections')}
        >
          Collections
        </button>
        <button 
          className={`sidebar-tab-btn ${sidebarTab === 'history' ? 'active' : ''}`}
          onClick={() => setSidebarTab('history')}
        >
          History
        </button>
      </div>

      <div className="sidebar-search-container">
        <div style={{ position: 'relative', flex: 1, display: 'flex', alignItems: 'center' }}>
          <Search size={14} style={{ position: 'absolute', left: '8px', color: 'var(--text-dark)' }} />
          <input 
            type="text" 
            className="sidebar-search" 
            placeholder={sidebarTab === 'collections' ? "Search collections..." : "Search history..."}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ paddingLeft: '28px' }}
          />
        </div>
        {sidebarTab === 'collections' && (
          <button className="btn-sidebar-add" onClick={handleCreateCollection} title="New Collection">
            <Plus size={14} />
          </button>
        )}
      </div>

      <div className="sidebar-list-container">
        {sidebarTab === 'collections' ? (
          filteredCollections.map(col => {
            const isExpanded = expandedCollections[col.id];
            return (
              <div key={col.id} className="tree-node">
                <div className="tree-folder" onClick={() => toggleCollection(col.id)}>
                  <div className="tree-folder-info">
                    {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                    <Folder size={14} style={{ color: 'var(--postman-orange)', fill: 'rgba(255, 108, 55, 0.15)' }} />
                    <span style={{ fontSize: '12px' }}>{col.name}</span>
                  </div>
                  <div className="tree-folder-actions">
                    <button className="btn-tree-action" onClick={(e) => handleAddRequestToCollection(e, col.id)} title="Add Request">
                      <Plus size={12} />
                    </button>
                    <button className="btn-tree-action" onClick={(e) => handleRenameCollection(e, col.id, col.name)} title="Rename">
                      <Edit2 size={12} />
                    </button>
                    <button className="btn-tree-action" onClick={(e) => handleDeleteCollection(e, col.id)} title="Delete">
                      <Trash2 size={12} style={{ color: 'var(--color-delete)' }} />
                    </button>
                  </div>
                </div>

                {isExpanded && (
                  <div className="tree-children">
                    {col.requests.map(req => (
                      <div 
                        key={req.id} 
                        className={`tree-item ${activeTabId === `saved_${req.id}` ? 'active' : ''}`}
                        onClick={() => onSelectRequest(req, 'saved')}
                      >
                        <div className="tree-item-info">
                          <span className={`verb-badge ${req.method.toLowerCase()}`}>
                            {req.method}
                          </span>
                          <span className="tree-item-name">{req.name}</span>
                        </div>
                        <div className="tree-item-actions">
                          <button className="btn-tree-action" onClick={(e) => handleDeleteRequest(e, req.id)} title="Delete Request">
                            <Trash2 size={11} />
                          </button>
                        </div>
                      </div>
                    ))}
                    {col.requests.length === 0 && (
                      <div style={{ padding: '6px 20px', color: 'var(--text-dark)', fontSize: '11px' }}>
                        Empty collection
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        ) : (
          <div>
            {filteredHistory.map(item => (
              <div 
                key={item.id} 
                className="history-item"
                onClick={() => onSelectRequest(item, 'history')}
              >
                <div className="history-item-top">
                  <span className={`verb-badge ${item.method.toLowerCase()}`} style={{ width: '32px' }}>
                    {item.method}
                  </span>
                  <span className="history-item-url">{item.url}</span>
                </div>
                <div className="history-item-meta">
                  <span className={`history-status ${item.response_status && item.response_status < 400 ? 'success' : 'error'}`}>
                    {item.response_status || 'Network Error'}
                  </span>
                  <span>{item.response_time_ms ? `${item.response_time_ms} ms` : ''}</span>
                  <span>{new Date(item.sent_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
                <button className="btn-history-delete" onClick={(e) => handleDeleteHistoryItem(e, item.id)}>
                  <Trash2 size={12} />
                </button>
              </div>
            ))}

            {filteredHistory.length > 0 && (
              <div style={{ padding: '16px', display: 'flex', justifyContent: 'center' }}>
                <button className="btn-save" onClick={handleClearHistory} style={{ fontSize: '11px', width: '100%' }}>
                  Clear All History
                </button>
              </div>
            )}
            
            {filteredHistory.length === 0 && (
              <div style={{ color: 'var(--text-dark)', fontSize: '12px', textAlign: 'center', marginTop: '32px' }}>
                No history entries.
              </div>
            )}
          </div>
        )}
        
        {sidebarTab === 'collections' && filteredCollections.length === 0 && (
          <div style={{ color: 'var(--text-dark)', fontSize: '12px', textAlign: 'center', marginTop: '32px' }}>
            No collections. Create one using the "+" icon!
          </div>
        )}
      </div>
    </div>
  );
}

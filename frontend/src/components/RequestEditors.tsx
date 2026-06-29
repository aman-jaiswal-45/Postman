import React, { useState } from 'react';
import { Trash2, Plus } from 'lucide-react';

interface KeyValuePair {
  key: string;
  value: string;
  enabled: boolean;
  type?: string; 
}

interface RequestEditorsProps {
  params: KeyValuePair[];
  onChangeParams: (params: KeyValuePair[]) => void;
  headers: KeyValuePair[];
  onChangeHeaders: (headers: KeyValuePair[]) => void;
  authType: string;
  onChangeAuthType: (type: string) => void;
  authConfig: Record<string, string>;
  onChangeAuthConfig: (config: Record<string, string>) => void;
  bodyType: string;
  onChangeBodyType: (type: string) => void;
  bodyRaw: string;
  onChangeBodyRaw: (raw: string) => void;
  bodyFormData: KeyValuePair[];
  onChangeBodyFormData: (formData: KeyValuePair[]) => void;
  bodyUrlEncoded: KeyValuePair[];
  onChangeBodyUrlEncoded: (urlEncoded: KeyValuePair[]) => void;
}

export default function RequestEditors({
  params,
  onChangeParams,
  headers,
  onChangeHeaders,
  authType,
  onChangeAuthType,
  authConfig,
  onChangeAuthConfig,
  bodyType,
  onChangeBodyType,
  bodyRaw,
  onChangeBodyRaw,
  bodyFormData,
  onChangeBodyFormData,
  bodyUrlEncoded,
  onChangeBodyUrlEncoded
}: RequestEditorsProps) {
  const [activeSubTab, setActiveSubTab] = useState<'params' | 'auth' | 'headers' | 'body'>('params');

  const updateTable = (
    list: KeyValuePair[],
    index: number,
    field: keyof KeyValuePair,
    val: any,
    onChange: (updated: KeyValuePair[]) => void
  ) => {
    const updated = [...list];
    updated[index] = { ...updated[index], [field]: val };
    
    if (index === list.length - 1 && (field === 'key' || field === 'value') && val !== '') {
      updated.push({ key: '', value: '', enabled: true });
    }
    
    onChange(updated);
  };

  const addTableRow = (list: KeyValuePair[], onChange: (updated: KeyValuePair[]) => void) => {
    onChange([...list, { key: '', value: '', enabled: true }]);
  };

  const deleteTableRow = (list: KeyValuePair[], index: number, onChange: (updated: KeyValuePair[]) => void) => {
    const updated = list.filter((_, idx) => idx !== index);
    if (updated.length === 0) {
      updated.push({ key: '', value: '', enabled: true });
    }
    onChange(updated);
  };

  const handleAuthChange = (field: string, val: string) => {
    onChangeAuthConfig({
      ...authConfig,
      [field]: val
    });
  };

  return (
    <div className="request-details-container">
      <div className="editor-tabs-container">
        <button 
          className={`editor-tab-btn ${activeSubTab === 'params' ? 'active' : ''}`}
          onClick={() => setActiveSubTab('params')}
        >
          Params ({params.filter(p => p.key.trim() !== '').length})
        </button>
        <button 
          className={`editor-tab-btn ${activeSubTab === 'auth' ? 'active' : ''}`}
          onClick={() => setActiveSubTab('auth')}
        >
          Authorization ({authType !== 'none' ? 'Active' : 'None'})
        </button>
        <button 
          className={`editor-tab-btn ${activeSubTab === 'headers' ? 'active' : ''}`}
          onClick={() => setActiveSubTab('headers')}
        >
          Headers ({headers.filter(h => h.key.trim() !== '').length})
        </button>
        <button 
          className={`editor-tab-btn ${activeSubTab === 'body' ? 'active' : ''}`}
          onClick={() => setActiveSubTab('body')}
        >
          Body ({bodyType !== 'none' ? 'Active' : 'None'})
        </button>
      </div>

      <div className="request-editor-section">
        {activeSubTab === 'params' && (
          <div className="keyvalue-table-container">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span className="sidebar-section-title" style={{ padding: 0 }}>Query Parameters</span>
              <button className="btn-sidebar-add" onClick={() => addTableRow(params, onChangeParams)} style={{ padding: '2px 8px', fontSize: '11px', display: 'flex', gap: '4px' }}>
                <Plus size={11} /> Add Param
              </button>
            </div>
            <table className="keyvalue-table">
              <thead>
                <tr>
                  <th style={{ width: '40px', textAlign: 'center' }}>Active</th>
                  <th>Key</th>
                  <th>Value</th>
                  <th style={{ width: '40px' }}></th>
                </tr>
              </thead>
              <tbody>
                {params.map((p, idx) => (
                  <tr key={idx}>
                    <td className="checkbox-center">
                      <input 
                        type="checkbox" 
                        className="checkbox-input"
                        checked={p.enabled}
                        onChange={(e) => updateTable(params, idx, 'enabled', e.target.checked, onChangeParams)}
                      />
                    </td>
                    <td>
                      <input 
                        type="text" 
                        className="keyvalue-input" 
                        placeholder="Parameter Key"
                        value={p.key}
                        onChange={(e) => updateTable(params, idx, 'key', e.target.value, onChangeParams)}
                      />
                    </td>
                    <td>
                      <input 
                        type="text" 
                        className="keyvalue-input" 
                        placeholder="Value"
                        value={p.value}
                        onChange={(e) => updateTable(params, idx, 'value', e.target.value, onChangeParams)}
                      />
                    </td>
                    <td>
                      <button className="btn-row-action" onClick={() => deleteTableRow(params, idx, onChangeParams)}>
                        <Trash2 size={13} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeSubTab === 'auth' && (
          <div className="auth-panel">
            <div className="auth-row">
              <span className="auth-label">Type</span>
              <select 
                className="env-select"
                style={{ minWidth: '150px' }}
                value={authType}
                onChange={(e) => onChangeAuthType(e.target.value)}
              >
                <option value="none">No Auth</option>
                <option value="bearer">Bearer Token</option>
                <option value="basic">Basic Auth</option>
              </select>
            </div>

            {authType === 'bearer' && (
              <div className="auth-row">
                <span className="auth-label">Token</span>
                <input 
                  type="text"
                  className="auth-input"
                  placeholder="Bearer token value"
                  value={authConfig.token || ''}
                  onChange={(e) => handleAuthChange('token', e.target.value)}
                />
              </div>
            )}

            {authType === 'basic' && (
              <>
                <div className="auth-row">
                  <span className="auth-label">Username</span>
                  <input 
                    type="text"
                    className="auth-input"
                    placeholder="Username"
                    value={authConfig.username || ''}
                    onChange={(e) => handleAuthChange('username', e.target.value)}
                  />
                </div>
                <div className="auth-row">
                  <span className="auth-label">Password</span>
                  <input 
                    type="password"
                    className="auth-input"
                    placeholder="Password"
                    value={authConfig.password || ''}
                    onChange={(e) => handleAuthChange('password', e.target.value)}
                  />
                </div>
              </>
            )}

            {authType === 'none' && (
              <div style={{ color: 'var(--text-dark)', fontSize: '12px' }}>
                This request does not use authorization. Select type above to configure.
              </div>
            )}
          </div>
        )}

        {activeSubTab === 'headers' && (
          <div className="keyvalue-table-container">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span className="sidebar-section-title" style={{ padding: 0 }}>Headers List</span>
              <button className="btn-sidebar-add" onClick={() => addTableRow(headers, onChangeHeaders)} style={{ padding: '2px 8px', fontSize: '11px', display: 'flex', gap: '4px' }}>
                <Plus size={11} /> Add Header
              </button>
            </div>
            <table className="keyvalue-table">
              <thead>
                <tr>
                  <th style={{ width: '40px', textAlign: 'center' }}>Active</th>
                  <th>Header Name</th>
                  <th>Value</th>
                  <th style={{ width: '40px' }}></th>
                </tr>
              </thead>
              <tbody>
                {headers.map((h, idx) => (
                  <tr key={idx}>
                    <td className="checkbox-center">
                      <input 
                        type="checkbox" 
                        className="checkbox-input"
                        checked={h.enabled}
                        onChange={(e) => updateTable(headers, idx, 'enabled', e.target.checked, onChangeHeaders)}
                      />
                    </td>
                    <td>
                      <input 
                        type="text" 
                        className="keyvalue-input" 
                        placeholder="Content-Type"
                        value={h.key}
                        onChange={(e) => updateTable(headers, idx, 'key', e.target.value, onChangeHeaders)}
                      />
                    </td>
                    <td>
                      <input 
                        type="text" 
                        className="keyvalue-input" 
                        placeholder="value"
                        value={h.value}
                        onChange={(e) => updateTable(headers, idx, 'value', e.target.value, onChangeHeaders)}
                      />
                    </td>
                    <td>
                      <button className="btn-row-action" onClick={() => deleteTableRow(headers, idx, onChangeHeaders)}>
                        <Trash2 size={13} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeSubTab === 'body' && (
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div className="body-subselector">
              {['none', 'raw', 'form-data', 'x-www-form-urlencoded'].map(t => (
                <label key={t} className={`body-radio-label ${bodyType === t ? 'active' : ''}`}>
                  <input 
                    type="radio" 
                    className="body-radio-input"
                    name="body_type_radio"
                    value={t}
                    checked={bodyType === t}
                    onChange={(e) => onChangeBodyType(e.target.value)}
                  />
                  {t === 'x-www-form-urlencoded' ? 'x-www-form-urlencoded' : t}
                </label>
              ))}
            </div>

            {bodyType === 'raw' && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Raw Text/JSON Editor</span>
                  <span style={{ fontSize: '11px', color: 'var(--postman-orange)', fontWeight: 600 }}>JSON (application/json)</span>
                </div>
                <textarea 
                  className="raw-editor-textarea"
                  placeholder='{\n  "key": "value"\n}'
                  value={bodyRaw}
                  onChange={(e) => onChangeBodyRaw(e.target.value)}
                />
              </div>
            )}

            {bodyType === 'form-data' && (
              <div className="keyvalue-table-container">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span className="sidebar-section-title" style={{ padding: 0 }}>Multipart Form Data</span>
                  <button className="btn-sidebar-add" onClick={() => addTableRow(bodyFormData, onChangeBodyFormData)} style={{ padding: '2px 8px', fontSize: '11px', display: 'flex', gap: '4px' }}>
                    <Plus size={11} /> Add Parameter
                  </button>
                </div>
                <table className="keyvalue-table">
                  <thead>
                    <tr>
                      <th style={{ width: '40px', textAlign: 'center' }}>Active</th>
                      <th>Key</th>
                      <th>Value</th>
                      <th style={{ width: '40px' }}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {bodyFormData.map((fd, idx) => (
                      <tr key={idx}>
                        <td className="checkbox-center">
                          <input 
                            type="checkbox" 
                            className="checkbox-input"
                            checked={fd.enabled}
                            onChange={(e) => updateTable(bodyFormData, idx, 'enabled', e.target.checked, onChangeBodyFormData)}
                          />
                        </td>
                        <td>
                          <input 
                            type="text" 
                            className="keyvalue-input" 
                            placeholder="key"
                            value={fd.key}
                            onChange={(e) => updateTable(bodyFormData, idx, 'key', e.target.value, onChangeBodyFormData)}
                          />
                        </td>
                        <td>
                          <input 
                            type="text" 
                            className="keyvalue-input" 
                            placeholder="value"
                            value={fd.value}
                            onChange={(e) => updateTable(bodyFormData, idx, 'value', e.target.value, onChangeBodyFormData)}
                          />
                        </td>
                        <td>
                          <button className="btn-row-action" onClick={() => deleteTableRow(bodyFormData, idx, onChangeBodyFormData)}>
                            <Trash2 size={13} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {bodyType === 'x-www-form-urlencoded' && (
              <div className="keyvalue-table-container">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span className="sidebar-section-title" style={{ padding: 0 }}>URL Encoded Parameters</span>
                  <button className="btn-sidebar-add" onClick={() => addTableRow(bodyUrlEncoded, onChangeBodyUrlEncoded)} style={{ padding: '2px 8px', fontSize: '11px', display: 'flex', gap: '4px' }}>
                    <Plus size={11} /> Add Parameter
                  </button>
                </div>
                <table className="keyvalue-table">
                  <thead>
                    <tr>
                      <th style={{ width: '40px', textAlign: 'center' }}>Active</th>
                      <th>Key</th>
                      <th>Value</th>
                      <th style={{ width: '40px' }}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {bodyUrlEncoded.map((ue, idx) => (
                      <tr key={idx}>
                        <td className="checkbox-center">
                          <input 
                            type="checkbox" 
                            className="checkbox-input"
                            checked={ue.enabled}
                            onChange={(e) => updateTable(bodyUrlEncoded, idx, 'enabled', e.target.checked, onChangeBodyUrlEncoded)}
                          />
                        </td>
                        <td>
                          <input 
                            type="text" 
                            className="keyvalue-input" 
                            placeholder="key"
                            value={ue.key}
                            onChange={(e) => updateTable(bodyUrlEncoded, idx, 'key', e.target.value, onChangeBodyUrlEncoded)}
                          />
                        </td>
                        <td>
                          <input 
                            type="text" 
                            className="keyvalue-input" 
                            placeholder="value"
                            value={ue.value}
                            onChange={(e) => updateTable(bodyUrlEncoded, idx, 'value', e.target.value, onChangeBodyUrlEncoded)}
                          />
                        </td>
                        <td>
                          <button className="btn-row-action" onClick={() => deleteTableRow(bodyUrlEncoded, idx, onChangeBodyUrlEncoded)}>
                            <Trash2 size={13} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {bodyType === 'none' && (
              <div style={{ color: 'var(--text-dark)', fontSize: '12px', padding: '16px 0', textAlign: 'center' }}>
                This request does not send a body. Select a type above (e.g. raw, form-data) to write body parameters.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

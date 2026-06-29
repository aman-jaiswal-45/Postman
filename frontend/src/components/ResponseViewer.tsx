import React, { useState } from 'react';
import { FileText, Cpu, Clock, HardDrive, AlertCircle } from 'lucide-react';

interface ResponseData {
  status_code: number;
  status_text: string;
  time_ms: number;
  size_bytes: number;
  headers: Record<string, string>;
  body: string;
}

interface ResponseViewerProps {
  response: ResponseData | null;
  isLoading: boolean;
}

export default function ResponseViewer({ response, isLoading }: ResponseViewerProps) {
  const [responseTab, setResponseTab] = useState<'body' | 'headers'>('body');
  const [bodyMode, setBodyMode] = useState<'pretty' | 'raw'>('pretty');

  const getStatusClass = (code: number) => {
    if (code >= 200 && code < 300) return 'success';
    if (code >= 300 && code < 500) return 'warning';
    return 'error';
  };

  const formatBytes = (bytes: number) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const renderPrettyBody = (body: string) => {
    try {
      const parsed = JSON.parse(body);
      return (
        <pre className="response-pretty-json">
          {JSON.stringify(parsed, null, 2)}
        </pre>
      );
    } catch (e) {
      return (
        <pre className="response-pretty-text">
          {body}
        </pre>
      );
    }
  };

  if (isLoading) {
    return (
      <div className="response-section" style={{ borderTop: '1px solid var(--border-color)' }}>
        <div className="response-empty-state">
          <Clock size={28} className="animate-spin" style={{ color: 'var(--postman-orange)' }} />
          <div className="response-empty-title">Sending Request...</div>
          <div style={{ fontSize: '12px' }}>Waiting for response from the backend runner...</div>
        </div>
      </div>
    );
  }

  if (!response) {
    return (
      <div className="response-section" style={{ borderTop: '1px solid var(--border-color)' }}>
        <div className="response-empty-state">
          <FileText size={32} />
          <div className="response-empty-title">No Response</div>
          <div style={{ fontSize: '11px' }}>Enter a URL and click Send to get a response.</div>
        </div>
      </div>
    );
  }

  const isNetworkError = response.status_code === 0;

  return (
    <div className="response-section" style={{ borderTop: '1px solid var(--border-color)' }}>
      <div className="response-header-bar">
        <div style={{ display: 'flex', gap: '16px' }}>
          <button 
            className={`editor-tab-btn ${responseTab === 'body' ? 'active' : ''}`}
            onClick={() => setResponseTab('body')}
            style={{ padding: '8px 12px' }}
          >
            Body
          </button>
          <button 
            className={`editor-tab-btn ${responseTab === 'headers' ? 'active' : ''}`}
            onClick={() => setResponseTab('headers')}
            style={{ padding: '8px 12px' }}
          >
            Headers ({Object.keys(response.headers || {}).length})
          </button>
        </div>

        <div className="response-metadata-container">
          {isNetworkError ? (
            <div className="meta-badge" style={{ color: 'var(--color-delete)', fontWeight: 600 }}>
              <AlertCircle size={14} />
              <span>Could not connect</span>
            </div>
          ) : (
            <>
              <div className="meta-badge">
                <span>Status:</span>
                <span className={`status-code-badge ${getStatusClass(response.status_code)}`}>
                  {response.status_code} {response.status_text}
                </span>
              </div>

              <div className="meta-badge">
                <Clock size={13} />
                <span>Time:</span>
                <span className="meta-badge-value" style={{ color: 'var(--color-get)' }}>{response.time_ms} ms</span>
              </div>

              <div className="meta-badge">
                <HardDrive size={13} />
                <span>Size:</span>
                <span className="meta-badge-value">{formatBytes(response.size_bytes)}</span>
              </div>
            </>
          )}
        </div>
      </div>

      <div className="response-body-wrapper">
        {responseTab === 'body' ? (
          <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            {!isNetworkError && (
              <div className="body-subselector" style={{ borderBottom: 'none', padding: '0', marginBottom: '8px' }}>
                <button 
                  className={`editor-tab-btn ${bodyMode === 'pretty' ? 'active' : ''}`}
                  onClick={() => setBodyMode('pretty')}
                  style={{ padding: '4px 10px', fontSize: '11px' }}
                >
                  Pretty
                </button>
                <button 
                  className={`editor-tab-btn ${bodyMode === 'raw' ? 'active' : ''}`}
                  onClick={() => setBodyMode('raw')}
                  style={{ padding: '4px 10px', fontSize: '11px' }}
                >
                  Raw
                </button>
              </div>
            )}

            <div style={{ flex: 1, overflowY: 'auto' }}>
              {bodyMode === 'pretty' ? (
                renderPrettyBody(response.body)
              ) : (
                <pre className="response-pretty-text">{response.body}</pre>
              )}
            </div>
          </div>
        ) : (
          <div style={{ overflowY: 'auto', maxHeight: '100%' }}>
            <table className="keyvalue-table" style={{ width: '100%' }}>
              <thead>
                <tr>
                  <th>Header Key</th>
                  <th>Value</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(response.headers || {}).map(([key, val]) => (
                  <tr key={key}>
                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--text-muted)', width: '30%' }}>
                      {key}
                    </td>
                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', wordBreak: 'break-all' }}>
                      {val}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

import React from 'react';

interface RequestFormProps {
  method: string;
  url: string;
  onChangeMethod: (method: string) => void;
  onChangeUrl: (url: string) => void;
  onSend: () => void;
  onSave: () => void;
  isSending: boolean;
}

export default function RequestForm({
  method,
  url,
  onChangeMethod,
  onChangeUrl,
  onSend,
  onSave,
  isSending
}: RequestFormProps) {
  const methods = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS'];

  const getMethodClass = (m: string) => {
    return m.toLowerCase();
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      onSend();
    }
  };

  return (
    <div className="request-bar-container">
      <div className="method-select-wrapper">
        <select 
          className={`method-select ${getMethodClass(method)}`}
          value={method}
          onChange={(e) => onChangeMethod(e.target.value)}
        >
          {methods.map(m => (
            <option key={m} value={m} className={getMethodClass(m)}>
              {m}
            </option>
          ))}
        </select>
      </div>

      <input 
        type="text" 
        className="url-input" 
        placeholder="Enter request URL (e.g. {{placeholder_url}}/posts or https://httpbin.org/get)" 
        value={url}
        onChange={(e) => onChangeUrl(e.target.value)}
        onKeyDown={handleKeyPress}
      />

      <button 
        className="btn-send" 
        onClick={onSend}
        disabled={isSending}
      >
        {isSending ? 'Sending...' : 'Send'}
      </button>

      <button 
        className="btn-save" 
        onClick={onSave}
      >
        Save
      </button>
    </div>
  );
}

import React from 'react';
import ReactDOM from 'react-dom/client';

const SimpleApp = () => {
  return (
    <div style={{ padding: '20px', textAlign: 'center' }}>
      <h1>岩手イベントナビゲーター</h1>
      <p>シンプルテスト版</p>
    </div>
  );
};

const rootElement = document.getElementById('root');
if (rootElement) {
  const root = ReactDOM.createRoot(rootElement);
  root.render(<SimpleApp />);
}
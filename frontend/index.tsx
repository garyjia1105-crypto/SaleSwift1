import './index.css';
import React from 'react';
import ReactDOM from 'react-dom/client';
import { GoogleOAuthProvider } from '@react-oauth/google';
import App from './App';

const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

// 全局错误处理：过滤浏览器扩展相关的错误
window.addEventListener('error', (event) => {
  // 忽略浏览器扩展相关的错误
  if (event.message?.includes('message channel closed') ||
      event.message?.includes('listener indicated') ||
      event.message?.includes('content.bundle.js') ||
      event.filename?.includes('content.bundle.js') ||
      event.filename?.includes('extension://')) {
    event.preventDefault();
    console.warn('浏览器扩展错误已忽略:', event.message);
    return false;
  }
});

// 处理未捕获的 Promise 拒绝
window.addEventListener('unhandledrejection', (event) => {
  const error = event.reason;
  const errorMessage = error?.message || String(error);
  
  // 忽略浏览器扩展相关的错误
  if (errorMessage?.includes('message channel closed') ||
      errorMessage?.includes('listener indicated') ||
      errorMessage?.includes('content.bundle.js')) {
    event.preventDefault();
    console.warn('浏览器扩展 Promise 错误已忽略:', errorMessage);
    return false;
  }
});

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <GoogleOAuthProvider clientId={clientId}>
      <App />
    </GoogleOAuthProvider>
  </React.StrictMode>
);

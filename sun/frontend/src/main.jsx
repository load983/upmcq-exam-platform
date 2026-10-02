// ================== main.jsx ==================
// অ্যাপ্লিকেশনের এন্ট্রি পয়েন্ট
import React from 'react';
import ReactDOM from 'react-dom/client';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import { store } from './app/store';
import { ThemeProvider } from './context/ThemeContext';
import { LanguageProvider } from './context/LanguageContext';
import { SiteProvider } from './context/SiteContext';
import App from './App';
import './index.css';
import { registerSW } from './utils/push';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Provider store={store}>
      <LanguageProvider>
        <SiteProvider>
          <ThemeProvider>
            <BrowserRouter>
              <App />
            </BrowserRouter>
          </ThemeProvider>
        </SiteProvider>
      </LanguageProvider>
    </Provider>
  </React.StrictMode>
);

// 🔔 ডিভাইস নোটিফিকেশনের জন্য Service Worker
registerSW();

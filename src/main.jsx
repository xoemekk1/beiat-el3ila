import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';
import ReactPixel from 'react-facebook-pixel';

// 1. إعدادات البيكسل
const options = {
  autoConfig: true,
  debug: false,
};

// 2. تهيئة البيكسل
ReactPixel.init('1365543407994787', null, options);

// تتبع الزيارة الأولى
ReactPixel.pageView();

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
import React from 'react';
import { Link } from 'react-router-dom';
import { Home, Search } from 'lucide-react';

const NotFound = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 text-center px-4">
      <h1 className="text-9xl font-black text-gray-200">404</h1>
      <p className="text-2xl font-bold text-gray-800 mt-4">عذراً، الصفحة غير موجودة!</p>
      <p className="text-gray-500 mt-2 mb-8">ربما تم نقل الصفحة أو حذفها، أو أنك كتبت الرابط بشكل خاطئ.</p>
      
      <div className="flex gap-4">
        <Link to="/" className="flex items-center gap-2 bg-primary text-white px-6 py-3 rounded-xl font-bold hover:bg-gray-800 transition-colors">
          <Home size={20} /> الرئيسية
        </Link>
        <Link to="/shop" className="flex items-center gap-2 bg-white text-primary border border-gray-200 px-6 py-3 rounded-xl font-bold hover:border-primary transition-colors">
          <Search size={20} /> تصفح المنتجات
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
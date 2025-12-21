import React from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle, ShoppingBag, Home } from 'lucide-react';
import { motion } from 'framer-motion';

const OrderSuccess = () => {
  return (
    <div className="min-h-screen bg-[#FDFDFD] flex items-center justify-center p-6 text-center font-sans" dir="rtl">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white p-10 rounded-[2.5rem] shadow-xl border border-gray-100 max-w-md w-full"
      >
        <div className="w-24 h-24 bg-green-100 text-green-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm">
            <CheckCircle size={48} />
        </div>
        
        <h1 className="text-3xl font-black text-gray-900 mb-2">تم الطلب بنجاح!</h1>
        <p className="text-gray-500 mb-8">شكراً لثقتك بنا. سنقوم بمراجعة طلبك والتواصل معك قريباً لتأكيد الموعد.</p>

        <div className="flex flex-col gap-3">
            <Link to="/shop" className="w-full bg-[#111] text-white py-3 rounded-xl font-bold hover:bg-[#D4AF37] hover:text-black transition-all flex items-center justify-center gap-2">
                <ShoppingBag size={20} /> متابعة التسوق
            </Link>
            <Link to="/" className="w-full bg-gray-100 text-gray-700 py-3 rounded-xl font-bold hover:bg-gray-200 transition-all flex items-center justify-center gap-2">
                <Home size={20} /> الرئيسية
            </Link>
        </div>
      </motion.div>
    </div>
  );
};

export default OrderSuccess;
import React from 'react';
import { MessageCircle } from 'lucide-react';

const FloatingWhatsApp = () => {
  const phoneNumber = "201029315300"   ;
  const message = "مرحباً، لدي استفسار بخصوص منتجات بيت العيلة...";

  return (
    <a 
      href={`https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-6 right-6 z-[999] bg-[#25D366] text-white p-4 rounded-full transition-all hover:scale-110 hover:shadow-[0_0_20px_rgba(37,211,102,0.6)] flex items-center justify-center group"
      style={{ boxShadow: '0 4px 10px rgba(0,0,0,0.2)' }}
      title="تواصل معنا عبر واتساب"
    >
      <MessageCircle size={32} className="fill-white text-white group-hover:rotate-12 transition-transform duration-300" />
            <span className="absolute right-full mr-3 bg-gray-900 text-white text-xs py-1 px-3 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
        تواصل معنا
      </span>
    </a>
  );
};

export default FloatingWhatsApp;
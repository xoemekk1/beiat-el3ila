import React from 'react';
import { Link } from 'react-router-dom';
import { Facebook, MapPin, ShoppingBag } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-[#111] text-white pt-16 pb-8 border-t-4 border-[#D4AF37]" dir="rtl">
      <div className="container mx-auto px-6">
        
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-10 mb-12 text-right">
          
          <div className="lg:col-span-1">
            <Link to="/" className="text-2xl font-black tracking-tight flex items-center gap-2 mb-6 group w-fit">
              <ShoppingBag className="text-[#D4AF37] group-hover:rotate-12 transition-transform" size={32} />
              <span className="text-white">بيت</span>
              <span className="text-[#D4AF37]">العيلة</span>
            </Link>
            <p className="text-gray-400 leading-loose text-sm font-medium mb-6 max-w-sm">
              بيت العيلة هو وجهتك الأولى للمنتجات العصرية بجودة عالية وأسعار تنافسية. نسعى دائماً لتقديم الأفضل لعملائنا في كل مكان.
            </p>
          </div>

          <div>
            <h3 className="text-lg font-bold mb-6 text-[#D4AF37] relative inline-block">
              روابط سريعة
              <span className="absolute -bottom-2 right-0 w-8 h-1 bg-[#D4AF37] rounded-full"></span>
            </h3>
            <ul className="space-y-3 text-gray-400 text-sm font-medium">
              <li><Link to="/" className="hover:text-white transition-colors hover:translate-x-[-5px] inline-block">الرئيسية</Link></li>
              <li><Link to="/shop" className="hover:text-white transition-colors hover:translate-x-[-5px] inline-block">المنتجات</Link></li>
              <li><Link to="/about" className="hover:text-white transition-colors hover:translate-x-[-5px] inline-block">من نحن</Link></li>
              <li><Link to="/contact" className="hover:text-white transition-colors hover:translate-x-[-5px] inline-block">تواصل معنا</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-bold mb-6 text-[#D4AF37] relative inline-block">
              خدمة العملاء
              <span className="absolute -bottom-2 right-0 w-8 h-1 bg-[#D4AF37] rounded-full"></span>
            </h3>
            <ul className="space-y-3 text-gray-400 text-sm font-medium">
              <li><Link to="/profile" className="hover:text-white transition-colors hover:translate-x-[-5px] inline-block">حسابي</Link></li>
              <li><Link to="/cart" className="hover:text-white transition-colors hover:translate-x-[-5px] inline-block">سلة المشتريات</Link></li>
              <li><Link to="/policy" className="hover:text-white transition-colors hover:translate-x-[-5px] inline-block">سياسة الخصوصية</Link></li>
              <li><Link to="/terms" className="hover:text-white transition-colors hover:translate-x-[-5px] inline-block">الشروط والأحكام</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-bold mb-6 text-[#D4AF37] relative inline-block">
              تواصل معنا
              <span className="absolute -bottom-2 right-0 w-8 h-1 bg-[#D4AF37] rounded-full"></span>
            </h3>
            
            <ul className="space-y-4 text-gray-400 text-sm font-medium mb-8">
              <li className="flex items-start gap-3 group">
                <div className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center text-[#D4AF37] group-hover:bg-[#D4AF37] group-hover:text-black transition-all">
                    <MapPin size={16} />
                </div>
                <span className="mt-1">القاهرة، مصر</span>
              </li>
            </ul>

            <div className="flex gap-3">
              <a 
                href="https://www.facebook.com/BeitEL3ilaa/" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center text-white hover:bg-[#1877F2] transition-all hover:-translate-y-1 shadow-lg"
                title="تابعنا على فيسبوك"
              >
                <Facebook size={20} />
              </a>
            </div>
          </div>

        </div>

        <div className="border-t border-gray-800 pt-8 mt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-gray-500 text-sm font-medium">
          <p>© {new Date().getFullYear()} بيت العيلة - جميع الحقوق محفوظة.</p>
          <div className="flex gap-6">
             <div className="flex gap-2 opacity-50 grayscale hover:grayscale-0 transition-all">
             </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
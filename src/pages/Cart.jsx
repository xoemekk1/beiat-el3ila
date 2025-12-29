import React from 'react';
import { useCart } from '../context/CartContext';
import { Link, useNavigate } from 'react-router-dom';
import { Trash2, Plus, Minus, ArrowRight, ShoppingBag, Heart } from 'lucide-react';
import { motion } from 'framer-motion';

const Cart = () => {
  const { cartItems, removeFromCart, updateQuantity, cartTotal } = useCart();
  const navigate = useNavigate();

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 font-sans" dir="rtl">
        <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center">
          <div className="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-6 text-gray-400">
            <ShoppingBag size={48} />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">سلة التسوق فارغة</h2>
          <p className="text-gray-500 mb-8">لم تقم بإضافة أي منتجات للسلة بعد.</p>
          <Link to="/shop" className="bg-primary text-white px-8 py-3 rounded-xl font-bold hover:bg-gray-800 transition-colors inline-flex items-center gap-2">
            تصفح المنتجات <ArrowRight size={20} className="rtl:rotate-180"/>
          </Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f9fafb] pt-28 pb-20 font-sans" dir="rtl">
      <div className="container mx-auto px-4 md:px-6">
        <h1 className="text-3xl font-black text-gray-900 mb-8 flex items-center gap-2">
          <ShoppingBag className="text-primary" /> سلة التسوق <span className="text-sm font-normal text-gray-500 mt-2 mr-2">({cartItems.length} منتجات)</span>
        </h1>

        <div className="grid lg:grid-cols-3 gap-8">
          
          {/* قائمة المنتجات */}
          <div className="lg:col-span-2 space-y-4">
            {cartItems.map((item) => (
              <motion.div 
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                key={item.cartId} 
                className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex gap-4 md:gap-6 items-center"
              >
                <Link to={`/product/${item.id}`} className="shrink-0 w-24 h-24 md:w-32 md:h-32 bg-gray-50 rounded-xl overflow-hidden border border-gray-100 hover:opacity-90 transition-opacity">
                  <img 
                    src={item.image} 
                    alt={item.name} 
                    className="w-full h-full object-cover" 
                  />
                </Link>

                <div className="flex-1">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                        <div className="text-xs text-gray-400 mb-1">{item.category}</div>
                        <Link to={`/product/${item.id}`} className="font-bold text-gray-900 text-lg hover:text-primary transition-colors line-clamp-1">
                        {item.name}
                        </Link>
                    </div>
                    <button onClick={() => removeFromCart(item.cartId)} className="text-gray-400 hover:text-red-500 transition-colors p-1">
                      <Trash2 size={20} />
                    </button>
                  </div>

                  <div className="text-sm text-gray-500 mb-4 flex gap-3">
                    {item.selectedColor && <span className="bg-gray-100 px-2 py-1 rounded">لون: {item.selectedColor}</span>}
                    {item.selectedSize && <span className="bg-gray-100 px-2 py-1 rounded">مقاس: {item.selectedSize}</span>}
                  </div>

                  <div className="flex justify-between items-center">
                    <div className="flex items-center border border-gray-200 rounded-lg">
                      <button onClick={() => updateQuantity(item.cartId, -1)} className="p-2 hover:bg-gray-50 text-gray-600"><Minus size={16} /></button>
                      <span className="w-8 text-center font-bold text-sm">{item.quantity}</span>
                      <button onClick={() => updateQuantity(item.cartId, 1)} className="p-2 hover:bg-gray-50 text-gray-600"><Plus size={16} /></button>
                    </div>
                    <span className="font-black text-xl text-primary">{item.price * item.quantity} ج.م</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          <div className="lg:col-span-1">
            <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm sticky top-28">
              <h3 className="text-xl font-bold text-gray-900 mb-6">ملخص الطلب</h3>
              <div className="space-y-3 mb-6">
                <div className="flex justify-between text-gray-500"><span>المجموع الفرعي</span><span>{cartTotal} ج.م</span></div>
                <div className="flex justify-between text-gray-500"><span>الشحن</span><span className="text-xs bg-gray-100 px-2 py-1 rounded">يُحسب عند الدفع</span></div>
              </div>
              <div className="border-t border-gray-100 pt-4 mb-6 flex justify-between items-center">
                <span className="font-bold text-gray-900 text-lg">الإجمالي</span>
                <span className="font-black text-2xl text-primary">{cartTotal} ج.م</span>
              </div>
              <button onClick={() => navigate('/checkout')} className="w-full bg-primary text-white py-4 rounded-xl font-bold text-lg hover:bg-gray-800 transition-all shadow-lg hover:translate-y-[-2px]">
                إتمام الشراء
              </button>
              <div className="mt-4 text-center">
                <Link to="/shop" className="text-sm font-bold text-gray-500 hover:text-primary transition-colors">أو تابع التسوق</Link>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Cart;
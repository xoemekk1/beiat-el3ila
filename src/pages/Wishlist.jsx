import React from 'react';
import { useCart } from '../context/CartContext';
import ProductCard from '../components/ProductCard';
import { Link } from 'react-router-dom';
import { Heart, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';

const Wishlist = () => {
  const { wishlist } = useCart();

  if (wishlist.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 font-sans" dir="rtl">
        <div className="w-24 h-24 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6 text-red-300">
          <Heart size={48} className="fill-red-300" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">قائمة المفضلة فارغة</h2>
        <p className="text-gray-500 mb-8">احفظ المنتجات التي تعجبك هنا لشرائها لاحقاً.</p>
        <Link to="/shop" className="bg-primary text-white px-8 py-3 rounded-xl font-bold hover:bg-gray-800 transition-colors inline-flex items-center gap-2">
          تصفح المنتجات <ArrowRight size={20} className="rtl:rotate-180"/>
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f9fafb] pt-28 pb-20 font-sans" dir="rtl">
      <div className="container mx-auto px-4 md:px-6">
        <h1 className="text-3xl font-black text-gray-900 mb-8 flex items-center gap-2">
          <Heart className="text-red-500 fill-red-500" /> المفضلة <span className="text-sm font-normal text-gray-500 mt-2 mr-2">({wishlist.length})</span>
        </h1>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {wishlist.map((product) => (
            <motion.div layout key={product.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <ProductCard product={product} />
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Wishlist;
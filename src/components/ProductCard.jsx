import React from 'react';
import { Link } from 'react-router-dom';
import { ShoppingCart, Star, Heart, Flame } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { motion } from 'framer-motion';

const ProductCard = ({ product }) => {
  const { addToCart, toggleWishlist, isInWishlist } = useCart();
  const isLoved = isInWishlist(product.id);

  // حساب السعر والخصم (لو موجود)
  const isExpired = product.discountEnd ? new Date() > (product.discountEnd.seconds ? new Date(product.discountEnd.seconds * 1000) : new Date(product.discountEnd)) : false;
  const currentPrice = (isExpired && product.oldPrice) ? product.oldPrice : product.price;
  const hasDiscount = !isExpired && product.oldPrice > 0;
  const discountPercentage = hasDiscount ? Math.round(((product.oldPrice - currentPrice) / product.oldPrice) * 100) : 0;

  // ✅ دالة الإضافة للسلة المعدلة (الحل الجذري)
  const handleAddToCart = (e) => {
    // 1. منع أي تداخل أو انتقال للصفحة
    e.preventDefault(); 
    e.stopPropagation(); 

    // 2. إضافة المنتج للسلة (اللوجيك الأساسي)
    addToCart({ ...product, price: currentPrice });

    // 3. تتبع البيكسل (الطريقة المباشرة - Native Way)
    // دي أضمن طريقة لأنها بتنادي سكريبت الفيسبوك مباشرة
    if (window.fbq) {
        window.fbq('track', 'AddToCart', {
            content_name: product.name,
            content_ids: [product.id],
            content_type: 'product',
            value: currentPrice,
            currency: 'EGP'
        });
        console.log("✅ Pixel AddToCart Fired for:", product.name); // عشان تشوفها في الكونسول
    } else {
        console.log("⚠️ Pixel not loaded yet");
    }
  };

  const handleToggleWishlist = (e) => {
    e.preventDefault();
    e.stopPropagation();
    toggleWishlist(product);
  };

  return (
    <div className="group relative bg-white rounded-2xl border border-gray-100 hover:border-primary/20 hover:shadow-xl transition-all duration-300 overflow-hidden flex flex-col h-full">
      
      {/* Product Image & Badges */}
      <Link to={`/product/${product.id}`} className="relative block aspect-[4/5] overflow-hidden bg-gray-50">
        <img 
          src={product.image} 
          alt={product.name} 
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 mix-blend-multiply" 
        />
        
        {/* Badges */}
        <div className="absolute top-3 right-3 flex flex-col gap-2">
          {hasDiscount && (
            <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-lg shadow-sm animate-pulse">
              -{discountPercentage}%
            </span>
          )}
          {Number(product.stock) < 5 && Number(product.stock) > 0 && (
             <span className="bg-orange-500 text-white text-xs font-bold px-2 py-1 rounded-lg shadow-sm flex items-center gap-1">
               <Flame size={10} fill="white" /> قريباً ينفد
             </span>
          )}
        </div>

        {/* Wishlist Button */}
        <button 
          onClick={handleToggleWishlist}
          className={`absolute top-3 left-3 p-2 rounded-full shadow-sm transition-all duration-300 z-10 ${isLoved ? 'bg-red-50 text-red-500' : 'bg-white text-gray-400 hover:text-red-500 hover:scale-110'}`}
        >
          <Heart size={18} className={isLoved ? 'fill-current' : ''} />
        </button>
      </Link>

      {/* Product Info */}
      <div className="p-4 flex flex-col flex-grow">
        <div className="flex justify-between items-start mb-2">
            <span className="text-xs font-bold text-accent bg-accent/5 px-2 py-1 rounded-md">{product.category}</span>
            <div className="flex items-center gap-1 text-yellow-400 text-xs font-bold">
                <Star size={12} fill="currentColor" /> <span>{product.rating || 'جديد'}</span>
            </div>
        </div>

        <Link to={`/product/${product.id}`} className="block mb-2">
            <h3 className="font-bold text-gray-800 text-lg leading-tight group-hover:text-primary transition-colors line-clamp-2">
                {product.name}
            </h3>
        </Link>

        <div className="mt-auto flex items-end justify-between pt-4 border-t border-gray-50">
            <div className="flex flex-col">
                {hasDiscount && <span className="text-xs text-gray-400 line-through font-medium">{product.oldPrice} ج.م</span>}
                <span className="text-xl font-black text-gray-900">{currentPrice} <span className="text-xs font-bold">ج.م</span></span>
            </div>

            {/* ✅ زر الإضافة للسلة مع z-index عالي لضمان الضغط */}
            <motion.button 
                whileTap={{ scale: 0.9 }}
                onClick={handleAddToCart}
                disabled={Number(product.stock) <= 0}
                className={`relative z-20 w-10 h-10 rounded-xl flex items-center justify-center transition-colors shadow-lg ${Number(product.stock) <= 0 ? 'bg-gray-200 cursor-not-allowed text-gray-400' : 'bg-gray-900 text-white hover:bg-primary'}`}
                title={Number(product.stock) <= 0 ? "نفذت الكمية" : "أضف للسلة"}
            >
                <ShoppingCart size={20} />
            </motion.button>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
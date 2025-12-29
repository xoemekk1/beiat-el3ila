import React, { useRef, useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, query, orderBy, limit, getDocs } from 'firebase/firestore';
import { Link } from 'react-router-dom';
import { ChevronRight, ChevronLeft, Heart, Plus, Star, Zap } from 'lucide-react';
import { useCart } from '../context/CartContext';

import ReactPixel from 'react-facebook-pixel';

const BestSellers = () => {
  const [products, setProducts] = useState([]);
  const scrollRef = useRef(null);
  const { addToCart, toggleWishlist, isInWishlist } = useCart();

  useEffect(() => {
    const fetchBestSellers = async () => {
      try {
        const q = query(collection(db, "products"), orderBy("price", "desc"), limit(10));
        const snapshot = await getDocs(q);
        setProducts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      } catch (err) {
        console.error(err);
      }
    };
    fetchBestSellers();
  }, []);

  const scroll = (direction) => {
    const { current } = scrollRef;
    if (current) {
      const scrollAmount = direction === 'left' ? -300 : 300; 
      current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  
  const handleAddToCart = (product) => {
    
    addToCart(product);

    
    if (window.fbq) {
        window.fbq('track', 'AddToCart', {
            content_name: product.name,
            content_ids: [product.id],
            content_type: 'product',
            value: product.price,
            currency: 'EGP'
        });
        console.log(" Pixel AddToCart Fired for:", product.name);
    }
  };

  return (
    <section className="py-16 bg-white relative">
      <div className="container mx-auto px-4">
        
        <div className="flex justify-between items-center mb-8 px-2">
          <h2 className="text-2xl md:text-4xl font-black text-gray-900">الأفضل مبيعاً <span className="text-[#D4AF37]">عشانك</span></h2>
          <Link to="/shop" className="text-sm md:text-base font-bold text-gray-500 hover:text-[#D4AF37] transition-colors">عرض الكل</Link>
        </div>

        <div className="relative group/slider">
          
          <button 
            onClick={() => scroll('left')} 
            className="absolute left-0 top-1/2 -translate-y-1/2 z-20 bg-white shadow-lg border border-gray-100 rounded-full p-3 text-gray-800 hover:text-[#D4AF37] transition-all opacity-0 group-hover/slider:opacity-100 disabled:opacity-30 translate-x-1/3"
          >
            <ChevronLeft size={24} />
          </button>

          <button 
            onClick={() => scroll('right')} 
            className="absolute right-0 top-1/2 -translate-y-1/2 z-20 bg-white shadow-lg border border-gray-100 rounded-full p-3 text-gray-800 hover:text-[#D4AF37] transition-all opacity-0 group-hover/slider:opacity-100 -translate-x-1/3"
          >
            <ChevronRight size={24} />
          </button>
          <div 
            ref={scrollRef} 
            className="flex gap-6 overflow-x-auto pb-6 pt-4 px-2 scroll-smooth hide-scrollbar"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {products.map((product) => {
               const isLoved = isInWishlist(product.id);
               const discount = product.oldPrice > 0 ? Math.round(((product.oldPrice - product.price) / product.oldPrice) * 100) : 0;

               return (
                <div key={product.id} className="w-[220px] md:w-[280px] flex-none bg-white border border-gray-200 rounded-2xl hover:shadow-2xl hover:border-[#D4AF37]/30 transition-all duration-300 flex flex-col overflow-hidden relative group h-full">
                  
                  <div className="absolute top-0 right-0 bg-[#004d40] text-white text-[10px] md:text-xs font-bold px-4 py-1.5 rounded-bl-xl z-10 shadow-sm">
                    أفضل المنتجات
                  </div>

                  <button 
                    onClick={() => toggleWishlist(product)}
                    className="absolute top-3 left-3 z-10 bg-white/90 backdrop-blur p-2 rounded-full shadow-sm text-gray-400 hover:text-red-500 hover:bg-white transition-colors"
                  >
                    <Heart size={20} className={isLoved ? "fill-red-500 text-red-500" : ""} />
                  </button>

                  <div className="relative h-64 md:h-72 bg-gray-50 flex items-center justify-center overflow-hidden">
                    <Link to={`/product/${product.id}`} className="w-full h-full block">
                        <img 
                            src={product.image} 
                            alt={product.name} 
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-in-out" 
                        />
                    </Link>
                                        <button 
                        onClick={() => handleAddToCart(product)}
                        className="absolute bottom-3 left-3 bg-white border border-gray-200 p-2.5 rounded-full text-gray-700 hover:bg-[#D4AF37] hover:text-black hover:border-[#D4AF37] transition-all shadow-md active:scale-95 z-20"
                    >
                        <Plus size={22} />
                    </button>
                  </div>

                  <div className="p-4 md:p-5 flex flex-col flex-grow text-right bg-white relative z-10">
                                        <Link to={`/product/${product.id}`} className="block mb-2">
                        <h3 className="text-sm md:text-base font-bold text-gray-900 line-clamp-2 min-h-[3rem] leading-snug hover:text-[#D4AF37] transition-colors" title={product.name}>
                        {product.name}
                        </h3>
                    </Link>

                    <div className="flex items-center gap-1.5 mb-3">
                        <div className="flex text-yellow-400"><Star size={14} className="fill-yellow-400" /></div>
                        <span className="text-xs md:text-sm font-bold text-gray-900">{product.rating || "4.9"}</span>
                        <span className="text-[10px] md:text-xs text-gray-400">({product.reviewsCount || 120})</span>
                    </div>

                    <div className="mt-auto pt-3 border-t border-gray-50">
                        <div className="flex items-end gap-2 mb-1.5">
                            <span className="text-xl md:text-2xl font-black text-gray-900">{product.price} <span className="text-xs font-normal text-gray-500">ج.م</span></span>
                        </div>
                        
                        {product.oldPrice > 0 && (
                             <div className="flex items-center gap-2 text-[10px] md:text-xs">
                                <span className="text-gray-400 line-through">{product.oldPrice} ج.م</span>
                                <span className="text-green-700 font-bold bg-green-50 px-2 py-0.5 rounded border border-green-100">{discount}% خصم</span>
                             </div>
                        )}
                    </div>
                  </div>

                  <div className="bg-[#111] text-white py-2 px-4 flex justify-between items-center text-[10px] md:text-xs font-bold tracking-wide">
                    <span className="flex items-center gap-1.5"><Zap size={12} className="fill-[#D4AF37] text-[#D4AF37]"/> اكسبرس</span>
                    <span className="bg-[#D4AF37] text-black px-2 py-0.5 rounded-[3px]">غداً</span>
                  </div>

                </div>
               );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};

export default BestSellers;
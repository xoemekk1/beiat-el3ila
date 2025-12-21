import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ShoppingCart, Star, Eye, Clock, Heart, XCircle } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { doc, onSnapshot } from 'firebase/firestore'; 
import { db } from '../firebase';

const ProductCard = ({ product }) => {
  const { addToCart, toggleWishlist, isInWishlist } = useCart();
  
  const [liveProduct, setLiveProduct] = useState(product); 
  const [timeLeft, setTimeLeft] = useState(null);
  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    if (!product?.id) return;
    const unsub = onSnapshot(doc(db, "products", product.id), (docSnap) => {
        if (docSnap.exists()) {
            setLiveProduct({ id: docSnap.id, ...docSnap.data() });
        }
    });
    return () => unsub();
  }, [product.id]);

  useEffect(() => {
    if (!liveProduct.discountEnd) return;
    const calculateTime = () => {
      const now = new Date();
      const end = liveProduct.discountEnd.seconds ? new Date(liveProduct.discountEnd.seconds * 1000) : new Date(liveProduct.discountEnd);
      const distance = end - now;
      if (distance < 0) { setTimeLeft(null); setIsExpired(true); } 
      else { setIsExpired(false); 
        const days = Math.floor(distance / (1000 * 60 * 60 * 24));
        const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((distance % (1000 * 60)) / 1000);
        setTimeLeft({ days, hours, minutes, seconds });
      }
    };
    calculateTime();
    const interval = setInterval(calculateTime, 1000); 
    return () => clearInterval(interval);
  }, [liveProduct]); 

  if (!liveProduct) return null;

  const currentPrice = (isExpired && liveProduct.oldPrice) ? liveProduct.oldPrice : liveProduct.price;
  const showOldPrice = !isExpired && liveProduct.oldPrice > 0;
  const discount = showOldPrice ? Math.round(((liveProduct.oldPrice - currentPrice) / liveProduct.oldPrice) * 100) : 0;
  const ratingValue = liveProduct.rating || 0;
  const reviewsCount = liveProduct.reviewsCount || 0;
  const isLoved = isInWishlist(liveProduct.id);
  const isOutOfStock = Number(liveProduct.stock) <= 0; // ✅ التحقق من المخزون

  const handleAddToCart = () => {
    if (!isOutOfStock) addToCart({ ...liveProduct, price: currentPrice });
  };

  return (
    <div className={`group relative bg-white rounded-2xl border transition-all duration-300 overflow-hidden flex flex-col h-full ${isOutOfStock ? 'border-red-100 opacity-80' : 'border-gray-100 hover:border-gray-200 hover:shadow-xl'}`}>
      
      {/* بادج الخصم أو نفاذ الكمية */}
      <div className="absolute top-3 right-3 z-10 flex flex-col gap-2">
        {isOutOfStock ? (
            <span className="bg-red-600 text-white text-[10px] font-bold px-2 py-1 rounded shadow-sm flex items-center gap-1"><XCircle size={12}/> نفذت الكمية</span>
        ) : (
            discount > 0 && <span className="bg-red-600 text-white text-[10px] font-bold px-2 py-1 rounded shadow-sm">-{discount}%</span>
        )}
      </div>

      <div className="relative aspect-[4/5] bg-gray-50 overflow-hidden">
        <Link to={`/product/${liveProduct.id}`}>
            <img src={liveProduct.image} alt={liveProduct.name} className={`w-full h-full object-contain p-4 mix-blend-multiply transition-transform duration-700 ease-out ${isOutOfStock ? 'grayscale' : 'group-hover:scale-110'}`}/>
        </Link>
        <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2 translate-y-10 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
            {/* ✅ تعطيل زر السلة لو المخزون 0 */}
            <button 
                onClick={handleAddToCart} 
                disabled={isOutOfStock}
                className={`p-3 rounded-full transition-colors shadow-lg ${isOutOfStock ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'bg-accent text-white hover:bg-gray-800'}`}
            >
                <ShoppingCart size={18} />
            </button>
            <Link to={`/product/${liveProduct.id}`} className="bg-white text-gray-700 p-3 rounded-full hover:bg-gray-100 transition-colors shadow-lg border border-gray-100"><Eye size={18} /></Link>
        </div>
      </div>

      <div className="p-4 flex flex-col flex-grow text-right">
        <div className="text-xs text-gray-400 mb-1">{liveProduct.category}</div>
        <Link to={`/product/${liveProduct.id}`} className="block"><h3 className="font-bold text-gray-800 text-sm mb-2 line-clamp-2 hover:text-accent transition-colors min-h-[40px]">{liveProduct.name}</h3></Link>
        
        <div className="flex items-center gap-1 mb-3">
            <div className="flex text-yellow-400">
                {[...Array(5)].map((_, i) => (
                    <Star key={i} size={12} className={i < Math.round(ratingValue) ? "fill-yellow-400 text-yellow-400" : "fill-gray-200 text-gray-200"} />
                ))}
            </div>
            <span className="text-xs text-gray-500 font-medium mr-1" dir="ltr">{reviewsCount > 0 ? `(${reviewsCount})` : '(جديد)'}</span>
        </div>

        <div className="mt-auto">
            {timeLeft && !isExpired && !isOutOfStock && (
                <div className="flex items-center justify-center gap-2 bg-red-50 text-red-600 text-xs font-bold py-2 px-2 rounded-xl border border-red-100 mb-3 animate-pulse">
                    <Clock size={14} />
                    <span className="font-mono text-xs tracking-widest" dir="ltr">{String(timeLeft.days).padStart(2, '0')}:{String(timeLeft.hours).padStart(2, '0')}:{String(timeLeft.minutes).padStart(2, '0')}:{String(timeLeft.seconds || 0).padStart(2, '0')}</span>
                </div>
            )}

            <div className="flex items-center justify-between">
                <div className="flex flex-col">
                    {showOldPrice && <span className="text-xs text-gray-400 line-through decoration-red-400">{liveProduct.oldPrice} ج.م</span>}
                    <span className={`text-lg font-black ${isOutOfStock ? 'text-gray-400' : 'text-primary'}`}>{currentPrice} ج.م</span>
                </div>
                
                <button onClick={() => toggleWishlist(liveProduct)} className={`transition-colors ${isLoved ? 'text-red-500' : 'text-gray-300 hover:text-red-500'}`}>
                    <Heart size={20} className={isLoved ? 'fill-red-500' : ''} />
                </button>
            </div>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
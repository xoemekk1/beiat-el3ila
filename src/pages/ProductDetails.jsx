import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { db } from '../firebase';
import { doc, onSnapshot, collection, query, where, limit, getDocs } from 'firebase/firestore'; 
import { useCart } from '../context/CartContext';
import { ShoppingCart, Star, Truck, ShieldCheck, Minus, Plus, Heart, Flame, XCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import ReactPixel from 'react-facebook-pixel';
import Reviews from '../components/Reviews';
import ProductCard from '../components/ProductCard'; 
import ProductSkeleton from '../components/ProductSkeleton'; 

const ProductDetails = () => {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [relatedProducts, setRelatedProducts] = useState([]); 
  const [relatedLoading, setRelatedLoading] = useState(true); 
  const [quantity, setQuantity] = useState(1);
  const [activeImage, setActiveImage] = useState('');
  const [selectedColor, setSelectedColor] = useState('');
  const [selectedSize, setSelectedSize] = useState('');
  const [timeLeft, setTimeLeft] = useState(null);
  const [isExpired, setIsExpired] = useState(false);
  const [zoomPos, setZoomPos] = useState({ x: 50, y: 50 });
  const { addToCart, toggleWishlist, isInWishlist } = useCart();

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    setProduct(null);
    setRelatedProducts([]);
    
    const unsub = onSnapshot(doc(db, "products", id), (docSnap) => {
        if (docSnap.exists()) {
            const data = docSnap.data();
            setProduct({ id: docSnap.id, ...data });
            setActiveImage(data.image); 
            
            if (data.discountEnd) {
                const end = data.discountEnd.seconds ? new Date(data.discountEnd.seconds * 1000) : new Date(data.discountEnd);
                if (new Date() > end) setIsExpired(true);
            }
            ReactPixel.track('ViewContent', { content_name: data.name, content_id: docSnap.id, value: data.price, currency: 'EGP' });
            setLoading(false);
        } else {
            setLoading(false);
        }
    });

    window.scrollTo({ top: 0, behavior: 'smooth' });

    return () => unsub();
  }, [id]);

  useEffect(() => {
    if (!product || !product.category) return;

    const fetchRelated = async () => {
        setRelatedLoading(true);
        try {
            const q = query(
                collection(db, "products"), 
                where("category", "==", product.category),
                limit(5) 
            );
            const snapshot = await getDocs(q);
            const related = snapshot.docs
                .map(doc => ({ id: doc.id, ...doc.data() }))
                .filter(item => item.id !== product.id) 
                .slice(0, 4); 

            setRelatedProducts(related);
        } catch (err) {
            console.error("Error fetching related:", err);
        } finally {
            setRelatedLoading(false);
        }
    };

    fetchRelated();
  }, [product]); 

  useEffect(() => {
    if (!product?.discountEnd) return;
    const calculateTime = () => {
      const now = new Date();
      const end = product.discountEnd.seconds ? new Date(product.discountEnd.seconds * 1000) : new Date(product.discountEnd);
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
  }, [product]);

  const handleMouseMove = (e) => {
    const { left, top, width, height } = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - left) / width) * 100;
    const y = ((e.clientY - top) / height) * 100;
    setZoomPos({ x, y });
  };

  const handleMouseLeave = () => {
    setZoomPos({ x: 50, y: 50 });
  };

  if (loading) return (
    <div className="min-h-screen bg-[#f9fafb] pt-28 pb-20 container mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="aspect-square bg-gray-200 animate-pulse rounded-3xl"></div>
            <div className="space-y-4 pt-10">
                <div className="h-8 bg-gray-200 w-3/4 rounded animate-pulse"></div>
                <div className="h-6 bg-gray-200 w-1/4 rounded animate-pulse"></div>
                <div className="h-32 bg-gray-200 w-full rounded animate-pulse"></div>
                <div className="h-12 bg-gray-200 w-full rounded animate-pulse mt-8"></div>
            </div>
        </div>
    </div>
  );

  if (!product) return <div className="min-h-screen flex justify-center items-center font-bold text-xl">المنتج غير موجود</div>;

  const currentPrice = (isExpired && product.oldPrice) ? product.oldPrice : product.price;
  const showOldPrice = !isExpired && product.oldPrice > 0;
  const gallery = product.images?.length > 0 ? product.images : [product.image];
  const isLoved = isInWishlist(product.id);
  const isOutOfStock = Number(product.stock) <= 0;

  const handleAddToCart = () => {
    addToCart({ ...product, price: currentPrice }, quantity, selectedColor, selectedSize);
    ReactPixel.track('AddToCart', { content_name: product.name, content_id: product.id, value: currentPrice, currency: 'EGP' });
  };

  return (
    <div className="min-h-screen bg-[#f9fafb] pt-28 pb-20 font-sans" dir="rtl">
      <div className="container mx-auto px-4 md:px-6">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-8">
          <Link to="/" className="hover:text-primary">الرئيسية</Link> / <Link to="/shop" className="hover:text-primary">المتجر</Link> / <span className="font-bold text-gray-800">{product.name}</span>
        </div>

        {/* Product Main Section */}
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden mb-16">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-0 lg:gap-8">
            {/* Gallery */}
            <div className="p-6 lg:p-10 bg-gray-50 flex flex-col items-center">
               
               <motion.div 
                 key={activeImage} 
                 initial={{ opacity: 0 }} 
                 animate={{ opacity: 1 }} 
                 className="relative w-full aspect-square max-w-md bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-6 group cursor-zoom-in"
                 onMouseMove={handleMouseMove}
                 onMouseLeave={handleMouseLeave}
               >
                 <img 
                    src={activeImage} 
                    alt={product.name} 
                    className="w-full h-full object-cover transition-transform duration-200 ease-out group-hover:scale-150"
                    style={{ 
                        transformOrigin: `${zoomPos.x}% ${zoomPos.y}%`
                    }} 
                 />
               </motion.div>

               <div className="flex gap-3 overflow-x-auto w-full justify-center pb-2 no-scrollbar">
                 {gallery.map((img, idx) => (
                   <button key={idx} onClick={() => setActiveImage(img)} className={`w-20 h-20 rounded-xl border-2 overflow-hidden flex-shrink-0 transition-all ${activeImage === img ? 'border-primary' : 'border-transparent'}`}><img src={img} className="w-full h-full object-cover" /></button>
                 ))}
               </div>
            </div>

            {/* Details */}
            <div className="p-6 lg:p-10 flex flex-col">
              <div className="mb-4 flex items-center justify-between">
                  <span className="text-accent font-bold text-sm bg-accent/10 px-3 py-1 rounded-full">{product.category}</span>
                  <div className="flex items-center gap-1 bg-yellow-50 px-2 py-1 rounded-lg">
                      <Star size={16} className="fill-yellow-400 text-yellow-400" />
                      <span className="font-bold text-gray-700">{product.rating || 'جديد'}</span>
                      <span className="text-xs text-gray-400">({product.reviewsCount || 0} تقييم)</span>
                  </div>
              </div>
              <h1 className="text-3xl lg:text-4xl font-black text-gray-900 mb-4 leading-tight">{product.name}</h1>
              <div className="flex items-end gap-4 mb-6 pb-6 border-b border-gray-100">
                <span className="text-5xl font-black text-primary">{currentPrice} <span className="text-xl font-bold">ج.م</span></span>
                {showOldPrice && <span className="text-xl text-gray-400 line-through mb-2">{product.oldPrice} ج.م</span>}
              </div>

              {/* Timer */}
              {timeLeft && !isExpired && (
                <div className="mb-8 bg-red-50 border-2 border-red-100 rounded-2xl p-4 md:p-6 text-center shadow-inner">
                    <div className="flex items-center justify-center gap-2 text-red-600 font-bold mb-3 animate-pulse"><Flame size={20} className="fill-red-600" /><span>ينتهي العرض خلال:</span></div>
                    <div className="flex justify-center gap-2 md:gap-4 text-gray-800" dir="ltr">
                        <div className="flex flex-col items-center"><div className="w-14 h-14 md:w-16 md:h-16 bg-white rounded-xl shadow-sm border border-red-100 flex items-center justify-center text-2xl md:text-3xl font-black text-red-600">{String(timeLeft.seconds).padStart(2, '0')}</div><span className="text-xs mt-1 font-bold text-gray-500">ثانية</span></div>
                        <span className="text-2xl font-bold text-red-300 mt-2">:</span>
                        <div className="flex flex-col items-center"><div className="w-14 h-14 md:w-16 md:h-16 bg-white rounded-xl shadow-sm border border-red-100 flex items-center justify-center text-2xl md:text-3xl font-black text-gray-800">{String(timeLeft.minutes).padStart(2, '0')}</div><span className="text-xs mt-1 font-bold text-gray-500">دقيقة</span></div>
                        <span className="text-2xl font-bold text-red-300 mt-2">:</span>
                        <div className="flex flex-col items-center"><div className="w-14 h-14 md:w-16 md:h-16 bg-white rounded-xl shadow-sm border border-red-100 flex items-center justify-center text-2xl md:text-3xl font-black text-gray-800">{String(timeLeft.hours).padStart(2, '0')}</div><span className="text-xs mt-1 font-bold text-gray-500">ساعة</span></div>
                        <span className="text-2xl font-bold text-red-300 mt-2">:</span>
                        <div className="flex flex-col items-center"><div className="w-14 h-14 md:w-16 md:h-16 bg-white rounded-xl shadow-sm border border-red-100 flex items-center justify-center text-2xl md:text-3xl font-black text-gray-800">{String(timeLeft.days).padStart(2, '0')}</div><span className="text-xs mt-1 font-bold text-gray-500">يوم</span></div>
                    </div>
                </div>
              )}

              {/* Options */}
              {product.colors && product.colors.length > 0 && (<div className="mb-6"><h3 className="font-bold text-gray-800 mb-3">اختر اللون:</h3><div className="flex gap-3">{product.colors.map((color, idx) => (<button key={idx} onClick={() => setSelectedColor(color)} className={`px-4 py-2 rounded-lg border-2 font-bold text-sm transition-all ${selectedColor === color ? 'border-primary bg-primary text-white' : 'border-gray-200 text-gray-600 hover:border-gray-300'}`}>{color}</button>))}</div></div>)}
              {product.sizes && product.sizes.length > 0 && (<div className="mb-8"><h3 className="font-bold text-gray-800 mb-3">اختر المقاس:</h3><div className="flex gap-3">{product.sizes.map((size, idx) => (<button key={idx} onClick={() => setSelectedSize(size)} className={`w-12 h-12 rounded-lg border-2 font-bold text-sm flex items-center justify-center transition-all ${selectedSize === size ? 'border-primary bg-primary text-white' : 'border-gray-200 text-gray-600 hover:border-gray-300'}`}>{size}</button>))}</div></div>)}

              <p className="text-gray-600 leading-relaxed mb-8 bg-gray-50 p-4 rounded-xl border border-gray-100">{product.description}</p>

              {/* Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 mt-auto">
                {!isOutOfStock && (
                    <div className="flex items-center justify-between border border-gray-300 rounded-xl px-4 py-3 w-full sm:w-32 bg-white">
                        <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="p-1 hover:text-primary"><Minus size={20} /></button>
                        <span className="font-black text-xl">{quantity}</span>
                        <button onClick={() => setQuantity(quantity + 1)} className="p-1 hover:text-primary"><Plus size={20} /></button>
                    </div>
                )}

                <button 
                    onClick={handleAddToCart} 
                    disabled={isOutOfStock}
                    className={`flex-1 py-4 rounded-xl font-black text-lg transition-all shadow-xl flex items-center justify-center gap-2 transform active:scale-95 ${isOutOfStock ? 'bg-red-50 text-red-500 border-2 border-red-100 cursor-not-allowed shadow-none' : 'bg-primary text-white hover:bg-gray-800 shadow-primary/20'}`}
                >
                    {isOutOfStock ? (<> <XCircle size={22} /> نفذت الكمية (Out of Stock) </>) : (<> <ShoppingCart size={22} /> أضف إلى السلة </>)}
                </button>

                <button onClick={() => toggleWishlist(product)} className={`w-14 h-14 flex-shrink-0 flex items-center justify-center rounded-xl border-2 transition-all ${isLoved ? 'border-red-100 bg-red-50 text-red-500' : 'border-gray-300 text-gray-400 hover:border-red-200 hover:text-red-500'}`}><Heart size={28} className={isLoved ? 'fill-red-500' : ''} /></button>
              </div>
              
              {!isOutOfStock && Number(product.stock) < 5 && (
                  <p className="text-red-500 text-sm font-bold mt-3 flex items-center gap-2 animate-pulse"><Flame size={16}/> تنبيه: باقي {product.stock} قطع فقط في المخزون!</p>
              )}

              <div className="grid grid-cols-2 gap-4 mt-8 pt-8 border-t border-gray-100">
                  <div className="flex items-center gap-3 text-sm text-gray-600"><div className="bg-green-100 p-2 rounded-full text-green-600"><Truck size={18}/></div> شحن سريع </div>
                  <div className="flex items-center gap-3 text-sm text-gray-600"><div className="bg-blue-100 p-2 rounded-full text-blue-600"><ShieldCheck size={18}/></div>افضل كواليتي </div>
              </div>
            </div>
          </div>
          
          <div className="border-t border-gray-100"><Reviews productId={product.id} /></div>
        </div>

        {/* قسم المنتجات ذات الصلة */}
        <div className="mb-16">
            <h2 className="text-2xl font-black text-gray-900 mb-8 flex items-center gap-2 border-r-4 border-accent pr-4">
                منتجات قد تعجبك
            </h2>
            
            {relatedLoading ? (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
                    {[1,2,3,4].map(i => <div key={i} className="h-[350px]"><ProductSkeleton/></div>)}
                </div>
            ) : relatedProducts.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
                    {relatedProducts.map(related => (
                        <ProductCard key={related.id} product={related} />
                    ))}
                </div>
            ) : (
                <p className="text-gray-500 text-center py-10 bg-white rounded-xl border border-gray-100">لا توجد منتجات مشابهة حالياً.</p>
            )}
        </div>

      </div>
    </div>
  );
};

export default ProductDetails;
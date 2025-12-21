import React, { useState, useEffect, useRef } from 'react';
import { motion, useScroll, useTransform, useSpring, useMotionValue } from 'framer-motion';
import { ArrowRight, ShoppingBag, Truck, ShieldCheck, Headset, ArrowUpRight, Zap, Clock, Star } from 'lucide-react';
import { Link } from 'react-router-dom';
import { db } from '../firebase';
import { collection, getDocs, query, orderBy, limit, doc, getDoc } from 'firebase/firestore';
import BestSellers from '../components/BestSellers'; // ✅ استيراد

// --- مكونات UI ---

// 1. زر بتأثير مغناطيسي
const MagneticButton = ({ children, className }) => {
  const ref = useRef(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const springConfig = { damping: 15, stiffness: 150, mass: 0.1 };
  const springX = useSpring(x, springConfig);
  const springY = useSpring(y, springConfig);

  const handleMouseMove = (e) => {
    const { clientX, clientY } = e;
    const { height, width, left, top } = ref.current.getBoundingClientRect();
    const middleX = clientX - (left + width / 2);
    const middleY = clientY - (top + height / 2);
    x.set(middleX * 0.3);
    y.set(middleY * 0.3);
  };

  const handleMouseLeave = () => { x.set(0); y.set(0); };

  return (
    <motion.button
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{ x: springX, y: springY }}
      className={className}
    >
      {children}
    </motion.button>
  );
};

// 2. شريط نصوص متحرك
const ParallaxText = ({ children, baseVelocity = 5 }) => {
  return (
    <div className="overflow-hidden whitespace-nowrap flex gap-10 select-none py-6 border-y border-[#D4AF37]/20 bg-white relative z-20 shadow-sm">
      <motion.div 
        className="flex gap-10 text-5xl md:text-6xl font-black uppercase text-[#D4AF37]"
        animate={{ x: [0, -1000] }}
        transition={{ repeat: Infinity, duration: 30, ease: "linear" }}
      >
        {children} {children} {children} {children}
      </motion.div>
    </div>
  );
};

// --- الصفحة الرئيسية ---
const Home = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [heroContent, setHeroContent] = useState({
    title1: 'الفخامة',
    title2: 'تستحقها',
    description: 'اكتشف تشكيلة حصرية من المنتجات التي تجمع بين الجودة العالية والتصميم العصري.',
    imageUrl: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?q=80&w=1000',
    imageFit: 'cover'
  });

  const { scrollY } = useScroll();
  const yHero = useTransform(scrollY, [0, 1000], [0, 250]); 
  const heroScale = useTransform(scrollY, [0, 1000], [1, 1.05]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        let prods = [];
        try {
            const q = query(collection(db, "products"), orderBy("createdAt", "desc"), limit(8));
            const snapshot = await getDocs(q);
            prods = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        } catch (err) {
            const snapshot = await getDocs(collection(db, "products"));
            prods = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })).slice(0, 8);
        }
        setProducts(prods);

        const catSnap = await getDocs(collection(db, "categories"));
        setCategories(catSnap.docs.map(d => ({ id: d.id, ...d.data() })));

        const heroDoc = await getDoc(doc(db, "site_settings", "home_hero"));
        if (heroDoc.exists()) setHeroContent(prev => ({ ...prev, ...heroDoc.data() }));

      } catch (err) { console.error(err); } finally { setLoading(false); }
    };
    fetchData();
  }, []);

  if (loading) return (
    <div className="h-screen flex items-center justify-center bg-white">
      <div className="flex flex-col items-center gap-6">
        <div className="w-16 h-16 border-t-4 border-r-4 border-[#D4AF37] rounded-full animate-spin"></div>
      </div>
    </div>
  );

  return (
    <div className="w-full bg-[#FDFDFD] text-gray-900 font-sans selection:bg-[#D4AF37] selection:text-white overflow-x-hidden" dir="rtl">
      
      {/* ==================== 1. قسم الهيرو ==================== */}
      <section className="relative h-[92vh] min-h-[650px] flex items-center justify-center overflow-hidden bg-[#FDFDFD]">
        
        <div className="absolute inset-0 z-0 overflow-hidden">
            <motion.div style={{ scale: heroScale }} className="absolute inset-0 z-0">
                 <img 
                    src={heroContent.imageUrl} 
                    alt="Hero Background" 
                    className="w-full h-full" 
                    style={{ objectFit: heroContent.imageFit || 'cover' }} 
                 />
                 
                 <div className="absolute inset-0 bg-black/10"></div>
                 <div className="absolute inset-0 bg-gradient-to-t from-[#FDFDFD] via-transparent to-transparent"></div>
            </motion.div>
        </div>

        <div className="container mx-auto px-6 relative z-10 grid lg:grid-cols-2 gap-12 items-center h-full pt-20">
          <motion.div style={{ y: yHero }} className="text-center lg:text-right">
            
            <motion.div 
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}
              className="inline-flex items-center gap-3 border border-gray-200 bg-white/90 backdrop-blur-md px-4 py-2 rounded-full mb-8 shadow-sm"
            >
              <span className="w-2 h-2 bg-[#D4AF37] rounded-full animate-pulse shadow-[0_0_10px_#D4AF37]"></span>
              <span className="text-xs font-bold tracking-wider uppercase text-gray-900">اكتشف الجديد</span>
            </motion.div>

            <h1 className="text-5xl md:text-7xl lg:text-8xl font-black mb-6 tracking-tight leading-[1.1]">
              <motion.span initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.2 }} className="block text-white drop-shadow-lg">{heroContent.title1}</motion.span>
              <motion.span initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.4 }} className="block text-[#D4AF37] drop-shadow-[0_2px_20px_rgba(212,175,55,0.4)]">{heroContent.title2}</motion.span>
            </h1>

            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6, duration: 1 }} className="text-gray-100 text-lg lg:text-xl max-w-lg leading-relaxed mb-12 lg:mr-0 mx-auto font-medium drop-shadow-md">{heroContent.description}</motion.p>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8 }} className="flex flex-col sm:flex-row gap-6 justify-center lg:justify-start">
              <MagneticButton className="group relative bg-[#D4AF37] text-black px-12 py-4 rounded-full font-bold text-lg overflow-hidden shadow-[0_4px_25px_rgba(212,175,55,0.4)] hover:shadow-[0_6px_35px_rgba(212,175,55,0.6)] transition-shadow">
                <Link to="/shop" className="relative z-10 flex items-center gap-2">تسوق الآن <ArrowRight size={20} className="group-hover:-translate-x-1 transition-transform rtl:rotate-180" /></Link>
                <div className="absolute inset-0 bg-white scale-x-0 group-hover:scale-x-100 transition-transform origin-right duration-500"></div>
              </MagneticButton>
            </motion.div>
          </motion.div>
          <div className="hidden lg:block"></div>
        </div>
      </section>

      {/* ==================== 2. شريط العلامات المتحرك ==================== */}
      <section className="relative z-20">
        <ParallaxText baseVelocity={-2}>جودة لا تضاهى • تصميم عصري • شحن سريع • دفع آمن • خدمة متميزة • </ParallaxText>
      </section>
      {/* ==================== 4. الأفضل مبيعاً (السلايدر) ==================== */}
      <BestSellers />

      {/* ==================== 3. التصنيفات ==================== */}
      <section className="py-24 px-4 md:px-10 bg-white relative z-10">
        <div className="container mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-end mb-16 px-2 gap-4">
            <div><h2 className="text-3xl md:text-5xl font-black text-gray-900 mb-2">تسوق حسب <span className="text-[#D4AF37]">القسم</span></h2><p className="text-gray-400">تصفح المجموعات المختارة بعناية.</p></div>
            <Link to="/shop" className="flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-gray-500 hover:text-black transition-all group">عرض الكل <ArrowUpRight size={18} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform rtl:rotate-180" /></Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 md:gap-6 auto-rows-[220px] md:auto-rows-[280px]">
            {categories.slice(0, 5).map((cat, idx) => {
              const isLarge = idx === 0 || idx === 3;
              return (
              <Link to={`/shop?category=${cat.name}`} key={idx} className={`relative group overflow-hidden rounded-[2rem] bg-gray-50 border border-gray-100 ${isLarge ? 'md:col-span-2 md:row-span-2' : 'md:col-span-1'}`}>
                <div className="absolute inset-0">
                   {cat.imageUrl ? (
                       <img src={cat.imageUrl} alt={cat.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                   ) : (
                       <div className="w-full h-full flex items-center justify-center text-gray-200"><ShoppingBag size={isLarge ? 64 : 40}/></div>
                   )}
                   <div className="absolute inset-0 bg-white/0 group-hover:bg-white/20 transition-colors duration-500"></div>
                   <div className="absolute inset-0 bg-gradient-to-t from-gray-900/50 via-transparent to-transparent opacity-80"></div>
                </div>
                <div className="absolute bottom-6 right-6 z-10">
                  <h3 className={`${isLarge ? 'text-3xl' : 'text-xl'} font-bold text-white mb-1 drop-shadow-sm`}>{cat.name}</h3>
                  <div className="h-1 w-12 bg-[#D4AF37] rounded-full transition-all group-hover:w-20"></div>
                </div>
              </Link>
            )})}
          </div>
        </div>
      </section>


      {/* ==================== 5. وصل حديثاً ==================== */}
      <section className="py-24 bg-[#F8F9FA] rounded-t-[3rem] border-t border-gray-100 relative z-10">
        <div className="container mx-auto px-6">
          <div className="flex justify-between items-center mb-12">
              <h2 className="text-3xl md:text-4xl font-black text-gray-900">وصل <span className="text-[#D4AF37]">حديثاً</span></h2>
              <Link to="/shop" className="text-sm font-bold text-gray-500 hover:text-black transition-colors">تصفح المتجر</Link>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-12">
            {products.slice(0, 4).map((product, i) => {
              let displayPrice = product.price;
              let displayOldPrice = product.oldPrice;
              let isExpired = false;

              if (product.discountEnd) {
                 const now = new Date();
                 const end = product.discountEnd.seconds ? new Date(product.discountEnd.seconds * 1000) : new Date(product.discountEnd);
                 if (now > end) { isExpired = true; displayPrice = product.oldPrice > 0 ? product.oldPrice : product.price; displayOldPrice = 0; }
              }

              return (
                <Link to={`/product/${product.id}`} key={product.id}>
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}
                    className="group bg-white rounded-[1.5rem] p-4 shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-50"
                  >
                    <div className="relative aspect-[3/4] mb-4 overflow-hidden rounded-[1rem] bg-gray-50">
                        <img src={product.image} alt={product.name} className="w-full h-full object-contain p-4 mix-blend-multiply group-hover:scale-110 transition-transform duration-500" />
                        
                        <button className="absolute bottom-3 right-3 bg-black text-white p-3 rounded-full opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300 shadow-lg">
                            <ShoppingBag size={18} />
                        </button>

                        {!isExpired && product.discountEnd && (
                           <span className="absolute top-3 right-3 bg-red-50 text-red-600 text-[10px] font-bold px-2 py-1 rounded-lg flex items-center gap-1 border border-red-100 animate-pulse">
                             <Clock size={10} /> عرض مؤقت
                           </span>
                        )}
                        <div className="absolute top-3 left-3 bg-white/90 backdrop-blur px-2 py-1 rounded-lg text-[10px] font-bold flex items-center gap-1 shadow-sm">
                            <Star size={10} className="fill-yellow-400 text-yellow-400"/> {product.rating || 'جديد'}
                        </div>
                    </div>

                    <div>
                        <p className="text-xs text-gray-400 mb-1">{product.category}</p>
                        <h3 className="text-base font-bold text-gray-900 mb-2 truncate group-hover:text-[#D4AF37] transition-colors">{product.name}</h3>
                        <div className="flex items-center justify-between">
                            <span className="text-lg font-black text-gray-900">{displayPrice} <span className="text-xs font-normal text-gray-500">ج.م</span></span>
                            {displayOldPrice > 0 && <span className="text-xs text-gray-400 line-through decoration-red-300">{displayOldPrice}</span>}
                        </div>
                    </div>
                  </motion.div>
                </Link>
              );
            })}
          </div>

          <div className="mt-16 text-center">
            <Link to="/shop" className="inline-block border-2 border-black text-black px-10 py-3 rounded-full font-bold text-sm hover:bg-black hover:text-white transition-all">عرض كل المنتجات</Link>
          </div>
        </div>
      </section>

      {/* ==================== 6. المميزات ==================== */}
      <section className="py-20 bg-white relative z-10">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { icon: <Truck size={32} />, title: "شحن سريع", desc: "لجميع المحافظات" },
              { icon: <ShieldCheck size={32} />, title: "دفع آمن", desc: "حماية 100% لبياناتك" },
              { icon: <Zap size={32} />, title: "جودة أصلية", desc: "منتجات مضمونة" },
              { icon: <Headset size={32} />, title: "دعم فني", desc: "متواجدون لمساعدتك" },
            ].map((item, idx) => (
              <div key={idx} className="flex flex-col items-center text-center gap-4 p-6 rounded-2xl hover:bg-gray-50 transition-colors border border-transparent hover:border-gray-100">
                <div className="w-16 h-16 rounded-full bg-[#D4AF37]/10 flex items-center justify-center text-[#D4AF37] mb-2 shadow-sm">
                  {item.icon}
                </div>
                <div>
                  <h4 className="font-bold text-gray-900 text-lg mb-1">{item.title}</h4>
                  <p className="text-sm text-gray-500">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
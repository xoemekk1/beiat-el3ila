import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { 
  ShoppingBag, 
  Heart, 
  User, 
  Search, 
  Menu, 
  X, 
  LogOut, 
  ChevronDown, 
  MessageCircle // تم إضافة أيقونة الشات هنا
} from 'lucide-react';
import { auth, db } from '../firebase';
import { signOut, onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, collection, getDocs } from 'firebase/firestore';
import { motion, AnimatePresence } from 'framer-motion';

const Navbar = () => {
  const { cartItems, wishlist } = useCart();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [categories, setCategories] = useState([]);
  const [isShopHovered, setIsShopHovered] = useState(false);

  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
        setUser(currentUser);
        if (currentUser) {
            const userDoc = await getDoc(doc(db, "users", currentUser.uid));
            if (userDoc.exists() && userDoc.data().role === 'admin') {
                setIsAdmin(true);
            } else {
                setIsAdmin(false);
            }
        } else {
            setIsAdmin(false);
        }
    });

    const fetchCategories = async () => {
        try {
            const snapshot = await getDocs(collection(db, "categories"));
            setCategories(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        } catch (err) { console.error("Error fetching categories:", err); }
    };
    fetchCategories();

    return () => {
        window.removeEventListener('scroll', handleScroll);
        unsubscribe();
    };
  }, []);

  useEffect(() => {
    setIsMobileMenuOpen(false);
    setIsShopHovered(false);
  }, [location]);

  const handleLogout = async () => {
      await signOut(auth);
      navigate('/');
  };

  const navbarClasses = `fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
    isScrolled 
      ? 'bg-white/95 backdrop-blur-md shadow-sm py-2' 
      : 'bg-white/60 backdrop-blur-sm py-3' 
  }`;

  const linkClasses = (path) => `text-base md:text-lg font-bold uppercase tracking-wider transition-colors relative group py-1 leading-none ${
    location.pathname === path ? 'text-[#D4AF37]' : 'text-gray-900 hover:text-[#D4AF37]'
  }`;

  const NavLink = ({ to, children }) => (
    <Link to={to} className={linkClasses(to)}>
      {children}
      <span className={`absolute -bottom-1 left-0 h-[2px] bg-[#D4AF37] transition-all duration-300 ${location.pathname === to ? 'w-full' : 'w-0 group-hover:w-full'}`}></span>
    </Link>
  );

  return (
    <nav className={navbarClasses} dir="rtl">
      <div className="container mx-auto px-4 md:px-8 flex justify-between items-center relative">
        
        {/* Logo */}
        <Link to="/" className="text-2xl md:text-4xl font-black tracking-tight flex items-center gap-1 group z-50 leading-none">
          <ShoppingBag className="text-[#D4AF37] group-hover:rotate-12 transition-transform" size={32} />
          <span className="text-gray-900">بيت</span>
          <span className="text-[#D4AF37]">العيلة</span>
        </Link>

        {/* Desktop Navigation Links */}
        <div className="hidden md:flex items-center gap-8">
          <NavLink to="/">الرئيسية</NavLink>
          
          <div 
            className="relative py-2" 
            onMouseEnter={() => setIsShopHovered(true)}
            onMouseLeave={() => setIsShopHovered(false)}
          >
            <Link to="/shop" className={`flex items-center gap-1 text-base md:text-lg font-bold uppercase tracking-wider leading-none transition-colors ${location.pathname === '/shop' ? 'text-[#D4AF37]' : 'text-gray-900 hover:text-[#D4AF37]'}`}>
                المتجر <ChevronDown size={18} className={`transition-transform duration-300 ${isShopHovered ? 'rotate-180' : ''}`}/>
            </Link>

            <AnimatePresence>
                {isShopHovered && (
                    <motion.div 
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 15 }}
                        transition={{ duration: 0.2 }}
                        className="absolute top-8 right-0 w-64 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden pt-2 pb-2 z-50"
                    >
                        <Link to="/shop" className="block px-6 py-3 text-base font-bold text-gray-900 hover:bg-gray-50 hover:text-[#D4AF37] transition-colors border-b border-gray-50">
                            عرض كل المنتجات
                        </Link>
                        
                        {categories.length > 0 ? (
                            <div className="py-2">
                                <p className="px-6 py-2 text-xs font-bold text-gray-400 uppercase tracking-widest">الأقسام</p>
                                {categories.map(cat => (
                                    <Link 
                                        key={cat.id} 
                                        to={`/shop?category=${cat.name}`} 
                                        className="block px-6 py-2.5 text-base text-gray-700 hover:text-[#D4AF37] hover:bg-gray-50 transition-colors flex items-center justify-between group"
                                    >
                                        {cat.name}
                                    </Link>
                                ))}
                            </div>
                        ) : (
                            <p className="text-center py-4 text-sm text-gray-400">جاري التحميل...</p>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
          </div>

          <NavLink to="/about">من نحن</NavLink>
          <NavLink to="/contact">اتصل بنا</NavLink>
        </div>

        {/* Icons Section (Desktop & Mobile Mixed) */}
        <div className="flex items-center gap-2 md:gap-4 z-50">
          <Link to="/search" className="p-1 text-gray-900 hover:text-[#D4AF37] transition-colors hidden md:block">
            <Search size={26} />
          </Link>

          {/* أيقونة الشات الجديدة */}
          {user && (
            <Link to="/chat" className="p-1 text-gray-900 hover:text-[#D4AF37] transition-colors relative">
              <MessageCircle size={26} />
              {/* يمكنك إضافة badge هنا لاحقاً للإشعارات */}
            </Link>
          )}

          {isAdmin && (
            <Link to="/admin" className="p-1 text-gray-900 hover:text-[#D4AF37] transition-colors font-bold hidden md:block bg-gray-100 rounded-full px-3 text-xs">
              لوحة التحكم
            </Link>
          )}

          {user ? (
            <div className="relative group hidden md:block">
                <Link to="/profile" className="p-1 text-gray-900 hover:text-[#D4AF37] transition-colors block">
                  <User size={26} />
                </Link>
                <div className="absolute left-0 mt-2 w-44 bg-white rounded-xl shadow-lg border border-gray-100 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all text-right overflow-hidden z-50">
                    <Link to="/profile" className="block px-5 py-3 text-base text-gray-700 hover:bg-gray-50">حسابي</Link>
                    <button onClick={handleLogout} className="w-full text-right px-5 py-3 text-base text-red-600 hover:bg-red-50 flex items-center gap-2">
                        <LogOut size={18} /> تسجيل خروج
                    </button>
                </div>
            </div>
          ) : (
            <Link to="/login" className="p-1 text-gray-900 hover:text-[#D4AF37] transition-colors hidden md:block">
              <User size={26} />
            </Link>
          )}

          <Link to="/wishlist" className="p-1 text-gray-900 hover:text-[#D4AF37] transition-colors relative">
            <Heart size={26} />
            {wishlist.length > 0 && <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] w-5 h-5 flex items-center justify-center rounded-full font-bold shadow-sm">{wishlist.length}</span>}
          </Link>

          <Link to="/cart" className="p-1 text-gray-900 hover:text-[#D4AF37] transition-colors relative group">
            <ShoppingBag size={26} className="group-hover:fill-[#D4AF37]/20"/>
            {cartItems.length > 0 && <span className="absolute -top-1 -right-1 bg-[#D4AF37] text-white text-[10px] w-5 h-5 flex items-center justify-center rounded-full font-bold shadow-sm">{cartItems.length}</span>}
          </Link>

          <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-1 text-gray-900 hover:text-[#D4AF37] transition-colors md:hidden">
            {isMobileMenuOpen ? <X size={30} /> : <Menu size={30} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-white border-t border-gray-100 overflow-hidden shadow-xl absolute top-full left-0 right-0 z-40"
          >
            <div className="container mx-auto px-6 py-6 flex flex-col gap-4">
              <Link to="/" className="text-gray-900 hover:text-[#D4AF37] font-black text-xl p-2 rounded-lg hover:bg-gray-50 transition-colors">الرئيسية</Link>
              
              <div className="bg-gray-50 rounded-xl p-4">
                  <Link to="/shop" className="text-[#D4AF37] font-black text-xl block mb-3">المتجر</Link>
                  <div className="mr-3 border-r-2 border-gray-200 pr-3 space-y-3">
                      {categories.map(cat => (
                          <Link key={cat.id} to={`/shop?category=${cat.name}`} className="block text-lg text-gray-600 font-bold">
                              {cat.name}
                          </Link>
                      ))}
                  </div>
              </div>

              <Link to="/about" className="text-gray-900 hover:text-[#D4AF37] font-black text-xl p-2 rounded-lg hover:bg-gray-50 transition-colors">من نحن</Link>
              <Link to="/contact" className="text-gray-900 hover:text-[#D4AF37] font-black text-xl p-2 rounded-lg hover:bg-gray-50 transition-colors">اتصل بنا</Link>
              
              <div className="flex flex-col gap-3 mt-4 pt-4 border-t border-gray-100">
                  <Link to="/search" className="flex items-center gap-3 text-gray-700 hover:text-[#D4AF37] p-3 text-lg font-bold"><Search size={24}/> بحث</Link>
                  
                  {/* إضافة الشات في قائمة الموبايل أيضاً */}
                  {user && (
                    <Link to="/chat" className="flex items-center gap-3 text-gray-700 hover:text-[#D4AF37] p-3 text-lg font-bold">
                      <MessageCircle size={24}/> المحادثات
                    </Link>
                  )}

                  {isAdmin && <Link to="/admin" className="flex items-center gap-3 text-[#D4AF37] font-bold p-3 bg-[#D4AF37]/10 rounded-lg text-lg">لوحة التحكم</Link>}
                  
                  {user ? (
                      <>
                        <Link to="/profile" className="flex items-center gap-3 text-gray-700 hover:text-[#D4AF37] p-3 text-lg font-bold"><User size={24}/> حسابي ({user.displayName?.split(' ')[0]})</Link>
                        <button onClick={handleLogout} className="flex items-center gap-3 text-red-600 hover:text-red-700 p-3 text-right text-lg font-bold"><LogOut size={24}/> تسجيل خروج</button>
                      </>
                  ) : (
                      <Link to="/login" className="flex items-center gap-3 text-gray-700 hover:text-[#D4AF37] p-3 text-lg font-bold"><User size={24}/> تسجيل الدخول</Link>
                  )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

export default Navbar;
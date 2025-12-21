import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

// Context
import { CartProvider } from './context/CartContext'; // ضروري جداً لعمل السلة

// Layout Components
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ScrollToTop from './components/ScrollToTop';
import Wishlist from './pages/Wishlist'; // ✅ ضيف ده
// Pages
import Signup from './pages/Signup';
import Home from './pages/Home';
import Shop from './pages/Shop';
import ProductDetails from './pages/ProductDetails';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import Login from './pages/Login';
import Profile from './pages/Profile';
import Admin from './pages/Admin';
import About from './pages/About';
import Contact from './pages/Contact';
import Policy from './pages/Policy';
import Terms from './pages/Terms';
import NotFound from './pages/NotFound';

// Firebase & Auth
import { auth, db } from './firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import FloatingWhatsApp from './components/FloatingWhatsApp';
// --- مكون الحماية الصارم (Admin Only) ---
import FacebookPixel from './utils/FacebookPixel';

const AdminRoute = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        try {
          // جلب بيانات المستخدم من Firestore للتحقق من دوره
          const userDoc = await getDoc(doc(db, "users", currentUser.uid));
          
          if (userDoc.exists() && userDoc.data().role === 'admin') {
            setIsAdmin(true); // هذا المستخدم أدمن
          } else {
            setIsAdmin(false); // هذا المستخدم عميل عادي
          }
        } catch (error) {
          console.error("Error verifying admin role:", error);
          setIsAdmin(false);
        }
      } else {
        setUser(null);
        setIsAdmin(false);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  if (loading) return (
    <div className="h-screen flex flex-col items-center justify-center gap-4 bg-gray-50">
      <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      <p className="text-gray-500 font-bold">جاري التحقق من الصلاحيات...</p>
    </div>
  );
  
  // 1. إذا لم يكن مسجل دخول -> اذهب لصفحة الدخول
  if (!user) return <Navigate to="/login" state={{ from: { pathname: '/admin' } }} />;

  // 2. إذا كان مسجل دخول ولكنه ليس أدمن -> اذهب للصفحة الرئيسية
  if (!isAdmin) return <Navigate to="/" />;

  // 3. إذا كان أدمن -> اسمح بالدخول
  return children;
};

// --- التطبيق الرئيسي ---
function App() {
  return (
    <CartProvider> {/* تغليف التطبيق بـ CartProvider ضروري جداً */}
      <Router>
        <ScrollToTop /> {/* تشغيل السكرول للأعلى عند تغيير الصفحة */}
        
        {/* ✅ تشغيل فيسبوك بيكسل هنا */}
        <FacebookPixel /> 

        <div dir="rtl" className="font-sans text-gray-800 bg-[#f9fafb] min-h-screen flex flex-col">
          <Navbar />
          
          <main className="flex-grow">
            <Routes>
              {/* الصفحات العامة */}
              <Route path="/" element={<Home />} />
              <Route path="/shop" element={<Shop />} />
              <Route path="/product/:id" element={<ProductDetails />} />
              <Route path="/cart" element={<Cart />} />
              <Route path="/checkout" element={<Checkout />} />
              <Route path="/login" element={<Login />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/wishlist" element={<Wishlist />} />
              {/* صفحات المعلومات */}
              <Route path="/about" element={<About />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/policy" element={<Policy />} />
              <Route path="/terms" element={<Terms />} />
              <Route path="/signup" element={<Signup />} />
              {/* لوحة التحكم (محمية) */}
              <Route 
                path="/admin" 
                element={
                  <AdminRoute>
                    <Admin />
                  </AdminRoute>
                } 
              />

              {/* صفحة الخطأ 404 */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </main>

          <Footer />
          <FloatingWhatsApp />
        </div>
      </Router>
    </CartProvider>
  );
}

export default App;
import React, { useState, useEffect, useRef } from 'react';
import { db, auth } from '../firebase';
import { collection, addDoc, deleteDoc, doc, updateDoc, onSnapshot, query, orderBy, limit, setDoc, getDoc } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import { 
  Upload, CheckCircle, AlertCircle, Trash2, Edit, LogOut, Package, 
  ShoppingBag, Plus, X, Users, Phone, MapPin, Calendar, Clock, 
  List, Truck, Search, MessageSquare, Bell, DollarSign, Loader, LayoutTemplate, Image as ImageIcon, Palette, Ruler,
  TicketPercent, Star, Check, EyeOff, Monitor, Wallet, Banknote, ExternalLink, Save, ArrowLeft, ArrowRight, Mail, User, Ban, Unlock, Pencil,
  History, CalendarClock, TrendingUp, ChevronLeft, ChevronRight 
} from 'lucide-react';
import { BarChart, Bar, XAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const Admin = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const heroImageInputRef = useRef(null);
  const categoryImageInputRef = useRef(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [categories, setCategories] = useState([]);
  const [users, setUsers] = useState([]); 
  const [customersList, setCustomersList] = useState([]); 
  const [messages, setMessages] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [promoCodes, setPromoCodes] = useState([]);
  const [allReviews, setAllReviews] = useState([]);
  const [siteReviews, setSiteReviews] = useState([]);
  const [showShippingModal, setShowShippingModal] = useState(false);
  const [shippingData, setShippingData] = useState({ orderId: null, status: '', courier: 'bosta', trackingNumber: '' });
  const [showUserModal, setShowUserModal] = useState(false);
  const [editingUser, setEditingUser] = useState({ id: '', name: '', email: '', phone: '', isBanned: false });
  const [showPromoHistoryModal, setShowPromoHistoryModal] = useState(false);
  const [selectedPromo, setSelectedPromo] = useState(null);
  const [reviewForm, setReviewForm] = useState({ name: '', text: '', rating: 5, image: null, imageUrl: '' });
  const [reviewLoading, setReviewLoading] = useState(false);
  const [heroSettings, setHeroSettings] = useState({ title1: '', title2: '', description: '', image: null, imageUrl: '', imageFit: 'cover' });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [editMode, setEditMode] = useState(false);
  const [currentId, setCurrentId] = useState(null);
  const [product, setProduct] = useState({ 
    name: '', price: '', oldPrice: '', costPrice: '', category: '', description: '', 
    images: [], imageUrls: [], colors: '', sizes: '', discountEnd: '',
    stock: '', 
    maxLimit: 10 
  });
  const [categoryForm, setCategoryForm] = useState({ name: '', image: null, imageUrl: '' });
  const [editingCategory, setEditingCategory] = useState(null);
  const [newPromo, setNewPromo] = useState({ code: '', type: 'percent', value: '', expiryDate: '', usageLimit: '' });
  const CLOUD_NAME = "dahzcrxj9"; 
  const UPLOAD_PRESET = "cmgojjrr";
  useEffect(() => {
    const unsubProducts = onSnapshot(collection(db, "products"), (snap) => setProducts(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
    const unsubOrders = onSnapshot(query(collection(db, "orders"), orderBy("createdAt", "desc")), (snap) => setOrders(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
    const unsubCategories = onSnapshot(query(collection(db, "categories"), orderBy("createdAt", "asc")), (snap) => setCategories(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
    const unsubMessages = onSnapshot(query(collection(db, "contact_messages"), orderBy("createdAt", "desc")), (snap) => setMessages(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
    const unsubNotif = onSnapshot(query(collection(db, "notifications"), orderBy("time", "desc"), limit(20)), (snap) => setNotifications(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
    const unsubPromos = onSnapshot(query(collection(db, "promo_codes"), orderBy("createdAt", "desc")), (snap) => setPromoCodes(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
    const unsubReviews = onSnapshot(query(collection(db, "reviews"), orderBy("createdAt", "desc")), (snap) => setAllReviews(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
    const unsubSiteReviews = onSnapshot(collection(db, "site_reviews"), (snap) => setSiteReviews(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
    
    const unsubUsers = onSnapshot(collection(db, "users"), 
        (snap) => setUsers(snap.docs.map(d => ({ id: d.id, ...d.data() }))),
        (error) => console.log("Users fetch warning:", error)
    );

    const fetchSettings = async () => {
        const docRef = doc(db, "site_settings", "home_hero");
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) setHeroSettings(prev => ({ ...prev, ...docSnap.data() }));
    };
    fetchSettings();

    return () => { unsubProducts(); unsubOrders(); unsubCategories(); unsubMessages(); unsubNotif(); unsubPromos(); unsubReviews(); unsubUsers(); unsubSiteReviews(); };
  }, []);

  // Customer Analysis Logic
  useEffect(() => {
    const customersMap = new Map();

    users.forEach(u => {
        customersMap.set(u.id, {
            id: u.id,
            name: u.displayName || u.name || 'مستخدم مسجل',
            email: u.email,
            phone: u.phone || 'غير مسجل',
            role: 'registered',
            isBanned: u.isBanned || false,
            ordersCount: 0,
            totalSpent: 0,
            lastOrderDate: null
        });
    });

    orders.forEach(order => {
        let customerId = order.userId;
        let customerData = null;

        if (customerId && customersMap.has(customerId)) {
            customerData = customersMap.get(customerId);
        } else {
            const guestId = `guest-${order.customer?.phone || 'unknown'}`;
            if (!customersMap.has(guestId)) {
                customersMap.set(guestId, {
                    id: guestId,
                    name: order.customer?.name || 'زائر',
                    email: order.customer?.email || '-',
                    phone: order.customer?.phone || '-',
                    role: 'guest',
                    isBanned: false,
                    ordersCount: 0,
                    totalSpent: 0,
                    lastOrderDate: null
                });
            }
            customerData = customersMap.get(guestId);
        }

        if (customerData) {
            customerData.ordersCount += 1;
            if (!['cancelled', 'returned', 'returning'].includes(order.status)) {
                customerData.totalSpent += (Number(order.total) || 0);
            }
            const orderDate = order.createdAt?.toDate ? order.createdAt.toDate() : new Date(order.createdAt);
            if (!customerData.lastOrderDate || orderDate > customerData.lastOrderDate) {
                customerData.lastOrderDate = orderDate;
            }
        }
    });

    const sortedCustomers = Array.from(customersMap.values()).sort((a, b) => b.totalSpent - a.totalSpent);
    setCustomersList(sortedCustomers);

  }, [users, orders]);

  const totalSales = orders.reduce((sum, order) => { 
      const isCancelled = ['cancelled', 'returned', 'returning'].includes(order.status); 
      return isCancelled ? sum : sum + (Number(order.total) || 0); 
  }, 0);

  const totalProfit = orders.reduce((sum, order) => {
      const isCancelled = ['cancelled', 'returned', 'returning'].includes(order.status);
      if (isCancelled) return sum;

      // Calculate profit for each item in the order
      const orderProfit = order.items?.reduce((itemSum, item) => {
          // Find the original product to get the current cost price
          // Note: Ideally, cost price should be saved with the order item at purchase time for accuracy if costs change.
          // Here we use the current product cost price as a fallback/simplification.
          const originalProduct = products.find(p => p.id === item.id || p.id === item.productId);
          const cost = Number(originalProduct?.costPrice) || 0; 
          const sellingPrice = Number(item.price);
          const quantity = Number(item.quantity);
          
          return itemSum + ((sellingPrice - cost) * quantity);
      }, 0) || 0;

      return sum + orderProfit;
  }, 0);

  // --- Handlers ---
  const getChartData = () => {
    const last7Days = [...Array(7)].map((_, i) => {
      const d = new Date(); d.setDate(d.getDate() - i); return d.toLocaleDateString('en-CA');
    }).reverse();
    return last7Days.map(dateStr => {
      const daySales = orders.filter(o => {
          if (!o.createdAt) return false;
          const isCancelled = ['cancelled', 'returned', 'returning'].includes(o.status);
          if (isCancelled) return false;
          const orderDate = o.createdAt.toDate ? o.createdAt.toDate() : new Date(o.createdAt);
          return orderDate.toLocaleDateString('en-CA') === dateStr;
        }).reduce((sum, o) => sum + (Number(o.total) || 0), 0);
      const displayDate = new Date(dateStr).toLocaleDateString('ar-EG', {day: 'numeric', month: 'short'});
      return { name: displayDate, sales: daySales };
    });
  };

  const uploadImage = async (file) => {
    const formData = new FormData(); formData.append("file", file); formData.append("upload_preset", UPLOAD_PRESET);
    const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, { method: "POST", body: formData });
    const data = await res.json(); return data.secure_url;
  };

  const handleHeroImageChange = (e) => { if (e.target.files[0]) setHeroSettings({ ...heroSettings, image: e.target.files[0] }); };
  const handleHeroSubmit = async (e) => {
    e.preventDefault(); setLoading(true); setSuccess(''); setError('');
    try {
        let url = heroSettings.imageUrl; if (heroSettings.image) url = await uploadImage(heroSettings.image);
        await setDoc(doc(db, "site_settings", "home_hero"), { title1: heroSettings.title1, title2: heroSettings.title2, description: heroSettings.description, imageUrl: url, imageFit: heroSettings.imageFit || 'cover', updatedAt: new Date() });
        setSuccess("تم التحديث"); setTimeout(() => setSuccess(''), 3000);
    } catch (err) { setError("فشل التحديث"); } finally { setLoading(false); }
  };

  const handleDeleteUser = async (customerId) => {
    if (customerId.startsWith('guest')) {
        alert("لا يمكن حذف الزوار (Guests) لأنهم مرتبطون بالطلبات فقط.");
        return;
    }
    if (window.confirm("تحذير: هل أنت متأكد من حذف هذا العميل نهائياً؟ سيتم منعه من الدخول وحذف بياناته.")) {
        try {
            await deleteDoc(doc(db, "users", customerId));
            setSuccess("تم حذف العميل بنجاح");
            setTimeout(() => setSuccess(''), 3000);
        } catch (err) {
            setError("حدث خطأ أثناء الحذف");
        }
    }
  };

  const openEditUserModal = (customer) => {
      setEditingUser({
          id: customer.id,
          name: customer.name,
          email: customer.email,
          phone: customer.phone,
          isBanned: customer.isBanned || false
      });
      setShowUserModal(true);
  };

  const handleSaveUser = async (e) => {
      e.preventDefault();
      setLoading(true);
      try {
          const userRef = doc(db, "users", editingUser.id);
          await updateDoc(userRef, {
              displayName: editingUser.name, 
              name: editingUser.name,        
              phone: editingUser.phone,
              isBanned: editingUser.isBanned === 'true' || editingUser.isBanned === true
          });
          setSuccess("تم تحديث بيانات العميل");
          setShowUserModal(false);
          setTimeout(() => setSuccess(''), 3000);
      } catch (err) {
          setError("فشل التحديث: " + err.message);
      } finally {
          setLoading(false);
      }
  };

  const handleToggleBan = async (userId, currentStatus) => {
      if (!userId.startsWith('guest')) {
          if (window.confirm(currentStatus ? "هل أنت متأكد من فك الحظر عن هذا العميل؟" : "هل أنت متأكد من حظر هذا العميل ومنعه من الطلب؟")) {
              await updateDoc(doc(db, "users", userId), { isBanned: !currentStatus });
          }
      } else {
          alert("لا يمكن حظر الزوار (Guests) من هنا حالياً، فقط الأعضاء المسجلين.");
      }
  };

  const handleImagesChange = (e) => { if (e.target.files) setProduct({ ...product, images: Array.from(e.target.files) }); };

  const moveImageLeft = (index) => {
    if (index === 0) return;
    const newUrls = [...product.imageUrls];
    [newUrls[index - 1], newUrls[index]] = [newUrls[index], newUrls[index - 1]];
    setProduct({ ...product, imageUrls: newUrls });
  };

  const moveImageRight = (index) => {
    if (index === product.imageUrls.length - 1) return;
    const newUrls = [...product.imageUrls];
    [newUrls[index + 1], newUrls[index]] = [newUrls[index], newUrls[index + 1]];
    setProduct({ ...product, imageUrls: newUrls });
  };
    
  const handleProductSubmit = async (e) => {
    e.preventDefault(); setLoading(true); setError(''); setSuccess('');
    try {
      let finalImageUrls = product.imageUrls || [];
      if (product.images && product.images.length > 0) {
        const uploadPromises = product.images.map(file => uploadImage(file));
        const newUrls = await Promise.all(uploadPromises);
        // editMode Logic: If editing, just append new ones. 
        // Note: The 'finalImageUrls' variable already has the current (potentially reordered) list.
        finalImageUrls = [...finalImageUrls, ...newUrls];
      }
      
      if (finalImageUrls.length === 0) throw new Error("يجب إضافة صورة واحدة على الأقل");
        
      const colorsArray = product.colors ? String(product.colors).split(',').map(c => c.trim()).filter(c => c) : [];
      const sizesArray = product.sizes ? String(product.sizes).split(',').map(s => s.trim()).filter(s => s) : [];
        
      const productData = {
        name: product.name, 
        price: Number(product.price), 
        oldPrice: Number(product.oldPrice) || 0,
        costPrice: Number(product.costPrice) || 0, 
        category: product.category, 
        description: product.description, 
        image: finalImageUrls[0], // First image is main
        images: finalImageUrls, // All images (ordered)
        colors: colorsArray, 
        sizes: sizesArray, 
        discountEnd: product.discountEnd ? new Date(product.discountEnd) : null,
        stock: Number(product.stock), 
        maxLimit: Number(product.maxLimit) || 10, 
        updatedAt: new Date()
      };

      if (editMode) { await updateDoc(doc(db, "products", currentId), productData); setSuccess("تم التحديث"); } 
      else { await addDoc(collection(db, "products"), { ...productData, createdAt: new Date() }); setSuccess("تمت الإضافة"); }
        
      setEditMode(false); setCurrentId(null);
      setProduct({ name: '', price: '', oldPrice: '', costPrice: '', category: '', description: '', images: [], imageUrls: [], colors: '', sizes: '', discountEnd: '', stock: '', maxLimit: 10 });
      if (fileInputRef.current) fileInputRef.current.value = "";
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) { setError(err.message); } finally { setLoading(false); }
  };

  const handleEditClick = (item) => {
    setEditMode(true); setCurrentId(item.id);
    let formattedDate = '';
    if (item.discountEnd) {
        const date = item.discountEnd.toDate ? item.discountEnd.toDate() : new Date(item.discountEnd);
        const offset = date.getTimezoneOffset() * 60000;
        formattedDate = new Date(date.getTime() - offset).toISOString().slice(0, 16);
    }
    setProduct({ 
        ...item, 
        images: [], imageUrls: item.images || (item.image ? [item.image] : []), 
        colors: item.colors ? item.colors.join(', ') : '', 
        sizes: item.sizes ? item.sizes.join(', ') : '', 
        discountEnd: formattedDate,
        stock: item.stock !== undefined ? item.stock : '', 
        maxLimit: item.maxLimit !== undefined ? item.maxLimit : 10,
        costPrice: item.costPrice || ''
    });
    setActiveTab('products'); window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeleteProduct = async (id) => { if (window.confirm("حذف المنتج؟")) await deleteDoc(doc(db, "products", id)); };
  const handleCategorySubmit = async () => {
    if (!categoryForm.name.trim()) return; setLoading(true);
    try {
        let url = categoryForm.imageUrl || ''; 
        if (categoryForm.image) url = await uploadImage(categoryForm.image);
        const categoryData = { name: categoryForm.name.trim(), imageUrl: url, updatedAt: new Date() };
        if (editingCategory) { await updateDoc(doc(db, "categories", editingCategory.id), categoryData); setSuccess('تم التحديث'); } 
        else { await addDoc(collection(db, "categories"), { ...categoryData, createdAt: new Date() }); setSuccess('تم الإضافة'); }
        setCategoryForm({ name: '', image: null, imageUrl: '' }); setEditingCategory(null);
        if (categoryImageInputRef.current) categoryImageInputRef.current.value = "";
        setTimeout(() => setSuccess(''), 3000);
    } catch (err) { setError("فشل العملية"); } finally { setLoading(false); }
  };

  const handleEditCategory = (cat) => { setEditingCategory(cat); setCategoryForm({ name: cat.name, imageUrl: cat.imageUrl, image: null }); };
  const handleDeleteCategory = async (id) => { if (window.confirm("حذف التصنيف؟")) await deleteDoc(doc(db, "categories", id)); };
  const handleDeleteOrder = async (id) => { if (window.confirm("حذف الطلب؟")) await deleteDoc(doc(db, "orders", id)); };
  const handleDeleteMessage = async (id) => { if (window.confirm("حذف الرسالة؟")) await deleteDoc(doc(db, "contact_messages", id)); };
    
  const initiateStatusChange = (id, newStatus) => {
    if (newStatus === 'shipped' || newStatus === 'on_delivery') {
        setShippingData({ orderId: id, status: newStatus, courier: 'bosta', trackingNumber: '' });
        setShowShippingModal(true);
    } else {
        updateDoc(doc(db, "orders", id), { status: newStatus });
    }
  };

  const confirmShippingDetails = async () => {
      if (!shippingData.orderId) return;
      const updateData = { 
          status: shippingData.status,
          courierName: shippingData.courier,
          trackingNumber: shippingData.trackingNumber,
          shippedAt: new Date()
      };
      await updateDoc(doc(db, "orders", shippingData.orderId), updateData);
      setShowShippingModal(false);
      setShippingData({ orderId: null, status: '', courier: 'bosta', trackingNumber: '' });
  };
    
  const handlePaymentStatusChange = async (order) => {
      const newStatus = !order.isPaid;
      await updateDoc(doc(db, "orders", order.id), { isPaid: newStatus });
  };

  const handleApproveReview = async (review) => {
    if (!window.confirm("الموافقة على نشر هذا التقييم؟")) return;
    setLoading(true);
    try {
        await updateDoc(doc(db, "reviews", review.id), { status: "approved" });
        const productRef = doc(db, "products", review.productId);
        const productSnap = await getDoc(productRef);
        if (productSnap.exists()) {
            const data = productSnap.data();
            const currentCount = Number(data.reviewsCount) || 0;
            const currentRating = Number(data.rating) || 0;
            const newRatingVal = review.rating;
            const newCount = currentCount + 1;
            const newAvg = ((currentRating * currentCount) + newRatingVal) / newCount;
            await updateDoc(productRef, { rating: Number(newAvg.toFixed(1)), reviewsCount: newCount });
        }
        setSuccess("تم نشر التقييم"); setTimeout(() => setSuccess(''), 3000);
    } catch (err) { setError("حدث خطأ"); } finally { setLoading(false); }
  };

  const handleHideReview = async (review) => {
    if (!window.confirm("إخفاء هذا التقييم؟")) return;
    setLoading(true);
    try { await updateDoc(doc(db, "reviews", review.id), { status: "hidden" }); setSuccess("تم إخفاء التقييم"); setTimeout(() => setSuccess(''), 3000); } catch (err) { setError("حدث خطأ"); } finally { setLoading(false); }
  };

  const handleDeleteReview = async (id) => { if (window.confirm("حذف التقييم نهائياً؟")) await deleteDoc(doc(db, "reviews", id)); };

  const handleAddPromo = async (e) => {
    e.preventDefault(); 
    if (!newPromo.code || !newPromo.value) return; 
    setLoading(true);
    try { 
        await addDoc(collection(db, "promo_codes"), { 
            code: newPromo.code.toUpperCase().trim(), 
            type: newPromo.type, 
            value: Number(newPromo.value),
            expiryDate: newPromo.expiryDate ? new Date(newPromo.expiryDate) : null,
            usageLimit: newPromo.usageLimit ? Number(newPromo.usageLimit) : 0, 
            usageCount: 0,
            usageHistory: [], 
            createdAt: new Date() 
        }); 
        setNewPromo({ code: '', type: 'percent', value: '', expiryDate: '', usageLimit: '' }); 
        setSuccess('تم إضافة الكوبون'); setTimeout(() => setSuccess(''), 3000); 
    } catch(err) { setError("حدث خطأ"); } finally { setLoading(false); }
  };

  const handleDeletePromo = async (id) => { if (window.confirm("حذف الكوبون؟")) await deleteDoc(doc(db, "promo_codes", id)); };

  const handleOpenPromoHistory = (promo) => {
      setSelectedPromo(promo);
      setShowPromoHistoryModal(true);
  };

  const handleSiteReviewSubmit = async (e) => {
      e.preventDefault(); 
      setReviewLoading(true); 
      try { 
          let url = reviewForm.imageUrl || '';
          if (reviewForm.image) {
              url = await uploadImage(reviewForm.image);
          }
          await addDoc(collection(db, "site_reviews"), {
              name: reviewForm.name,
              text: reviewForm.text,
              rating: Number(reviewForm.rating),
              image: url,
              type: 'external',
              createdAt: new Date()
          });
          setSuccess("تم إضافة الرأي بنجاح");
          setReviewForm({ name: '', text: '', rating: 5, image: null, imageUrl: '' });
          setTimeout(() => setSuccess(''), 3000);
      } catch (err) {
          setError("حدث خطأ");
      } finally {
          setReviewLoading(false);
      }
  };

  const handleDeleteSiteReview = async (id) => {
      if(window.confirm("حذف هذا الرأي؟")) await deleteDoc(doc(db, "site_reviews", id));
  };

  const getStatusColor = (status) => {
    const colors = { pending: 'bg-yellow-100 text-yellow-800 border-yellow-200', shipped: 'bg-blue-100 text-blue-800 border-blue-200', on_delivery: 'bg-indigo-100 text-indigo-800 border-indigo-200', delivered: 'bg-green-100 text-green-800 border-green-200', returning: 'bg-orange-100 text-orange-800 border-orange-200', returned: 'bg-gray-100 text-gray-800 border-gray-200', cancelled: 'bg-red-100 text-red-800 border-red-200' };
    return colors[status] || 'bg-gray-100 text-gray-800 border-gray-200';
  };
  const getStatusText = (status) => ({ pending: '⏳ قيد الانتظار', shipped: '🚚 تم الشحن', on_delivery: '🛵 جاري التوصيل', delivered: '✅ تم التوصيل', returning: '🔄 جاري الاسترجاع', returned: '↩️ مسترجع', cancelled: '❌ ملغي' }[status] || status);
  const formatDate = (ts) => ts ? new Date(ts.toDate()).toLocaleDateString('ar-EG') + ' ' + new Date(ts.toDate()).toLocaleTimeString('ar-EG') : "";

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col font-sans" dir="rtl">
      {/* Top Navbar */}
      <div className="bg-white px-6 py-4 shadow-sm flex flex-col md:flex-row justify-between items-center sticky top-0 z-50 gap-4 md:gap-0">
        <h1 className="text-2xl font-extrabold text-primary flex items-center gap-2"><span className="text-accent">لوحة تحكم</span> بيت العيلة</h1>
        <div className="flex items-center gap-4 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
            <div className="flex gap-2">
                {['dashboard', 'orders', 'customers', 'products', 'categories', 'promos', 'messages', 'reviews', 'settings'].map(tab => (
                    <button key={tab} onClick={() => setActiveTab(tab)} className={`px-4 py-2 rounded-lg font-bold text-sm transition-colors whitespace-nowrap ${activeTab === tab ? 'bg-primary text-white' : 'bg-gray-50 text-gray-600 hover:bg-gray-100'}`}>
                        {tab === 'dashboard' ? 'الرئيسية' : tab === 'products' ? 'المنتجات' : tab === 'categories' ? 'التصنيفات' : tab === 'promos' ? 'الكوبونات' : tab === 'orders' ? 'الطلبات' : tab === 'messages' ? 'الرسائل' : tab === 'reviews' ? 'التقييمات' : tab === 'customers' ? 'العملاء' : 'الواجهة'}
                    </button>
                ))}
            </div>
            <button onClick={() => {signOut(auth); navigate('/login');}} className="text-red-500 font-bold p-2 hover:bg-red-50 rounded-lg"><LogOut size={20}/></button>
        </div>
      </div>

      <div className="p-6 flex-1 overflow-hidden relative">
        
        {/* Shipping Modal */}
        {showShippingModal && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden">
                    <div className="bg-gray-50 p-6 border-b border-gray-100 flex justify-between items-center">
                        <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2"><Truck className="text-accent"/> تفاصيل الشحن</h3>
                        <button onClick={() => setShowShippingModal(false)} className="text-gray-400 hover:text-red-500"><X/></button>
                    </div>
                    <div className="p-6 space-y-4">
                        <div>
                            <label className="block text-gray-700 font-bold mb-2">شركة الشحن</label>
                            <select value={shippingData.courier} onChange={(e) => setShippingData({...shippingData, courier: e.target.value})} className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl outline-none focus:border-accent font-bold">
                                <option value="bosta">بوسطة (Bosta)</option>
                                <option value="egypt_post">البريد المصري</option>
                                <option value="aramex">أرامكس (Aramex)</option>
                                <option value="private">مندوب خاص / أخر</option>
                            </select>
                        </div>
                        {shippingData.courier !== 'private' && (
                            <div>
                                <label className="block text-gray-700 font-bold mb-2">رقم التتبع (Tracking Number)</label>
                                <input type="text" value={shippingData.trackingNumber} onChange={(e) => setShippingData({...shippingData, trackingNumber: e.target.value})} placeholder="اكتب الرقم هنا..." className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl outline-none focus:border-accent font-mono font-bold" />
                            </div>
                        )}
                        <button onClick={confirmShippingDetails} className="w-full bg-accent text-white py-3 rounded-xl font-bold hover:bg-primary transition-colors flex items-center justify-center gap-2 mt-4"><Save size={18}/> حفظ وتحديث الحالة</button>
                    </div>
                </div>
            </div>
        )}

        {showPromoHistoryModal && selectedPromo && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[80vh]">
                    <div className="bg-gray-50 p-6 border-b border-gray-100 flex justify-between items-center">
                        <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2"><History className="text-accent"/> سجل استخدام الكوبون ({selectedPromo.code})</h3>
                        <button onClick={() => setShowPromoHistoryModal(false)} className="text-gray-400 hover:text-red-500"><X/></button>
                    </div>
                    <div className="p-0 overflow-y-auto custom-scrollbar flex-1">
                        {(!selectedPromo.usageHistory || selectedPromo.usageHistory.length === 0) ? (
                            <div className="p-10 text-center text-gray-500 flex flex-col items-center">
                                <History size={48} className="text-gray-200 mb-2"/>
                                <p>لم يتم استخدام هذا الكوبون بعد.</p>
                            </div>
                        ) : (
                            <table className="w-full text-right text-sm">
                                <thead className="bg-gray-50 text-gray-600 font-bold sticky top-0">
                                    <tr>
                                        <th className="p-4">العميل</th>
                                        <th className="p-4 text-center">رقم الطلب</th>
                                        <th className="p-4 text-center">الخصم</th>
                                        <th className="p-4">التاريخ</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {selectedPromo.usageHistory.map((log, idx) => (
                                        <tr key={idx} className="hover:bg-gray-50">
                                            <td className="p-4 font-bold">{log.customerName || 'مستخدم'}</td>
                                            <td className="p-4 text-center font-mono text-xs bg-gray-50 rounded">{log.orderId ? log.orderId.slice(0, 8) + '...' : '-'}</td>
                                            <td className="p-4 text-center text-green-600 font-bold">{log.discountAmount} ج.م</td>
                                            <td className="p-4 text-gray-500 text-xs">{log.date ? new Date(log.date.toDate ? log.date.toDate() : log.date).toLocaleDateString('ar-EG') : '-'}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                    <div className="p-4 bg-gray-50 border-t text-center text-xs text-gray-500">
                        إجمالي مرات الاستخدام: {selectedPromo.usageCount || 0}
                    </div>
                </div>
            </div>
        )}

        {activeTab === 'dashboard' && (
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-full">
                <div className="lg:col-span-3 space-y-6">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100"><div className="flex justify-between items-center mb-2"><span className="text-gray-500 font-bold">المبيعات</span><DollarSign className="text-green-600 bg-green-50 p-1 rounded-lg" size={28}/></div><p className="text-2xl font-extrabold text-primary">{totalSales.toLocaleString()} <span className="text-xs text-gray-400">ج.م</span></p></div>
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100"><div className="flex justify-between items-center mb-2"><span className="text-gray-500 font-bold">صافي الربح</span><TrendingUp className="text-green-600 bg-green-50 p-1 rounded-lg" size={28}/></div><p className="text-2xl font-extrabold text-primary">{totalProfit.toLocaleString()} <span className="text-xs text-gray-400">ج.م</span></p></div>
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100"><div className="flex justify-between items-center mb-2"><span className="text-gray-500 font-bold">المنتجات</span><Package className="text-purple-600 bg-purple-50 p-1 rounded-lg" size={28}/></div><p className="text-2xl font-extrabold text-primary">{products.length}</p></div>
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100"><div className="flex justify-between items-center mb-2"><span className="text-gray-500 font-bold">العملاء</span><Users className="text-orange-600 bg-orange-50 p-1 rounded-lg" size={28}/></div><p className="text-2xl font-extrabold text-primary">{customersList.length}</p></div>
                    </div>
                    <div className="bg-[#dcfce7] rounded-3xl p-6 shadow-inner h-80 relative">
                        <div className="flex justify-between items-start mb-4"><div><h3 className="text-2xl font-bold text-green-900">ملخص الأسبوع</h3><p className="text-green-800 opacity-70">أداء المبيعات الحقيقي</p></div></div>
                        <div style={{ width: '100%', height: '80%' }}><ResponsiveContainer width="100%" height="100%"><BarChart data={getChartData()}><CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#16653433" /><XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#14532d', fontSize: 12}} /><Tooltip contentStyle={{backgroundColor: '#fff', borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)'}} cursor={{fill: '#16653422'}}/><Bar dataKey="sales" fill="#115e59" radius={[6, 6, 0, 0]} barSize={40} /></BarChart></ResponsiveContainer></div>
                    </div>
                </div>
            </div>
        )}

        {/* Customers Tab */}
        {activeTab === 'customers' && (
            <div className="bg-white rounded-3xl shadow-lg border border-gray-100 overflow-hidden">
                <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                    <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2"><Users className="text-accent"/> قاعدة العملاء</h2>
                    <span className="bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-xs font-bold">{customersList.length} عميل</span>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-right min-w-[900px] text-sm">
                        <thead className="bg-gray-50 text-gray-600 font-bold uppercase tracking-wider text-base border-b border-gray-200">
                            <tr>
                                <th className="p-6">بيانات العميل</th>
                                <th className="p-6 text-center">الحالة</th>
                                <th className="p-6 text-center">إجمالي المشتريات</th>
                                <th className="p-6 text-center">إجراءات</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {customersList.map(customer => (
                                <tr key={customer.id} className={`hover:bg-gray-50 transition-colors ${customer.isBanned ? 'bg-red-50' : ''}`}>
                                    <td className="p-6 align-middle">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg uppercase border shadow-sm ${customer.role === 'registered' ? 'bg-blue-50 text-blue-600 border-blue-100' : 'bg-orange-50 text-orange-600 border-orange-100'}`}>
                                                <User size={20}/>
                                            </div>
                                            <div>
                                                <p className="font-bold text-gray-900 text-lg">{customer.name}</p>
                                                <div className="flex flex-col text-xs text-gray-500">
                                                    <span>{customer.phone}</span>
                                                    <span>{customer.email}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="p-6 align-middle text-center">
                                        {customer.isBanned ? (
                                            <span className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-xs font-bold flex items-center justify-center gap-1 mx-auto w-fit"><Ban size={12}/> محظور</span>
                                        ) : (
                                            <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-bold flex items-center justify-center gap-1 mx-auto w-fit"><CheckCircle size={12}/> نشط</span>
                                        )}
                                    </td>
                                    <td className="p-6 align-middle text-center">
                                        <span className="text-xl font-black text-primary">{customer.totalSpent.toLocaleString()} ج.م</span>
                                        <p className="text-xs text-gray-400 mt-1">{customer.ordersCount} طلبات</p>
                                    </td>
                                    <td className="p-6 align-middle text-center">
                                        {customer.role === 'registered' ? (
                                            <div className="flex justify-center gap-2">
                                                <button onClick={() => handleToggleBan(customer.id, customer.isBanned)} className={`p-2 rounded-xl transition-colors ${customer.isBanned ? 'bg-green-50 text-green-600 hover:bg-green-100' : 'bg-orange-50 text-orange-600 hover:bg-orange-100'}`} title={customer.isBanned ? "فك الحظر" : "حظر العميل"}>
                                                    {customer.isBanned ? <Unlock size={18}/> : <Ban size={18}/>}
                                                </button>
                                                <button onClick={() => openEditUserModal(customer)} className="p-2 rounded-xl bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors" title="تعديل البيانات">
                                                    <Pencil size={18}/>
                                                </button>
                                                <button onClick={() => handleDeleteUser(customer.id)} className="p-2 rounded-xl bg-red-50 text-red-600 hover:bg-red-100 transition-colors" title="حذف الحساب">
                                                    <Trash2 size={18}/>
                                                </button>
                                            </div>
                                        ) : (
                                            <span className="text-gray-300 text-xs cursor-not-allowed">زائر</span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        )}

        {/* Orders Tab */}
        {activeTab === 'orders' && (
          <div className="bg-white rounded-3xl shadow-lg border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full text-right min-w-[1200px] text-sm">
                    <thead className="bg-gray-50 text-gray-600 font-bold uppercase tracking-wider text-base border-b border-gray-200">
                        <tr>
                            <th className="p-6 w-[20%]">بيانات العميل</th>
                            <th className="p-6 w-[25%]">تفاصيل الطلب</th>
                            <th className="p-6 w-[15%]">المالية</th>
                            <th className="p-6 w-[20%]">بيانات الدفع</th>
                            <th className="p-6 w-[15%]">الحالة</th>
                            <th className="p-6 w-[5%] text-center"></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {orders.map((order) => (
                            <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                                <td className="p-6 align-top">
                                    <div className="flex flex-col gap-2">
                                        <div className="font-bold text-gray-900 text-lg flex items-center gap-2">
                                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary"><Users size={16}/></div>
                                            {order.customer?.name || "عميل"}
                                        </div>
                                        <div className="space-y-1.5 text-sm text-gray-500 font-medium mr-2">
                                            <div className="flex items-center gap-2"><Phone size={14} className="text-gray-400"/> {order.customer?.phone}</div>
                                            <div className="flex items-center gap-2"><MapPin size={14} className="text-gray-400"/> {order.customer?.governorate}, {order.customer?.address}</div>
                                            <div className="flex items-center gap-2 text-xs bg-gray-100 w-fit px-2 py-1 rounded"><Calendar size={12}/> {formatDate(order.createdAt)}</div>
                                        </div>
                                    </div>
                                </td>
                                <td className="p-6 align-top">
                                    <div className="space-y-3">
                                        {order.items?.map((item, idx) => (
                                            <div key={idx} className="flex gap-4 p-2 rounded-xl border border-gray-100 bg-white hover:border-gray-200 transition-colors">
                                                <div className="w-12 h-12 bg-gray-50 rounded-lg overflow-hidden border border-gray-100 flex-shrink-0">
                                                    <img src={item.image} className="w-full h-full object-cover" />
                                                </div>
                                                <div className="flex flex-col justify-center">
                                                    <span className="font-bold text-gray-800 line-clamp-1">{item.name}</span>
                                                    <span className="text-xs text-gray-500 font-medium">الكمية: {item.quantity} × {item.price} ج.م</span>
                                                </div>
                                            </div>
                                        ))}
                                        {order.customer?.notes && (
                                            <div className="text-xs bg-yellow-50 text-yellow-700 p-3 rounded-xl border border-yellow-100 flex items-start gap-2">
                                                <MessageSquare size={14} className="mt-0.5"/> 
                                                <span><span className="font-bold">ملاحظة:</span> {order.customer.notes}</span>
                                            </div>
                                        )}
                                    </div>
                                </td>
                                <td className="p-6 align-top">
                                    <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 space-y-2">
                                        <div className="flex justify-between text-sm text-gray-500"><span>الشحن:</span> <span className="font-bold">{order.shippingCost}</span></div>
                                        {order.discountAmount > 0 && <div className="flex justify-between text-sm text-green-600"><span>خصم:</span> <span className="font-bold">-{order.discountAmount}</span></div>}
                                        <div className="border-t border-gray-200 pt-2 mt-2 flex justify-between font-black text-primary text-xl">
                                            <span>الإجمالي</span><span>{order.total} ج.م</span>
                                        </div>
                                    </div>
                                </td>
                                <td className="p-6 align-top">
                                    {order.paymentMethod === 'vodafone' ? (
                                        <div className="bg-red-50 border border-red-100 p-4 rounded-2xl space-y-3">
                                            <div className="flex items-center gap-2 text-red-600 font-bold text-base"><Wallet size={18}/> فودافون كاش</div>
                                            <div className="text-sm text-gray-700 space-y-1 bg-white p-3 rounded-xl border border-red-100">
                                                <div className="flex justify-between"><span>من:</span> <span className="font-mono font-bold">{order.walletNumber}</span></div>
                                                <div className="flex justify-between"><span>المبلغ:</span> <span className="font-bold">{order.transferredAmount} ج.م</span></div>
                                            </div>
                                            {order.receiptImageUrl && (
                                                <a href={order.receiptImageUrl} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 w-full py-2 bg-red-100 text-red-700 rounded-lg text-xs font-bold hover:bg-red-200 transition-colors">
                                                    <ExternalLink size={14} /> صورة التحويل
                                                </a>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="bg-green-50 border border-green-100 p-4 rounded-2xl flex flex-col gap-2 items-center text-center">
                                            <div className="w-10 h-10 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-1"><Banknote size={20}/></div>
                                            <span className="font-bold text-green-800">دفع عند الاستلام</span>
                                            <span className="text-xs text-green-600">تحصيل المبلغ كاملاً</span>
                                        </div>
                                    )}
                                    <button 
                                        onClick={() => handlePaymentStatusChange(order)}
                                        className={`mt-3 w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all border-2 ${order.isPaid ? 'bg-green-100 text-green-700 border-green-200 hover:bg-green-200' : 'bg-white text-red-600 border-red-100 hover:border-red-300'}`}
                                    >
                                        {order.isPaid ? <><CheckCircle size={16}/> تم الدفع</> : <><X size={16}/> غير مدفوع</>}
                                    </button>
                                </td>
                                <td className="p-6 align-top space-y-3">
                                    <div className={`flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-sm font-bold border ${getStatusColor(order.status)}`}>
                                        {getStatusText(order.status)}
                                    </div>
                                    <select 
                                        value={order.status} 
                                        onChange={(e) => initiateStatusChange(order.id, e.target.value)} 
                                        className="w-full p-3 text-sm font-bold border-2 border-gray-200 rounded-xl focus:border-accent outline-none cursor-pointer bg-white"
                                    >
                                        <option value="pending">⏳ قيد الانتظار</option>
                                        <option value="shipped">🚚 تم الشحن</option>
                                        <option value="on_delivery">🛵 جاري التوصيل</option>
                                        <option value="delivered">✅ تم التوصيل</option>
                                        <option value="returning">🔄 جاري الاسترجاع</option>
                                        <option value="returned">↩️ مسترجع</option>
                                        <option value="cancelled">❌ ملغي</option>
                                    </select>
                                    {(order.courierName && order.trackingNumber) && (
                                        <div className="bg-gray-800 text-white p-3 rounded-xl text-xs space-y-1">
                                            <div className="flex items-center gap-2 font-bold"><Truck size={12}/> {order.courierName === 'bosta' ? 'بوسطة' : order.courierName === 'aramex' ? 'أرامكس' : order.courierName === 'egypt_post' ? 'البريد' : 'مندوب'}</div>
                                            <div className="font-mono bg-gray-700 px-2 py-1 rounded text-center tracking-wider">{order.trackingNumber}</div>
                                        </div>
                                    )}
                                </td>
                                <td className="p-6 align-middle text-center">
                                    <button onClick={() => handleDeleteOrder(order.id)} className="text-gray-400 hover:text-red-500 hover:bg-red-50 p-3 rounded-xl transition-all" title="حذف الطلب">
                                        <Trash2 size={20} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
          </div>
        )}

        {activeTab === 'products' && (
          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-1">
                <div className="bg-white rounded-3xl shadow-lg p-6 sticky top-28 border border-gray-100">
                    <h2 className="text-xl font-bold mb-6 flex items-center gap-2 text-primary border-b pb-4">{editMode ? 'تعديل منتج' : 'إضافة منتج'}</h2>
                    {success && <div className="mb-4 p-3 bg-green-50 text-green-700 rounded-xl flex items-center gap-2 text-sm"><CheckCircle size={16} /> {success}</div>}
                    {error && <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-xl flex items-center gap-2 text-sm"><AlertCircle size={16} /> {error}</div>}
                    <form onSubmit={handleProductSubmit} className="space-y-4">
                        <input type="text" required className="w-full p-3 border-2 border-gray-100 rounded-xl outline-none focus:border-accent font-bold" value={product.name} onChange={e => setProduct({...product, name: e.target.value})} placeholder="اسم المنتج" />
                        <div className="grid grid-cols-2 gap-3">
                            <input type="number" required className="w-full p-3 border-2 border-gray-100 rounded-xl outline-none focus:border-accent" value={product.price} onChange={e => setProduct({...product, price: e.target.value})} placeholder="سعر البيع" />
                            <input type="number" className="w-full p-3 border-2 border-red-100 bg-red-50 rounded-xl outline-none focus:border-accent" value={product.costPrice} onChange={e => setProduct({...product, costPrice: e.target.value})} placeholder="سعر التكلفة" />
                        </div>
                        <input type="number" className="w-full p-3 border-2 border-gray-100 rounded-xl outline-none focus:border-accent bg-gray-50" value={product.oldPrice} onChange={e => setProduct({...product, oldPrice: e.target.value})} placeholder="سعر قديم" />
                        
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="text-xs font-bold text-gray-500 mb-1 block">الكمية في المخزون</label>
                                <input type="number" required className="w-full p-3 border-2 border-gray-100 rounded-xl outline-none focus:border-accent" value={product.stock} onChange={e => setProduct({...product, stock: e.target.value})} placeholder="مثال: 50" />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-gray-500 mb-1 block">الحد الأقصى للعميل</label>
                                <input type="number" required className="w-full p-3 border-2 border-gray-100 rounded-xl outline-none focus:border-accent" value={product.maxLimit} onChange={e => setProduct({...product, maxLimit: e.target.value})} placeholder="مثال: 10" />
                            </div>
                        </div>

                        <select required className="w-full p-3 border-2 border-gray-100 rounded-xl outline-none focus:border-accent bg-white" value={product.category} onChange={e => setProduct({...product, category: e.target.value})}>
                            <option value="">التصنيف...</option>{categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                        </select>
                        <div className="space-y-2">
                           <div className="relative"><Palette className="absolute top-3.5 right-3 text-gray-400" size={18} /><input type="text" className="w-full pr-10 pl-3 py-3 border-2 border-gray-100 rounded-xl outline-none focus:border-accent" value={product.colors} onChange={e => setProduct({...product, colors: e.target.value})} placeholder="الألوان (مثال: أحمر, أزرق)" /></div>
                           <div className="relative"><Ruler className="absolute top-3.5 right-3 text-gray-400" size={18} /><input type="text" className="w-full pr-10 pl-3 py-3 border-2 border-gray-100 rounded-xl outline-none focus:border-accent" value={product.sizes} onChange={e => setProduct({...product, sizes: e.target.value})} placeholder="المقاسات (مثال: S, M, L, XL)" /></div>
                        </div>
                        <div className="mt-2"><label className="block text-gray-500 font-bold mb-1 text-xs">نهاية العرض (المؤقت)</label><input type="datetime-local" className="w-full p-3 border-2 border-gray-100 rounded-xl outline-none focus:border-accent bg-gray-50 text-sm font-bold text-primary cursor-pointer" value={product.discountEnd} onChange={e => setProduct({...product, discountEnd: e.target.value})} /></div>
                        <textarea rows="3" required className="w-full p-3 border-2 border-gray-100 rounded-xl outline-none focus:border-accent" value={product.description} onChange={e => setProduct({...product, description: e.target.value})} placeholder="الوصف" />
                        <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center cursor-pointer hover:bg-gray-50 relative group">
                            <input type="file" multiple ref={fileInputRef} accept="image/*" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" onChange={handleImagesChange} />
                            <div className="flex flex-col items-center text-gray-400 group-hover:text-accent"><Upload size={32} className="mb-2" /><span className="text-xs font-bold">اضغط لرفع الصور</span></div>
                        </div>
                        <div className="flex gap-2 overflow-x-auto pb-2 min-h-[90px]">
                            {product.imageUrls && product.imageUrls.map((url, idx) => (
                                <div key={`old-${idx}`} className="relative group w-20 h-20 shrink-0 border border-gray-200 rounded-lg overflow-hidden">
                                    <img src={url} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-125" />
                                    {/* Sort Controls Overlay */}
                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-between px-1">
                                        <button type="button" onClick={() => moveImageRight(idx)} className="bg-white/80 p-1 rounded-full hover:bg-white text-gray-800"><ChevronRight size={14}/></button>
                                        <button type="button" onClick={() => moveImageLeft(idx)} className="bg-white/80 p-1 rounded-full hover:bg-white text-gray-800"><ChevronLeft size={14}/></button>
                                    </div>
                                    {idx === 0 && <span className="absolute top-0 right-0 bg-accent text-white text-[9px] px-1 rounded-bl">Main</span>}
                                </div>
                            ))}
                            {product.images && product.images.map((file, idx) => (
                                <div key={`new-${idx}`} className="w-20 h-20 shrink-0 border border-accent rounded-lg overflow-hidden relative group">
                                    <img src={URL.createObjectURL(file)} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-125" />
                                </div>
                            ))}
                        </div>
                        <div className="flex gap-3 pt-2">
                            <button type="submit" disabled={loading} className="flex-1 bg-primary text-white py-4 rounded-xl font-bold hover:bg-gray-800 transition-all">{loading ? 'جاري الحفظ...' : editMode ? 'تحديث' : 'نشر'}</button>
                            {editMode && <button type="button" onClick={() => {setEditMode(false); setCurrentId(null); setProduct({ name: '', price: '', oldPrice: '', costPrice: '', category: '', description: '', images: [], imageUrls: [], colors: '', sizes: '', discountEnd: '', stock: '', maxLimit: 10 });}} className="px-4 bg-red-50 text-red-500 rounded-xl"><X size={24} /></button>}
                        </div>
                    </form>
                </div>
            </div>
            <div className="lg:col-span-2 bg-white rounded-3xl shadow-lg border border-gray-100 overflow-hidden">
                <table className="w-full text-right text-sm">
                    <thead className="bg-gray-50 text-gray-500 font-bold"><tr><th className="p-4">صورة</th><th className="p-4">المنتج والمخزون</th><th className="p-4">السعر</th><th className="p-4 text-center">إجراء</th></tr></thead>
                    <tbody>
                        {products.map(p => (
                            <tr key={p.id} className="hover:bg-gray-50 transition-colors group border-t">
                                <td className="p-4 w-24">
                                    <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-100 shadow-sm border border-gray-200">
                                        <img src={p.image || 'https://via.placeholder.com/150'} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-150 origin-center" />
                                    </div>
                                </td>
                                <td className="p-4">
                                    <p className="font-bold text-primary text-lg">{p.name}</p>
                                    <div className="flex gap-2 mt-1">
                                        <span className="bg-accent/10 text-accent text-xs px-2 py-1 rounded font-bold">{p.category}</span>
                                        {Number(p.stock) > 0 ? (
                                            <span className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded font-bold">متاح: {p.stock}</span>
                                        ) : (
                                            <span className="bg-red-100 text-red-700 text-xs px-2 py-1 rounded font-bold">Out of Stock</span>
                                        )}
                                        <span className="bg-blue-50 text-blue-600 text-xs px-2 py-1 rounded font-bold">Max: {p.maxLimit || 10}</span>
                                    </div>
                                </td>
                                <td className="p-4">
                                    <span className="text-primary font-bold text-lg">{p.price} ج.م</span>
                                    {p.costPrice && <div className="text-xs text-gray-400 mt-1">ت: {p.costPrice} ج.م</div>}
                                </td>
                                <td className="p-4 text-center"><div className="flex justify-center gap-2 opacity-60 group-hover:opacity-100"><button onClick={() => handleEditClick(p)} className="text-blue-600 bg-blue-50 p-2 rounded-lg"><Edit size={18} /></button><button onClick={() => handleDeleteProduct(p.id)} className="text-red-600 bg-red-50 p-2 rounded-lg"><Trash2 size={18} /></button></div></td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
          </div>
        )}

        {/* Categories Tab */}
        {activeTab === 'categories' && (
          <div className="max-w-4xl mx-auto bg-white rounded-3xl shadow-lg border border-gray-100 p-8">
             <h2 className="text-2xl font-bold text-primary mb-6 flex items-center gap-2 border-b pb-4"><List className="text-accent" /> إدارة التصنيفات</h2>
             {success && <div className="mb-4 p-3 bg-green-50 text-green-700 rounded-xl flex items-center gap-2"><CheckCircle size={16} /> {success}</div>}
             <div className="flex flex-col md:flex-row gap-4 mb-8 items-start">
                <input type="text" value={categoryForm.name} onChange={e => setCategoryForm({...categoryForm, name: e.target.value})} placeholder="اسم التصنيف" className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-xl outline-none focus:border-accent text-lg" />
                <div className="relative w-full md:w-32 h-14 border-2 border-dashed border-gray-300 rounded-xl flex items-center justify-center cursor-pointer hover:bg-gray-50 transition-colors group"><input type="file" ref={categoryImageInputRef} accept="image/*" onChange={(e) => {if(e.target.files[0]) setCategoryForm({...categoryForm, image: e.target.files[0]})}} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" /><div className="text-gray-400 flex flex-col items-center text-xs group-hover:text-accent"><ImageIcon size={20} /><span>{categoryForm.image || categoryForm.imageUrl ? "تم" : "صورة"}</span></div></div>
                <button onClick={handleCategorySubmit} disabled={loading} className="bg-accent text-white px-8 py-3 rounded-xl font-bold hover:bg-primary transition-colors flex items-center gap-2 h-14">{loading ? <Loader className="animate-spin" /> : editingCategory ? <><Edit size={20}/> تحديث</> : <><Plus size={20} /> إضافة</>}</button>
                {editingCategory && (<button onClick={() => {setEditingCategory(null); setCategoryForm({name: '', image: null, imageUrl: ''});}} className="bg-red-50 text-red-500 px-4 py-3 rounded-xl font-bold hover:bg-red-100 h-14"><X size={20} /></button>)}
             </div>
             <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {categories.map(c => (
                    <div key={c.id} className="flex flex-col items-center p-4 bg-gray-50 rounded-2xl border border-gray-200 hover:border-accent group relative transition-all">
                        <div className="w-16 h-16 rounded-full overflow-hidden bg-white border border-gray-200 mb-2 shadow-sm relative">
                            {c.imageUrl ? (
                                <img src={c.imageUrl} alt={c.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-125" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-gray-300"><ImageIcon /></div>
                            )}
                        </div>
                        <span className="font-bold text-gray-700">{c.name}</span>
                        <div className="absolute top-2 left-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity"><button onClick={() => handleEditCategory(c)} className="text-blue-500 hover:text-blue-600 bg-white rounded-full p-1 shadow-sm"><Edit size={16} /></button><button onClick={() => handleDeleteCategory(c.id)} className="text-red-400 hover:text-red-600 bg-white rounded-full p-1 shadow-sm"><Trash2 size={16} /></button></div>
                    </div>
                ))}
             </div>
          </div>
        )}
        {activeTab === 'promos' && (
          <div className="max-w-4xl mx-auto bg-white rounded-3xl shadow-lg border border-gray-100 p-8">
             <h2 className="text-2xl font-bold text-primary mb-6 flex items-center gap-2 border-b pb-4"><TicketPercent className="text-accent" /> أكواد الخصم</h2>
             {success && <div className="mb-4 p-3 bg-green-50 text-green-700 rounded-xl flex items-center gap-2"><CheckCircle size={16} /> {success}</div>}
             <div className="flex flex-col gap-4 mb-8 bg-gray-50 p-6 rounded-2xl border border-gray-200">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="w-full">
                        <label className="block text-gray-700 font-bold mb-2 text-xs">كود الخصم</label>
                        <input type="text" value={newPromo.code} onChange={e => setNewPromo({...newPromo, code: e.target.value})} placeholder="مثال: SAVE10" className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl outline-none focus:border-accent uppercase font-bold" />
                    </div>
                    <div className="flex gap-4">
                        <div className="w-full">
                            <label className="block text-gray-700 font-bold mb-2 text-xs">النوع</label>
                            <select value={newPromo.type} onChange={e => setNewPromo({...newPromo, type: e.target.value})} className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl outline-none focus:border-accent bg-white">
                                <option value="percent">نسبة مئوية %</option>
                                <option value="fixed">مبلغ ثابت (ج.م)</option>
                            </select>
                        </div>
                        <div className="w-full">
                            <label className="block text-gray-700 font-bold mb-2 text-xs">القيمة</label>
                            <input type="number" value={newPromo.value} onChange={e => setNewPromo({...newPromo, value: e.target.value})} placeholder="10" className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl outline-none focus:border-accent" />
                        </div>
                    </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-gray-700 font-bold mb-2 text-xs">تاريخ الانتهاء</label>
                        <input type="datetime-local" value={newPromo.expiryDate} onChange={e => setNewPromo({...newPromo, expiryDate: e.target.value})} className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl outline-none focus:border-accent bg-white font-mono text-sm" />
                    </div>
                    <div>
                        <label className="block text-gray-700 font-bold mb-2 text-xs">حد الاستخدام (0 = غير محدود)</label>
                        <input type="number" value={newPromo.usageLimit} onChange={e => setNewPromo({...newPromo, usageLimit: e.target.value})} placeholder="مثال: 50" className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl outline-none focus:border-accent" />
                    </div>
                </div>

                <button onClick={handleAddPromo} disabled={loading} className="w-full bg-accent text-white px-8 py-3 rounded-xl font-bold hover:bg-primary transition-colors flex items-center justify-center gap-2 mt-2 h-[50px]">{loading ? <Loader className="animate-spin" /> : <><Plus size={20} /> إضافة الكوبون</>}</button>
             </div>

             <div className="space-y-3">
                {promoCodes.length === 0 ? <p className="text-gray-400 text-center py-6">لا توجد أكواد خصم</p> : promoCodes.map(promo => (
                    <div key={promo.id} className="flex flex-col md:flex-row justify-between items-start md:items-center p-4 bg-white rounded-xl border border-gray-200 hover:border-accent shadow-sm gap-4">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-full flex items-center justify-center flex-shrink-0"><TicketPercent size={24}/></div>
                            <div>
                                <h4 className="font-bold text-lg text-gray-900 tracking-wider">{promo.code}</h4>
                                <div className="flex gap-2 mt-1">
                                    <span className="text-xs text-green-700 bg-green-100 px-2 py-1 rounded font-bold">خصم {promo.value} {promo.type === 'percent' ? '%' : 'ج.م'}</span>
                                    {promo.usageLimit > 0 && (
                                        <span className={`text-xs px-2 py-1 rounded font-bold ${promo.usageCount >= promo.usageLimit ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'}`}>
                                            استخدام: {promo.usageCount || 0} / {promo.usageLimit}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                        
                        <div className="flex items-center gap-4 text-xs text-gray-500 w-full md:w-auto justify-between md:justify-end">
                             <div className="flex flex-col gap-1">
                                {promo.expiryDate && (
                                    <div className="flex items-center gap-1 bg-gray-50 px-2 py-1 rounded border border-gray-100">
                                        <CalendarClock size={14}/> 
                                        <span>ينتهي: {new Date(promo.expiryDate.toDate ? promo.expiryDate.toDate() : promo.expiryDate).toLocaleDateString('ar-EG')}</span>
                                    </div>
                                )}
                             </div>
                             <div className="flex gap-2">
                                <button onClick={() => handleOpenPromoHistory(promo)} className="text-blue-500 hover:bg-blue-50 p-2 rounded-lg transition-colors" title="سجل الاستخدام">
                                    <History size={20}/>
                                </button>
                                <button onClick={() => handleDeletePromo(promo.id)} className="text-red-500 hover:bg-red-50 p-2 rounded-lg transition-colors" title="حذف">
                                    <Trash2 size={20}/>
                                </button>
                             </div>
                        </div>
                    </div>
                ))}
             </div>
          </div>
        )}

        {/* Messages Tab */}
        {activeTab === 'messages' && (
          <div className="bg-white rounded-3xl shadow-lg border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full text-right min-w-[800px] text-sm">
                    <thead className="bg-gray-50 text-gray-500 font-bold uppercase"><tr><th className="p-6">المرسل</th><th className="p-6">نص الرسالة</th><th className="p-6">التاريخ</th><th className="p-6 text-center">حذف</th></tr></thead>
                    <tbody>
                        {messages.length === 0 ? <tr><td colSpan="4" className="text-center py-20 text-gray-400">لا توجد رسائل</td></tr> : messages.map((msg) => (
                            <tr key={msg.id} className="hover:bg-gray-50 transition-colors border-t">
                                <td className="p-6 align-top"><div className="font-bold text-primary text-lg">{msg.name}</div><div className="flex items-center gap-2 text-gray-500 text-sm mt-1 font-mono bg-gray-100 px-2 py-1 rounded w-fit"><Phone size={14} className="text-accent" /> {msg.phone}</div></td>
                                <td className="p-6 align-top"><p className="text-gray-700 bg-blue-50 p-4 rounded-xl border border-blue-100 text-lg leading-relaxed">{msg.message}</p></td>
                                <td className="p-6 align-top text-sm text-gray-500 whitespace-nowrap"><div className="flex items-center gap-2"><Calendar size={14} /> {formatDate(msg.createdAt)}</div></td>
                                <td className="p-6 align-top text-center"><button onClick={() => handleDeleteMessage(msg.id)} className="text-red-500 bg-red-50 hover:bg-red-100 p-3 rounded-xl border border-red-100"><Trash2 size={20} /></button></td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
          </div>
        )}

        {/* Reviews Tab */}
        {activeTab === 'reviews' && (
          <div className="bg-white rounded-3xl shadow-lg border border-gray-100 overflow-hidden">
            <h2 className="p-6 text-xl font-bold border-b border-gray-100 flex items-center gap-2"><Star className="text-yellow-500 fill-yellow-500"/> إدارة التقييمات</h2>
            {success && <div className="mx-6 mt-4 p-3 bg-green-50 text-green-700 rounded-xl flex items-center gap-2"><CheckCircle size={16} /> {success}</div>}
            <div className="overflow-x-auto">
                <table className="w-full text-right min-w-[900px] text-sm">
                    <thead className="bg-gray-50 text-gray-500 font-bold uppercase">
                        <tr>
                            <th className="p-6">العميل</th>
                            <th className="p-6">التقييم</th>
                            <th className="p-6">التعليق والصورة</th> 
                            <th className="p-6">الحالة</th>
                            <th className="p-6 text-center">الإجراءات</th>
                        </tr>
                    </thead>
                    <tbody>
                        {allReviews.length === 0 ? <tr><td colSpan="5" className="text-center py-10 text-gray-400">لا توجد تقييمات</td></tr> : allReviews.map((rev) => (
                            <tr key={rev.id} className={`hover:bg-gray-50 transition-colors border-t ${rev.status === 'pending' ? 'bg-yellow-50/50' : ''}`}>
                                <td className="p-6 align-top">
                                    <div className="font-bold text-primary">{rev.userName}</div>
                                    <div className="text-xs text-gray-400">{rev.userEmail}</div>
                                    <div className="text-[10px] font-mono text-gray-400 mt-1">Prod: {rev.productId}</div>
                                </td>
                                <td className="p-6 align-top">
                                    <div className="flex gap-1 text-yellow-400">{[...Array(5)].map((_, i) => (<Star key={i} size={14} className={i < rev.rating ? "fill-yellow-400" : "text-gray-200"} />))}</div>
                                </td>
                                <td className="p-6 align-top">
                                    <p className="text-gray-600 max-w-xs">{rev.comment}</p>
                                     
                                    {rev.image && (
                                        <div className="mt-3">
                                            <a href={rev.image} target="_blank" rel="noopener noreferrer" className="inline-block group relative">
                                                <img 
                                                    src={rev.image} 
                                                    alt="Review Attachment" 
                                                    className="w-20 h-20 object-cover rounded-lg border border-gray-200 shadow-sm transition-transform group-hover:scale-105" 
                                                />
                                                <div className="absolute inset-0 bg-black/10 rounded-lg group-hover:bg-transparent transition-colors"></div>
                                                <span className="absolute bottom-1 right-1 bg-black/50 text-white text-[10px] px-1 rounded">صورة مرفقة</span>
                                            </a>
                                        </div>
                                    )}
                                </td>
                                <td className="p-6 align-top">
                                    {rev.status === 'approved' && <span className="bg-green-100 text-green-700 px-2 py-1 rounded text-xs font-bold">منشور</span>}
                                    {(rev.status === 'pending' || !rev.status) && <span className="bg-yellow-100 text-yellow-700 px-2 py-1 rounded text-xs font-bold">انتظار</span>}
                                    {rev.status === 'hidden' && <span className="bg-gray-200 text-gray-600 px-2 py-1 rounded text-xs font-bold">مخفي</span>}
                                </td>
                                <td className="p-6 align-top text-center">
                                    <div className="flex justify-center gap-2">
                                        {rev.status !== 'approved' && (<button onClick={() => handleApproveReview(rev)} className="text-green-600 bg-green-50 hover:bg-green-100 p-2 rounded-xl" title="نشر"><Check size={18} /></button>)}
                                        {rev.status !== 'hidden' && (<button onClick={() => handleHideReview(rev)} className="text-orange-500 bg-orange-50 hover:bg-orange-100 p-2 rounded-xl" title="إخفاء"><EyeOff size={18} /></button>)}
                                        <button onClick={() => handleDeleteReview(rev.id)} className="text-red-500 bg-red-50 hover:bg-red-100 p-2 rounded-xl" title="حذف نهائي"><Trash2 size={18} /></button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
          </div>
        )}

        {/* Testimonials Tab */}
        {activeTab === 'testimonials' && (
            <div className="grid lg:grid-cols-3 gap-8">
                <div className="lg:col-span-1">
                    <div className="bg-white rounded-3xl shadow-lg p-6 border border-gray-100 sticky top-28">
                        <h2 className="text-xl font-bold mb-6 flex items-center gap-2 text-primary border-b pb-4"><Quote className="text-yellow-500"/> إضافة رأي</h2>
                        <form onSubmit={handleSiteReviewSubmit} className="space-y-4">
                            <input type="text" required value={reviewForm.name} onChange={e => setReviewForm({...reviewForm, name: e.target.value})} className="w-full p-3 border-2 border-gray-100 rounded-xl outline-none focus:border-accent" placeholder="اسم العميل" />
                            <textarea rows="3" value={reviewForm.text} onChange={e => setReviewForm({...reviewForm, text: e.target.value})} className="w-full p-3 border-2 border-gray-100 rounded-xl outline-none focus:border-accent" placeholder="نص الرأي (اختياري)"></textarea>
                            <select value={reviewForm.rating} onChange={e => setReviewForm({...reviewForm, rating: e.target.value})} className="w-full p-3 border-2 border-gray-100 rounded-xl outline-none bg-white"><option value="5">⭐⭐⭐⭐⭐</option><option value="4">⭐⭐⭐⭐</option></select>
                            <div className="border-2 border-dashed border-gray-300 rounded-xl p-4 text-center cursor-pointer hover:bg-gray-50 relative"><input type="file" accept="image/*" onChange={(e) => setReviewForm({...reviewForm, image: e.target.files[0]})} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" /><div className="flex flex-col items-center text-gray-400"><Upload size={24} /><span className="text-xs mt-1">{reviewForm.image ? "تم اختيار الصورة" : "اضغط لرفع سكرين شوت"}</span></div></div>
                            <button type="submit" disabled={reviewLoading} className="w-full bg-accent text-white py-3 rounded-xl font-bold hover:bg-primary transition-all">{reviewLoading ? 'جاري الرفع...' : 'إضافة للقائمة'}</button>
                        </form>
                    </div>
                </div>
                <div className="lg:col-span-2 space-y-4">
                    {siteReviews.length === 0 ? <p className="text-center text-gray-400 py-10">لا توجد آراء مضافة يدوياً</p> : siteReviews.map(rev => (
                        <div key={rev.id} className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex gap-4 items-start">
                            {rev.image ? <div className="w-24 h-24 rounded-xl overflow-hidden border border-gray-200 flex-shrink-0 cursor-pointer" onClick={() => window.open(rev.image, '_blank')}><img src={rev.image} className="w-full h-full object-cover" alt="Review" /></div> : <div className="w-24 h-24 rounded-xl bg-gray-100 flex items-center justify-center text-gray-400 flex-shrink-0"><MessageSquare/></div>}
                            <div className="flex-1"><div className="flex justify-between"><h3 className="font-bold text-primary">{rev.name}</h3><button onClick={() => handleDeleteSiteReview(rev.id)} className="text-red-500 hover:bg-red-50 p-2 rounded-lg"><Trash2 size={18}/></button></div><div className="flex text-yellow-400 text-xs my-1">{[...Array(Number(rev.rating)||5)].map((_,i) => <Star key={i} size={12} fill="currentColor"/>)}</div><p className="text-gray-600 text-sm mt-2">{rev.text || "بدون نص (صورة فقط)"}</p></div>
                        </div>
                    ))}
                </div>
            </div>
        )}

        {/* Settings Tab */}
        {activeTab === 'settings' && (
            <div className="max-w-4xl mx-auto bg-white rounded-3xl shadow-lg border border-gray-100 p-8">
                <h2 className="text-2xl font-bold text-primary mb-6 flex items-center gap-2 border-b pb-4"><LayoutTemplate className="text-accent" /> إعدادات الصفحة الرئيسية</h2>
                {success && <div className="mb-4 p-3 bg-green-50 text-green-700 rounded-xl flex items-center gap-2"><CheckCircle size={16} /> {success}</div>}
                <form onSubmit={handleHeroSubmit} className="space-y-6">
                    <div className="grid md:grid-cols-2 gap-6">
                        <div><label className="block text-gray-700 font-bold mb-2">العنوان الأول</label><input type="text" value={heroSettings.title1} onChange={(e) => setHeroSettings({...heroSettings, title1: e.target.value})} className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-accent outline-none" /></div>
                        <div><label className="block text-gray-700 font-bold mb-2">العنوان الثاني</label><input type="text" value={heroSettings.title2} onChange={(e) => setHeroSettings({...heroSettings, title2: e.target.value})} className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-accent outline-none" /></div>
                    </div>
                    <div><label className="block text-gray-700 font-bold mb-2">الوصف</label><textarea rows="3" value={heroSettings.description} onChange={(e) => setHeroSettings({...heroSettings, description: e.target.value})} className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-accent outline-none"></textarea></div>
                    <div>
                        <label className="block text-gray-700 font-bold mb-2 flex items-center gap-2"><Monitor size={18} className="text-accent"/> طريقة عرض الصورة</label>
                        <select value={heroSettings.imageFit} onChange={(e) => setHeroSettings({...heroSettings, imageFit: e.target.value})} className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-accent outline-none bg-white font-bold"><option value="cover">تغطية كاملة (Cover)</option><option value="contain">احتواء (Contain)</option><option value="fill">تمطيط (Fill)</option></select>
                    </div>
                    <div>
                        <label className="block text-gray-700 font-bold mb-2">الصورة الرئيسية</label>
                        <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:bg-gray-50 transition-colors cursor-pointer relative group">
                            <input type="file" ref={heroImageInputRef} accept="image/*" onChange={handleHeroImageChange} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
                            <div className="flex flex-col items-center text-gray-500 group-hover:text-accent"><Upload size={32} className="mb-2" /><span className="font-medium">اضغط لتغيير الصورة الرئيسية</span></div>
                        </div>
                        {(heroSettings.image || heroSettings.imageUrl) && (<div className="mt-4 relative w-full h-48 mx-auto rounded-xl overflow-hidden border border-gray-200 bg-gray-50"><img src={heroSettings.image ? URL.createObjectURL(heroSettings.image) : heroSettings.imageUrl} alt="Hero Preview" className="w-full h-full" style={{ objectFit: heroSettings.imageFit || 'cover' }} /></div>)}
                    </div>
                    <button type="submit" disabled={loading} className="w-full bg-primary text-white py-4 rounded-xl font-bold hover:bg-gray-800 transition-all flex items-center justify-center gap-2">{loading ? <><Loader className="animate-spin" /> جاري الحفظ...</> : 'حفظ الإعدادات'}</button>
                </form>
            </div>
        )}

        {/* User Edit Modal */}
        {showUserModal && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden">
                    <div className="bg-gray-50 p-6 border-b border-gray-100 flex justify-between items-center">
                        <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2"><Edit className="text-accent"/> تعديل العميل</h3>
                        <button onClick={() => setShowUserModal(false)} className="text-gray-400 hover:text-red-500"><X/></button>
                    </div>
                    <form onSubmit={handleSaveUser} className="p-6 space-y-4">
                        <div>
                            <label className="block text-gray-700 font-bold mb-2 text-sm">الاسم</label>
                            <input type="text" required value={editingUser.name} onChange={(e) => setEditingUser({...editingUser, name: e.target.value})} className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl outline-none focus:border-accent font-bold" />
                        </div>
                        <div>
                            <label className="block text-gray-700 font-bold mb-2 text-sm">رقم الهاتف</label>
                            <input type="text" value={editingUser.phone} onChange={(e) => setEditingUser({...editingUser, phone: e.target.value})} className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl outline-none focus:border-accent font-mono" />
                        </div>
                        <div>
                            <label className="block text-gray-700 font-bold mb-2 text-sm">البريد الإلكتروني (للعرض فقط)</label>
                            <input type="email" disabled value={editingUser.email} className="w-full px-4 py-3 border-2 border-gray-100 bg-gray-50 rounded-xl outline-none text-gray-500" />
                        </div>
                        <div>
                            <label className="block text-gray-700 font-bold mb-2 text-sm">حالة الحساب</label>
                            <select value={editingUser.isBanned} onChange={(e) => setEditingUser({...editingUser, isBanned: e.target.value === 'true'})} className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl outline-none focus:border-accent bg-white">
                                <option value="false">✅ نشط (Active)</option>
                                <option value="true">⛔ محظور (Banned)</option>
                            </select>
                        </div>
                         
                        <div className="pt-2 flex gap-3">
                            <button type="button" onClick={() => setShowUserModal(false)} className="flex-1 py-3 bg-gray-100 text-gray-600 rounded-xl font-bold hover:bg-gray-200 transition-colors">إلغاء</button>
                            <button type="submit" disabled={loading} className="flex-1 py-3 bg-primary text-white rounded-xl font-bold hover:bg-gray-800 transition-colors">{loading ? 'جاري الحفظ...' : 'حفظ التغييرات'}</button>
                        </div>
                    </form>
                </div>
            </div>
        )}
      </div>
    </div>
  );
};
export default Admin;
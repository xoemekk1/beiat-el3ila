import React, { useState, useEffect } from 'react';
import { auth, db } from '../firebase';
import { collection, query, where, getDocs, doc, getDoc, setDoc, addDoc, deleteDoc, updateDoc } from 'firebase/firestore';
import { useNavigate, Link } from 'react-router-dom';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { Package, LogOut, Clock, CheckCircle, XCircle, Truck, RefreshCw, User, MapPin, Plus, Trash2, Edit, Home, Phone, Save, Wallet, Banknote, Calendar, ExternalLink } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const Profile = () => {
  const [user, setUser] = useState(null);
  const [orders, setOrders] = useState([]);
  const [addresses, setAddresses] = useState([]); 
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('orders'); // التنقل بين الطلبات والعناوين
  
  // ستيت نموذج العنوان
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState(null);
  const [addressForm, setAddressForm] = useState({ name: '', phone: '', governorate: '', address: '', notes: '' });

  const [gender, setGender] = useState('');
  const navigate = useNavigate();

  const governorates = ["القاهرة", "الجيزة", "الإسكندرية", "الدقهلية", "الشرقية", "الغربية", "أسيوط", "سوهاج", "قنا", "أسوان", "محافظات أخرى"];

  // الصور والأسماء
  const maleAvatar = "https://cdn-icons-png.flaticon.com/512/4128/4128176.png";
  const femaleAvatar = "https://cdn-icons-png.flaticon.com/512/4128/4128244.png";
  const defaultAvatar = "https://cdn-icons-png.flaticon.com/512/149/149071.png";
  
  const maleNames = ["محمد", "أحمد", "محمود", "علي", "عمر", "حسن", "حسين", "خالد", "يوسف", "ابراهيم", "عبدالله", "عبدالرحمن", "مصطفى", "كريم", "طارق", "زياد", "عمرو", "هشام", "وائل", "ياسر", "سامح", "شريف", "ماجد", "رامي", "تامر", "ايهاب", "وليد", "سيد", "اسلام", "mohamed", "ahmed", "mahmoud", "ali", "omar", "hassan", "khaled", "youssef", "ibrahim", "mostafa", "kareem", "tarek", "ziad", "amr", "hisham", "wael", "yasser", "sherif", "maged", "ramy", "tamer", "walid", "sayed", "islam"];
  const femaleNames = ["مريم", "فاطمة", "اية", "اسراء", "سارة", "هاجر", "نور", "سلمى", "منى", "نادية", "هبة", "رنا", "مي", "نهى", "دينا", "ياسمين", "فريدة", "جنى", "ملك", "حبيبة", "منة", "امل", "اميرة", "ندى", "رضوى", "شيماء", "علياء", "سلوى", "هدى", "mariam", "maryam", "fatma", "aya", "esraa", "sara", "hagar", "nour", "salma", "mona", "nadia", "heba", "rana", "mai", "noha", "dina", "yasmin", "farida", "jana", "malak", "habiba", "menna", "amal", "amira", "nada", "radwa", "shaimaa"];

  const detectGender = (fullName) => {
    if (!fullName) return 'unknown';
    const firstName = fullName.split(' ')[0].toLowerCase().trim();
    if (maleNames.includes(firstName)) return 'male';
    if (femaleNames.includes(firstName)) return 'female';
    return 'unknown';
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        try {
            // 1. تحديد الجنس
            const userDocRef = doc(db, "users", currentUser.uid);
            const userDocSnap = await getDoc(userDocRef);
            let currentGender = '';
            if (userDocSnap.exists() && userDocSnap.data().gender && userDocSnap.data().gender !== 'unknown') {
                currentGender = userDocSnap.data().gender;
            } else {
                currentGender = detectGender(currentUser.displayName);
                await setDoc(doc(db, "users", currentUser.uid), { gender: currentGender }, { merge: true });
            }
            setGender(currentGender);

            // 2. جلب الطلبات (بدون orderBy في الكويري لتجنب مشاكل الـ Index)
            const qOrders = query(collection(db, "orders"), where("userId", "==", currentUser.uid));
            const ordersSnap = await getDocs(qOrders);
            const fetchedOrders = ordersSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            
            // الترتيب يدوياً (الأحدث أولاً)
            fetchedOrders.sort((a, b) => {
                const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt);
                const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt);
                return dateB - dateA;
            });
            setOrders(fetchedOrders);

            // 3. جلب العناوين
            const qAddresses = collection(db, "users", currentUser.uid, "addresses");
            const addressesSnap = await getDocs(qAddresses);
            setAddresses(addressesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));

        } catch (error) { console.error("Error fetching data:", error); }
      } else {
        navigate('/login');
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, [navigate]);

  // --- دوال العناوين ---
  const handleAddressSubmit = async (e) => {
      e.preventDefault();
      const phoneRegex = /^01[0-9]{9}$/;
      if (!phoneRegex.test(addressForm.phone)) {
          alert("رقم الهاتف يجب أن يبدأ بـ 01 ويتكون من 11 رقماً");
          return;
      }
      try {
          if (editingAddressId) {
              await updateDoc(doc(db, "users", user.uid, "addresses", editingAddressId), addressForm);
              setAddresses(addresses.map(addr => addr.id === editingAddressId ? { ...addr, ...addressForm } : addr));
          } else {
              const docRef = await addDoc(collection(db, "users", user.uid, "addresses"), addressForm);
              setAddresses([...addresses, { id: docRef.id, ...addressForm }]);
          }
          setShowAddressForm(false);
          setEditingAddressId(null);
          setAddressForm({ name: '', phone: '', governorate: '', address: '', notes: '' });
      } catch (err) { alert("حدث خطأ أثناء حفظ العنوان"); }
  };

  const handleDeleteAddress = async (id) => {
      if(!window.confirm("حذف هذا العنوان؟")) return;
      try {
          await deleteDoc(doc(db, "users", user.uid, "addresses", id));
          setAddresses(addresses.filter(a => a.id !== id));
      } catch (err) { console.error(err); }
  };

  const startEditAddress = (addr) => {
      setAddressForm(addr);
      setEditingAddressId(addr.id);
      setShowAddressForm(true);
  };

  const handleLogout = async () => { await signOut(auth); navigate('/'); };
  
  const getStatusDetails = (status) => { 
      switch (status) {
      case 'pending': return { label: 'قيد المراجعة', color: 'bg-yellow-100 text-yellow-700', icon: <Clock size={16}/> };
      case 'shipped': return { label: 'تم الشحن', color: 'bg-blue-100 text-blue-700', icon: <Truck size={16}/> };
      case 'on_delivery': return { label: 'جاري التوصيل', color: 'bg-indigo-100 text-indigo-700', icon: <Truck size={16}/> };
      case 'delivered': return { label: 'تم التوصيل', color: 'bg-green-100 text-green-700', icon: <CheckCircle size={16}/> };
      case 'returning': return { label: 'جاري الاسترجاع', color: 'bg-orange-100 text-orange-700', icon: <RefreshCw size={16}/> };
      case 'returned': return { label: 'مسترجع', color: 'bg-gray-200 text-gray-700', icon: <RefreshCw size={16}/> };
      case 'cancelled': return { label: 'ملغي', color: 'bg-red-100 text-red-700', icon: <XCircle size={16}/> };
      default: return { label: 'غير معروف', color: 'bg-gray-100 text-gray-600', icon: <Clock size={16}/> };
    }
  };

  const getTrackingLink = (courier, number) => {
      switch(courier) {
          case 'bosta': return `https://bosta.co/ar-eg/tracking-shipments?shipment-number=${number}`;
          case 'aramex': return `https://www.aramex.com/lb/ar/track/results?source=aramex&ShipmentNumber=${number}`;
          case 'egypt_post': return `https://egyptpost.gov.eg/ar-EG//Home/EServices/Track-And-Trace`;
          default: return '#';
      }
  };

  if (loading) return <div className="h-screen flex items-center justify-center"><div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div></div>;

  return (
    <div className="min-h-screen bg-[#f9fafb] pt-28 pb-20 font-sans" dir="rtl">
      <div className="container mx-auto px-4 md:px-6">
        <div className="grid lg:grid-cols-4 gap-8">
          
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 sticky top-28 text-center">
              <div className="relative w-32 h-32 mx-auto mb-6">
                <div className="w-full h-full rounded-full overflow-hidden border-4 border-gray-50 shadow-inner bg-gray-100 flex items-center justify-center">
                    <img 
                        src={gender === 'male' ? maleAvatar : gender === 'female' ? femaleAvatar : defaultAvatar} 
                        alt="Profile" 
                        className="w-full h-full object-cover" 
                    />
                </div>
              </div>
              <h2 className="font-bold text-2xl text-gray-900 mb-2">{user?.displayName || 'عميل مميز'}</h2>
              <p className="text-gray-500 text-sm mb-8 bg-gray-50 py-1 px-3 rounded-full inline-block">{user?.email}</p>
              
              <div className="space-y-3 mb-6">
                  <button onClick={() => setActiveTab('orders')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${activeTab === 'orders' ? 'bg-primary text-white shadow-lg' : 'bg-gray-50 text-gray-600 hover:bg-gray-100'}`}>
                      <Package size={20} /> طلباتي
                  </button>
                  <button onClick={() => setActiveTab('addresses')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${activeTab === 'addresses' ? 'bg-primary text-white shadow-lg' : 'bg-gray-50 text-gray-600 hover:bg-gray-100'}`}>
                      <MapPin size={20} /> عناويني
                  </button>
              </div>

              <button onClick={handleLogout} className="w-full flex items-center justify-center gap-2 border-2 border-red-50 text-red-600 py-3 rounded-xl font-bold hover:bg-red-50 transition-colors">
                <LogOut size={20} /> تسجيل الخروج
              </button>
            </div>
          </div>

          {/* Content Area */}
          <div className="lg:col-span-3">
              
              {/* === TAB 1: الطلبات === */}
              {activeTab === 'orders' && (
                  <div>
                    <h1 className="text-3xl font-black text-gray-900 mb-8 flex items-center gap-3"><Package className="text-primary" size={32} /> سجل الطلبات</h1>
                    {orders.length > 0 ? (
                      <div className="space-y-8">
                        {orders.map((order, index) => {
                          const statusInfo = getStatusDetails(order.status);
                          return (
                            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.1 }} key={order.id} className="bg-white p-8 rounded-[2rem] shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow">
                              
                              {/* Header */}
                              <div className="flex flex-wrap justify-between items-start mb-6 pb-6 border-b border-gray-100 gap-6">
                                <div><p className="text-sm text-gray-400 mb-1">رقم الطلب</p><p className="font-bold text-gray-900 font-mono text-base bg-gray-50 px-2 py-1 rounded">#{order.id.slice(0, 8)}</p></div>
                                <div><p className="text-sm text-gray-400 mb-1">تاريخ الطلب</p><p className="font-bold text-gray-900 text-base flex items-center gap-2"><Calendar size={16} className="text-gray-400"/> {order.createdAt?.toDate ? order.createdAt.toDate().toLocaleDateString('ar-EG') : 'الآن'}</p></div>
                                <div><p className="text-sm text-gray-400 mb-1">الإجمالي</p><p className="font-black text-primary text-xl">{order.total} ج.م</p></div>
                                <div className="flex flex-col gap-3">
                                    <span className={`px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 ${statusInfo.color}`}>{statusInfo.icon} {statusInfo.label}</span>
                                    {order.trackingNumber && (
                                        <a href={order.courierName === 'private' ? '#' : getTrackingLink(order.courierName, order.trackingNumber)} target={order.courierName === 'private' ? '_self' : '_blank'} rel="noreferrer" className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-colors shadow-lg ${order.courierName === 'private' ? 'bg-gray-100 text-gray-500 cursor-default' : 'bg-gray-900 text-white hover:bg-black hover:shadow-xl'}`}>
                                            {order.courierName === 'private' ? 'سيتم التواصل قريباً' : <><Truck size={14}/> تتبع الشحنة</>}
                                        </a>
                                    )}
                                </div>
                              </div>

                              {/* Payment Details */}
                              <div className="bg-gray-50 p-5 rounded-2xl mb-6 flex flex-wrap justify-between items-center border border-gray-100 gap-4">
                                  <div className="flex items-center gap-3">
                                      <div className="bg-white p-2 rounded-full shadow-sm">{order.paymentMethod === 'vodafone' ? <Wallet size={24} className="text-red-600"/> : <Banknote size={24} className="text-green-600"/>}</div>
                                      <div><p className="text-xs text-gray-500 font-bold mb-0.5">طريقة الدفع</p><p className="text-sm font-black text-gray-800">{order.paymentMethod === 'vodafone' ? 'فودافون كاش' : 'دفع عند الاستلام'}</p></div>
                                  </div>
                                  {order.paymentMethod === 'vodafone' ? (
                                      order.isPaid ? <span className="text-sm bg-green-100 text-green-700 px-4 py-2 rounded-xl font-bold flex items-center gap-2 border border-green-200"><CheckCircle size={16}/> تم استلام المبلغ</span> : <span className="text-sm bg-yellow-100 text-yellow-700 px-4 py-2 rounded-xl font-bold flex items-center gap-2 border border-yellow-200"><Clock size={16}/> جاري مراجعة التحويل</span>
                                  ) : (<span className="text-sm bg-gray-200 text-gray-600 px-4 py-2 rounded-xl font-bold border border-gray-300">الدفع نقداً للمندوب</span>)}
                              </div>

                              {/* Items */}
                              <div className="space-y-4">
                                {order.items.map((item, idx) => (
                                  <div key={idx} className="flex items-center gap-5 p-3 hover:bg-gray-50 rounded-2xl transition-colors group">
                                    <Link to={`/product/${item.id}`} className="w-20 h-20 bg-white rounded-xl overflow-hidden border border-gray-200 shadow-sm p-1 block flex-shrink-0"><img src={item.image} alt={item.name} className="w-full h-full object-contain mix-blend-multiply group-hover:scale-110 transition-transform duration-300" /></Link>
                                    <div>
                                        <Link to={`/product/${item.id}`}><p className="text-base font-bold text-gray-900 mb-1 hover:text-[#D4AF37] transition-colors">{item.name}</p></Link>
                                        <div className="flex gap-3 text-sm text-gray-500 font-medium"><span className="bg-gray-100 px-2 py-0.5 rounded text-xs text-gray-600">الكمية: {item.quantity}</span>{item.selectedColor && <span className="bg-gray-100 px-2 py-0.5 rounded text-xs text-gray-600">اللون: {item.selectedColor}</span>}</div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </motion.div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="text-center py-24 bg-white rounded-[2.5rem] border-2 border-dashed border-gray-200 flex flex-col items-center justify-center">
                        <div className="bg-gray-50 p-6 rounded-full mb-6"><Package size={64} className="text-gray-300" /></div>
                        <h3 className="font-bold text-gray-900 text-2xl mb-2">لا توجد طلبات حتى الآن</h3>
                        <p className="text-gray-500 mb-8 max-w-md mx-auto">لم تقم بإجراء أي طلبات بعد. تصفح متجرنا وابدأ التسوق!</p>
                        <button onClick={() => navigate('/shop')} className="px-10 py-4 bg-primary text-white rounded-2xl font-bold text-lg hover:bg-gray-800 transition-all shadow-xl hover:shadow-2xl transform hover:-translate-y-1">تسوق الآن</button>
                      </div>
                    )}
                  </div>
              )}

              {/* === TAB 2: العناوين === */}
              {activeTab === 'addresses' && (
                  <div>
                      <div className="flex justify-between items-center mb-8">
                          <h1 className="text-3xl font-black text-gray-900 flex items-center gap-3"><MapPin className="text-primary" size={32} /> عناويني</h1>
                          <button onClick={() => { setShowAddressForm(true); setEditingAddressId(null); setAddressForm({ name: '', phone: '', governorate: '', address: '', notes: '' }); }} className="bg-primary text-white px-6 py-3 rounded-xl font-bold hover:bg-gray-800 transition-all flex items-center gap-2 shadow-lg">
                              <Plus size={20} /> إضافة عنوان
                          </button>
                      </div>

                      <AnimatePresence>
                      {showAddressForm && (
                          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="mb-8 overflow-hidden">
                              <div className="bg-white p-8 rounded-[2rem] shadow-lg border border-primary/20">
                                  <h3 className="text-xl font-bold mb-6 flex items-center gap-2">{editingAddressId ? 'تعديل العنوان' : 'إضافة عنوان جديد'}</h3>
                                  <form onSubmit={handleAddressSubmit} className="space-y-4">
                                      <div className="grid md:grid-cols-2 gap-4">
                                          <input type="text" required placeholder="الاسم (مثال: المنزل، العمل)" value={addressForm.name} onChange={e => setAddressForm({...addressForm, name: e.target.value})} className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:border-primary outline-none" />
                                          <input type="tel" required placeholder="رقم الهاتف (01xxxxxxxxx)" value={addressForm.phone} onChange={e => {const val = e.target.value.replace(/\D/g, ''); if(val.length <= 11) setAddressForm({...addressForm, phone: val})}} className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:border-primary outline-none" />
                                      </div>
                                      <div className="grid md:grid-cols-2 gap-4">
                                          <select required value={addressForm.governorate} onChange={e => setAddressForm({...addressForm, governorate: e.target.value})} className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:border-primary outline-none bg-white">
                                              <option value="">اختر المحافظة</option>
                                              {governorates.map(gov => <option key={gov} value={gov}>{gov}</option>)}
                                          </select>
                                          <input type="text" required placeholder="العنوان بالتفصيل" value={addressForm.address} onChange={e => setAddressForm({...addressForm, address: e.target.value})} className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:border-primary outline-none" />
                                      </div>
                                      <textarea placeholder="ملاحظات إضافية (اختياري)" value={addressForm.notes} onChange={e => setAddressForm({...addressForm, notes: e.target.value})} className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:border-primary outline-none" rows="2"></textarea>
                                      
                                      <div className="flex gap-3 pt-2">
                                          <button type="submit" className="flex-1 bg-green-600 text-white py-3 rounded-xl font-bold hover:bg-green-700 transition-colors flex justify-center gap-2"><Save size={20}/> حفظ</button>
                                          <button type="button" onClick={() => setShowAddressForm(false)} className="px-6 bg-gray-100 text-gray-600 py-3 rounded-xl font-bold hover:bg-gray-200 transition-colors">إلغاء</button>
                                      </div>
                                  </form>
                              </div>
                          </motion.div>
                      )}
                      </AnimatePresence>

                      {addresses.length > 0 ? (
                          <div className="grid md:grid-cols-2 gap-4">
                              {addresses.map(addr => (
                                  <div key={addr.id} className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow relative group">
                                      <div className="absolute top-4 left-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                          <button onClick={() => startEditAddress(addr)} className="p-2 bg-blue-50 text-blue-600 rounded-full hover:bg-blue-100"><Edit size={16}/></button>
                                          <button onClick={() => handleDeleteAddress(addr.id)} className="p-2 bg-red-50 text-red-600 rounded-full hover:bg-red-100"><Trash2 size={16}/></button>
                                      </div>
                                      <div className="flex items-center gap-3 mb-3">
                                          <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-gray-600"><Home size={20}/></div>
                                          <div>
                                              <h4 className="font-bold text-gray-900">{addr.name}</h4>
                                              <p className="text-xs text-gray-500">{addr.governorate}</p>
                                          </div>
                                      </div>
                                      <div className="space-y-2 text-sm text-gray-600">
                                          <p className="flex items-center gap-2"><MapPin size={14} className="text-primary"/> {addr.address}</p>
                                          <p className="flex items-center gap-2"><Phone size={14} className="text-primary"/> {addr.phone}</p>
                                      </div>
                                  </div>
                              ))}
                          </div>
                      ) : (
                          <div className="text-center py-20 bg-white rounded-[2.5rem] border-2 border-dashed border-gray-200">
                              <MapPin size={48} className="mx-auto text-gray-300 mb-4" />
                              <h3 className="font-bold text-gray-900 text-lg">لا توجد عناوين محفوظة</h3>
                              <p className="text-gray-500 mb-6">أضف عنوانك الآن لتسهيل عملية الطلب القادمة.</p>
                          </div>
                      )}
                  </div>
              )}

          </div>
        </div>
      </div>
    </div>
  );
};
export default Profile;
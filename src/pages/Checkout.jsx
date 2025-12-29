import React, { useState, useEffect } from 'react';
import { useCart } from '../context/CartContext';
import { db, auth } from '../firebase';
import { collection, addDoc, query, where, getDocs, doc, updateDoc, increment, arrayUnion } from 'firebase/firestore'; 
import { useNavigate } from 'react-router-dom';
import { CheckCircle, MapPin, Phone, User, Truck, Mail, ShoppingBag, ShieldCheck, Loader, TicketPercent, Wallet, Banknote, Upload, Image as ImageIcon, DollarSign, Gift, Plus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactPixel from 'react-facebook-pixel';
import { onAuthStateChanged } from 'firebase/auth';

const Checkout = () => {
  const { cartItems, cartTotal, clearCart } = useCart();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [shippingCost, setShippingCost] = useState(0);
  const [currentUserId, setCurrentUserId] = useState(null);
  
  const [savedAddresses, setSavedAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState('new'); // 'new' or addressID

  const [paymentMethod, setPaymentMethod] = useState('cod');
  const [walletNumber, setWalletNumber] = useState(''); 
  const [transferredAmount, setTransferredAmount] = useState(''); 
  const [receiptImage, setReceiptImage] = useState(null); 
  const [receiptPreview, setReceiptPreview] = useState(null); 
  
  const [payShippingNow, setPayShippingNow] = useState(true);
  const ADMIN_WALLET_NUMBER = "01029315300";
  const CLOUD_NAME = "dahzcrxj9"; 
  const UPLOAD_PRESET = "cmgojjrr";

  // ... (Promo States) ...
  const [promoCode, setPromoCode] = useState('');
  const [discountAmount, setDiscountAmount] = useState(0);
  const [appliedPromo, setAppliedPromo] = useState(null); // اسم الكوبون للعرض
  const [appliedPromoId, setAppliedPromoId] = useState(null); 
  const [promoError, setPromoError] = useState('');
  const [promoSuccess, setPromoSuccess] = useState('');
  const [verifyingPromo, setVerifyingPromo] = useState(false);

  const VODAFONE_DISCOUNT = 50;

  const governorates = [
    { name: "القاهرة", price: 50 }, { name: "الجيزة", price: 50 }, { name: "الإسكندرية", price: 60 },
    { name: "الدقهلية", price: 75 }, { name: "الشرقية", price: 75 }, { name: "الغربية", price: 75 },
    { name: "أسيوط", price: 100 }, { name: "سوهاج", price: 100 }, { name: "قنا", price: 120 },
    { name: "أسوان", price: 150 }, { name: "محافظات أخرى", price: 85 }
  ];

  const [formData, setFormData] = useState({ name: '', phone: '', email: '', governorate: '', address: '', notes: '' });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
        if (user) {
            setCurrentUserId(user.uid);
            setFormData(prev => ({ ...prev, email: user.email }));

            try {
                const q = collection(db, "users", user.uid, "addresses");
                const snapshot = await getDocs(q);
                const addrs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                setSavedAddresses(addrs);
            } catch (err) { console.error("Error fetching addresses", err); }
        }
    });
    return () => unsubscribe();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    if (name === "governorate") {
      const selectedGov = governorates.find(g => g.name === value);
      setShippingCost(selectedGov ? selectedGov.price : 0);
    }
  };

  const handleAddressSelect = (addrId) => {
      setSelectedAddressId(addrId);
      if (addrId === 'new') {
          // تفريغ الفورم (ماعدا الايميل)
          setFormData(prev => ({ name: '', phone: '', email: prev.email, governorate: '', address: '', notes: '' }));
          setShippingCost(0);
      } else {
          const addr = savedAddresses.find(a => a.id === addrId);
          if (addr) {
              setFormData(prev => ({ ...prev, name: addr.name, phone: addr.phone, governorate: addr.governorate, address: addr.address, notes: addr.notes || '' }));
              // حساب الشحن
              const selectedGov = governorates.find(g => g.name === addr.governorate);
              setShippingCost(selectedGov ? selectedGov.price : 0);
          }
      }
  };

  const uploadReceiptImage = async (file) => {
    const formData = new FormData(); formData.append("file", file); formData.append("upload_preset", UPLOAD_PRESET);
    const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, { method: "POST", body: formData });
    const data = await res.json(); return data.secure_url;
  };
  
  const handleImageChange = (e) => { if (e.target.files[0]) { setReceiptImage(e.target.files[0]); setReceiptPreview(URL.createObjectURL(e.target.files[0])); } };

  const handleApplyPromo = async () => {
    if (!promoCode) return;
    setVerifyingPromo(true);
    setPromoError('');
    setPromoSuccess('');
    
    try {
        const q = query(collection(db, "promo_codes"), where("code", "==", promoCode.toUpperCase()));
        const snapshot = await getDocs(q);
        
        if (snapshot.empty) {
            setPromoError('الكود غير صحيح');
            setVerifyingPromo(false);
            return;
        }

        const promoData = snapshot.docs[0].data();
        const promoDocId = snapshot.docs[0].id;

        // 1. التحقق من تاريخ الانتهاء
        if (promoData.expiryDate) {
            const now = new Date();
            const expiry = promoData.expiryDate.toDate ? promoData.expiryDate.toDate() : new Date(promoData.expiryDate);
            if (now > expiry) {
                setPromoError('عذراً، لقد انتهت صلاحية هذا الكوبون');
                setVerifyingPromo(false);
                return;
            }
        }

        // 2. التحقق من حد الاستخدام
        if (promoData.usageLimit > 0 && (promoData.usageCount || 0) >= promoData.usageLimit) {
            setPromoError('عذراً، لقد وصل هذا الكوبون للحد الأقصى من الاستخدام');
            setVerifyingPromo(false);
            return;
        }

        // حساب الخصم
        let discount = 0;
        if (promoData.type === 'percent') {
            discount = (cartTotal * promoData.value) / 100;
        } else {
            discount = promoData.value;
        }
        
        // التأكد ان الخصم لا يتعدى المجموع
        if (discount > cartTotal) discount = cartTotal;

        setDiscountAmount(discount);
        setAppliedPromo(promoData.code);
        setAppliedPromoId(promoDocId); 
        setPromoSuccess(`تم تطبيق خصم ${discount} ج.م`);

    } catch (err) {
        console.error(err);
        setPromoError('حدث خطأ أثناء التحقق');
    } finally {
        setVerifyingPromo(false);
    }
  };

  const paymentDiscount = paymentMethod === 'vodafone' ? VODAFONE_DISCOUNT : 0;
  const fullOrderTotal = Math.max(0, cartTotal + shippingCost - discountAmount - paymentDiscount);
  const amountToTransferNow = payShippingNow ? fullOrderTotal : Math.max(0, fullOrderTotal - shippingCost);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (cartItems.length === 0) return;

    const phoneRegex = /^01[0-9]{9}$/;
    if (!phoneRegex.test(formData.phone)) {
        alert("خطأ: رقم الهاتف يجب أن يكون 11 رقماً ويبدأ بـ 01");
        return; 
    }

    if (shippingCost === 0) { alert("يرجى اختيار المحافظة لحساب الشحن"); return; }

    if (paymentMethod === 'vodafone') {
        if (!phoneRegex.test(walletNumber)) { alert("خطأ: رقم المحفظة غير صحيح"); return; }
        if (!receiptImage) { alert("يرجى إرفاق صورة التحويل"); return; }
    }

    setLoading(true);
    try {
      let receiptUrl = null;
      if (paymentMethod === 'vodafone' && receiptImage) receiptUrl = await uploadReceiptImage(receiptImage);
      if (selectedAddressId === 'new' && currentUserId) {
          const saveChoice = window.confirm("هل تريد حفظ هذا العنوان لاستخدامه مستقبلاً؟");
          if (saveChoice) {
              await addDoc(collection(db, "users", currentUserId, "addresses"), {
                  name: formData.name, phone: formData.phone, governorate: formData.governorate, address: formData.address, notes: formData.notes
              });
          }
      }

      const newOrderRef = await addDoc(collection(db, "orders"), {
        userId: currentUserId,
        customer: formData,
        items: cartItems,
        subtotal: cartTotal,
        shippingCost: shippingCost,
        discountAmount: discountAmount,
        paymentDiscount: paymentDiscount, 
        promoCode: appliedPromo,
        total: fullOrderTotal,
        paymentMethod: paymentMethod,
        walletNumber: paymentMethod === 'vodafone' ? walletNumber : null,
        transferredAmount: paymentMethod === 'vodafone' ? amountToTransferNow : null,
        shippingStatus: (paymentMethod === 'vodafone' && !payShippingNow) ? 'unpaid' : 'paid',
        receiptImageUrl: receiptUrl,
        status: 'pending',
        isPaid: false,
        createdAt: new Date()
      });

      if (appliedPromoId) {
        try {
            const promoRef = doc(db, "promo_codes", appliedPromoId);
            await updateDoc(promoRef, {
                usageCount: increment(1), // زيادة العداد
                usageHistory: arrayUnion({ // تسجيل العملية
                    userId: currentUserId || 'guest',
                    customerName: formData.name,
                    orderId: newOrderRef.id,
                    discountAmount: discountAmount,
                    date: new Date()
                })
            });
            console.log("Promo usage updated");
        } catch (promoErr) {
            console.error("Failed to update promo usage:", promoErr);
            // لا نوقف العملية لأن الطلب تم بالفعل
        }
      }

      ReactPixel.track('Purchase', {
        value: fullOrderTotal, // القيمة الإجمالية للطلب
        currency: 'EGP',
        content_ids: cartItems.map(item => item.id), // مصفوفة IDs المنتجات
        content_type: 'product',
        num_items: cartItems.length, // عدد المنتجات
        order_id: newOrderRef.id // معرف الطلب (لعدم التكرار)
      });
      setSuccess(true);
      clearCart();
      setTimeout(() => navigate('/profile'), 3000);
    } catch (error) { console.error(error); } finally { setLoading(false); }
  };

  if (success) { return (<div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 text-center p-4">
    <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mb-6">
        <CheckCircle className="text-green-600 w-12 h-12" />
    </div>
    <h2 className="text-3xl font-black text-gray-900 mb-2">تم الطلب بنجاح!</h2>
    <p className="text-gray-500 mb-8">شكراً لثقتك بنا، سيتم التواصل معك قريباً لتأكيد الطلب.</p>
    <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 max-w-sm w-full">
        <p className="text-sm text-gray-500">جاري تحويلك لصفحة طلباتك...</p>
        <div className="w-full bg-gray-100 h-2 rounded-full mt-3 overflow-hidden">
            <motion.div initial={{ width: 0 }} animate={{ width: '100%' }} transition={{ duration: 3 }} className="h-full bg-primary" />
        </div>
    </div>
  </div>); }

  return (
    <div className="min-h-screen bg-[#f9fafb] pt-28 pb-20 font-sans" dir="rtl">
      <div className="container mx-auto px-4 md:px-6">
        <h1 className="text-3xl font-black text-gray-900 mb-8 flex items-center gap-3"><Truck className="text-accent" size={32} /> إتمام الشراء</h1>

        <div className="grid lg:grid-cols-3 gap-8">
          
          <div className="lg:col-span-2">
                        {savedAddresses.length > 0 && (
                <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 mb-6">
                    <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2"><MapPin size={20} className="text-primary"/> اختر عنوان التوصيل</h3>
                    <div className="grid md:grid-cols-2 gap-3">
                        {savedAddresses.map(addr => (
                            <div 
                                key={addr.id} 
                                onClick={() => handleAddressSelect(addr.id)}
                                className={`cursor-pointer p-4 rounded-xl border-2 transition-all relative ${selectedAddressId === addr.id ? 'border-primary bg-primary/5' : 'border-gray-100 hover:border-gray-200'}`}
                            >
                                {selectedAddressId === addr.id && <div className="absolute top-3 left-3 text-primary"><CheckCircle size={20}/></div>}
                                <h4 className="font-bold text-gray-900">{addr.name}</h4>
                                <p className="text-sm text-gray-500 mb-1">{addr.phone}</p>
                                <p className="text-xs text-gray-400 line-clamp-1">{addr.governorate}, {addr.address}</p>
                            </div>
                        ))}
                        {/* خيار عنوان جديد */}
                        <div 
                            onClick={() => handleAddressSelect('new')}
                            className={`cursor-pointer p-4 rounded-xl border-2 border-dashed flex flex-col items-center justify-center gap-2 transition-all ${selectedAddressId === 'new' ? 'border-primary bg-primary/5 text-primary' : 'border-gray-300 text-gray-400 hover:border-gray-400'}`}
                        >
                            <Plus size={24} />
                            <span className="font-bold text-sm">استخدام عنوان جديد</span>
                        </div>
                    </div>
                </div>
            )}

            <div className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-gray-100 mb-6">
                <h3 className="text-xl font-bold text-gray-800 mb-6 border-b border-gray-100 pb-4">بيانات التوصيل</h3>
                                <form id="checkout-form" onSubmit={handleSubmit} className="space-y-5">
                    <div className="grid md:grid-cols-2 gap-5">
                        <div>
                            <label className="block text-gray-700 font-bold mb-2 text-sm">الاسم بالكامل</label>
                            <div className="relative"><User className="absolute top-3.5 right-4 text-gray-400" size={18} /><input type="text" name="name" required className="w-full pr-12 pl-4 py-3 border border-gray-200 rounded-xl focus:border-accent focus:ring-2 focus:ring-accent/10 outline-none transition-all" value={formData.name} onChange={handleChange} placeholder="الاسم ثلاثي" readOnly={selectedAddressId !== 'new'} /></div>
                        </div>
                        <div>
                            <label className="block text-gray-700 font-bold mb-2 text-sm">رقم الهاتف</label>
                            <div className="relative">
                                <Phone className="absolute top-3.5 right-4 text-gray-400" size={18} />
                                <input type="tel" name="phone" required className="w-full pr-12 pl-4 py-3 border border-gray-200 rounded-xl focus:border-accent focus:ring-2 focus:ring-accent/10 outline-none transition-all" value={formData.phone} onChange={(e) => {const val = e.target.value.replace(/\D/g, ''); if (val.length <= 11) setFormData({...formData, phone: val});}} placeholder="01xxxxxxxxx" readOnly={selectedAddressId !== 'new'} />
                            </div>
                        </div>
                    </div>
                    
                    <div className="grid md:grid-cols-2 gap-5">
                        <div><label className="block text-gray-700 font-bold mb-2 text-sm">البريد الإلكتروني</label><div className="relative"><Mail className="absolute top-3.5 right-4 text-gray-400" size={18} /><input type="email" name="email" readOnly className="w-full pr-12 pl-4 py-3 border border-gray-200 rounded-xl bg-gray-50 text-gray-500 cursor-not-allowed" value={formData.email} /></div></div>
                        <div>
                            <label className="block text-gray-700 font-bold mb-2 text-sm">المحافظة</label>
                            <div className="relative"><Truck className="absolute top-3.5 right-4 text-gray-400" size={18} />
                            {selectedAddressId === 'new' ? (
                                <select name="governorate" required className="w-full pr-12 pl-4 py-3 border border-gray-200 rounded-xl focus:border-accent focus:ring-2 focus:ring-accent/10 outline-none appearance-none bg-white cursor-pointer" value={formData.governorate} onChange={handleChange}><option value="">اختر المحافظة...</option>{governorates.map((g) => <option key={g.name} value={g.name}>{g.name} (+{g.price}ج)</option>)}</select>
                            ) : (
                                <input type="text" readOnly className="w-full pr-12 pl-4 py-3 border border-gray-200 rounded-xl bg-gray-50 text-gray-700 font-bold" value={formData.governorate} />
                            )}
                            </div>
                        </div>
                    </div>

                    <div>
                        <label className="block text-gray-700 font-bold mb-2 text-sm">العنوان بالتفصيل</label>
                        <div className="relative"><MapPin className="absolute top-3.5 right-4 text-gray-400" size={18} /><input type="text" name="address" required className="w-full pr-12 pl-4 py-3 border border-gray-200 rounded-xl focus:border-accent focus:ring-2 focus:ring-accent/10 outline-none transition-all" value={formData.address} onChange={handleChange} placeholder="المنطقة، الشارع، رقم العقار" readOnly={selectedAddressId !== 'new'} /></div>
                    </div>
                    
                    <div className="mt-6">
                        <h3 className="text-lg font-bold text-gray-800 mb-4 border-b border-gray-100 pb-2">طريقة الدفع</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <label className={`relative flex items-center p-4 border rounded-xl cursor-pointer transition-all ${paymentMethod === 'cod' ? 'border-accent bg-accent/5 ring-1 ring-accent' : 'border-gray-200 hover:border-gray-300'}`}>
                                <input type="radio" name="paymentMethod" value="cod" checked={paymentMethod === 'cod'} onChange={() => setPaymentMethod('cod')} className="hidden" />
                                <div className="flex items-center gap-3 w-full">
                                    <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${paymentMethod === 'cod' ? 'border-accent' : 'border-gray-400'}`}>{paymentMethod === 'cod' && <div className="w-2.5 h-2.5 rounded-full bg-accent"></div>}</div>
                                    <div className="flex items-center gap-2 text-gray-700 font-bold"><Banknote size={20} className="text-green-600" /><span>دفع عند الاستلام</span></div>
                                </div>
                            </label>

                            <label className={`relative flex items-center p-4 border rounded-xl cursor-pointer transition-all ${paymentMethod === 'vodafone' ? 'border-red-500 bg-red-50 ring-1 ring-red-500' : 'border-gray-200 hover:border-gray-300'}`}>
                                <div className="absolute -top-4 left-3 bg-red-600 text-white text-xs md:text-sm font-bold px-3 py-1 rounded-full shadow-sm flex items-center gap-1 animate-pulse z-10">
                                    <Gift size={14} /> خصم {VODAFONE_DISCOUNT}ج
                                </div>
                                <input type="radio" name="paymentMethod" value="vodafone" checked={paymentMethod === 'vodafone'} onChange={() => setPaymentMethod('vodafone')} className="hidden" />
                                <div className="flex items-center gap-3 w-full">
                                    <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${paymentMethod === 'vodafone' ? 'border-red-500' : 'border-gray-400'}`}>{paymentMethod === 'vodafone' && <div className="w-2.5 h-2.5 rounded-full bg-red-500"></div>}</div>
                                    <div className="flex items-center gap-2 text-gray-700 font-bold"><Wallet size={20} className="text-red-600" /><span>فودافون كاش</span></div>
                                </div>
                            </label>
                        </div>

                        {paymentMethod === 'vodafone' && (
                            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="mt-4 p-5 bg-red-50 rounded-2xl border border-red-100">
                                <div className="mb-6 text-center bg-white p-4 rounded-xl border border-red-100 shadow-sm">
                                    <p className="text-sm text-gray-700 mb-2 font-medium">يرجى تحويل المبلغ إلى الرقم التالي:</p>
                                    <div className="text-3xl font-black text-red-600 tracking-wider mb-2" dir="ltr">{ADMIN_WALLET_NUMBER}</div>
                                    
                                    <div className="mt-4 flex flex-col items-center justify-center gap-2 p-3 bg-red-50 rounded-lg border border-red-100">
                                        <div className="flex items-center gap-3">
                                            <span className={`text-sm font-bold ${!payShippingNow ? 'text-gray-900' : 'text-gray-400'}`}>الدفع عند الاستلام</span>
                                            <button 
                                                type="button" 
                                                onClick={() => setPayShippingNow(!payShippingNow)} 
                                                className="relative w-12 h-6 bg-gray-300 rounded-full transition-colors duration-300 focus:outline-none"
                                                style={{ backgroundColor: payShippingNow ? '#dc2626' : '#d1d5db' }}
                                            >
                                                <div className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-300 ${payShippingNow ? 'translate-x-6' : 'translate-x-0'}`}></div>
                                            </button>
                                            <span className={`text-sm font-bold ${payShippingNow ? 'text-red-600' : 'text-gray-400'}`}>دفع الشحن الآن</span>
                                        </div>
                                        <p className="text-[10px] text-gray-500">{payShippingNow ? "سيتم دفع مصاريف الشحن مع التحويل" : "ستدفع مصاريف الشحن للمندوب عند الاستلام"}</p>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-gray-700 font-bold mb-2 text-sm">المبلغ الذي يجب تحويله</label>
                                        <div className="relative">
                                            <DollarSign className="absolute top-3.5 right-4 text-gray-400" size={18} />
                                            <input type="text" readOnly className="w-full pr-12 pl-4 py-3 border border-red-200 rounded-xl focus:border-red-500 bg-gray-100 font-black text-gray-700 cursor-not-allowed" value={`${amountToTransferNow} ج.م`} />
                                        </div>
                                        <p className="text-xs text-green-600 mt-1 font-bold">✓ المبلغ شامل الخصم {payShippingNow ? "ومصاريف الشحن" : "(بدون مصاريف الشحن)"}</p>
                                    </div>
                                    <div>
                                        <label className="block text-gray-700 font-bold mb-2 text-sm">رقم المحفظة المحول منها</label>
                                        <div className="relative"><Phone className="absolute top-3.5 right-4 text-gray-400" size={18} /><input type="tel" required className="w-full pr-12 pl-4 py-3 border border-red-200 rounded-xl focus:border-red-500 focus:ring-2 focus:ring-red-500/10 outline-none bg-white font-bold" value={walletNumber} onChange={(e) => {const val = e.target.value.replace(/\D/g, ''); if (val.length <= 11) setWalletNumber(val);}} placeholder="رقم فودافون كاش الخاص بك" /></div>
                                    </div>
                                    <div>
                                        <label className="block text-gray-700 font-bold mb-2 text-sm">صورة التحويل (سكرين شوت)</label>
                                        <div className="border-2 border-dashed border-red-300 rounded-xl p-6 text-center cursor-pointer hover:bg-red-50 transition-colors bg-white relative group">
                                            <input type="file" accept="image/*" required onChange={handleImageChange} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"/>
                                            <div className="flex flex-col items-center justify-center text-gray-400 group-hover:text-red-500"><Upload size={32} className="mb-2" /><span className="text-xs font-bold">اضغط لرفع صورة التحويل</span></div>
                                        </div>
                                        {receiptPreview && (<div className="mt-3 relative w-full h-32 rounded-xl overflow-hidden border border-gray-200"><img src={receiptPreview} alt="Receipt Preview" className="w-full h-full object-contain bg-gray-50" /></div>)}
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </div>

                </form>
            </div>
          </div>

          <div className="lg:col-span-1">
             <div className="bg-white p-6 rounded-3xl shadow-lg border border-gray-100 sticky top-28">
              <h3 className="text-xl font-bold text-gray-800 mb-6">ملخص الطلب</h3>
              
              <div className="space-y-4 mb-6 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                {cartItems.map((item) => (
                    <div key={item.cartId} className="flex justify-between items-center text-sm border-b border-gray-50 pb-3 last:border-0">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-gray-50 overflow-hidden"><img src={item.image} className="w-full h-full object-cover" /></div>
                            <div><p className="font-bold text-gray-800 line-clamp-1">{item.name}</p><p className="text-gray-500 text-xs">x{item.quantity} {item.selectedColor && `| ${item.selectedColor}`}</p></div>
                        </div>
                        <span className="font-bold text-gray-900">{item.price * item.quantity} ج.م</span>
                    </div>
                ))}
              </div>

              {/* Coupon Input */}
              <div className="mb-6">
                <label className="text-xs font-bold text-gray-500 mb-2 block">هل لديك كود خصم؟</label>
                <div className="flex gap-2">
                    <div className="relative flex-1"><TicketPercent size={18} className="absolute top-3.5 right-3 text-gray-400" /><input type="text" value={promoCode} onChange={(e) => setPromoCode(e.target.value)} disabled={appliedPromo} placeholder="اكتب الكود هنا" className={`w-full pr-10 pl-3 py-3 border rounded-xl outline-none text-sm font-bold uppercase ${appliedPromo ? 'bg-green-50 border-green-200 text-green-700' : 'bg-gray-50 border-gray-200 focus:border-accent'}`}/></div>
                    {appliedPromo ? (<button onClick={() => {setAppliedPromo(null); setAppliedPromoId(null); setDiscountAmount(0); setPromoCode(''); setPromoSuccess('');}} className="px-4 bg-red-100 text-red-600 rounded-xl font-bold text-sm hover:bg-red-200">حذف</button>) : (<button onClick={handleApplyPromo} disabled={verifyingPromo || !promoCode} className="px-4 bg-gray-800 text-white rounded-xl font-bold text-sm hover:bg-gray-900 disabled:opacity-50">{verifyingPromo ? <Loader size={16} className="animate-spin" /> : 'تطبيق'}</button>)}
                </div>
                {promoError && <p className="text-red-500 text-xs mt-2 font-bold">{promoError}</p>}
                {promoSuccess && <p className="text-green-600 text-xs mt-2 font-bold flex items-center gap-1"><CheckCircle size={12}/> {promoSuccess}</p>}
              </div>

              <div className="border-t border-dashed border-gray-200 pt-4 space-y-3">
                <div className="flex justify-between text-gray-500 text-sm"><span>المجموع الفرعي</span><span>{cartTotal} ج.م</span></div>
                <div className="flex justify-between text-gray-500 text-sm items-center"><span>الشحن</span>{shippingCost > 0 ? <span className="text-gray-900 font-bold">{shippingCost} ج.م</span> : <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded">اختر المحافظة</span>}</div>
                
                {discountAmount > 0 && (<div className="flex justify-between text-green-600 text-sm font-bold"><span>خصم ({appliedPromo})</span><span>-{discountAmount} ج.م</span></div>)}

                {paymentMethod === 'vodafone' && (
                    <div className="flex justify-between text-red-600 text-sm font-bold bg-red-50 p-2 rounded-lg border border-red-100">
                        <span className="flex items-center gap-1"><Gift size={14}/> خصم فودافون كاش</span>
                        <span>-{VODAFONE_DISCOUNT} ج.م</span>
                    </div>
                )}

                <div className="border-t border-gray-100 pt-4 flex justify-between text-xl font-black text-primary">
                    <span>الإجمالي</span>
                    <span>{fullOrderTotal} ج.م</span>
                </div>
                {paymentMethod === 'vodafone' && !payShippingNow && (
                    <p className="text-xs text-orange-600 text-center font-bold">* سيتم دفع {shippingCost} ج.م عند الاستلام (مصاريف الشحن)</p>
                )}
              </div>

              <button form="checkout-form" type="submit" disabled={loading} className="w-full bg-primary text-white py-4 rounded-xl font-bold text-lg hover:bg-gray-800 transition-all shadow-lg hover:shadow-xl mt-6 flex items-center justify-center gap-2">
                {loading ? <Loader className="animate-spin" /> : 'تأكيد الطلب الآن'}
              </button>
              
              <div className="mt-4 flex items-center justify-center gap-2 text-xs text-gray-400 font-medium"><ShieldCheck size={14} /> جميع البيانات مشفرة وآمنة</div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Checkout;
import React, { useState, useEffect } from 'react';
import { db, auth } from '../firebase';
import { collection, addDoc, query, where, orderBy, doc, serverTimestamp, getDoc, onSnapshot, getDocs } from 'firebase/firestore';
import { Star, Send, Lock, MessageSquare, AlertCircle, CheckCircle, Camera, X, Image as ImageIcon } from 'lucide-react'; // ✅ إضافة أيقونات جديدة
import { onAuthStateChanged } from 'firebase/auth';
import { Link } from 'react-router-dom';

const Reviews = ({ productId }) => {
  const [reviews, setReviews] = useState([]);
  const [user, setUser] = useState(null);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [hoveredStar, setHoveredStar] = useState(0);

  // ✅ 1. حالات الصورة الجديدة
  const [reviewImage, setReviewImage] = useState(null); // ملف الصورة
  const [imagePreview, setImagePreview] = useState(''); // رابط المعاينة

  // إعدادات Cloudinary (نفس المستخدمة في الأدمن)
  const CLOUD_NAME = "dahzcrxj9"; 
  const UPLOAD_PRESET = "cmgojjrr";

  // حالات التحقق
  const [canReview, setCanReview] = useState(false);
  const [reviewMessage, setReviewMessage] = useState('جاري التحقق...');

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser && productId) await checkReviewEligibility(currentUser, productId);
      else { setCanReview(false); setReviewMessage('يجب تسجيل الدخول للتقييم.'); }
    });

    if (productId) {
      const q = query(
        collection(db, "reviews"),
        where("productId", "==", String(productId)),
        where("status", "==", "approved"), 
        orderBy("createdAt", "desc")
      );

      const unsubscribeReviews = onSnapshot(q, (snapshot) => {
        const reviewsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setReviews(reviewsData);
      }, (error) => {
        console.error("🔥🔥 خطأ في جلب التقييمات:", error);
      });

      return () => { unsubscribeAuth(); unsubscribeReviews(); };
    }
  }, [productId]);

  const checkReviewEligibility = async (currentUser, prodId) => {
    setCanReview(false);
    try {
      const userDocRef = doc(db, "users", currentUser.uid);
      const userDocSnap = await getDoc(userDocRef);
      if (userDocSnap.exists() && userDocSnap.data().role === 'admin') { setCanReview(true); return; }

      const existingReviewQuery = query(collection(db, "reviews"), where("productId", "==", String(prodId)), where("userId", "==", currentUser.uid));
      const existingReviewSnap = await getDocs(existingReviewQuery);
      if (!existingReviewSnap.empty) { setReviewMessage('لقد قمت بتقييم هذا المنتج مسبقاً.'); return; }

      const ordersQuery = query(collection(db, "orders"), where("userId", "==", currentUser.uid));
      const ordersSnap = await getDocs(ordersQuery);
      let foundPurchase = false;
      ordersSnap.forEach((doc) => {
        const order = doc.data();
        if (['shipped', 'delivered', 'on_delivery'].includes(order.status)) {
          if (order.items.some(item => String(item.id) === String(prodId))) foundPurchase = true;
        }
      });

      if (foundPurchase) setCanReview(true);
      else setReviewMessage('يمكنك التقييم فقط بعد شراء المنتج واستلامه.');

    } catch (error) { console.error(error); setReviewMessage('حدث خطأ أثناء التحقق.'); }
  };

  // ✅ 2. دالة رفع الصورة
  const uploadImage = async (file) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", UPLOAD_PRESET);
    const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, { method: "POST", body: formData });
    const data = await res.json();
    return data.secure_url;
  };

  // ✅ 3. معالجة اختيار الصورة
  const handleImageChange = (e) => {
    if (e.target.files[0]) {
      setReviewImage(e.target.files[0]);
      setImagePreview(URL.createObjectURL(e.target.files[0]));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (rating === 0) return alert("يرجى اختيار عدد النجوم");
    setLoading(true);

    try {
      // ✅ 4. رفع الصورة إذا وجدت
      let finalImageUrl = "";
      if (reviewImage) {
        finalImageUrl = await uploadImage(reviewImage);
      }

      await addDoc(collection(db, "reviews"), {
        productId: String(productId),
        userId: user.uid,
        userName: user.displayName || "عميل",
        userEmail: user.email,
        rating: Number(rating),
        comment,
        image: finalImageUrl, // ✅ حفظ رابط الصورة
        status: "pending", 
        createdAt: serverTimestamp()
      });

      setComment('');
      setRating(0);
      setReviewImage(null); // تصفير الصورة
      setImagePreview('');
      setCanReview(false);
      setReviewMessage('شكراً لتقييمك! سيظهر التقييم بعد مراجعة الإدارة.');
      alert("تم إرسال التقييم للمراجعة.");

    } catch (error) {
      console.error("Error adding review:", error);
      alert("حدث خطأ أثناء الإرسال");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-12 bg-white rounded-3xl p-6 md:p-10 border border-gray-100 shadow-sm">
      <h3 className="text-2xl font-black text-gray-900 mb-8 flex items-center gap-2">
        <Star className="text-yellow-400 fill-yellow-400" /> تقييمات العملاء ({reviews.length})
      </h3>

      <div className="mb-10 bg-gray-50 p-6 rounded-2xl border border-gray-100">
        {!user && (
          <div className="text-center py-6 flex flex-col items-center gap-2">
            <Lock className="text-gray-400" size={32} />
            <p className="text-gray-500">يجب عليك تسجيل الدخول لإضافة تقييم</p>
            <Link to="/login" className="text-primary font-bold hover:underline">سجل دخول الآن</Link>
          </div>
        )}

        {user && canReview && (
          <form onSubmit={handleSubmit}>
            <h4 className="font-bold text-gray-800 mb-4">أضف تقييمك</h4>
            <div className="flex gap-2 mb-4">
              {[1, 2, 3, 4, 5].map((star) => (
                <button type="button" key={star} onClick={() => setRating(star)} onMouseEnter={() => setHoveredStar(star)} onMouseLeave={() => setHoveredStar(0)} className="transition-transform hover:scale-110">
                  <Star size={28} className={`${(hoveredStar || rating) >= star ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'} transition-colors`} />
                </button>
              ))}
            </div>
            
            <div className="relative">
              <textarea className="w-full p-4 pl-12 border border-gray-200 rounded-xl focus:border-primary outline-none min-h-[100px]" placeholder="اكتب رأيك في المنتج هنا..." value={comment} onChange={(e) => setComment(e.target.value)} required />
              
              {/* ✅ 5. أزرار التحكم (إرسال + رفع صورة) */}
              <div className="absolute bottom-4 left-4 flex gap-2">
                 <input type="file" id="review-img-upload" accept="image/*" className="hidden" onChange={handleImageChange} />
                 <label htmlFor="review-img-upload" className="bg-gray-100 text-gray-600 p-2 rounded-lg hover:bg-gray-200 transition-colors cursor-pointer" title="أضف صورة">
                    <Camera size={18} />
                 </label>
                 <button type="submit" disabled={loading} className="bg-primary text-white p-2 rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50">
                    <Send size={18} className="rtl:rotate-180" />
                 </button>
              </div>
            </div>

            {/* ✅ 6. معاينة الصورة */}
            {imagePreview && (
                <div className="mt-3 relative w-24 h-24 rounded-xl overflow-hidden border border-gray-200 group">
                    <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                    <button type="button" onClick={() => { setReviewImage(null); setImagePreview(''); }} className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <X size={12} />
                    </button>
                </div>
            )}
          </form>
        )}

        {user && !canReview && (
          <div className="text-center py-6 flex flex-col items-center gap-2 text-gray-500">
             {reviewMessage.includes('شكراً') ? (
                 <div className="text-green-600 font-bold flex items-center gap-2"><CheckCircle /> {reviewMessage}</div>
             ) : (
                 <><AlertCircle className="text-gray-400" size={32} /><p>{reviewMessage}</p></>
             )}
          </div>
        )}
      </div>

      <div className="space-y-6">
        {reviews.length === 0 ? (
          <div className="text-center py-8 text-gray-400 flex flex-col items-center"><MessageSquare size={40} className="mb-2 opacity-20"/><p>لا توجد تقييمات منشورة بعد.</p></div>
        ) : (
          reviews.map((rev) => (
            <div key={rev.id} className="border-b border-gray-100 last:border-0 pb-6 last:pb-0">
              <div className="flex justify-between items-start mb-2">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-gray-500 font-bold text-lg">{rev.userName ? rev.userName.charAt(0).toUpperCase() : 'U'}</div>
                  <div>
                    <p className="font-bold text-gray-900 text-sm">{rev.userName}</p>
                    <div className="flex gap-0.5">{[...Array(5)].map((_, i) => (<Star key={i} size={12} className={i < rev.rating ? "text-yellow-400 fill-yellow-400" : "text-gray-200"} />))}</div>
                  </div>
                </div>
                <span className="text-xs text-gray-400">{rev.createdAt?.toDate ? rev.createdAt.toDate().toLocaleDateString('ar-EG') : 'الآن'}</span>
              </div>
              <p className="text-gray-600 text-sm leading-relaxed pr-4">{rev.comment}</p>
              
              {/* ✅ 7. عرض صورة الريفيو */}
              {rev.image && (
                  <div className="mt-3 mr-4 w-32 h-32 rounded-xl overflow-hidden border border-gray-100 cursor-pointer" onClick={() => window.open(rev.image, '_blank')}>
                      <img src={rev.image} alt="User Review" className="w-full h-full object-cover hover:scale-105 transition-transform" />
                  </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Reviews;
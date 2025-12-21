import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Phone, Facebook, Send, CheckCircle, Loader, Mail } from 'lucide-react';
import { db } from '../firebase';
import { collection, addDoc } from 'firebase/firestore';

const Contact = () => {
  // --- States ---
  const [formData, setFormData] = useState({
    name: '',
    phone: '', // تم التغيير من email إلى phone
    message: ''
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  // تحديث البيانات
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // إرسال الرسالة
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.phone || !formData.message) return;

    setLoading(true);
    try {
      // حفظ الرسالة في Firestore
      await addDoc(collection(db, "contact_messages"), {
        ...formData,
        createdAt: new Date(),
        read: false // حالة الرسالة (غير مقروءة)
      });

      setSuccess(true);
      setFormData({ name: '', phone: '', message: '' }); 
      
      setTimeout(() => setSuccess(false), 4000);

    } catch (error) {
      console.error("Error sending message:", error);
      alert("حدث خطأ أثناء الإرسال، حاول مرة أخرى.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pt-24 pb-12 relative overflow-hidden" dir="rtl">
      
      <div className="absolute top-0 left-0 w-full h-96 bg-primary skew-y-2 transform origin-top-right -z-10 shadow-2xl"></div>
      <div className="absolute top-20 left-20 w-64 h-64 bg-accent/10 rounded-full blur-3xl -z-10"></div>

      <div className="container mx-auto px-6 max-w-6xl relative z-10">
        
        <div className="text-center">
  <motion.h1 
    initial={{ y: -20, opacity: 0 }}
    animate={{ y: 0, opacity: 1 }}
    className="text-4xl md:text-6xl font-extrabold mb-6 text-gray-900" 
  >
    تواصل مع <span className="text-primary">بيت العيلة</span>
  </motion.h1>
  
  <p className="text-lg md:text-xl text-gray-600 max-w-2xl mx-auto font-medium leading-relaxed">
    لديك استفسار أو شكوى؟ اترك رسالتك ورقم هاتفك وسنتواصل معك في أسرع وقت.
  </p>
</div>
        <div className="grid lg:grid-cols-3 gap-8">
          
          {/* --- كروت المعلومات --- */}
          <div className="lg:col-span-1 space-y-6">
            
            <motion.a 
              href="https://www.facebook.com/BeitEL3ilaa/" 
              target="_blank"
              rel="noopener noreferrer"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="block bg-white p-6 rounded-3xl shadow-lg border border-gray-100 hover:shadow-xl transition-all hover:-translate-y-1 group"
            >
              <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 mb-4 shadow-sm group-hover:bg-blue-600 group-hover:text-white transition-colors">
                <Facebook size={28} />
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-1">صفحتنا على فيسبوك</h3>
              <p className="text-gray-500 text-sm mb-3">تابع أحدث العروض والمنتجات</p>
              <span className="text-lg font-bold text-primary group-hover:text-accent transition-colors flex items-center gap-2">
                Beit EL3ilaa <ArrowIcon />
              </span>
            </motion.a>

            <motion.a 
              href="mailto:Xoemekk1@gmail.com"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="block bg-white p-6 rounded-3xl shadow-lg border border-gray-100 hover:shadow-xl transition-all hover:-translate-y-1 group"
            >
              <div className="w-14 h-14 bg-orange-50 rounded-2xl flex items-center justify-center text-orange-600 mb-4 shadow-sm group-hover:bg-orange-600 group-hover:text-white transition-colors">
                <Mail size={28} />
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-1">البريد الإلكتروني</h3>
              <p className="text-gray-500 text-sm mb-3">للشكاوى والاقتراحات</p>
              <span className="text-lg font-bold text-primary group-hover:text-accent transition-colors block break-all font-mono">
                Xoemekk1@gmail.com
              </span>
            </motion.a>

          </div>

          {/* --- نموذج الرسالة --- */}
          <div className="lg:col-span-2">
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white p-8 md:p-12 rounded-[2.5rem] shadow-2xl border border-gray-100 h-full relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-40 h-40 bg-accent/5 rounded-bl-full -mr-10 -mt-10"></div>
              
              <h2 className="text-3xl font-bold text-primary mb-2 relative z-10">أرسل لنا رسالة</h2>
              <p className="text-gray-500 mb-8 relative z-10">
                املأ النموذج وسيقوم فريق الدعم بالتواصل معك .
              </p>

              {success ? (
                <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-green-50 text-green-700 p-6 rounded-2xl border border-green-200 text-center py-12">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4"><CheckCircle size={32} /></div>
                  <h3 className="text-xl font-bold mb-2">تم الإرسال بنجاح!</h3>
                  <p>شكراً لتواصلك معنا، سنرد عليك قريباً.</p>
                </motion.div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-700">الاسم بالكامل</label>
                    <input 
                      type="text" 
                      name="name"
                      required
                      placeholder="اسمك هنا" 
                      className="w-full p-4 bg-gray-50 border-2 border-gray-100 rounded-xl focus:outline-none focus:border-accent focus:bg-white transition-all"
                      value={formData.name}
                      onChange={handleChange}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-700">رقم الهاتف (للتواصل)</label>
                    <input 
                      type="tel" 
                      name="phone"
                      required
                      placeholder="01xxxxxxxxx" 
                      className="w-full p-4 bg-gray-50 border-2 border-gray-100 rounded-xl focus:outline-none focus:border-accent focus:bg-white transition-all"
                      value={formData.phone}
                      onChange={handleChange}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-700">نص الرسالة</label>
                    <textarea 
                      name="message"
                      rows="5" 
                      required
                      placeholder="اكتب استفسارك هنا بالتفصيل..." 
                      className="w-full p-4 bg-gray-50 border-2 border-gray-100 rounded-xl focus:outline-none focus:border-accent focus:bg-white transition-all resize-none"
                      value={formData.message}
                      onChange={handleChange}
                    ></textarea>
                  </div>

                  <button 
                    type="submit" 
                    disabled={loading}
                    className="w-full bg-primary text-white py-4 rounded-xl font-bold text-xl hover:bg-gray-800 transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-3 group active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed"
                  >
                    {loading ? <><Loader className="animate-spin" size={22} /> جاري الإرسال</> : <>إرسال الرسالة <Send size={22} className="group-hover:-translate-x-1 transition-transform" /></>}
                  </button>
                </form>
              )}
            </motion.div>
          </div>

        </div>
      </div>
    </div>
  );
};

const ArrowIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="transform rotate-180"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 5 12 12 19"></polyline></svg>
);

export default Contact;
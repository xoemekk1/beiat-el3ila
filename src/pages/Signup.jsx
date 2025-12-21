import React, { useState } from 'react';
import { auth, db } from '../firebase';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { Link, useNavigate } from 'react-router-dom';
import { User, Mail, Lock, Phone, ArrowRight, Loader, AlertCircle } from 'lucide-react';

const Signup = () => {
  const [formData, setFormData] = useState({ name: '', email: '', phone: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // 🧠 قوائم الأسماء لتحديد النوع تلقائياً
  const maleNames = ["محمد", "أحمد", "محمود", "علي", "عمر", "حسن", "حسين", "خالد", "يوسف", "ابراهيم", "عبدالله", "عبدالرحمن", "مصطفى", "كريم", "طارق", "زياد", "عمرو", "هشام", "وائل", "ياسر", "سامح", "شريف", "ماجد", "رامي", "تامر", "ايهاب", "وليد", "سيد", "اسلام", "mohamed", "ahmed", "mahmoud", "ali", "omar", "hassan", "khaled", "youssef", "ibrahim", "mostafa", "kareem", "tarek", "ziad", "amr", "hisham", "wael", "yasser", "sherif", "maged", "ramy", "tamer", "walid", "sayed", "islam"];
  const femaleNames = ["فاطمة", "مريم", "اية", "اسراء", "سارة", "هاجر", "نور", "سلمى", "منى", "نادية", "هبة", "رنا", "مي", "نهى", "دينا", "ياسمين", "فريدة", "جنى", "ملك", "حبيبة", "منة", "امل", "اميرة", "ندى", "رضوى", "شيماء", "علياء", "سلوى", "هدى", "fatma", "maryam", "aya", "esraa", "sara", "hagar", "nour", "salma", "mona", "nadia", "heba", "rana", "mai", "noha", "dina", "yasmin", "farida", "jana", "malak", "habiba", "menna", "amal", "amira", "nada", "radwa", "shaimaa"];

  const detectGender = (fullName) => {
    if (!fullName) return 'unknown';
    const firstName = fullName.split(' ')[0].toLowerCase().trim();
    if (maleNames.includes(firstName)) return 'male';
    if (femaleNames.includes(firstName)) return 'female';
    return 'unknown';
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // ✅ تحكم خاص برقم الهاتف (أرقام فقط - حد أقصى 11)
    if (name === 'phone') {
        const numericValue = value.replace(/\D/g, ''); // مسح أي حروف
        if (numericValue.length <= 11) {
            setFormData({ ...formData, [name]: numericValue });
        }
    } else {
        setFormData({ ...formData, [name]: value });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // ✅ التحقق من صحة رقم الهاتف (لازم يبدأ بـ 01 ويكون 11 رقم)
    if (!formData.phone.startsWith("01") || formData.phone.length !== 11) {
        setError("رقم الهاتف يجب أن يكون 11 رقماً ويبدأ بـ 01");
        return;
    }

    if (formData.password.length < 6) {
        setError("كلمة المرور يجب أن تكون 6 أحرف على الأقل");
        return;
    }

    setLoading(true);
    try {
      // 1. إنشاء الحساب في Authentication
      const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
      const user = userCredential.user;

      // 2. تحديث اسم المستخدم في Auth
      await updateProfile(user, { displayName: formData.name });

      // 3. تحديد النوع تلقائياً
      const gender = detectGender(formData.name);

      // 4. حفظ بيانات المستخدم الإضافية (الهاتف + النوع) في Firestore
      await setDoc(doc(db, "users", user.uid), {
        name: formData.name,
        email: formData.email,
        phone: formData.phone, // حفظنا الرقم الصحيح
        gender: gender,        // حفظنا النوع
        createdAt: new Date()
      });

      navigate('/'); // تحويل للصفحة الرئيسية
    } catch (err) {
      if (err.code === 'auth/email-already-in-use') setError('البريد الإلكتروني مسجل بالفعل');
      else setError('حدث خطأ في التسجيل. حاول مرة أخرى.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 font-sans" dir="rtl">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-xl p-8 border border-gray-100">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-black text-gray-900 mb-2">إنشاء حساب جديد</h2>
          <p className="text-gray-500">انضم لعائلة بيت العيلة واستمتع بالعروض</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-xl flex items-center gap-3 text-red-600 text-sm font-bold">
            <AlertCircle size={20} /> {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">الاسم بالكامل</label>
            <div className="relative">
              <User className="absolute top-3.5 right-4 text-gray-400" size={20} />
              <input 
                type="text" 
                name="name" 
                required 
                className="w-full pr-12 pl-4 py-3 border border-gray-200 rounded-xl focus:border-accent focus:ring-2 focus:ring-accent/10 outline-none transition-all" 
                placeholder="الاسم الثنائي" 
                value={formData.name} 
                onChange={handleChange} 
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">رقم الهاتف</label>
            <div className="relative">
              <Phone className="absolute top-3.5 right-4 text-gray-400" size={20} />
              <input 
                type="tel" 
                name="phone" 
                required 
                className="w-full pr-12 pl-4 py-3 border border-gray-200 rounded-xl focus:border-accent focus:ring-2 focus:ring-accent/10 outline-none transition-all" 
                placeholder="01xxxxxxxxx" 
                value={formData.phone} 
                onChange={handleChange} 
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">البريد الإلكتروني</label>
            <div className="relative">
              <Mail className="absolute top-3.5 right-4 text-gray-400" size={20} />
              <input 
                type="email" 
                name="email" 
                required 
                className="w-full pr-12 pl-4 py-3 border border-gray-200 rounded-xl focus:border-accent focus:ring-2 focus:ring-accent/10 outline-none transition-all" 
                placeholder="example@mail.com" 
                value={formData.email} 
                onChange={handleChange} 
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">كلمة المرور</label>
            <div className="relative">
              <Lock className="absolute top-3.5 right-4 text-gray-400" size={20} />
              <input 
                type="password" 
                name="password" 
                required 
                className="w-full pr-12 pl-4 py-3 border border-gray-200 rounded-xl focus:border-accent focus:ring-2 focus:ring-accent/10 outline-none transition-all" 
                placeholder="******" 
                value={formData.password} 
                onChange={handleChange} 
              />
            </div>
          </div>

          <button 
            type="submit" 
            disabled={loading} 
            className="w-full bg-primary text-white py-4 rounded-xl font-bold text-lg hover:bg-gray-800 transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2 mt-4"
          >
            {loading ? <Loader className="animate-spin" /> : 'تسجيل حساب جديد'}
          </button>
        </form>

        <div className="mt-8 text-center border-t border-gray-100 pt-6">
          <p className="text-gray-500 font-medium">
            لديك حساب بالفعل؟ 
            <Link to="/login" className="text-primary font-bold hover:underline mr-1 inline-flex items-center gap-1">
              سجل دخول <ArrowRight size={16} className="rtl:rotate-180" />
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Signup;
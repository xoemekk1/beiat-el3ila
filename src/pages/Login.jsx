import React, { useState } from 'react';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile, sendEmailVerification, signOut } from 'firebase/auth';
import { auth, db } from '../firebase';
import { doc, setDoc, getDoc } from 'firebase/firestore'; 
import { useNavigate, useLocation } from 'react-router-dom';
import { Lock, Mail, User, Phone, Loader, CheckCircle, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';

const Login = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');

  const navigate = useNavigate();
  const location = useLocation();

  const maleNames = ["محمد", "أحمد", "محمود", "علي", "عمر", "حسن", "حسين", "خالد", "يوسف", "ابراهيم", "عبدالله", "عبدالرحمن", "مصطفى", "كريم", "طارق", "زياد", "عمرو", "هشام", "وائل", "ياسر", "سامح", "شريف", "ماجد", "رامي", "تامر", "ايهاب", "وليد", "سيد", "اسلام", "mohamed", "ahmed", "mahmoud", "ali", "omar", "hassan", "khaled", "youssef", "ibrahim", "mostafa", "kareem", "tarek", "ziad", "amr", "hisham", "wael", "yasser", "sherif", "maged", "ramy", "tamer", "walid", "sayed", "islam"];
  const femaleNames = ["مريم", "فاطمة", "اية", "اسراء", "سارة", "هاجر", "نور", "سلمى", "منى", "نادية", "هبة", "رنا", "مي", "نهى", "دينا", "ياسمين", "فريدة", "جنى", "ملك", "حبيبة", "منة", "امل", "اميرة", "ندى", "رضوى", "شيماء", "علياء", "سلوى", "هدى", "mariam", "maryam", "fatma", "aya", "esraa", "sara", "hagar", "nour", "salma", "mona", "nadia", "heba", "rana", "mai", "noha", "dina", "yasmin", "farida", "jana", "malak", "habiba", "menna", "amal", "amira", "nada", "radwa", "shaimaa"];

  const detectGender = (fullName) => {
    if (!fullName) return 'unknown';
    const firstName = fullName.split(' ')[0].toLowerCase().trim();
    if (maleNames.includes(firstName)) return 'male';
    if (femaleNames.includes(firstName)) return 'female';
    return 'unknown';
  };

  const handleAuth = async (e) => {
    e.preventDefault(); 
    setLoading(true); 
    setError(''); 
    setSuccessMsg('');

    try {
      if (isLogin) {
        // ------------------ تسجيل الدخول ------------------
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        // ✅ 1. جلب بيانات المستخدم للتحقق من الحظر والرتبة
        const userDocRef = doc(db, "users", user.uid);
        const userDocSnap = await getDoc(userDocRef);
        
        if (userDocSnap.exists()) {
            const userData = userDocSnap.data();

            // ⛔ التحقق من الحظر (Ban Check)
            if (userData.isBanned === true) {
                await signOut(auth); // طرد المستخدم فوراً
                setError("⛔ تم حظر حسابك. يرجى المحاولة لاحقاً أو التواصل مع خدمة العملاء.");
                setLoading(false);
                return; // إيقاف الدالة
            }

            // ✅ التحقق من التفعيل (لو مش أدمن)
            if (userData.role !== 'admin' && !user.emailVerified) {
                await signOut(auth);
                setError("يرجى تفعيل حسابك أولاً. تفقد البريد الوارد أو الرسائل المزعجة (Spam).");
                setLoading(false);
                return;
            }
        }

        // لو كله تمام (مش محظور ومفعل أو أدمن) -> يدخل
        navigate(location.state?.from?.pathname || "/");

      } else {
        // ------------------ إنشاء حساب جديد ------------------
        if (!phone.startsWith("01") || phone.length !== 11) {
            setError("رقم الهاتف يجب أن يكون 11 رقماً ويبدأ بـ 01");
            setLoading(false); return;
        }
        if (password.length < 8) {
            setError("كلمة المرور يجب أن تكون 8 أحرف على الأقل");
            setLoading(false); return;
        }

        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        await updateProfile(user, { displayName: name });
        const gender = detectGender(name);
        
        // حفظ البيانات مع حقول إضافية (isBanned: false افتراضياً)
        await setDoc(doc(db, "users", user.uid), { 
            name, 
            email, 
            phone, 
            gender, 
            role: 'customer', 
            isBanned: false, // ✅ الحساب الجديد غير محظور افتراضياً
            createdAt: new Date() 
        });

        await sendEmailVerification(user);
        await signOut(auth);

        setSuccessMsg("تم إنشاء الحساب! تم إرسال رابط التفعيل. يرجى مراجعة الـ Inbox أو الـ Spam.");
        
        setIsLogin(true);
        setEmail(''); setPassword(''); setName(''); setPhone('');
      }
    } catch (err) {
      console.error(err);
      if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') setError('البريد الإلكتروني أو كلمة المرور غير صحيحة');
      else if (err.code === 'auth/email-already-in-use') setError('البريد الإلكتروني مستخدم بالفعل');
      else if (err.code === 'auth/weak-password') setError('كلمة المرور ضعيفة');
      else setError('حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى.');
    } finally { 
      setLoading(false); 
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4 font-sans" dir="rtl">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white w-full max-w-4xl rounded-[2.5rem] shadow-2xl overflow-hidden grid md:grid-cols-2 min-h-[600px]">
        
        <div className="hidden md:flex flex-col justify-center p-12 bg-gray-900 text-white relative overflow-hidden">
          <div className="absolute inset-0 bg-accent/10 z-0"></div>
          <img src="https://images.unsplash.com/photo-1441986300917-64674bd600d8?q=80&w=1000" className="absolute inset-0 w-full h-full object-cover opacity-30" alt="background" />
          <div className="relative z-10">
            <h1 className="text-5xl font-black mb-6">Beit ElEila</h1>
            <p className="text-gray-300 text-lg leading-relaxed">وجهتك الأولى للأناقة والجودة. سجل دخولك الآن واستمتع بتجربة تسوق فريدة وعروض حصرية.</p>
          </div>
        </div>

        <div className="p-8 md:p-16 flex flex-col justify-center">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">{isLogin ? 'مرحباً بعودتك' : 'إنشاء حساب جديد'}</h2>
            <p className="text-gray-500">{isLogin ? 'سجل دخولك للمتابعة' : 'أدخل بياناتك للانضمام إلينا'}</p>
          </div>

          {successMsg && (
            <div className="bg-green-50 text-green-700 p-4 rounded-xl mb-6 text-sm font-bold border border-green-100 text-center flex flex-col items-center gap-2">
                <CheckCircle size={24} />
                {successMsg}
            </div>
          )}

          {error && (
            <div className="bg-red-50 text-red-600 p-4 rounded-xl mb-6 text-sm font-bold border border-red-100 text-center flex items-center justify-center gap-2">
                <AlertCircle size={20} className="shrink-0"/>
                <span>{error}</span>
            </div>
          )}

          {!successMsg && (
            <form onSubmit={handleAuth} className="space-y-4">
                {!isLogin && (
                <>
                    <div className="relative"><User className="absolute top-3.5 right-4 text-gray-400" size={20}/><input type="text" required className="w-full bg-gray-50 border border-gray-200 rounded-xl px-12 py-3 focus:border-accent outline-none transition-all" placeholder="الاسم" value={name} onChange={(e) => setName(e.target.value)} /></div>
                    <div className="relative"><Phone className="absolute top-3.5 right-4 text-gray-400" size={20}/><input type="tel" required className="w-full bg-gray-50 border border-gray-200 rounded-xl px-12 py-3 focus:border-accent outline-none transition-all" placeholder="الهاتف" value={phone} onChange={(e) => {const val = e.target.value.replace(/\D/g, ''); if (val.length <= 11) setPhone(val);}} /></div>
                </>
                )}
                <div className="relative"><Mail className="absolute top-3.5 right-4 text-gray-400" size={20}/><input type="email" required className="w-full bg-gray-50 border border-gray-200 rounded-xl px-12 py-3 focus:border-accent outline-none transition-all" placeholder="البريد الإلكتروني" value={email} onChange={(e) => setEmail(e.target.value)} /></div>
                <div className="relative"><Lock className="absolute top-3.5 right-4 text-gray-400" size={20}/><input type="password" required className="w-full bg-gray-50 border border-gray-200 rounded-xl px-12 py-3 focus:border-accent outline-none transition-all" placeholder={isLogin ? "كلمة المرور" : "كلمة المرور (8 أحرف على الأقل)"} value={password} onChange={(e) => setPassword(e.target.value)} /></div>

                <button type="submit" disabled={loading} className="w-full bg-primary text-white font-bold py-3.5 rounded-xl hover:bg-gray-800 transition-all shadow-lg mt-4 flex items-center justify-center gap-2">
                {loading ? <Loader className="animate-spin" /> : (isLogin ? 'تسجيل الدخول' : 'إنشاء الحساب')}
                </button>
            </form>
          )}

          <div className="mt-8 text-center">
            <button onClick={() => {setIsLogin(!isLogin); setError(''); setSuccessMsg('');}} className="text-accent font-bold hover:underline text-sm transition-colors">
              {isLogin ? 'ليس لديك حساب؟ سجل الآن' : 'لديك حساب بالفعل؟ دخول'}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Login;
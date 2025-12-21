import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, Users, Award, TrendingUp } from 'lucide-react';

const About = () => {
  return (
    <div className="min-h-screen bg-gray-50 pt-24 pb-12" dir="rtl">
      <div className="container mx-auto px-6 max-w-5xl">
        
        {/* Hero Section */}
        <div className="text-center mb-16">
          <motion.h1 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-5xl font-extrabold text-primary mb-6"
          >
            من نحن؟ <span className="text-accent">بيت العيلة</span>
          </motion.h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            لسنا مجرد متجر إلكتروني، بل نحن شريكك في اختيار الأفضل. في "بيت العيلة"، نجمع بين جودة المنتجات العالمية وروح العائلة المصرية التي تهتم بالتفاصيل.
          </p>
        </div>

        {/* Story Section */}
        <div className="bg-white p-8 md:p-12 rounded-3xl shadow-sm border border-gray-100 mb-12 flex flex-col md:flex-row items-center gap-10">
          <div className="flex-1">
            <h2 className="text-3xl font-bold text-primary mb-4">قصتنا ورؤيتنا</h2>
            <p className="text-gray-600 mb-4 leading-loose">
              بدأت رحلة "بيت العيلة" بهدف بسيط: توفير منتجات عصرية بجودة عالية وأسعار تنافسية، دون التنازل عن معايير الخدمة الممتازة.
            </p>
            <p className="text-gray-600 leading-loose">
              نؤمن أن التسوق يجب أن يكون تجربة مريحة وآمنة. لذلك، نقوم بانتقاء كل منتج بعناية فائقة، ونتأكد من مطابقته للمواصفات قبل أن يصل إليك. هدفنا ليس مجرد بيع منتج، بل كسب ثقة عميل ينضم لعائلتنا الكبيرة.
            </p>
          </div>
          <div className="flex-1 w-full">
<img 
  src="/images/Photo.png" // 👈 المسار بالنسبة للمجلد العام
  alt="فريق بيت العيلة"
  className="rounded-2xl shadow-lg w-full h-64 object-cover"
/>
          </div>
        </div>

        {/* Why Us? */}
        <div className="grid md:grid-cols-3 gap-6">
          {[
            { icon: <Award size={32} />, title: "جودة مضمونة", desc: "منتجات أصلية ومفحوصة بعناية لضمان أفضل تجربة استخدام." },
            { icon: <Users size={32} />, title: "عميلنا أولاً", desc: "فريق دعم فني متاح لخدمتك والإجابة على استفساراتك في أي وقت." },
            { icon: <TrendingUp size={32} />, title: "تطور مستمر", desc: "نواكب أحدث الصيحات لنوفر لك كل ما هو جديد وحصري." }
          ].map((item, idx) => (
            <div key={idx} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 text-center hover:-translate-y-1 transition-transform">
              <div className="w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center text-accent mx-auto mb-4">
                {item.icon}
              </div>
              <h3 className="text-xl font-bold text-primary mb-2">{item.title}</h3>
              <p className="text-gray-500 text-sm">{item.desc}</p>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
};

export default About;
import React from 'react';
import { Lock } from 'lucide-react';

const Policy = () => {
  return (
    <div className="min-h-screen bg-gray-50 pt-24 pb-12" dir="rtl">
      <div className="container mx-auto px-6 max-w-4xl">
        
        <div className="bg-white p-8 md:p-12 rounded-3xl shadow-sm border border-gray-100">
          <div className="flex items-center gap-3 mb-8 border-b border-gray-100 pb-6">
            <Lock size={32} className="text-accent" />
            <h1 className="text-3xl font-extrabold text-primary">سياسة الخصوصية</h1>
          </div>

          <div className="space-y-6 text-gray-700 leading-relaxed">
            <p>في "بيت العيلة"، ندرك أهمية خصوصية بياناتك. توضح هذه السياسة كيف نجمع ونستخدم ونحمي معلوماتك الشخصية.</p>

            <h3 className="text-lg font-bold text-primary">1. البيانات التي نجمعها</h3>
            <p>نقوم بجمع المعلومات التي تقدمها لنا عند التسجيل أو الشراء، مثل: الاسم، رقم الهاتف، العنوان، والبريد الإلكتروني. الهدف هو توصيل طلباتك والتواصل معك بشأنها.</p>

            <h3 className="text-lg font-bold text-primary">2. كيف نستخدم بياناتك؟</h3>
            <ul className="list-disc list-inside text-sm md:text-base">
              <li>لإتمام عمليات الشراء وتوصيل المنتجات.</li>
              <li>لإرسال تحديثات حول حالة طلبك.</li>
              <li>لتحسين تجربة استخدامك للموقع.</li>
              <li>لن نشارك بياناتك مع أي طرف ثالث لأغراض تسويقية دون موافقتك.</li>
            </ul>

            <h3 className="text-lg font-bold text-primary">3. أمان المعلومات</h3>
            <p>نتخذ كافة التدابير الأمنية اللازمة لحماية بياناتك من الوصول غير المصرح به. نستخدم تقنيات تشفير ومزودات خدمة آمنة (مثل Firebase) لضمان سلامة معلوماتك.</p>

            <h3 className="text-lg font-bold text-primary">4. ملفات تعريف الارتباط (Cookies)</h3>
            <p>نستخدم الكوكيز لتحسين تجربة التصفح وتذكر تفضيلاتك (مثل المنتجات في السلة). يمكنك تعطيل الكوكيز من إعدادات متصفحك، لكن قد يؤثر ذلك على بعض وظائف الموقع.</p>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Policy;
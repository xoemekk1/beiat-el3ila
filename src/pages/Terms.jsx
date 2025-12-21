import React from 'react';
import { ShieldAlert, FileText } from 'lucide-react';

const Terms = () => {
  return (
    <div className="min-h-screen bg-gray-50 pt-24 pb-12" dir="rtl">
      <div className="container mx-auto px-6 max-w-4xl">
        
        <div className="bg-white p-8 md:p-12 rounded-3xl shadow-sm border border-gray-100">
          <div className="flex items-center gap-3 mb-8 border-b border-gray-100 pb-6">
            <FileText size={32} className="text-accent" />
            <h1 className="text-3xl font-extrabold text-primary">الشروط والأحكام</h1>
          </div>

          <div className="space-y-8 text-gray-700 leading-relaxed">
            
            <section>
              <h2 className="text-xl font-bold text-primary mb-3">1. مقدمة</h2>
              <p>مرحباً بك في "بيت العيلة". استخدامك للموقع وطلب المنتجات يعني موافقتك الكاملة على هذه الشروط. نحتفظ بالحق في تعديل هذه الشروط في أي وقت دون إشعار مسبق.</p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-primary mb-3">2. سياسة الطلب والتسعير</h2>
              <ul className="list-disc list-inside space-y-2 text-sm md:text-base">
                <li>نحرص على دقة الأسعار، ولكن في حال وجود خطأ تسعيري واضح، نحتفظ بالحق في إلغاء الطلب وإبلاغ العميل.</li>
                <li>يتم تأكيد الطلب بعد مراجعة توافر المنتج في المخزون.</li>
                <li>يحق للموقع إلغاء أي طلب في حال الشك في جدية المشتري أو وجود تلاعب.</li>
              </ul>
            </section>

            <section className="bg-red-50 p-6 rounded-xl border border-red-100">
              <h2 className="text-xl font-bold text-red-700 mb-3 flex items-center gap-2">
                <ShieldAlert size={20} /> 3. سياسة الاستبدال والاسترجاع (هام جداً)
              </h2>
              <ul className="list-disc list-inside space-y-3 text-sm md:text-base text-red-800 font-medium">
                <li>يحق للعميل استرجاع المنتج خلال <strong>2 يوماً</strong> من الاستلام في حالة وجود <strong>عيب صناعة</strong> فقط.</li>
                <li>في حالة "تغيير الرأي" أو عدم الحاجة للمنتج، يمكن الاسترجاع خلال 1 يوماً بشرط أن يكون المنتج <strong>بحالته الأصلية تماماً (مغلق ولم يفتح)</strong>، وفي هذه الحالة <strong>يتحمل العميل مصاريف الشحن (ذهاباً وعودة)</strong>.</li>
                <li>لا يتم استرجاع المنتجات الشخصية، العطور المفتوحة، أو الملابس التي تم استخدامها أو غسلها، حفاظاً على الصحة العامة.</li>
                <li>يتم استرداد المبلغ المدفوع بعد وصول المنتج لمخازنا وفحصه للتأكد من حالته.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-primary mb-3">4. الشحن والتوصيل</h2>
              <p>نقوم بالشحن لجميع محافظات مصر. مدة التوصيل تتراوح بين 2 إلى 5 أيام عمل حسب المحافظة. أي تأخير من شركة الشحن خارج عن إرادتنا، ولكننا نتابع الشحنة حتى تصلك.</p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-primary mb-3">5. حقوق الملكية الفكرية</h2>
              <p>جميع محتويات الموقع من صور، نصوص، وتصاميم هي ملك حصري لـ "بيت العيلة" ولا يجوز نسخها أو استخدامها لأغراض تجارية دون إذن.</p>
            </section>

          </div>
        </div>

      </div>
    </div>
  );
};

export default Terms;
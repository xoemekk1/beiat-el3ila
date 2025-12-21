/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      // ✅ تعريف الألوان الرسمية للموقع (عشان نستخدمها بأسماء ثابتة)
      colors: {
        primary: '#1a1a1a',   // الأسود الأساسي (للنصوص والعناوين)
        secondary: '#4b5563', // الرمادي (للنصوص الفرعية)
        accent: '#D4AF37',    // الذهبي (للأزرار واللمسات الجمالية)
        'accent-dark': '#b5952f', // ذهبي غامق (للـ Hover)
        'light-bg': '#FDFDFD', // خلفية فاتحة جداً
      },
      fontFamily: {
        sans: ['Almarai', 'sans-serif'], // تعيين خط المراعي كخط افتراضي
      },
      // ❌ تم حذف قسم fontSize المخصص لكي نعود للمقاسات القياسية المتناسقة
    },
  },
  plugins: [],
}
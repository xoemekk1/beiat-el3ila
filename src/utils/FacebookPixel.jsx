import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import ReactPixel from 'react-facebook-pixel';

const FacebookPixel = () => {
  const location = useLocation();

  useEffect(() => {
    // 1. تفعيل البيكسل برقمك أنت
    ReactPixel.init('1365543407994787', { // 👈 ده الرقم بتاعك
      autoConfig: true,
      debug: false,
    });
    
    // 2. تسجيل أول زيارة
    ReactPixel.pageView();
  }, []);

  // 3. مراقبة تغيير الصفحات (عشان يسجل كل صفحة جديدة العميل يروحها)
  useEffect(() => {
    ReactPixel.pageView();
  }, [location]);

  return null; // المكون ده مش بيعرض حاجة، هو شغال في الخلفية بس
};

export default FacebookPixel;
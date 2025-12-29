import React, { useEffect, useState } from 'react';
import { db } from '../firebase';
import { collection, query, where, getDocs, limit, orderBy } from 'firebase/firestore';
import { Star, Quote, Image as ImageIcon } from 'lucide-react';
import { motion } from 'framer-motion';

const TestimonialsSection = () => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const siteReviewsSnap = await getDocs(query(collection(db, "site_reviews"), orderBy("createdAt", "desc")));
        const siteReviews = siteReviewsSnap.docs.map(doc => ({ id: doc.id, ...doc.data(), isManual: true }));
        const productReviewsSnap = await getDocs(query(collection(db, "reviews"), where("rating", "==", 5), limit(10)));
        const productReviews = productReviewsSnap.docs.map(doc => ({ id: doc.id, ...doc.data(), isManual: false }));
        const combined = [...siteReviews, ...productReviews].sort(() => 0.5 - Math.random());
        setReviews(combined);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) return null;
  if (reviews.length === 0) return null;

  return (
    <section className="py-24 bg-gray-50 overflow-hidden relative" dir="rtl">
      <div className="absolute top-0 left-0 w-full h-full opacity-30 pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>

      <div className="container mx-auto px-6 relative z-10">
        <div className="text-center mb-16">
          <span className="text-[#D4AF37] font-bold tracking-widest uppercase text-sm bg-[#D4AF37]/10 px-4 py-2 rounded-full">قالوا عنا</span>
          <h2 className="text-4xl md:text-5xl font-black text-gray-900 mt-4 leading-tight">تجارب عملاء <span className="text-[#D4AF37]">بيت العيلة</span></h2>
          <p className="text-gray-500 mt-4 max-w-2xl mx-auto">ثقتكم هي سر نجاحنا. إليكم بعض مما قاله عملاؤنا المميزون.</p>
        </div>
        <div className="columns-1 md:columns-2 lg:columns-3 gap-6 space-y-6">
          {reviews.map((rev, index) => (
            <motion.div 
              key={rev.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1, duration: 0.5 }}
              viewport={{ once: true }}
              className="break-inside-avoid bg-white rounded-3xl p-6 shadow-sm border border-gray-100 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 flex flex-col"
            >
              <div className="flex items-center justify-between mb-4 border-b border-gray-50 pb-4">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-lg font-black text-gray-400">
                        {rev.name ? rev.name.charAt(0) : 'U'}
                    </div>
                    <div>
                        <h4 className="font-bold text-gray-900 text-sm">{rev.name || "عميل مميز"}</h4>
                        <div className="flex text-yellow-400 text-[10px]">
                            {[...Array(Number(rev.rating) || 5)].map((_, i) => <Star key={i} size={12} fill="currentColor" />)}
                        </div>
                    </div>
                </div>
                {/* Badge Source */}
                {rev.isManual ? (
                    <span className="bg-blue-50 text-blue-600 text-[10px] px-2 py-1 rounded-full font-bold flex items-center gap-1">فيسبوك/واتس</span>
                ) : (
                    <span className="bg-green-50 text-green-600 text-[10px] px-2 py-1 rounded-full font-bold flex items-center gap-1"><Check size={10}/> شراء مؤكد</span>
                )}
              </div>

              {/* Image (Screenshot) */}
              {rev.image && (
                <div className="mb-4 rounded-xl overflow-hidden border border-gray-100 cursor-pointer group" onClick={() => window.open(rev.image, '_blank')}>
                    <div className="relative">
                        <img src={rev.image} alt="Feedback" className="w-full h-auto object-cover group-hover:scale-105 transition-transform duration-500" />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                            <ImageIcon className="text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-md" size={32}/>
                        </div>
                    </div>
                </div>
              )}

              {/* Text */}
              {(rev.text || rev.comment) && (
                  <p className="text-gray-600 text-sm leading-relaxed relative font-medium">
                      <Quote size={24} className="absolute -top-3 -right-1 text-gray-100 fill-gray-100 -z-10 opacity-50"/>
                      {rev.text || rev.comment}
                  </p>
              )}
              
              {/* Product Link (if from product review) */}
              {!rev.isManual && rev.productName && (
                  <div className="mt-4 pt-3 border-t border-gray-50 flex justify-between items-center text-xs text-gray-400">
                      <span>منتج: {rev.productName}</span>
                  </div>
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TestimonialsSection;
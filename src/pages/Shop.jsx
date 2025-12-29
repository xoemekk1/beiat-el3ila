import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import ProductCard from '../components/ProductCard';
import { Filter, X, Search, ChevronDown } from 'lucide-react';
import { useLocation } from 'react-router-dom'; 
const Shop = () => {
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // States للفلاتر
  const [selectedCategory, setSelectedCategory] = useState('الكل');
  const [priceRange, setPriceRange] = useState(10000);
  const [searchQuery, setSearchQuery] = useState('');
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const location = useLocation();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const productsSnap = await getDocs(query(collection(db, "products"), orderBy("createdAt", "desc")));
        const productsData = productsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setProducts(productsData);
        setFilteredProducts(productsData);

        const catsSnap = await getDocs(collection(db, "categories"));
        setCategories(catsSnap.docs.map(doc => doc.data().name));

        const params = new URLSearchParams(location.search);
        const categoryFromUrl = params.get('category');
        
        if (categoryFromUrl) {
            setSelectedCategory(categoryFromUrl);
        }

      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [location.search]);
  useEffect(() => {
    let result = products;

    // 1. فلتر التصنيف
    if (selectedCategory !== 'الكل') {
      result = result.filter(p => p.category === selectedCategory);
    }

    // 2. فلتر السعر
    result = result.filter(p => Number(p.price) <= priceRange);

    // 3. فلتر البحث
    if (searchQuery) {
      result = result.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()));
    }

    setFilteredProducts(result);
  }, [selectedCategory, priceRange, searchQuery, products]);

  if (loading) return <div className="h-screen flex items-center justify-center"><div className="w-16 h-16 border-t-4 border-r-4 border-[#D4AF37] rounded-full animate-spin"></div></div>;

  return (
    <div className="min-h-screen bg-[#FDFDFD] pt-28 pb-10 font-sans" dir="rtl">
      <div className="container mx-auto px-4">
        
        {/* Header & Mobile Filter Button */}
        <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-black text-gray-900">المتجر <span className="text-gray-400 text-lg font-medium">({filteredProducts.length} منتج)</span></h1>
            <button onClick={() => setIsFilterOpen(true)} className="lg:hidden flex items-center gap-2 bg-white border border-gray-200 px-4 py-2 rounded-xl text-sm font-bold shadow-sm">
                <Filter size={18} /> تصفية
            </button>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
            
            {/* ================= Sidebar Filters ================= */}
            <aside className={`fixed inset-y-0 right-0 z-50 w-80 bg-white shadow-2xl transform transition-transform duration-300 ease-in-out lg:relative lg:transform-none lg:shadow-none lg:w-1/4 lg:block lg:bg-transparent ${isFilterOpen ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'}`}>
                <div className="p-6 h-full overflow-y-auto lg:p-0 lg:overflow-visible">
                    
                    {/* Close Button (Mobile) */}
                    <div className="flex justify-between items-center mb-6 lg:hidden">
                        <h2 className="text-xl font-bold">تصفية المنتجات</h2>
                        <button onClick={() => setIsFilterOpen(false)}><X /></button>
                    </div>

                    {/* Search */}
                    <div className="relative mb-8">
                        <Search className="absolute top-3.5 right-3 text-gray-400" size={18} />
                        <input 
                            type="text" 
                            placeholder="بحث عن منتج..." 
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-white border border-gray-200 rounded-xl py-3 pr-10 pl-4 focus:outline-none focus:border-[#D4AF37] transition-colors"
                        />
                    </div>

                    {/* Categories */}
                    <div className="mb-8">
                        <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">الأقسام <ChevronDown size={16}/></h3>
                        <div className="space-y-2">
                            <button 
                                onClick={() => setSelectedCategory('الكل')}
                                className={`w-full text-right px-4 py-2 rounded-lg text-sm font-medium transition-all ${selectedCategory === 'الكل' ? 'bg-[#D4AF37] text-white shadow-md' : 'text-gray-600 hover:bg-gray-100'}`}
                            >
                                الكل
                            </button>
                            {categories.map((cat, idx) => (
                                <button 
                                    key={idx}
                                    onClick={() => setSelectedCategory(cat)}
                                    className={`w-full text-right px-4 py-2 rounded-lg text-sm font-medium transition-all ${selectedCategory === cat ? 'bg-[#D4AF37] text-white shadow-md' : 'text-gray-600 hover:bg-gray-100'}`}
                                >
                                    {cat}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Price Range */}
                    <div className="mb-8">
                        <h3 className="font-bold text-gray-900 mb-4">السعر</h3>
                        <input 
                            type="range" 
                            min="0" 
                            max="10000" 
                            value={priceRange} 
                            onChange={(e) => setPriceRange(Number(e.target.value))}
                            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#D4AF37]"
                        />
                        <div className="flex justify-between text-sm text-gray-500 mt-2 font-bold">
                            <span>0 ج.م</span>
                            <span>{priceRange} ج.م</span>
                        </div>
                    </div>

                </div>
            </aside>

            {/* Overlay for Mobile */}
            {isFilterOpen && <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setIsFilterOpen(false)}></div>}

            {/* ================= Products Grid ================= */}
            <main className="flex-1">
                {filteredProducts.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredProducts.map(product => (
                            <ProductCard key={product.id} product={product} />
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-20 bg-gray-50 rounded-3xl border border-gray-100">
                        <p className="text-gray-400 text-lg">لا توجد منتجات تطابق بحثك</p>
                        <button onClick={() => {setSelectedCategory('الكل'); setSearchQuery(''); setPriceRange(10000);}} className="mt-4 text-[#D4AF37] font-bold hover:underline">إعادة تعيين الفلاتر</button>
                    </div>
                )}
            </main>

        </div>
      </div>
    </div>
  );
};

export default Shop;
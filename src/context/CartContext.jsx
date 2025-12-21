import React, { createContext, useContext, useState, useEffect } from 'react';
import { X, CheckCircle, AlertCircle } from 'lucide-react';

const CartContext = createContext();

export const useCart = () => useContext(CartContext);

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState(() => {
    const saved = localStorage.getItem('cart');
    return saved ? JSON.parse(saved) : [];
  });

  const [wishlist, setWishlist] = useState(() => {
    const saved = localStorage.getItem('wishlist');
    return saved ? JSON.parse(saved) : [];
  });

  // ✅ نظام الإشعارات الداخلي
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  useEffect(() => { localStorage.setItem('cart', JSON.stringify(cartItems)); }, [cartItems]);
  useEffect(() => { localStorage.setItem('wishlist', JSON.stringify(wishlist)); }, [wishlist]);

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ ...toast, show: false }), 3000);
  };

  // --- دالة الإضافة (المنطق الجديد) ---
  const addToCart = (product, quantity = 1, color = null, size = null) => {
    const qtyToAdd = parseInt(quantity, 10);
    const productStock = parseInt(product.stock, 10);
    const productMaxLimit = parseInt(product.maxLimit, 10) || 10;

    // حساب الكمية الحالية في السلة لنفس المنتج
    const currentQtyInCart = cartItems
      .filter(item => item.id === product.id)
      .reduce((sum, item) => sum + parseInt(item.quantity, 10), 0);

    const futureTotal = currentQtyInCart + qtyToAdd;

    // 1. هل نفذت الكمية؟
    if (productStock <= 0) {
      showToast("عذراً، هذا المنتج غير متوفر حالياً (نفذت الكمية)", "error");
      return;
    }

    // 2. هل تجاوز الحد الأقصى؟ (رسالة بدون تفاصيل المخزون)
    if (futureTotal > productMaxLimit) {
      showToast(`عذراً، الحد الأقصى المسموح بطلبه هو ${productMaxLimit} قطع فقط.`, "error");
      return;
    }

    // 3. هل الكمية المطلوبة موجودة؟ (رسالة غامضة بدون رقم المخزون)
    if (futureTotal > productStock) {
      showToast("عذراً، الكمية المطلوبة غير متوفرة حالياً في المخزون.", "error");
      return;
    }

    // 4. الإضافة للسلة
    setCartItems(prev => {
      const existingItemIndex = prev.findIndex(item => item.id === product.id && item.selectedColor === color && item.selectedSize === size);
      
      if (existingItemIndex >= 0) {
        const updatedCart = [...prev];
        updatedCart[existingItemIndex] = {
          ...updatedCart[existingItemIndex],
          quantity: parseInt(updatedCart[existingItemIndex].quantity, 10) + qtyToAdd
        };
        showToast("تم تحديث الكمية في السلة", "success");
        return updatedCart;
      } else {
        showToast("تمت الإضافة للسلة بنجاح", "success");
        return [...prev, { ...product, quantity: qtyToAdd, selectedColor: color, selectedSize: size, cartId: Date.now() }];
      }
    });
  };

  const updateQuantity = (cartId, amount) => {
    setCartItems(prev => prev.map(item => {
      if (item.cartId === cartId) {
        const currentQty = parseInt(item.quantity, 10);
        const newQty = currentQty + amount;
        const stock = parseInt(item.stock, 10);
        const maxLimit = parseInt(item.maxLimit, 10) || 10;
        
        // حساب إجمالي هذا المنتج في السلة
        const otherVariantsQty = prev
            .filter(p => p.id === item.id && p.cartId !== cartId)
            .reduce((sum, p) => sum + parseInt(p.quantity, 10), 0);
        
        const totalProjected = otherVariantsQty + newQty;

        if (newQty < 1) return item;

        if (amount > 0) {
            if (totalProjected > maxLimit) {
                showToast(`الحد الأقصى للشراء ${maxLimit} قطع فقط`, "error");
                return item;
            }
            if (totalProjected > stock) {
                showToast("الكمية المطلوبة غير متوفرة بالمخزون", "error");
                return item;
            }
        }
        return { ...item, quantity: newQty };
      }
      return item;
    }));
  };

  const removeFromCart = (cartId) => {
      setCartItems(prev => prev.filter(item => item.cartId !== cartId));
      showToast("تم حذف المنتج", "error");
  };
  
  const clearCart = () => setCartItems([]);
  const cartTotal = cartItems.reduce((total, item) => total + (Number(item.price) * Number(item.quantity)), 0);

  const toggleWishlist = (product) => {
    setWishlist(prev => {
      const exists = prev.find(item => item.id === product.id);
      if (exists) {
          showToast("تم الحذف من المفضلة", "error");
          return prev.filter(item => item.id !== product.id);
      }
      showToast("تمت الإضافة للمفضلة", "success");
      return [...prev, product];
    });
  };
  const isInWishlist = (productId) => wishlist.some(item => item.id === productId);

  return (
    <CartContext.Provider value={{ cartItems, addToCart, removeFromCart, updateQuantity, clearCart, cartTotal, wishlist, toggleWishlist, isInWishlist }}>
      {children}
      {/* Toast Notification UI */}
      {toast.show && (
        <div className={`fixed bottom-10 left-1/2 transform -translate-x-1/2 z-[9999] flex items-center gap-3 px-6 py-4 rounded-xl shadow-2xl transition-all duration-300 min-w-[300px] justify-center ${toast.type === 'success' ? 'bg-gray-900 text-white' : 'bg-red-600 text-white'}`}>
            {toast.type === 'success' ? <CheckCircle size={24} className="text-green-400"/> : <AlertCircle size={24} className="text-white"/>}
            <span className="font-bold text-sm">{toast.message}</span>
        </div>
      )}
    </CartContext.Provider>
  );
};
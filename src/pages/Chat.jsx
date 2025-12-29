import React, { useState, useEffect, useRef } from 'react';
import { db, auth, storage } from '../firebase';
import { 
  collection, addDoc, query, where, orderBy, onSnapshot, 
  serverTimestamp, getDocs, doc, getDoc, limit, deleteDoc 
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { 
  Send, Image as ImageIcon, Users, User, Plus, 
  MessageCircle, X, Loader, Search, CheckCheck, ChevronLeft, Trash2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

const Chat = () => {
  const [currentUser, setCurrentUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [users, setUsers] = useState([]);
  const [groups, setGroups] = useState([]);
  const [activeChat, setActiveChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [imageFile, setImageFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [authLoading, setAuthLoading] = useState(true); 
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  
  const navigate = useNavigate();
  const messagesEndRef = useRef(null);

  // تحديث دالة التمرير لتقبل نوع الحركة (smooth أو auto)
  const scrollToBottom = (behavior = "smooth") => {
    messagesEndRef.current?.scrollIntoView({ behavior });
  };

  // 1. مراقبة حالة المستخدم وجلب الصلاحيات
  useEffect(() => {
    const unsubscribeAuth = auth.onAuthStateChanged(async (user) => {
      if (user) {
        setCurrentUser(user);
        try {
          const userDoc = await getDoc(doc(db, "users", user.uid));
          if (userDoc.exists() && userDoc.data().role === 'admin') {
            setIsAdmin(true);
          }
        } catch (err) {
          console.error("Error fetching role:", err);
        }
      } else {
        navigate('/login');
      }
      setAuthLoading(false);
    });

    return () => unsubscribeAuth();
  }, [navigate]);

  // 2. جلب القوائم مع تطبيق منطق الخصوصية
  useEffect(() => {
    if (!currentUser) return;

    const unsubscribeUsers = onSnapshot(collection(db, "users"), (snapshot) => {
      const usersData = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      
      // العميل يرى الأدمن فقط، والأدمن يرى الجميع
      if (isAdmin) {
        setUsers(usersData.filter(u => u.id !== currentUser.uid));
      } else {
        setUsers(usersData.filter(u => u.role === 'admin'));
      }
    });

    const qGroups = query(collection(db, "groups"), where("members", "array-contains", currentUser.uid));
    const unsubscribeGroups = onSnapshot(qGroups, (snapshot) => {
      setGroups(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    return () => {
      unsubscribeUsers();
      unsubscribeGroups();
    };
  }, [currentUser, isAdmin]);

  // 3. جلب الرسائل وإصلاح مشكلة "القفزة المستفزة"
  useEffect(() => {
    if (!activeChat || !currentUser) {
      setMessages([]);
      return;
    }

    const chatId = activeChat.type === 'group' 
      ? activeChat.id 
      : [currentUser.uid, activeChat.id].sort().join("_");

    const qMessages = query(
      collection(db, "messages"), 
      where("chatId", "==", chatId), 
      orderBy("createdAt", "asc")
    );

    const unsubscribeMessages = onSnapshot(qMessages, (snapshot) => {
      const msgs = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      
      // هل هذه هي المرة الأولى لفتح هذه المحادثة؟
      const isSwitchingChat = messages.length === 0;

      setMessages(msgs);

      // التمرير التلقائي: لحظي عند التبديل، وانسيابي عند وصول رسالة جديدة
      if (isSwitchingChat) {
        setTimeout(() => scrollToBottom("auto"), 50);
      } else {
        setTimeout(() => scrollToBottom("smooth"), 50);
      }
    });

    return () => unsubscribeMessages();
  }, [activeChat, currentUser]);

  // 4. إرسال الرسالة
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if ((!newMessage.trim() && !imageFile) || !currentUser || !activeChat) return;

    setLoading(true);
    try {
      let imageUrl = null;
      if (imageFile) {
        const imageRef = ref(storage, `chat_images/${Date.now()}_${imageFile.name}`);
        await uploadBytes(imageRef, imageFile);
        imageUrl = await getDownloadURL(imageRef);
      }

      const chatId = activeChat.type === 'group' 
        ? activeChat.id 
        : [currentUser.uid, activeChat.id].sort().join("_");

      await addDoc(collection(db, "messages"), {
        chatId,
        senderId: currentUser.uid,
        senderName: currentUser.displayName || "مستخدم",
        text: newMessage,
        imageUrl,
        createdAt: serverTimestamp(),
      });

      setNewMessage("");
      setImageFile(null);
    } catch (err) {
      console.error("Send error:", err);
    } finally {
      setLoading(false);
    }
  };

  // 5. حذف الرسالة (للأدمن فقط)
  const handleDeleteMessage = async (messageId) => {
    if (!isAdmin) return;
    if (window.confirm("هل تريد حذف هذه الرسالة نهائياً؟")) {
      try {
        await deleteDoc(doc(db, "messages", messageId));
      } catch (err) {
        console.error("Delete error:", err);
      }
    }
  };

  const createGroup = async () => {
    if (!newGroupName.trim() || selectedUsers.length === 0) return;
    setLoading(true);
    try {
      const groupRef = await addDoc(collection(db, "groups"), {
        name: newGroupName,
        members: [...selectedUsers, currentUser.uid],
        createdBy: currentUser.uid,
        createdAt: serverTimestamp(),
      });
      setShowCreateGroup(false);
      setNewGroupName("");
      setSelectedUsers([]);
      setActiveChat({ id: groupRef.id, name: newGroupName, type: 'group' });
    } catch (err) {
      console.error("Group error:", err);
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) return (
    <div className="h-screen flex items-center justify-center bg-[#f8f9fa] flex-col gap-4">
      <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
      <p className="font-bold text-gray-500 italic">جاري تهيئة بيئة التواصل...</p>
    </div>
  );

  return (
    // تم إضافة حساب الارتفاع (calc) لضمان عدم التداخل مع الناف بار
    <div className="flex bg-[#eef2f7] font-sans overflow-hidden p-0 md:p-4" 
         style={{ height: 'calc(100vh - 85px)', marginTop: '85px' }} dir="rtl">
      
      {/* Sidebar */}
      <div className={`w-full md:w-[350px] lg:w-[400px] bg-white/80 backdrop-blur-xl border border-white/20 shadow-2xl rounded-3xl md:ml-4 flex flex-col overflow-hidden transition-all ${activeChat ? 'hidden md:flex' : 'flex'}`}>
        <div className="p-6 bg-indigo-600 text-white flex justify-between items-center">
          <div className="flex items-center gap-3">
             <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center font-black text-xl border border-white/30">
               {currentUser?.displayName?.charAt(0) || 'U'}
             </div>
             <div>
               <h2 className="font-black text-lg leading-tight">محادثاتي</h2>
               <p className="text-xs text-indigo-100">{isAdmin ? 'لوحة التحكم' : 'مركز المساعدة'}</p>
             </div>
          </div>
          {isAdmin && (
            <button onClick={() => setShowCreateGroup(true)} className="p-2 bg-white/10 hover:bg-white/20 rounded-xl transition-all border border-white/10">
              <Plus size={24} />
            </button>
          )}
        </div>

        <div className="p-4">
          <div className="relative group">
            <Search className="absolute right-3 top-3 text-gray-400 group-focus-within:text-indigo-500 transition-colors" size={20} />
            <input 
              type="text" 
              placeholder="بحث في الأسماء..." 
              className="w-full bg-gray-100/50 border-none rounded-2xl py-3 pr-11 pl-4 text-sm focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all"
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="flex-grow overflow-y-auto custom-scrollbar px-2">
          {groups.map(group => (
            <div key={group.id} onClick={() => setActiveChat({ id: group.id, name: group.name, type: 'group' })}
              className={`flex items-center gap-4 p-4 mb-2 cursor-pointer rounded-2xl transition-all ${activeChat?.id === group.id ? 'bg-indigo-50 shadow-sm border border-indigo-100' : 'hover:bg-gray-50'}`}>
              <div className="w-14 h-14 bg-gradient-to-tr from-indigo-500 to-purple-500 rounded-2xl flex items-center justify-center text-white shadow-lg"><Users size={24} /></div>
              <div className="flex-grow overflow-hidden text-right">
                <h3 className="font-bold text-gray-800 truncate">{group.name}</h3>
                <p className="text-xs text-gray-500 font-medium">مجموعة عامة • {group.members.length} عضو</p>
              </div>
            </div>
          ))}

          {users.filter(u => u.name.includes(searchTerm)).map(u => (
            <div key={u.id} onClick={() => setActiveChat({ id: u.id, name: u.name, type: 'private' })}
              className={`flex items-center gap-4 p-4 mb-2 cursor-pointer rounded-2xl transition-all ${activeChat?.id === u.id ? 'bg-indigo-50 shadow-sm border border-indigo-100' : 'hover:bg-gray-50'}`}>
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-white font-black text-xl shadow-lg ${u.role === 'admin' ? 'bg-gradient-to-tr from-rose-500 to-orange-500' : 'bg-gradient-to-tr from-indigo-400 to-cyan-400'}`}>
                {u.name.charAt(0)}
              </div>
              <div className="flex-grow overflow-hidden text-right">
                <h3 className="font-bold text-gray-800 flex items-center gap-2 truncate">
                    {u.name} {u.role === 'admin' && <span className="text-[10px] bg-rose-100 text-rose-600 px-2 py-0.5 rounded-lg font-black tracking-tighter">ADMIN</span>}
                </h3>
                <p className="text-xs text-gray-400 font-medium">{u.phone || 'متصل'}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Main Messages Area */}
      <div className={`flex-grow flex flex-col bg-white/40 backdrop-blur-md border border-white/20 shadow-2xl rounded-3xl relative overflow-hidden transition-all ${!activeChat ? 'hidden md:flex' : 'flex'}`}>
        {activeChat ? (
          <>
            <div className="p-4 bg-white/80 backdrop-blur-md border-b border-white/20 flex items-center justify-between z-10">
              <div className="flex items-center gap-4">
                <button onClick={() => setActiveChat(null)} className="md:hidden p-2 text-gray-600 bg-gray-100 rounded-xl"><ChevronLeft size={24} /></button>
                <div className="w-12 h-12 bg-gray-200 rounded-2xl flex items-center justify-center text-gray-600 font-black text-xl border-2 border-white shadow-sm">
                  {activeChat.name.charAt(0)}
                </div>
                <div>
                  <h2 className="font-black text-gray-800 leading-tight">{activeChat.name}</h2>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                    <p className="text-xs text-gray-500 font-bold">نشط الآن</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex-grow p-4 md:p-8 overflow-y-auto space-y-6 custom-scrollbar bg-gradient-to-b from-white/20 to-transparent">
              {messages.map((msg) => (
                <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} key={msg.id} 
                  className={`flex ${msg.senderId === currentUser.uid ? 'justify-start' : 'justify-end'} group`}>
                  <div className={`max-w-[85%] md:max-w-[70%] p-4 rounded-3xl shadow-xl relative border backdrop-blur-md transition-all ${
                    msg.senderId === currentUser.uid 
                      ? 'bg-white/90 border-white/40 rounded-tr-none text-gray-800' 
                      : 'bg-indigo-600 border-indigo-500 rounded-tl-none text-white'
                  }`}>
                    
                    {isAdmin && (
                      <button onClick={() => handleDeleteMessage(msg.id)}
                        className="absolute -top-3 -left-3 bg-white text-rose-500 p-2 rounded-xl opacity-0 group-hover:opacity-100 transition-all shadow-xl border border-rose-50">
                        <Trash2 size={16} />
                      </button>
                    )}

                    {activeChat.type === 'group' && msg.senderId !== currentUser.uid && (
                      <p className={`text-[11px] font-black mb-1 ${msg.senderId === currentUser.uid ? 'text-indigo-600' : 'text-indigo-100'}`}>
                        {msg.senderName}
                      </p>
                    )}
                    
                    {msg.imageUrl && (
                      <img src={msg.imageUrl} className="rounded-2xl mb-3 max-h-80 w-full object-cover shadow-inner" alt="attachment" />
                    )}
                    
                    {msg.text && <p className="text-[15px] leading-relaxed font-medium">{msg.text}</p>}
                    
                    <div className={`flex items-center justify-end gap-1.5 mt-2 ${msg.senderId === currentUser.uid ? 'text-gray-400' : 'text-indigo-200'} opacity-80`}>
                      <span className="text-[10px] font-bold">
                        {msg.createdAt ? msg.createdAt.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '...'}
                      </span>
                      {msg.senderId === currentUser.uid && <CheckCheck size={16} className="text-indigo-500" />}
                    </div>
                  </div>
                </motion.div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Bar */}
            <div className="p-4 md:p-6 bg-transparent">
              <div className="bg-white/90 backdrop-blur-xl p-2 rounded-[2rem] shadow-2xl flex items-center gap-2 border border-white/50">
                <label className="p-3 text-gray-500 hover:text-indigo-600 rounded-full cursor-pointer transition-all">
                  <ImageIcon size={24} />
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => setImageFile(e.target.files[0])} />
                </label>
                
                <div className="flex-grow relative">
                  {imageFile && (
                    <div className="absolute bottom-full mb-4 right-0 bg-white p-3 rounded-2xl shadow-2xl flex items-center gap-3 border border-indigo-100">
                      <span className="text-xs font-bold text-gray-700 truncate max-w-[120px]">{imageFile.name}</span>
                      <button onClick={() => setImageFile(null)} className="text-rose-500"><X size={16}/></button>
                    </div>
                  )}
                  <form onSubmit={handleSendMessage} className="flex gap-2">
                    <input type="text" value={newMessage} onChange={(e) => setNewMessage(e.target.value)}
                      placeholder="اكتب رسالتك هنا..." className="flex-grow bg-transparent border-none px-4 py-3 text-sm focus:ring-0 outline-none" />
                    <button type="submit" disabled={loading || (!newMessage.trim() && !imageFile)}
                      className="bg-indigo-600 text-white p-4 rounded-full hover:bg-indigo-700 transition-all shadow-lg disabled:opacity-50">
                      {loading ? <Loader className="animate-spin" size={20}/> : <Send size={20} className="rtl:rotate-180" />}
                    </button>
                  </form>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-gray-400 gap-6">
            <div className="w-40 h-40 bg-gradient-to-tr from-indigo-50 to-white rounded-full flex items-center justify-center shadow-inner">
              <MessageCircle size={100} strokeWidth={1} className="text-indigo-200" />
            </div>
            <div className="text-center">
              <h2 className="text-3xl font-black text-gray-700">مرحباً بك في بيت العيلة</h2>
              <p className="text-sm font-medium text-gray-400">اختر محادثة للبدء في التواصل</p>
            </div>
          </div>
        )}
      </div>

      <AnimatePresence>
        {showCreateGroup && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-indigo-900/20 backdrop-blur-md">
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="bg-white rounded-[2.5rem] p-8 w-full max-w-md shadow-2xl">
              <div className="flex justify-between items-center mb-8">
                <h2 className="text-2xl font-black text-gray-800">مجموعة جديدة</h2>
                <button onClick={() => setShowCreateGroup(false)} className="bg-gray-100 p-2 rounded-xl"><X /></button>
              </div>
              <div className="space-y-6">
                <input type="text" placeholder="اسم المجموعة" className="w-full p-4 bg-gray-50 border-2 border-transparent rounded-2xl outline-none focus:border-indigo-500 transition-all font-bold"
                  value={newGroupName} onChange={(e) => setNewGroupName(e.target.value)} />
                <div className="max-h-60 overflow-y-auto space-y-2 custom-scrollbar">
                    {users.map(u => (
                        <div key={u.id} onClick={() => setSelectedUsers(prev => prev.includes(u.id) ? prev.filter(id => id !== u.id) : [...prev, u.id])}
                        className={`flex items-center gap-4 p-3 rounded-2xl cursor-pointer transition-all border-2 ${selectedUsers.includes(u.id) ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-gray-50 border-transparent'}`}>
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-black ${selectedUsers.includes(u.id) ? 'bg-white/20' : 'bg-white text-indigo-600'}`}>{u.name.charAt(0)}</div>
                          <span className="font-bold">{u.name}</span>
                        </div>
                    ))}
                </div>
                <button onClick={createGroup} disabled={loading || !newGroupName || selectedUsers.length === 0}
                  className="w-full bg-indigo-600 text-white py-5 rounded-2xl font-black shadow-xl hover:bg-indigo-700 disabled:opacity-50">
                  {loading ? "جاري الإنشاء..." : "إنشاء المجموعة الآن"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <style dangerouslySetInnerHTML={{ __html: `
        .custom-scrollbar::-webkit-scrollbar { width: 5px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
        input::placeholder { color: #94a3b8; font-weight: 500; }
        /* منع أي تمرير خارجي أثناء فتح الشات */
        .overflow-y-auto { scroll-behavior: auto !important; }
      `}} />
    </div>
  );
};

export default Chat;
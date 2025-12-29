import React, { useState, useEffect, useRef } from 'react';
import { db, auth, storage } from '../firebase';
import { 
  collection, addDoc, query, where, orderBy, onSnapshot, 
  serverTimestamp, getDocs, doc, getDoc
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { 
  Send, Image as ImageIcon, Users, User, Plus, 
  MessageCircle, X, Loader, Search, CheckCheck 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

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
  const [authLoading, setAuthLoading] = useState(true); // لمنع القفل السريع
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");

  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // 1. إدارة حالة المستخدم والتحقق من الصلاحيات
  useEffect(() => {
    const unsubscribeAuth = auth.onAuthStateChanged(async (u) => {
      if (u) {
        setCurrentUser(u);
        const userDoc = await getDoc(doc(db, "users", u.uid));
        if (userDoc.exists() && userDoc.data().role === 'admin') {
          setIsAdmin(true);
        }
      } else {
        setCurrentUser(null);
      }
      setAuthLoading(false);
    });

    return () => unsubscribeAuth();
  }, []);

  // 2. جلب المستخدمين والمجموعات (مرة واحدة أو عند التغيير)
  useEffect(() => {
    if (!currentUser) return;

    // جلب المستخدمين
    const unsubscribeUsers = onSnapshot(collection(db, "users"), (snapshot) => {
      const usersData = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      setUsers(usersData.filter(u => u.id !== currentUser.uid));
    });

    // جلب المجموعات التي أنا عضو فيها
    const qGroups = query(collection(db, "groups"), where("members", "array-contains", currentUser.uid));
    const unsubscribeGroups = onSnapshot(qGroups, (snapshot) => {
      setGroups(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    return () => {
      unsubscribeUsers();
      unsubscribeGroups();
    };
  }, [currentUser]);

  // 3. نظام جلب الرسائل المطور (حل مشكلة الاختفاء)
  useEffect(() => {
    if (!activeChat || !currentUser) {
        setMessages([]);
        return;
    }

    let chatId;
    if (activeChat.type === 'group') {
      chatId = activeChat.id; // للمجموعات نستخدم الـ ID الخاص بالمجموعة
    } else {
      chatId = [currentUser.uid, activeChat.id].sort().join("_"); // للشات الخاص ندمج الـ IDs مرتبة
    }

    const qMessages = query(
      collection(db, "messages"), 
      where("chatId", "==", chatId), 
      orderBy("createdAt", "asc")
    );

    const unsubscribeMessages = onSnapshot(qMessages, (snapshot) => {
      const msgs = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      setMessages(msgs);
      setTimeout(scrollToBottom, 100);
    }, (error) => {
      console.error("Firestore OrderBy Error: يرجى تفعيل الـ Index من الرابط في الـ console", error);
    });

    return () => unsubscribeMessages();
  }, [activeChat, currentUser]);

  // 4. إرسال الرسائل (حل مشكلة الـ Null Timestamp)
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

      const messageData = {
        chatId,
        senderId: currentUser.uid,
        senderName: currentUser.displayName || "مستخدم",
        text: newMessage,
        imageUrl,
        createdAt: serverTimestamp(), // يتم استبداله بالسيرفر
      };

      await addDoc(collection(db, "messages"), messageData);

      setNewMessage("");
      setImageFile(null);
    } catch (err) {
      console.error("Send error:", err);
      alert("حدث خطأ أثناء الإرسال!");
    } finally {
      setLoading(false);
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
      console.error("Group creation error:", err);
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) return (
    <div className="h-screen flex items-center justify-center bg-gray-50 flex-col gap-4">
      <Loader className="animate-spin text-primary" size={40} />
      <p className="font-bold text-gray-500">جاري تحميل المحادثات...</p>
    </div>
  );

  if (!currentUser) return <div className="h-screen flex items-center justify-center font-bold">يرجى تسجيل الدخول للوصول للشات.</div>;

  return (
    <div className="flex h-screen pt-20 bg-gray-100 font-sans overflow-hidden" dir="rtl">
      {/* القائمة الجانبية */}
      <div className="w-full md:w-80 lg:w-96 bg-white border-l border-gray-200 flex flex-col shadow-sm">
        <div className="p-4 bg-primary text-white">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-black">بيت العيلة Chat</h2>
            {isAdmin && (
              <button onClick={() => setShowCreateGroup(true)} className="p-2 hover:bg-white/10 rounded-full">
                <Plus size={24} />
              </button>
            )}
          </div>
          <div className="relative">
            <Search className="absolute right-3 top-2.5 text-gray-400" size={18} />
            <input 
              type="text" 
              placeholder="بحث عن اسم أو هاتف..." 
              className="w-full bg-white/10 border-none rounded-lg py-2 pr-10 pl-4 text-white placeholder:text-white/60 focus:ring-1 focus:ring-white outline-none"
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="flex-grow overflow-y-auto">
          {/* المجموعات */}
          {groups.map(group => (
            <div 
              key={group.id} 
              onClick={() => setActiveChat({ id: group.id, name: group.name, type: 'group' })}
              className={`flex items-center gap-3 p-4 cursor-pointer border-b border-gray-50 transition-all ${activeChat?.id === group.id ? 'bg-primary/5 border-r-4 border-primary' : 'hover:bg-gray-50'}`}
            >
              <div className="w-12 h-12 bg-accent/20 rounded-full flex items-center justify-center text-accent"><Users size={24} /></div>
              <div>
                <h3 className="font-bold text-gray-800">{group.name}</h3>
                <p className="text-xs text-gray-500">{group.members.length} أعضاء</p>
              </div>
            </div>
          ))}

          {/* المستخدمين */}
          {users.filter(u => u.name.includes(searchTerm)).map(u => (
            <div 
              key={u.id} 
              onClick={() => setActiveChat({ id: u.id, name: u.name, type: 'private' })}
              className={`flex items-center gap-3 p-4 cursor-pointer border-b border-gray-50 transition-all ${activeChat?.id === u.id ? 'bg-primary/5 border-r-4 border-primary' : 'hover:bg-gray-50'}`}
            >
              <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold ${u.role === 'admin' ? 'bg-red-500' : 'bg-primary'}`}>
                {u.name.charAt(0)}
              </div>
              <div className="flex-grow">
                <h3 className="font-bold text-gray-800 flex items-center gap-2">
                    {u.name} {u.role === 'admin' && <span className="text-[8px] bg-red-100 text-red-600 px-1 rounded">ADMIN</span>}
                </h3>
                <p className="text-xs text-gray-400">{u.phone}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* منطقة الرسائل */}
      <div className="flex-grow flex flex-col bg-white">
        {activeChat ? (
          <>
            <div className="p-4 border-b border-gray-100 flex items-center gap-3 bg-gray-50/50">
              <div className="w-10 h-10 bg-primary text-white rounded-full flex items-center justify-center font-bold">
                {activeChat.name.charAt(0)}
              </div>
              <h2 className="font-bold text-gray-800">{activeChat.name}</h2>
            </div>

            <div className="flex-grow p-4 overflow-y-auto bg-[#efe7dd] space-y-3">
              {messages.map((msg) => (
                <div key={msg.id} className={`flex ${msg.senderId === currentUser.uid ? 'justify-start' : 'justify-end'}`}>
                  <div className={`max-w-[80%] p-3 rounded-2xl shadow-sm ${msg.senderId === currentUser.uid ? 'bg-primary text-white rounded-tr-none' : 'bg-white text-gray-800 rounded-tl-none'}`}>
                    {activeChat.type === 'group' && msg.senderId !== currentUser.uid && (
                      <p className="text-[9px] font-bold mb-1 text-accent">{msg.senderName}</p>
                    )}
                    {msg.imageUrl && <img src={msg.imageUrl} className="rounded-lg mb-2 max-h-64 w-full object-cover" alt="chat" />}
                    {msg.text && <p className="text-sm font-medium">{msg.text}</p>}
                    <p className={`text-[8px] mt-1 text-left opacity-60`}>
                      {msg.createdAt ? msg.createdAt.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '...'}
                    </p>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            <div className="p-4 bg-white border-t border-gray-100">
              {imageFile && (
                <div className="mb-2 p-2 bg-gray-50 rounded-lg flex items-center justify-between">
                  <span className="text-xs text-gray-500">📸 {imageFile.name}</span>
                  <button onClick={() => setImageFile(null)} className="text-red-500"><X size={16}/></button>
                </div>
              )}
              <form onSubmit={handleSendMessage} className="flex items-center gap-2">
                <label className="p-3 text-gray-400 hover:text-primary cursor-pointer">
                  <ImageIcon size={24} />
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => setImageFile(e.target.files[0])} />
                </label>
                <input 
                  type="text" 
                  value={newMessage} 
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="اكتب رسالة..." 
                  className="flex-grow bg-gray-100 border-none rounded-full px-6 py-3 focus:ring-2 focus:ring-primary/20 outline-none"
                />
                <button type="submit" disabled={loading} className="bg-primary text-white p-3 rounded-full hover:bg-gray-800 transition-all shadow-md">
                  {loading ? <Loader className="animate-spin" size={20}/> : <Send size={20} className="rtl:rotate-180" />}
                </button>
              </form>
            </div>
          </>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-gray-300">
            <MessageCircle size={100} strokeWidth={1} />
            <p className="text-xl font-bold">ابدأ محادثة مع العملاء أو الإدارة</p>
          </div>
        )}
      </div>

      {/* مودال المجموعة */}
      <AnimatePresence>
        {showCreateGroup && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="bg-white rounded-[2rem] p-8 w-full max-w-md shadow-2xl">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-black text-gray-900">إنشاء مجموعة</h2>
                <button onClick={() => setShowCreateGroup(false)} className="text-gray-400 p-1"><X /></button>
              </div>
              <input 
                type="text" 
                placeholder="اسم المجموعة" 
                className="w-full p-4 bg-gray-50 border rounded-2xl mb-4 outline-none focus:ring-2 focus:ring-primary/20"
                value={newGroupName}
                onChange={(e) => setNewGroupName(e.target.value)}
              />
              <div className="max-h-60 overflow-y-auto space-y-2 mb-6">
                {users.map(u => (
                  <div 
                    key={u.id} 
                    onClick={() => setSelectedUsers(prev => prev.includes(u.id) ? prev.filter(id => id !== u.id) : [...prev, u.id])}
                    className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer ${selectedUsers.includes(u.id) ? 'bg-primary text-white' : 'bg-gray-50'}`}
                  >
                    <span className="font-bold text-sm">{u.name}</span>
                  </div>
                ))}
              </div>
              <button 
                onClick={createGroup}
                disabled={loading || !newGroupName || selectedUsers.length === 0}
                className="w-full bg-primary text-white py-4 rounded-2xl font-black shadow-xl"
              >
                {loading ? "جاري الإنشاء..." : "إنشاء المجموعة"}
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Chat;
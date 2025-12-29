import React, { useState, useEffect, useRef } from 'react';
import { db, auth, storage } from '../firebase';
import { 
  collection, addDoc, query, where, orderBy, onSnapshot, 
  serverTimestamp, getDocs, doc, limit 
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { 
  Send, Image as ImageIcon, Users, User, Plus, 
  MessageCircle, X, Loader, Search, CheckCheck 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const Chat = () => {
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [users, setUsers] = useState([]);
  const [groups, setGroups] = useState([]);
  const [activeChat, setActiveChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [imageFile, setImageFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");

  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    const unsubscribeAuth = auth.onAuthStateChanged(async (u) => {
      setUser(u);
      if (u) {
        // التحقق مما إذا كان المستخدم أدمن
        const userDoc = await getDocs(query(collection(db, "users"), where("__name__", "==", u.uid)));
        if (!userDoc.empty && userDoc.docs[0].data().role === 'admin') {
          setIsAdmin(true);
        }
      }
    });

    const fetchUsers = async () => {
      const snapshot = await getDocs(collection(db, "users"));
      const usersData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setUsers(usersData.filter(u => u.id !== auth.currentUser?.uid));
    };

    fetchUsers();
    return () => unsubscribeAuth();
  }, []);

  // جلب المجموعات
  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, "groups"), where("members", "array-contains", user.uid));
    const unsubscribeGroups = onSnapshot(q, (snapshot) => {
      setGroups(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsubscribeGroups();
  }, [user]);

  // جلب الرسائل
  useEffect(() => {
    if (!activeChat || !user) return;

    let q;
    if (activeChat.type === 'group') {
      q = query(collection(db, "messages"), where("chatId", "==", activeChat.id), orderBy("createdAt", "asc"));
    } else {
      const chatId = [user.uid, activeChat.id].sort().join("_");
      q = query(collection(db, "messages"), where("chatId", "==", chatId), orderBy("createdAt", "asc"));
    }

    const unsubscribeMessages = onSnapshot(q, (snapshot) => {
      setMessages(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setTimeout(scrollToBottom, 100);
    });

    return () => unsubscribeMessages();
  }, [activeChat, user]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if ((!newMessage.trim() && !imageFile) || !user || !activeChat) return;

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
        : [user.uid, activeChat.id].sort().join("_");

      await addDoc(collection(db, "messages"), {
        chatId,
        senderId: user.uid,
        senderName: user.displayName || "مستخدم",
        text: newMessage,
        imageUrl,
        createdAt: serverTimestamp(),
      });

      setNewMessage("");
      setImageFile(null);
    } catch (err) {
      console.error("Error sending message:", err);
    } finally {
      setLoading(false);
      scrollToBottom();
    }
  };

  const createGroup = async () => {
    if (!newGroupName.trim() || selectedUsers.length === 0) return;
    setLoading(true);
    try {
      const groupRef = await addDoc(collection(db, "groups"), {
        name: newGroupName,
        members: [...selectedUsers, user.uid],
        createdBy: user.uid,
        createdAt: serverTimestamp(),
      });
      setShowCreateGroup(false);
      setNewGroupName("");
      setSelectedUsers([]);
      setActiveChat({ id: groupRef.id, name: newGroupName, type: 'group' });
    } catch (err) {
      console.error("Error creating group:", err);
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    u.phone?.includes(searchTerm)
  );

  if (!user) return <div className="h-screen flex items-center justify-center font-bold">جاري التحميل...</div>;

  return (
    <div className="flex h-screen pt-20 bg-gray-50 font-sans overflow-hidden" dir="rtl">
      {/* Sidebar - القائمة الجانبية */}
      <div className="w-full md:w-80 lg:w-96 bg-white border-l border-gray-200 flex flex-col shadow-lg z-10">
        <div className="p-4 bg-primary text-white">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-black flex items-center gap-2">
              <MessageCircle size={24} /> المحادثات
            </h2>
            {isAdmin && (
              <button onClick={() => setShowCreateGroup(true)} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                <Plus size={24} />
              </button>
            )}
          </div>
          <div className="relative">
            <Search className="absolute right-3 top-2.5 text-gray-400" size={18} />
            <input 
              type="text" 
              placeholder="بحث عن عميل أو رقم هاتف..." 
              className="w-full bg-white/10 border-none rounded-lg py-2 pr-10 pl-4 text-white placeholder:text-white/60 focus:ring-2 focus:ring-white/20 outline-none"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="flex-grow overflow-y-auto">
          {/* المجموعات */}
          {groups.length > 0 && (
            <div className="p-2 border-b border-gray-50">
              <p className="text-[10px] font-bold text-gray-400 px-3 py-2 uppercase tracking-widest">المجموعات المشترك بها</p>
              {groups.map(group => (
                <div 
                  key={group.id} 
                  onClick={() => setActiveChat({ id: group.id, name: group.name, type: 'group' })}
                  className={`flex items-center gap-3 p-3 cursor-pointer rounded-xl transition-all ${activeChat?.id === group.id ? 'bg-primary/5 border-r-4 border-primary' : 'hover:bg-gray-50'}`}
                >
                  <div className="w-12 h-12 bg-accent/20 rounded-full flex items-center justify-center text-accent">
                    <Users size={24} />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-800">{group.name}</h3>
                    <p className="text-xs text-gray-500">{group.members.length} عضو</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* المستخدمين / العملاء */}
          <div className="p-2">
            <p className="text-[10px] font-bold text-gray-400 px-3 py-2 uppercase tracking-widest">
              {isAdmin ? "كل العملاء" : "تواصل مع الإدارة"}
            </p>
            {filteredUsers.map(u => (
              <div 
                key={u.id} 
                onClick={() => setActiveChat({ id: u.id, name: u.name, type: 'private' })}
                className={`flex items-center gap-3 p-3 cursor-pointer rounded-xl transition-all ${activeChat?.id === u.id ? 'bg-primary/5 border-r-4 border-primary' : 'hover:bg-gray-50'}`}
              >
                <div className={`relative w-12 h-12 rounded-full flex items-center justify-center text-white font-bold shadow-sm ${u.role === 'admin' ? 'bg-red-500' : 'bg-primary'}`}>
                  {u.name.charAt(0)}
                  <span className="absolute bottom-0 left-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></span>
                </div>
                <div className="flex-grow">
                  <div className="flex justify-between items-center">
                    <h3 className="font-bold text-gray-800 text-sm">
                      {u.name} 
                      {u.role === 'admin' && <span className="mr-2 text-[8px] bg-red-100 text-red-600 px-1.5 py-0.5 rounded-full font-black uppercase">Admin</span>}
                    </h3>
                  </div>
                  <p className="text-xs text-gray-400 truncate w-40">{u.phone || u.email}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* منطقة الشات الرئيسية */}
      <div className="flex-grow flex flex-col bg-white relative">
        {activeChat ? (
          <>
            {/* الهيدر */}
            <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-white/80 backdrop-blur-md sticky top-0 z-20">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center text-primary">
                  {activeChat.type === 'group' ? <Users size={20}/> : <User size={20}/>}
                </div>
                <div>
                  <h2 className="font-black text-gray-900">{activeChat.name}</h2>
                  <p className="text-[10px] text-green-500 font-bold">نشط الآن</p>
                </div>
              </div>
            </div>

            {/* الرسائل */}
            <div className="flex-grow p-4 md:p-6 overflow-y-auto bg-[#F0F2F5] space-y-4">
              {messages.map((msg) => (
                <div key={msg.id} className={`flex ${msg.senderId === user.uid ? 'justify-start' : 'justify-end'}`}>
                  <div className={`max-w-[85%] md:max-w-[70%] p-3 rounded-2xl shadow-sm ${msg.senderId === user.uid ? 'bg-primary text-white rounded-tr-none' : 'bg-white text-gray-800 rounded-tl-none'}`}>
                    {activeChat.type === 'group' && msg.senderId !== user.uid && (
                      <p className="text-[9px] font-black mb-1 opacity-60 text-accent uppercase">{msg.senderName}</p>
                    )}
                    {msg.imageUrl && (
                      <img 
                        src={msg.imageUrl} 
                        alt="sent" 
                        className="rounded-lg mb-2 max-h-72 w-full object-cover cursor-pointer hover:opacity-90 transition-opacity" 
                        onClick={() => window.open(msg.imageUrl)} 
                      />
                    )}
                    {msg.text && <p className="text-sm leading-relaxed font-medium">{msg.text}</p>}
                    <div className="flex items-center justify-end gap-1 mt-1">
                      <p className={`text-[8px] ${msg.senderId === user.uid ? 'text-white/70' : 'text-gray-400'}`}>
                        {msg.createdAt?.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                      {msg.senderId === user.uid && <CheckCheck size={12} className="text-white/60" />}
                    </div>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* الإدخال */}
            <div className="p-4 bg-white border-t border-gray-100">
              {imageFile && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-3 p-2 bg-gray-50 rounded-xl flex items-center justify-between border border-primary/10">
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center text-primary font-bold text-[10px]">IMG</div>
                    <span className="text-xs font-bold text-gray-600 truncate max-w-[200px]">{imageFile.name}</span>
                  </div>
                  <button onClick={() => setImageFile(null)} className="p-1 hover:bg-red-50 text-red-500 rounded-full"><X size={18}/></button>
                </motion.div>
              )}
              <form onSubmit={handleSendMessage} className="flex items-center gap-2 max-w-5xl mx-auto">
                <label className="p-3 text-gray-400 hover:text-primary cursor-pointer transition-colors bg-gray-50 rounded-full">
                  <ImageIcon size={22} />
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => setImageFile(e.target.files[0])} />
                </label>
                <input 
                  type="text" 
                  value={newMessage} 
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="اكتب رسالتك للعميل..." 
                  className="flex-grow bg-gray-50 border border-gray-100 rounded-full px-6 py-3 focus:bg-white focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                />
                <button 
                  type="submit" 
                  disabled={loading || (!newMessage.trim() && !imageFile)}
                  className="bg-primary text-white p-3.5 rounded-full hover:bg-gray-800 transition-all shadow-lg disabled:opacity-50 disabled:shadow-none"
                >
                  {loading ? <Loader className="animate-spin" size={20}/> : <Send size={20} className="rtl:rotate-180" />}
                </button>
              </form>
            </div>
          </>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-gray-300 gap-4 bg-gray-50/50">
            <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center shadow-sm">
                <MessageCircle size={48} strokeWidth={1.5} className="text-gray-200" />
            </div>
            <p className="text-lg font-black text-gray-400">اختر محادثة لبدء التواصل</p>
            {isAdmin && <p className="text-sm text-gray-400">يمكنك البحث عن أي عميل من القائمة الجانبية</p>}
          </div>
        )}
      </div>

      {/* مودال المجموعات (للأدمن فقط) */}
      <AnimatePresence>
        {showCreateGroup && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="bg-white rounded-[2rem] p-8 w-full max-w-md shadow-2xl">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-black text-gray-900">إنشاء مجموعة</h2>
                <button onClick={() => setShowCreateGroup(false)} className="text-gray-400 hover:text-gray-600 p-1"><X /></button>
              </div>
              <input 
                type="text" 
                placeholder="اسم المجموعة (مثلاً: عروض الشتاء)" 
                className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl mb-4 outline-none focus:ring-2 focus:ring-primary/20"
                value={newGroupName}
                onChange={(e) => setNewGroupName(e.target.value)}
              />
              <p className="text-xs font-black text-gray-400 mb-3 uppercase tracking-widest">اختر العملاء المراد إضافتهم:</p>
              <div className="max-h-60 overflow-y-auto space-y-2 mb-6 pr-1 custom-scrollbar">
                {users.map(u => (
                  <div 
                    key={u.id} 
                    onClick={() => setSelectedUsers(prev => prev.includes(u.id) ? prev.filter(id => id !== u.id) : [...prev, u.id])}
                    className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all ${selectedUsers.includes(u.id) ? 'bg-primary text-white shadow-md' : 'bg-gray-50 hover:bg-gray-100'}`}
                  >
                    <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-xs font-bold">{u.name.charAt(0)}</div>
                    <span className="font-bold text-sm">{u.name}</span>
                  </div>
                ))}
              </div>
              <button 
                onClick={createGroup}
                disabled={loading || !newGroupName || selectedUsers.length === 0}
                className="w-full bg-primary text-white py-4 rounded-2xl font-black shadow-xl hover:bg-gray-800 transition-all disabled:opacity-50"
              >
                {loading ? "جاري الإنشاء..." : "إنشاء المجموعة الآن"}
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Chat;
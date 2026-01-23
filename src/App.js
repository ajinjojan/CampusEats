import React, { useEffect, useState } from "react";
import {
  Utensils, ShoppingBag, CreditCard,
  CheckCircle, User, LogOut,
  Coffee, Clock, Search, Plus, Minus,
  ChefHat, Trash2, ArrowRight, QrCode,
  Edit, PlusCircle, X, Palette
} from "lucide-react";

import DarkVeil, { THEMES } from "./components/DarkVeil";
import GradualBlur from "./components/GradualBlur";
import GlareHover from "./components/GlareHover";

import { initializeApp } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signOut,
} from "firebase/auth";
import {
  getFirestore,
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  onSnapshot,
  setDoc,
  getDoc
} from "firebase/firestore";

/* ================= FIREBASE CONFIGURATION ================= */

const firebaseConfig = {
  apiKey: "AIzaSyAQyI71N5SbqrRMkgCqzraK6yFfx1HtDP4",
  authDomain: "campuseats2-168fd.firebaseapp.com",
  projectId: "campuseats2-168fd",
  storageBucket: "campuseats2-168fd.firebasestorage.app",
  messagingSenderId: "1018340912497",
  appId: "1:1018340912497:web:32c52a41141ca5b54bdad0",
  measurementId: "G-MF9B673PRZ"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: "select_account" });

// App Constants
const APP_ID = "campuseats-live-v1";
const MASTER_KEY = "master123";

/* ================= MOCK DATA & UTILS ================= */

const INITIAL_MENU = [
  { id: 1, name: "Chicken Biryani", price: 120, category: "Lunch", desc: "Spicy aromatic rice with tender chicken", image: "🍗", color: "bg-orange-100 text-orange-600" },
  { id: 2, name: "Veg Thali", price: 80, category: "Lunch", desc: "Rice, dal, 2 curries, curd & pickle", image: "🥗", color: "bg-green-100 text-green-600" },
  { id: 3, name: "Spicy Chicken Roll", price: 60, category: "Snacks", desc: "Grilled chicken wrapped in paratha", image: "🌯", color: "bg-red-100 text-red-600" },
  { id: 4, name: "Egg Puffs", price: 20, category: "Snacks", desc: "Crispy pastry with boiled egg", image: "🥚", color: "bg-yellow-100 text-yellow-600" },
  { id: 5, name: "Fresh Lime Soda", price: 25, category: "Drinks", desc: "Refreshing sweet & salty lime", image: "🍋", color: "bg-lime-100 text-lime-600" },
  { id: 6, name: "Masala Chai", price: 10, category: "Drinks", desc: "Hot spiced tea", image: "☕", color: "bg-amber-100 text-amber-600" },
];

const generateOrderId = () => `ORD-${Math.floor(1000 + Math.random() * 9000)}`;

const formatCurrency = (amount) => `₹${amount}`;

/* ================= COMPONENTS ================= */

// --- Shared UI Components ---
const Button = ({ children, onClick, variant = "primary", className = "", disabled = false }) => {
  const base = "px-4 py-3 rounded-xl font-semibold transition-all duration-200 flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50 disabled:active:scale-100";
  const variants = {
    primary: "bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg shadow-indigo-200",
    secondary: "bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 shadow-sm",
    danger: "bg-red-50 text-red-600 hover:bg-red-100",
    ghost: "text-slate-600 hover:bg-slate-100 bg-transparent",
    success: "bg-emerald-600 text-white hover:bg-emerald-700 shadow-lg shadow-emerald-200"
  };
  return (
    <button disabled={disabled} onClick={onClick} className={`${base} ${variants[variant]} ${className}`}>
      {children}
    </button>
  );
};

const Input = ({ label, ...props }) => (
  <div className="flex flex-col gap-1.5 w-full">
    {label && <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">{label}</label>}
    <input
      className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
      {...props}
    />
  </div>
);

const Card = ({ children, className = "" }) => (
  <div className={`bg-white p-4 rounded-2xl border border-slate-100 shadow-sm ${className}`}>
    {children}
  </div>
);

// --- Auth Screens ---
const AuthScreen = ({ role, onLogin, onSignup, setStep, setRole }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [masterKey, setMasterKey] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      if (isLogin) {
        await onLogin(email, password);
      } else {
        await onSignup(email, password, masterKey);
      }
    } catch (err) {
      setError(err.message.replace("Firebase: ", ""));
    }
    setLoading(false);
  };

  const handleGoogle = async () => {
    setLoading(true);
    try {
      if (isLogin) await onLogin(null, null, "google");
      else await onSignup(null, null, masterKey, "google");
    } catch (err) {
      setError(err.message);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-indigo-600 text-white mb-4 shadow-xl shadow-indigo-200">
            <Utensils size={32} />
          </div>
          <h1 className="text-3xl font-bold text-slate-900">Campus Eats</h1>
          <p className="text-slate-500 mt-2">Ordering food made simple</p>
        </div>

        <Card className="p-6 md:p-8">
          <div className="flex gap-2 p-1 bg-slate-100 rounded-xl mb-6">
            <button
              onClick={() => setIsLogin(true)}
              className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${isLogin ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
            >
              Log In
            </button>
            <button
              onClick={() => setIsLogin(false)}
              className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${!isLogin ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
            >
              Sign Up
            </button>
          </div>

          <h2 className="text-xl font-semibold mb-6 text-slate-800">
            {isLogin ? `Welcome back, ${role === "student" ? "Student" : "Staff"}!` : `Create ${role} Account`}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <Input
                label="Master Key"
                type="text"
                placeholder="Enter master key"
                value={masterKey}
                onChange={(e) => setMasterKey(e.target.value)}
              />
            )}
            <Input
              label="Email"
              type="email"
              placeholder="name@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <Input
              label="Password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />

            {error && <div className="p-3 rounded-lg bg-red-50 text-red-600 text-sm flex items-center gap-2"><ArrowRight size={14}/> {error}</div>}

            <Button disabled={loading} type="submit" className="w-full">
              {loading ? "Processing..." : (isLogin ? "Log In" : "Create Account")}
            </Button>
          </form>

          <div className="mt-6 pt-6 border-t border-slate-100">
             <Button variant="secondary" onClick={handleGoogle} className="w-full relative">
                <span className="absolute left-4">G</span>
                {isLogin ? "Log in with Google" : "Sign up with Google"}
             </Button>
          </div>
        </Card>

        <button
          onClick={() => { setStep("role"); setRole(null); }}
          className="w-full mt-6 text-sm text-slate-500 hover:text-indigo-600 font-medium"
        >
          ← Change Role
        </button>
      </div>
    </div>
  );
};

// --- Student App ---
const StudentApp = ({ menu, orders, addToOrder, user, userProfile, updateUserProfile, logout }) => {
  const [activeTab, setActiveTab] = useState("menu");
  const [cart, setCart] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [profileForm, setProfileForm] = useState({ name: "", studentId: "", phone: "" });

  useEffect(() => {
    if (userProfile) setProfileForm(userProfile);
  }, [userProfile]);

  const addItem = (item) => {
    setCart(prev => {
      const existing = prev.find(i => i.id === item.id);
      if (existing) {
        return prev.map(i => i.id === item.id ? { ...i, qty: i.qty + 1 } : i);
      }
      return [...prev, { ...item, qty: 1 }];
    });
  };

  const removeItem = (itemId) => {
    setCart(prev => prev.filter(i => i.id !== itemId));
  };

  const updateQty = (itemId, delta) => {
    setCart(prev => prev.map(i => {
      if (i.id === itemId) {
        return { ...i, qty: Math.max(1, i.qty + delta) };
      }
      return i;
    }));
  };

  const cartTotal = cart.reduce((acc, item) => acc + (item.price * item.qty), 0);
  const cartCount = cart.reduce((acc, item) => acc + item.qty, 0);

  const handlePlaceOrder = () => {
    if (!profileForm.name || !profileForm.studentId) {
      alert("Please complete your profile first!");
      setActiveTab("profile");
      return;
    }
    if (cart.length === 0) return;

    addToOrder({
      orderId: generateOrderId(),
      items: cart,
      totalAmount: cartTotal,
      studentUid: user.uid,
      studentName: profileForm.name,
      orderStatus: "Placed",
      paymentStatus: "Paid",
      createdAt: new Date().toISOString(),
      timestamp: Date.now()
    });
    setCart([]);
    setActiveTab("orders");
  };

  const filteredMenu = menu.filter(item => 
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="h-screen bg-slate-50 flex flex-col overflow-hidden">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-4 py-3 flex justify-between items-center sticky top-0 z-10">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white">
            <Utensils size={16} />
          </div>
          <h1 className="font-bold text-slate-800">Campus Eats</h1>
        </div>
        <div className="flex items-center gap-2">
           <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2 py-1 rounded-full">{userProfile?.name || "Student"}</span>
           <button onClick={logout} className="p-2 text-slate-400 hover:text-red-500 transition-colors">
            <LogOut size={18} />
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto pb-24">
        
        {/* MENU VIEW */}
        {activeTab === "menu" && (
          <div className="p-4 space-y-6">
            <div className="relative">
              <Search className="absolute left-3 top-3 text-slate-400" size={20} />
              <input 
                type="text" 
                placeholder="Search food..." 
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-white border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredMenu.map(item => (
                <Card key={item.id} className="flex flex-col gap-3 hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center text-2xl ${item.color || 'bg-slate-100'}`}>
                      {item.image}
                    </div>
                    <span className="text-sm font-semibold text-slate-900 bg-slate-100 px-2 py-1 rounded-md">{formatCurrency(item.price)}</span>
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800">{item.name}</h3>
                    <p className="text-xs text-slate-500 line-clamp-2 mt-1">{item.desc}</p>
                  </div>
                  <Button 
                    variant="secondary" 
                    className="w-full mt-auto py-2 text-sm text-indigo-600 border-indigo-100 hover:bg-indigo-50"
                    onClick={() => addItem(item)}
                  >
                    Add to Cart
                  </Button>
                </Card>
              ))}
            </div>
            
            {/* Floating Cart Button for Mobile */}
            {cartCount > 0 && (
              <div className="fixed bottom-20 left-4 right-4 z-20">
                <button 
                  onClick={() => setActiveTab("cart")}
                  className="w-full bg-slate-900 text-white p-4 rounded-xl shadow-xl flex justify-between items-center animate-in slide-in-from-bottom-4"
                >
                  <div className="flex items-center gap-3">
                    <div className="bg-indigo-500 w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs">
                      {cartCount}
                    </div>
                    <span className="font-medium">View Cart</span>
                  </div>
                  <span className="font-bold">{formatCurrency(cartTotal)}</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* CART VIEW */}
        {activeTab === "cart" && (
          <div className="p-4 max-w-2xl mx-auto h-full flex flex-col">
            <h2 className="text-2xl font-bold text-slate-800 mb-6">Your Cart</h2>
            
            {cart.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-slate-400 space-y-4">
                <ShoppingBag size={64} strokeWidth={1} />
                <p>Your cart is empty</p>
                <Button variant="ghost" onClick={() => setActiveTab("menu")}>Browse Menu</Button>
              </div>
            ) : (
              <div className="space-y-4 flex-1">
                {cart.map(item => (
                  <div key={item.id} className="bg-white p-4 rounded-xl border border-slate-100 flex items-center gap-4 shadow-sm">
                    <div className="text-2xl">{item.image}</div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-slate-800">{item.name}</h4>
                      <p className="text-sm text-slate-500">{formatCurrency(item.price)}</p>
                    </div>
                    <div className="flex items-center gap-3 bg-slate-50 rounded-lg p-1">
                      <button onClick={() => updateQty(item.id, -1)} className="p-1 hover:bg-white rounded-md transition-colors"><Minus size={14}/></button>
                      <span className="text-sm font-medium w-4 text-center">{item.qty}</span>
                      <button onClick={() => updateQty(item.id, 1)} className="p-1 hover:bg-white rounded-md transition-colors"><Plus size={14}/></button>
                    </div>
                    <button onClick={() => removeItem(item.id)} className="text-slate-300 hover:text-red-500 p-2">
                      <Trash2 size={18} />
                    </button>
                  </div>
                ))}
                
                <div className="mt-8 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4">
                  <div className="flex justify-between text-slate-600">
                    <span>Subtotal</span>
                    <span>{formatCurrency(cartTotal)}</span>
                  </div>
                  <div className="flex justify-between font-bold text-xl text-slate-900 pt-4 border-t border-slate-100">
                    <span>Total</span>
                    <span>{formatCurrency(cartTotal)}</span>
                  </div>
                  <Button onClick={handlePlaceOrder} className="w-full py-4 text-lg shadow-indigo-200">
                    Place Order
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ORDERS VIEW (Student) */}
        {activeTab === "orders" && (
          <div className="p-4 max-w-2xl mx-auto">
            <h2 className="text-2xl font-bold text-slate-800 mb-6">Order History</h2>
            <div className="space-y-6">
              {orders.filter(o => o.studentUid === user.uid).sort((a,b) => b.timestamp - a.timestamp).map(order => {
                // Generate the display code from the order ID (e.g., ORD-1234 -> 1234)
                const pickupCode = order.orderId.split('-')[1] || order.orderId;
                
                return (
                  <Card key={order.orderId} className={`overflow-hidden border-l-4 ${order.orderStatus === 'Served' ? 'border-l-green-500 opacity-80' : 'border-l-indigo-500'}`}>
                    {order.orderStatus === "Placed" && (
                      <div className="bg-indigo-50 -m-4 mb-4 p-6 flex flex-col items-center justify-center text-center border-b border-indigo-100">
                        <div className="bg-white p-2 rounded-xl mb-3 shadow-sm">
                          <QrCode size={80} className="text-slate-800"/>
                        </div>
                        <p className="text-xs font-bold text-indigo-400 uppercase tracking-widest mb-1">Pickup Code</p>
                        <h3 className="text-4xl font-black text-indigo-600 tracking-wider font-mono">{pickupCode}</h3>
                        <p className="text-xs text-slate-500 mt-2">Show this code to the staff to collect your order</p>
                      </div>
                    )}
                    
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-slate-800">Order #{pickupCode}</h3>
                          <span className={`text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wider font-bold ${
                            order.orderStatus === "Served" ? "bg-green-100 text-green-700" : "bg-blue-100 text-blue-700"
                          }`}>
                            {order.orderStatus}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-1">{new Date(order.createdAt).toLocaleString()}</p>
                      </div>
                      <span className="font-bold text-slate-900">{formatCurrency(order.totalAmount)}</span>
                    </div>
                    
                    <div className="space-y-2">
                      {order.items.map((item, idx) => (
                        <div key={idx} className="flex justify-between text-sm text-slate-600 border-b border-slate-50 last:border-0 pb-2 last:pb-0">
                          <span>{item.qty}x {item.name}</span>
                          <span>{formatCurrency(item.price * item.qty)}</span>
                        </div>
                      ))}
                    </div>
                    
                    {order.orderStatus === "Served" && (
                      <div className="mt-4 pt-3 border-t border-slate-100 text-center">
                        <p className="text-xs text-green-600 font-medium flex items-center justify-center gap-1">
                          <CheckCircle size={12}/> Order Picked Up
                        </p>
                      </div>
                    )}
                  </Card>
                );
              })}
              
              {orders.filter(o => o.studentUid === user.uid).length === 0 && (
                 <div className="text-center text-slate-400 py-10">No orders yet</div>
              )}
            </div>
          </div>
        )}

        {/* PROFILE VIEW */}
        {activeTab === "profile" && (
          <div className="p-4 max-w-md mx-auto">
            <h2 className="text-2xl font-bold text-slate-800 mb-6">My Profile</h2>
            <Card className="space-y-4">
              <div className="flex justify-center mb-4">
                 <div className="w-20 h-20 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center text-2xl font-bold">
                    {profileForm.name ? profileForm.name[0].toUpperCase() : <User />}
                 </div>
              </div>
              <Input 
                label="Full Name" 
                value={profileForm.name} 
                onChange={e => setProfileForm({...profileForm, name: e.target.value})} 
              />
              <Input 
                label="Student ID / Roll No" 
                value={profileForm.studentId} 
                onChange={e => setProfileForm({...profileForm, studentId: e.target.value})} 
              />
              <Input 
                label="Phone Number" 
                value={profileForm.phone || ""} 
                onChange={e => setProfileForm({...profileForm, phone: e.target.value})} 
              />
              <div className="pt-4">
                <Button onClick={() => updateUserProfile(profileForm)} className="w-full">
                  Save Changes
                </Button>
              </div>
            </Card>
          </div>
        )}
      </main>

      {/* Bottom Navigation */}
      <nav className="bg-white border-t border-slate-200 flex justify-around items-center p-2 pb-safe sticky bottom-0 z-50">
        {[
          { id: "menu", icon: Utensils, label: "Menu" },
          { id: "cart", icon: ShoppingBag, label: "Cart", badge: cartCount },
          { id: "orders", icon: Clock, label: "Orders" },
          { id: "profile", icon: User, label: "Profile" }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex flex-col items-center p-2 rounded-xl transition-all w-16 ${
              activeTab === tab.id ? "text-indigo-600 bg-indigo-50" : "text-slate-400 hover:text-slate-600"
            }`}
          >
            <div className="relative">
              <tab.icon size={22} strokeWidth={activeTab === tab.id ? 2.5 : 2} />
              {tab.badge > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-bold">
                  {tab.badge}
                </span>
              )}
            </div>
            <span className="text-[10px] font-medium mt-1">{tab.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
};

// --- Staff App ---
const StaffApp = ({ orders, updateOrder, logout, menu, onUpdateMenu, onDeleteMenu, onAddMenu }) => {
  const [activeTab, setActiveTab] = useState("dashboard"); // dashboard | menu
  const [filter, setFilter] = useState("Placed");
  const [verifyModalOpen, setVerifyModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [verificationCode, setVerificationCode] = useState("");
  
  // Menu Editing State
  const [isEditingMenu, setIsEditingMenu] = useState(false);
  const [menuForm, setMenuForm] = useState({ name: "", price: "", category: "", desc: "", image: "🍲" });
  const [editingItemId, setEditingItemId] = useState(null);

  const filteredOrders = orders
    .filter(o => filter === "All" ? true : o.orderStatus === filter)
    .sort((a,b) => b.timestamp - a.timestamp);

  const stats = {
    pending: orders.filter(o => o.orderStatus === "Placed").length,
    served: orders.filter(o => o.orderStatus === "Served").length,
    revenue: orders.reduce((acc, o) => acc + o.totalAmount, 0)
  };

  const handleVerify = () => {
    if (!selectedOrder) return;
    const actualCode = selectedOrder.orderId.split('-')[1];
    
    if (verificationCode === actualCode) {
      updateOrder(selectedOrder.orderId, { orderStatus: "Served" });
      setVerifyModalOpen(false);
      setVerificationCode("");
      setSelectedOrder(null);
    } else {
      alert("Incorrect Code! Please check with the student.");
    }
  };

  const handleSaveMenu = () => {
    if (!menuForm.name || !menuForm.price) return alert("Name and Price required");
    
    const itemData = {
      ...menuForm,
      price: Number(menuForm.price),
      available: true
    };

    if (editingItemId) {
      onUpdateMenu(editingItemId, itemData);
    } else {
      onAddMenu({ ...itemData, id: Date.now() }); // Simple ID for now
    }
    
    setIsEditingMenu(false);
    setMenuForm({ name: "", price: "", category: "", desc: "", image: "🍲" });
    setEditingItemId(null);
  };

  const openEditMenu = (item) => {
    setMenuForm(item);
    setEditingItemId(item.docId); // Use Firestore doc ID
    setIsEditingMenu(true);
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col">
      <header className="bg-slate-900 text-white px-6 py-4 flex justify-between items-center shadow-md sticky top-0 z-20">
        <div className="flex items-center gap-3">
          <ChefHat className="text-orange-400" />
          <div>
             <h1 className="font-bold text-lg leading-none">Kitchen Dashboard</h1>
             <p className="text-xs text-slate-400">Manage orders efficiently</p>
          </div>
        </div>
        
        <div className="flex gap-2">
           <button 
             onClick={() => setActiveTab("dashboard")} 
             className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'dashboard' ? 'bg-orange-500 text-white' : 'text-slate-300 hover:text-white'}`}
           >
             Orders
           </button>
           <button 
             onClick={() => setActiveTab("menu")} 
             className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'menu' ? 'bg-orange-500 text-white' : 'text-slate-300 hover:text-white'}`}
           >
             Menu
           </button>
           <button onClick={logout} className="ml-4 p-2 bg-slate-800 rounded-lg hover:bg-slate-700 text-slate-300 hover:text-white transition-colors">
             <LogOut size={18}/>
           </button>
        </div>
      </header>

      <main className="flex-1 p-6 max-w-7xl mx-auto w-full">
        {activeTab === "dashboard" && (
          <>
            {/* Stats Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              <Card className="flex items-center gap-4 border-l-4 border-l-blue-500">
                 <div className="p-3 bg-blue-50 text-blue-600 rounded-full"><Clock/></div>
                 <div>
                    <p className="text-sm text-slate-500 font-medium">Pending Orders</p>
                    <p className="text-2xl font-bold text-slate-800">{stats.pending}</p>
                 </div>
              </Card>
              <Card className="flex items-center gap-4 border-l-4 border-l-green-500">
                 <div className="p-3 bg-green-50 text-green-600 rounded-full"><CheckCircle/></div>
                 <div>
                    <p className="text-sm text-slate-500 font-medium">Completed</p>
                    <p className="text-2xl font-bold text-slate-800">{stats.served}</p>
                 </div>
              </Card>
              <Card className="flex items-center gap-4 border-l-4 border-l-indigo-500">
                 <div className="p-3 bg-indigo-50 text-indigo-600 rounded-full"><CreditCard/></div>
                 <div>
                    <p className="text-sm text-slate-500 font-medium">Total Revenue</p>
                    <p className="text-2xl font-bold text-slate-800">{formatCurrency(stats.revenue)}</p>
                 </div>
              </Card>
            </div>

            {/* Filters */}
            <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
              {["Placed", "Served", "All"].map(f => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-5 py-2 rounded-full font-medium text-sm transition-all whitespace-nowrap ${
                    filter === f 
                    ? "bg-slate-900 text-white shadow-md" 
                    : "bg-white text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {f === "Placed" ? "Pending" : f}
                </button>
              ))}
            </div>

            {/* Orders Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredOrders.map(order => (
                <Card key={order.orderId} className={`flex flex-col h-full hover:shadow-lg transition-all ${order.orderStatus === "Served" ? "opacity-75 bg-slate-50" : "border-indigo-100"}`}>
                  <div className="flex justify-between items-start mb-4 pb-4 border-b border-slate-100">
                     <div>
                        {/* HIDE ORDER ID from Staff to force verification */}
                        <div className="flex items-center gap-2 mb-1">
                          <User size={16} className="text-slate-400"/>
                          <h3 className="font-bold text-lg text-slate-800">{order.studentName}</h3>
                        </div>
                        <p className="text-xs text-slate-500">{new Date(order.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                     </div>
                     <div className="text-right">
                        <p className="font-bold text-slate-900 bg-slate-100 px-2 py-1 rounded">{formatCurrency(order.totalAmount)}</p>
                     </div>
                  </div>

                  <div className="flex-1 space-y-3 mb-6">
                     {order.items.map((item, i) => (
                       <div key={i} className="flex justify-between items-center text-sm">
                          <div className="flex items-center gap-2">
                             <span className="bg-slate-200 text-slate-700 font-bold px-2 py-0.5 rounded text-xs">{item.qty}x</span>
                             <span className="text-slate-700">{item.name}</span>
                          </div>
                       </div>
                     ))}
                  </div>

                  {order.orderStatus === "Placed" ? (
                    <Button 
                       onClick={() => {
                         setSelectedOrder(order);
                         setVerifyModalOpen(true);
                       }}
                       className="w-full mt-auto bg-slate-900 hover:bg-slate-800 text-white"
                    >
                       Verify & Serve <QrCode size={18}/>
                    </Button>
                  ) : (
                    <div className="mt-auto text-center py-2 bg-green-100 text-green-700 rounded-lg font-medium text-sm flex items-center justify-center gap-2">
                       <CheckCircle size={16}/> Served
                    </div>
                  )}
                </Card>
              ))}
              
              {filteredOrders.length === 0 && (
                 <div className="col-span-full flex flex-col items-center justify-center py-20 text-slate-400">
                    <Coffee size={48} className="mb-4 opacity-20"/>
                    <p>No orders found for this filter.</p>
                 </div>
              )}
            </div>
          </>
        )}

        {/* MENU MANAGEMENT TAB */}
        {activeTab === "menu" && (
          <div className="max-w-4xl mx-auto">
             <div className="flex justify-between items-center mb-6">
               <h2 className="text-2xl font-bold text-slate-800">Menu Management</h2>
               <Button onClick={() => {
                 setMenuForm({ name: "", price: "", category: "", desc: "", image: "🍲" });
                 setEditingItemId(null);
                 setIsEditingMenu(true);
               }} className="gap-2">
                 <PlusCircle size={20}/> Add Item
               </Button>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               {menu.map(item => (
                 <div key={item.id} className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex items-start gap-4">
                    <div className="w-16 h-16 bg-slate-100 rounded-lg flex items-center justify-center text-3xl">
                      {item.image}
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between">
                        <h3 className="font-bold text-slate-800">{item.name}</h3>
                        <span className="font-medium text-slate-600">{formatCurrency(item.price)}</span>
                      </div>
                      <p className="text-sm text-slate-500 mb-2">{item.category}</p>
                      <div className="flex gap-2 mt-2">
                        <button onClick={() => openEditMenu(item)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                          <Edit size={16}/>
                        </button>
                        <button onClick={() => onDeleteMenu(item.docId)} className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                          <Trash2 size={16}/>
                        </button>
                      </div>
                    </div>
                 </div>
               ))}
             </div>
          </div>
        )}
      </main>

      {/* VERIFICATION MODAL */}
      {verifyModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm p-6 shadow-2xl animate-in fade-in zoom-in-95">
             <div className="text-center mb-6">
               <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4 text-indigo-600">
                 <QrCode size={32}/>
               </div>
               <h3 className="text-xl font-bold text-slate-900">Verify Order</h3>
               <p className="text-sm text-slate-500 mt-2">Enter the 4-digit code shown on the student's device.</p>
             </div>
             
             <input
               autoFocus
               type="text" 
               maxLength={4}
               placeholder="0000"
               className="w-full text-center text-3xl tracking-[1em] font-mono font-bold border-b-2 border-slate-200 focus:border-indigo-600 outline-none py-4 mb-6 bg-transparent"
               value={verificationCode}
               onChange={e => setVerificationCode(e.target.value)}
             />
             
             <div className="grid grid-cols-2 gap-3">
               <Button variant="secondary" onClick={() => setVerifyModalOpen(false)}>Cancel</Button>
               <Button onClick={handleVerify}>Confirm</Button>
             </div>
          </div>
        </div>
      )}

      {/* MENU EDIT MODAL */}
      {isEditingMenu && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl overflow-y-auto max-h-[90vh]">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-slate-900">{editingItemId ? "Edit Item" : "New Item"}</h3>
              <button onClick={() => setIsEditingMenu(false)} className="text-slate-400 hover:text-slate-600"><X/></button>
            </div>
            
            <div className="space-y-4">
              <Input label="Item Name" value={menuForm.name} onChange={e => setMenuForm({...menuForm, name: e.target.value})} />
              <div className="grid grid-cols-2 gap-4">
                <Input label="Price (₹)" type="number" value={menuForm.price} onChange={e => setMenuForm({...menuForm, price: e.target.value})} />
                <Input label="Category" placeholder="Lunch, Snacks..." value={menuForm.category} onChange={e => setMenuForm({...menuForm, category: e.target.value})} />
              </div>
              <Input label="Description" value={menuForm.desc} onChange={e => setMenuForm({...menuForm, desc: e.target.value})} />
              <Input label="Image (Emoji)" value={menuForm.image} onChange={e => setMenuForm({...menuForm, image: e.target.value})} />
              
              <div className="pt-4 flex gap-3">
                 <Button className="flex-1" onClick={handleSaveMenu}>Save Item</Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};


// --- Component Demo ---
const ComponentDemo = ({ onBack }) => {
  const [selectedTheme, setSelectedTheme] = useState('default');

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      <div className="sticky top-0 z-50 bg-slate-900/80 backdrop-blur-sm border-b border-slate-700 p-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <button
            onClick={onBack}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors flex items-center gap-2"
          >
            <ArrowRight size={16} className="rotate-180" />
            Back to App
          </button>
          <h1 className="text-xl font-bold flex items-center gap-2">
            <Palette size={24} />
            Component Showcase
          </h1>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6 space-y-12">
        {/* Theme Selector */}
        <div className="bg-slate-800 rounded-2xl p-6">
          <h2 className="text-2xl font-bold mb-4">DarkVeil Theme Selector</h2>
          <div className="flex flex-wrap gap-3">
            {Object.keys(THEMES).map(theme => (
              <button
                key={theme}
                onClick={() => setSelectedTheme(theme)}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  selectedTheme === theme
                    ? 'bg-indigo-600 text-white shadow-lg'
                    : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                }`}
              >
                {theme.charAt(0).toUpperCase() + theme.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* DarkVeil Demo */}
        <section className="relative rounded-2xl overflow-hidden" style={{ height: '600px' }}>
          <DarkVeil
            theme={selectedTheme}
            speed={THEMES[selectedTheme]?.speed || 0.5}
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="bg-slate-900/60 backdrop-blur-sm rounded-xl p-8 text-center">
              <h3 className="text-3xl font-bold mb-2">DarkVeil Background</h3>
              <p className="text-slate-300">Theme: {selectedTheme}</p>
            </div>
          </div>
        </section>

        {/* GradualBlur Demo */}
        <section style={{ position: 'relative', height: '500px', overflow: 'hidden' }} className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl">
          <div style={{ height: '100%', overflowY: 'auto', padding: '6rem 2rem' }}>
            <div className="space-y-4 text-white">
              <h3 className="text-2xl font-bold">GradualBlur Component</h3>
              <p>This section demonstrates the gradual blur effect at the bottom.</p>
              <p>Scroll down to see the blur effect in action.</p>
              <div className="space-y-2 mt-8">
                {Array.from({ length: 10 }).map((_, i) => (
                  <div key={i} className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                    <p>Content item {i + 1} - Scroll to see the blur effect</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <GradualBlur
            target="parent"
            position="bottom"
            height="7rem"
            strength={2}
            divCount={5}
            curve="bezier"
            exponential
            opacity={1}
          />
        </section>

        {/* GlareHover Demo */}
        <section className="flex items-center justify-center min-h-[400px]">
          <GlareHover
            width="100%"
            height="400px"
            background="linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
            borderRadius="20px"
            borderColor="#8b5cf6"
            glareColor="#ffffff"
            glareOpacity={0.3}
            glareAngle={-30}
            glareSize={300}
            transitionDuration={800}
            playOnce={false}
            className="max-w-2xl"
          >
            <div className="text-center p-8">
              <h2 style={{ fontSize: '3rem', fontWeight: '900', color: '#fff', margin: 0 }}>
                Hover Me
              </h2>
              <p className="text-white/80 mt-4 text-lg">Move your mouse over this card to see the glare effect</p>
            </div>
          </GlareHover>
        </section>
      </div>
    </div>
  );
};

// --- Role Selector ---
const RoleSelector = ({ onSelect, onShowDemo }) => (
  <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
    <div className="text-center mb-10 animate-in slide-in-from-top-10 fade-in duration-700">
       <h1 className="text-4xl font-extrabold text-slate-900 mb-2 tracking-tight">Campus Eats</h1>
       <p className="text-lg text-slate-500">Choose your portal to continue</p>
    </div>
    
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-3xl mb-6">
       <button 
         onClick={() => onSelect("student")}
         className="group relative bg-white p-8 rounded-3xl shadow-sm hover:shadow-xl transition-all duration-300 border border-slate-100 hover:border-indigo-500 flex flex-col items-center text-center gap-4 overflow-hidden"
       >
         <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 to-purple-500 opacity-0 group-hover:opacity-100 transition-opacity"/>
         <div className="w-20 h-20 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
            <User size={40} />
         </div>
         <div>
            <h3 className="text-xl font-bold text-slate-800 group-hover:text-indigo-600 transition-colors">Student</h3>
            <p className="text-sm text-slate-500 mt-2">Browse menu, place orders, and track your food history.</p>
         </div>
       </button>

       <button 
         onClick={() => onSelect("staff")}
         className="group relative bg-white p-8 rounded-3xl shadow-sm hover:shadow-xl transition-all duration-300 border border-slate-100 hover:border-orange-500 flex flex-col items-center text-center gap-4 overflow-hidden"
       >
         <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-orange-500 to-red-500 opacity-0 group-hover:opacity-100 transition-opacity"/>
         <div className="w-20 h-20 bg-orange-50 text-orange-600 rounded-2xl flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
            <ChefHat size={40} />
         </div>
         <div>
            <h3 className="text-xl font-bold text-slate-800 group-hover:text-orange-600 transition-colors">Canteen Staff</h3>
            <p className="text-sm text-slate-500 mt-2">Manage incoming orders, update status, and view sales.</p>
         </div>
       </button>
    </div>

    <button
      onClick={onShowDemo}
      className="px-6 py-3 bg-gradient-to-r from-purple-500 to-indigo-500 text-white rounded-xl font-medium hover:shadow-lg transition-all flex items-center gap-2"
    >
      <Palette size={20} />
      View Component Demo
    </button>
  </div>
);

/* ================= MAIN CONTROLLER ================= */

export default function App() {
  const [step, setStep] = useState("role"); // role | auth | app | demo
  const [role, setRole] = useState(null); // student | staff
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  
  // Data State
  const [menu, setMenu] = useState([]);
  const [orders, setOrders] = useState([]);

  /* --- AUTH & INIT --- */
  useEffect(() => {
    // Auth Listener
    const unsubscribeAuth = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        // Check for user profile in Firestore
        const userDocRef = doc(db, "artifacts", APP_ID, "users", currentUser.uid);
        const userDocSnap = await getDoc(userDocRef);
        
        if (userDocSnap.exists()) {
          setUser(currentUser);
          const data = userDocSnap.data();
          setUserProfile(data);
          // If role matches or if we want to auto-redirect
          setRole(data.role); 
          setStep("app");
        } else {
          // User authenticated but no profile (mid-signup state or error)
          // We'll handle this in the signup flow
          setUser(null);
        }
      } else {
        setUser(null);
        setUserProfile(null);
        setStep("role");
      }
    });
    return () => unsubscribeAuth();
  }, []);

  /* --- DATA LISTENERS --- */
  useEffect(() => {
    // 1. Menu Listener (Global - always listen if app is mounted or just when user is active)
    const menuRef = collection(db, "artifacts", APP_ID, "public", "data", "menu");
    const unsubscribeMenu = onSnapshot(menuRef, (snapshot) => {
      const loadedMenu = snapshot.docs.map(doc => ({ ...doc.data(), docId: doc.id }));
      if (loadedMenu.length > 0) {
        setMenu(loadedMenu);
      } else {
        // Seed initial menu if empty
        setMenu(INITIAL_MENU);
        INITIAL_MENU.forEach(item => {
           addDoc(menuRef, item);
        });
      }
    });

    if (!user) return unsubscribeMenu;
    
    // 2. Orders Listener (Only when logged in)
    const ordersRef = collection(db, "artifacts", APP_ID, "public", "data", "orders");
    const unsubscribeOrders = onSnapshot(ordersRef, (snapshot) => {
      const loadedOrders = snapshot.docs.map(doc => ({
        ...doc.data(),
        docId: doc.id // Important for updates
      }));
      setOrders(loadedOrders);
    });

    return () => {
      unsubscribeMenu();
      unsubscribeOrders();
    };
  }, [user]);

  /* --- ACTIONS --- */
  const handleRoleSelect = (selectedRole) => {
    setRole(selectedRole);
    setStep("auth");
  };

  const handleLogin = async (email, password, method = "email") => {
    if (method === "google") {
      await signInWithPopup(auth, googleProvider);
    } else {
      await signInWithEmailAndPassword(auth, email, password);
    }
  };

  const handleSignup = async (email, password, masterKey, method = "email") => {
    if (masterKey !== MASTER_KEY) throw new Error("Invalid Master Key");
    
    let userCredential;
    if (method === "google") {
      userCredential = await signInWithPopup(auth, googleProvider);
    } else {
      userCredential = await createUserWithEmailAndPassword(auth, email, password);
    }

    const profileData = {
      uid: userCredential.user.uid,
      role: role,
      email: userCredential.user.email,
      name: userCredential.user.displayName || "",
      provider: method,
      createdAt: new Date().toISOString()
    };

    await setDoc(doc(db, "artifacts", APP_ID, "users", userCredential.user.uid), profileData);
  };

  const handleLogout = async () => {
    await signOut(auth);
    setStep("role");
    setRole(null);
  };

  const addToOrder = async (orderData) => {
    await addDoc(collection(db, "artifacts", APP_ID, "public", "data", "orders"), orderData);
  };

  const updateOrder = async (orderId, updates) => {
    const order = orders.find(o => o.orderId === orderId);
    if (!order || !order.docId) return;
    
    await updateDoc(
      doc(db, "artifacts", APP_ID, "public", "data", "orders", order.docId),
      updates
    );
  };

  // Menu Management Actions
  const handleAddMenuItem = async (item) => {
    await addDoc(collection(db, "artifacts", APP_ID, "public", "data", "menu"), item);
  };

  const handleUpdateMenuItem = async (docId, updates) => {
    await updateDoc(doc(db, "artifacts", APP_ID, "public", "data", "menu", docId), updates);
  };

  const handleDeleteMenuItem = async (docId) => {
    await deleteDoc(doc(db, "artifacts", APP_ID, "public", "data", "menu", docId));
  };

  const updateUserProfile = async (data) => {
    if (!user) return;
    await setDoc(doc(db, "artifacts", APP_ID, "users", user.uid), data, { merge: true });
    setUserProfile(prev => ({ ...prev, ...data }));
  };

  /* --- RENDER --- */
  if (step === "demo") {
    return <ComponentDemo onBack={() => setStep("role")} />;
  }

  if (step === "role") {
    return <RoleSelector onSelect={handleRoleSelect} onShowDemo={() => setStep("demo")} />;
  }

  if (step === "auth") {
    return (
      <AuthScreen 
        role={role} 
        onLogin={handleLogin} 
        onSignup={handleSignup}
        setStep={setStep}
        setRole={setRole}
      />
    );
  }

  if (step === "app" && user && userProfile) {
    if (userProfile.role === "student") {
      return (
        <StudentApp 
          menu={menu}
          orders={orders}
          addToOrder={addToOrder}
          user={user}
          userProfile={userProfile}
          updateUserProfile={updateUserProfile}
          logout={handleLogout}
        />
      );
    } else {
      return (
        <StaffApp 
          orders={orders}
          menu={menu}
          updateOrder={updateOrder}
          onAddMenu={handleAddMenuItem}
          onUpdateMenu={handleUpdateMenuItem}
          onDeleteMenu={handleDeleteMenuItem}
          logout={handleLogout}
        />
      );
    }
  }

  return (
    <div className="h-screen w-full flex items-center justify-center bg-slate-50 text-indigo-600">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-current"></div>
    </div>
  );
}

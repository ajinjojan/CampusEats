<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Campus Eats</title>
    
    <!-- Tailwind CSS -->
    <script src="https://cdn.tailwindcss.com"></script>
    
    <!-- Fonts -->
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">

    <!-- Import Map -->
    <script type="importmap">
    {
        "imports": {
            "react": "https://esm.sh/react@18.2.0",
            "react-dom/client": "https://esm.sh/react-dom@18.2.0/client",
            "lucide-react": "https://esm.sh/lucide-react@0.263.1",
            "firebase/app": "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js",
            "firebase/auth": "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js",
            "firebase/firestore": "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js",
            "ogl": "https://esm.sh/ogl@1.0.1"
        }
    }
    </script>

    <!-- Babel for JSX -->
    <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>

    <style>
        body {
            font-family: 'Inter', sans-serif;
            -webkit-font-smoothing: antialiased;
        }
        
        .fade-in { animation: fadeIn 0.5s ease-in; }
        .slide-up { animation: slideUp 0.5s ease-out; }
        
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideUp { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
    </style>
</head>
<body class="bg-black text-slate-200 transition-colors duration-500">
    <div id="root"></div>

    <script type="text/babel" data-type="module">
        import React, { useEffect, useState, useRef, useMemo, createContext, useContext } from "react";
        import { createRoot } from "react-dom/client";
        import { Renderer, Program, Mesh, Triangle, Vec2 } from "ogl";
        import {
            Utensils, ShoppingBag, CreditCard,
            CheckCircle, User, LogOut,
            Coffee, Clock, Search, Plus, Minus,
            ChefHat, Trash2, ArrowRight, QrCode,
            Edit, PlusCircle, X, Palette, Settings
        } from "lucide-react";

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

        /* ================= THEME SYSTEM ================= */

        const THEMES = {
            midnight: {
                name: "Midnight",
                colors: {
                    bg: "bg-slate-950",
                    text: "text-slate-200",
                    textMuted: "text-slate-400",
                    card: "bg-white/5",
                    cardBorder: "border-white/10",
                    primary: "bg-indigo-600",
                    primaryHover: "hover:bg-indigo-700",
                    primaryRing: "focus:ring-indigo-500",
                    secondary: "bg-white/10",
                    accent: "text-indigo-400",
                    buttonText: "text-white",
                    glare: "#6366f1",
                    hueShift: 240
                }
            },
            forest: {
                name: "Forest",
                colors: {
                    bg: "bg-green-950",
                    text: "text-emerald-100",
                    textMuted: "text-emerald-400/70",
                    card: "bg-emerald-900/20",
                    cardBorder: "border-emerald-500/20",
                    primary: "bg-emerald-600",
                    primaryHover: "hover:bg-emerald-500",
                    primaryRing: "focus:ring-emerald-500",
                    secondary: "bg-emerald-900/40",
                    accent: "text-emerald-300",
                    buttonText: "text-white",
                    glare: "#10b981",
                    hueShift: 120
                }
            },
            ocean: {
                name: "Ocean",
                colors: {
                    bg: "bg-blue-950",
                    text: "text-cyan-100",
                    textMuted: "text-cyan-400/70",
                    card: "bg-cyan-900/10",
                    cardBorder: "border-cyan-500/20",
                    primary: "bg-cyan-600",
                    primaryHover: "hover:bg-cyan-500",
                    primaryRing: "focus:ring-cyan-500",
                    secondary: "bg-cyan-900/30",
                    accent: "text-cyan-300",
                    buttonText: "text-white",
                    glare: "#06b6d4",
                    hueShift: 180
                }
            },
            crimson: {
                name: "Crimson",
                colors: {
                    bg: "bg-red-950",
                    text: "text-rose-100",
                    textMuted: "text-rose-400/70",
                    card: "bg-rose-900/10",
                    cardBorder: "border-rose-500/20",
                    primary: "bg-rose-600",
                    primaryHover: "hover:bg-rose-500",
                    primaryRing: "focus:ring-rose-500",
                    secondary: "bg-rose-900/30",
                    accent: "text-rose-300",
                    buttonText: "text-white",
                    glare: "#e11d48",
                    hueShift: 320 // Pinkish red
                }
            }
        };

        const ThemeContext = createContext({
            theme: THEMES.midnight,
            setTheme: () => {}
        });

        // --- Gradual Blur Component ---
        const GradualBlur = React.memo(({
            position = 'bottom',
            strength = 2,
            height = '6rem',
            divCount = 5,
            exponential = false,
            opacity = 1,
            className = '',
            style = {}
        }) => {
            const divs = useMemo(() => {
                const elements = [];
                const increment = 100 / divCount;
                
                for (let i = 1; i <= divCount; i++) {
                    const progress = i / divCount;
                    // Simple linear curve
                    
                    let blurValue;
                    if (exponential) {
                        blurValue = Math.pow(2, progress * 4) * 0.0625 * strength;
                    } else {
                        blurValue = 0.0625 * (progress * divCount + 1) * strength;
                    }

                    const p1 = Math.round((increment * i - increment) * 10) / 10;
                    const p2 = Math.round(increment * i * 10) / 10;
                    
                    // Direction mapping
                    const directions = {
                        top: 'to top',
                        bottom: 'to bottom',
                        left: 'to left',
                        right: 'to right'
                    };
                    const direction = directions[position] || 'to bottom';

                    // Create mask gradient
                    const gradient = `transparent ${p1}%, black ${p2}%`;

                    const divStyle = {
                        position: 'absolute',
                        inset: '0',
                        maskImage: `linear-gradient(${direction}, ${gradient})`,
                        WebkitMaskImage: `linear-gradient(${direction}, ${gradient})`,
                        backdropFilter: `blur(${blurValue.toFixed(3)}rem)`,
                        WebkitBackdropFilter: `blur(${blurValue.toFixed(3)}rem)`,
                        opacity: opacity,
                        pointerEvents: 'none'
                    };

                    elements.push(<div key={i} style={divStyle} />);
                }
                return elements;
            }, [divCount, strength, exponential, position, opacity]);

            const containerStyle = {
                position: 'absolute',
                pointerEvents: 'none',
                zIndex: 20,
                ...style
            };

            // Set positioning based on prop
            if (['top', 'bottom'].includes(position)) {
                containerStyle.height = height;
                containerStyle.width = '100%';
                containerStyle.left = 0;
                containerStyle[position] = 0;
            } else {
                containerStyle.width = height;
                containerStyle.height = '100%';
                containerStyle.top = 0;
                containerStyle[position] = 0;
            }

            return (
                <div className={className} style={containerStyle}>
                    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
                        {divs}
                    </div>
                </div>
            );
        });

        // --- Glare Hover Component (FIXED) ---
        const GlareHover = ({
            width = '100%',
            height = '100%',
            borderRadius = '1.5rem',
            children,
            glareColor = '#ffffff',
            glareOpacity = 0.4,
            glareAngle = 135,
            transitionDuration = 600,
            className = '',
            onClick
        }) => {
            const overlayRef = useRef(null);

            const animateIn = () => {
                const el = overlayRef.current;
                if (!el) return;
                
                // Reset position (off-screen left/bottom)
                el.style.transition = 'none';
                el.style.backgroundPosition = '200% 50%'; 
                
                // Force reflow
                void el.offsetWidth;
                
                // Animate to end position (off-screen right/top)
                el.style.transition = `background-position ${transitionDuration}ms ease-out, opacity ${transitionDuration}ms ease-out`;
                el.style.backgroundPosition = '-100% 50%';
                el.style.opacity = glareOpacity;
            };

            const animateOut = () => {
                const el = overlayRef.current;
                if (!el) return;
                
                el.style.transition = `opacity ${transitionDuration/2}ms ease-out`;
                el.style.opacity = 0;
            };

            const overlayStyle = {
                position: 'absolute',
                inset: 0,
                // A narrow strip of glare
                background: `linear-gradient(${glareAngle}deg, transparent 40%, ${glareColor} 50%, transparent 60%)`,
                backgroundSize: '250% 250%', // Large size to allow movement
                backgroundPosition: '200% 50%', // Start off-screen
                pointerEvents: 'none',
                zIndex: 10,
                borderRadius: borderRadius,
                opacity: 0, // Hidden by default
                mixBlendMode: 'overlay'
            };

            return (
                <div
                    className={className}
                    style={{ 
                        width, 
                        height, 
                        borderRadius, 
                        position: 'relative', 
                        overflow: 'hidden', 
                        cursor: 'pointer' 
                    }}
                    onMouseEnter={animateIn}
                    onMouseLeave={animateOut}
                    onClick={onClick}
                >
                    <div ref={overlayRef} style={overlayStyle} />
                    {children}
                </div>
            );
        };

        // --- DarkVeil WebGL Component ---
        const vertex = `
            attribute vec2 position;
            void main() {
                gl_Position = vec4(position, 0.0, 1.0);
            }
        `;

        const fragment = `
            precision lowp float;
            uniform vec2 uResolution;
            uniform float uTime;
            uniform float uHueShift;
            uniform float uNoise;
            uniform float uWarp;
            uniform vec2 uMouse;

            mat3 rgb2yiq=mat3(0.299,0.587,0.114,0.596,-0.274,-0.322,0.211,-0.523,0.312);
            mat3 yiq2rgb=mat3(1.0,0.956,0.621,1.0,-0.272,-0.647,1.0,-1.106,1.703);

            vec3 hueShiftRGB(vec3 col,float deg){
                vec3 yiq=rgb2yiq*col;
                float rad=radians(deg);
                float c=cos(rad), s=sin(rad);
                vec3 yiqShift=vec3(yiq.x, yiq.y*c-yiq.z*s, yiq.y*s+yiq.z*c);
                return clamp(yiq2rgb*yiqShift,0.0,1.0);
            }

            float rand(vec2 c){ return fract(sin(dot(c,vec2(12.9898,78.233)))*43758.5453); }

            void main() {
                vec2 uv = gl_FragCoord.xy / uResolution.xy * 2.0 - 1.0;
                uv.y *= -1.0;
                float d = length(uv - uMouse);
                float influence = exp(-d * 3.0) * uWarp;
                vec2 swirl = vec2(-(uv.y - uMouse.y), (uv.x - uMouse.x));
                uv += normalize(swirl) * influence * 0.15;
                uv += 0.05 * uWarp * vec2(sin(uv.y * 6.283 + uTime), cos(uv.x * 6.283 + uTime));
                vec3 col = vec3(0.5 + 0.5 * sin(uv.x + uTime), 0.5 + 0.5 * sin(uv.y + uTime), 0.5 + 0.5 * sin(uTime));
                col = hueShiftRGB(col, uHueShift);
                col += (rand(gl_FragCoord.xy + uTime) - 0.5) * uNoise;
                gl_FragColor = vec4(col, 1.0);
            }
        `;

        function DarkVeil({ hueShift = 0, noiseIntensity = 0.02, warpAmount = 0.8, speed = 0.5 }) {
            const canvasRef = useRef(null);
            const mouse = useRef(new Vec2(0, 0));

            useEffect(() => {
                const canvas = canvasRef.current;
                const parent = canvas.parentElement;
                const renderer = new Renderer({ canvas, alpha: true });
                const gl = renderer.gl;
                const geometry = new Triangle(gl);
                const program = new Program(gl, {
                    vertex,
                    fragment,
                    uniforms: {
                        uTime: { value: 0 },
                        uResolution: { value: new Vec2() },
                        uHueShift: { value: hueShift },
                        uNoise: { value: noiseIntensity },
                        uWarp: { value: warpAmount },
                        uMouse: { value: new Vec2() }
                    }
                });
                const mesh = new Mesh(gl, { geometry, program });

                const resize = () => {
                    renderer.setSize(parent.clientWidth, parent.clientHeight);
                    program.uniforms.uResolution.value.set(parent.clientWidth, parent.clientHeight);
                };
                resize();
                window.addEventListener("resize", resize);
                const onMove = e => {
                    mouse.current.set(
                        (e.clientX / window.innerWidth) * 2 - 1,
                        -((e.clientY / window.innerHeight) * 2 - 1)
                    );
                };
                window.addEventListener("pointermove", onMove);
                const start = performance.now();
                let frame;
                const loop = () => {
                    if (!document.hidden) {
                        program.uniforms.uTime.value = ((performance.now() - start) / 1000) * speed;
                        program.uniforms.uMouse.value.copy(mouse.current);
                        program.uniforms.uHueShift.value = hueShift; // Update hue shift
                        renderer.render({ scene: mesh });
                    }
                    frame = requestAnimationFrame(loop);
                };
                loop();
                return () => {
                    cancelAnimationFrame(frame);
                    window.removeEventListener("resize", resize);
                    window.removeEventListener("pointermove", onMove);
                };
            }, [hueShift, noiseIntensity, warpAmount, speed]);

            return <canvas ref={canvasRef} style={{ width: '100%', height: '100%', display: 'block' }} />;
        }

        /* ================= FIREBASE & APP CONFIG ================= */
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
        const APP_ID = "campuseats-live-v1";
        const MASTER_KEY = "master123";

        const INITIAL_MENU = [
            { id: 1, name: "Chicken Biryani", price: 120, category: "Lunch", desc: "Spicy aromatic rice with tender chicken", image: "🍗" },
            { id: 2, name: "Veg Thali", price: 80, category: "Lunch", desc: "Rice, dal, 2 curries, curd & pickle", image: "🥗" },
            { id: 3, name: "Spicy Chicken Roll", price: 60, category: "Snacks", desc: "Grilled chicken wrapped in paratha", image: "🌯" },
            { id: 4, name: "Egg Puffs", price: 20, category: "Snacks", desc: "Crispy pastry with boiled egg", image: "🥚" },
            { id: 5, name: "Fresh Lime Soda", price: 25, category: "Drinks", desc: "Refreshing sweet & salty lime", image: "🍋" },
            { id: 6, name: "Masala Chai", price: 10, category: "Drinks", desc: "Hot spiced tea", image: "☕" },
        ];
        const generateOrderId = () => `ORD-${Math.floor(1000 + Math.random() * 9000)}`;
        const formatCurrency = (amount) => `₹${amount}`;

        /* ================= UI COMPONENTS ================= */

        const ThemeSelector = () => {
            const { theme, setTheme } = useContext(ThemeContext);
            const [open, setOpen] = useState(false);

            return (
                <div className="fixed top-4 right-4 z-50">
                    <button 
                        onClick={() => setOpen(!open)}
                        className={`p-2 rounded-full backdrop-blur-md shadow-lg border transition-all ${theme.colors.card} ${theme.colors.cardBorder} ${theme.colors.text}`}
                    >
                        <Palette size={20} />
                    </button>
                    
                    {open && (
                        <div className={`absolute right-0 mt-2 w-48 py-2 rounded-xl border shadow-xl backdrop-blur-xl animate-in slide-in-from-top-2 ${theme.colors.card} ${theme.colors.cardBorder}`}>
                            {Object.entries(THEMES).map(([key, t]) => (
                                <button
                                    key={key}
                                    onClick={() => { setTheme(t); setOpen(false); }}
                                    className={`w-full text-left px-4 py-2 text-sm transition-colors flex items-center gap-2 ${theme.colors.text} hover:${theme.colors.secondary}`}
                                >
                                    <div className={`w-3 h-3 rounded-full ${t.colors.primary}`}></div>
                                    {t.name}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            );
        };

        const Button = ({ children, onClick, className = "", disabled = false, variant = 'primary' }) => {
            const { theme } = useContext(ThemeContext);
            const base = "px-4 py-3 rounded-xl font-semibold transition-all duration-200 flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50 disabled:active:scale-100";
            
            let variantStyles = "";
            if (variant === 'primary') {
                variantStyles = `${theme.colors.primary} ${theme.colors.buttonText} ${theme.colors.primaryHover} shadow-lg`;
            } else {
                variantStyles = `${theme.colors.secondary} ${theme.colors.text} hover:bg-white/20 border ${theme.colors.cardBorder}`;
            }

            return (
                <button disabled={disabled} onClick={onClick} className={`${base} ${variantStyles} ${className}`}>
                    {children}
                </button>
            );
        };

        const Input = ({ label, ...props }) => {
            const { theme } = useContext(ThemeContext);
            return (
                <div className="flex flex-col gap-1.5 w-full">
                    {label && <label className={`text-xs font-medium uppercase tracking-wide ${theme.colors.textMuted}`}>{label}</label>}
                    <input
                        className={`w-full px-4 py-3 rounded-xl border bg-white/5 placeholder-slate-500 outline-none transition-all ${theme.colors.text} ${theme.colors.cardBorder} focus:bg-white/10 focus:ring-2 ${theme.colors.primaryRing} focus:border-transparent`}
                        {...props}
                    />
                </div>
            );
        };

        const Card = ({ children, className = "" }) => {
            const { theme } = useContext(ThemeContext);
            return (
                <div className={`backdrop-blur-md p-4 rounded-2xl border shadow-xl ${theme.colors.card} ${theme.colors.cardBorder} ${className}`}>
                    {children}
                </div>
            );
        };

        // --- Screens ---

        const RoleSelector = ({ onSelect }) => {
            const { theme } = useContext(ThemeContext);
            return (
                <div className="min-h-screen flex flex-col items-center justify-center p-4 animate-in fade-in duration-700">
                    <div className="text-center mb-10">
                        <h1 className={`text-4xl font-extrabold mb-2 tracking-tight drop-shadow-lg ${theme.colors.text}`}>Campus Eats</h1>
                        <p className={`text-lg ${theme.colors.textMuted}`}>Choose your portal to continue</p>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-3xl">
                        {/* Student Card with Glare */}
                        <GlareHover 
                            glareColor={theme.colors.glare} 
                            className={`backdrop-blur-sm border ${theme.colors.card} ${theme.colors.cardBorder}`}
                            onClick={() => onSelect("student")}
                        >
                            <div className="p-8 flex flex-col items-center text-center gap-4">
                                <div className={`w-20 h-20 rounded-2xl flex items-center justify-center mb-2 ${theme.colors.secondary} ${theme.colors.accent}`}>
                                    <User size={40} />
                                </div>
                                <div>
                                    <h3 className={`text-xl font-bold ${theme.colors.text}`}>Student</h3>
                                    <p className={`text-sm mt-2 ${theme.colors.textMuted}`}>Browse menu, place orders, and track your food history.</p>
                                </div>
                            </div>
                        </GlareHover>

                        {/* Staff Card with Glare */}
                        <GlareHover 
                            glareColor={theme.colors.glare} 
                            className={`backdrop-blur-sm border ${theme.colors.card} ${theme.colors.cardBorder}`}
                            onClick={() => onSelect("staff")}
                        >
                            <div className="p-8 flex flex-col items-center text-center gap-4">
                                <div className={`w-20 h-20 rounded-2xl flex items-center justify-center mb-2 ${theme.colors.secondary} ${theme.colors.accent}`}>
                                    <ChefHat size={40} />
                                </div>
                                <div>
                                    <h3 className={`text-xl font-bold ${theme.colors.text}`}>Canteen Staff</h3>
                                    <p className={`text-sm mt-2 ${theme.colors.textMuted}`}>Manage incoming orders, update status, and view sales.</p>
                                </div>
                            </div>
                        </GlareHover>
                    </div>
                </div>
            );
        };

        const AuthScreen = ({ role, onLogin, onSignup, setStep, setRole }) => {
            const { theme } = useContext(ThemeContext);
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
                    if (isLogin) await onLogin(email, password);
                    else await onSignup(email, password, masterKey);
                } catch (err) { setError(err.message.replace("Firebase: ", "")); }
                setLoading(false);
            };

            const handleGoogle = async () => {
                setLoading(true);
                try {
                    if (isLogin) await onLogin(null, null, "google");
                    else await onSignup(null, null, masterKey, "google");
                } catch (err) { setError(err.message); }
                setLoading(false);
            };

            return (
                <div className="min-h-screen flex flex-col items-center justify-center p-6 animate-in fade-in zoom-in-95 duration-500">
                    <div className="w-full max-w-md">
                        <div className="text-center mb-8">
                            <div className={`inline-flex items-center justify-center w-16 h-16 rounded-2xl ${theme.colors.primary} text-white mb-4 shadow-xl`}>
                                <Utensils size={32} />
                            </div>
                            <h1 className={`text-3xl font-bold ${theme.colors.text}`}>Campus Eats</h1>
                        </div>

                        <Card className="p-6 md:p-8">
                            <div className={`flex gap-2 p-1 rounded-xl mb-6 ${theme.colors.secondary}`}>
                                <button onClick={() => setIsLogin(true)} className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${isLogin ? `${theme.colors.primary} text-white shadow-sm` : theme.colors.textMuted}`}>Log In</button>
                                <button onClick={() => setIsLogin(false)} className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${!isLogin ? `${theme.colors.primary} text-white shadow-sm` : theme.colors.textMuted}`}>Sign Up</button>
                            </div>
                            <h2 className={`text-xl font-semibold mb-6 ${theme.colors.text}`}>{isLogin ? `Welcome back, ${role === "student" ? "Student" : "Staff"}!` : `Create ${role} Account`}</h2>
                            <form onSubmit={handleSubmit} className="space-y-4">
                                {!isLogin && <Input label="Master Key" type="text" placeholder="Enter master key" value={masterKey} onChange={(e) => setMasterKey(e.target.value)} />}
                                <Input label="Email" type="email" placeholder="name@example.com" value={email} onChange={(e) => setEmail(e.target.value)} />
                                <Input label="Password" type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} />
                                {error && <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-center gap-2"><ArrowRight size={14}/> {error}</div>}
                                <Button disabled={loading} type="submit" className="w-full">{loading ? "Processing..." : (isLogin ? "Log In" : "Create Account")}</Button>
                            </form>
                            <div className={`mt-6 pt-6 border-t ${theme.colors.cardBorder}`}>
                                <Button variant="secondary" onClick={handleGoogle} className="w-full relative"><span className="absolute left-4">G</span> {isLogin ? "Log in with Google" : "Sign up with Google"}</Button>
                            </div>
                        </Card>
                        <button onClick={() => { setStep("role"); setRole(null); }} className={`w-full mt-6 text-sm font-medium transition-colors ${theme.colors.textMuted} hover:${theme.colors.accent}`}>← Change Role</button>
                    </div>
                </div>
            );
        };

        const StudentApp = ({ menu, orders, addToOrder, user, userProfile, updateUserProfile, logout }) => {
            const { theme } = useContext(ThemeContext);
            const [activeTab, setActiveTab] = useState("menu");
            const [cart, setCart] = useState([]);
            const [searchTerm, setSearchTerm] = useState("");
            const [profileForm, setProfileForm] = useState({ name: "", studentId: "", phone: "" });

            useEffect(() => { if (userProfile) setProfileForm(userProfile); }, [userProfile]);

            const addItem = (item) => setCart(prev => {
                const existing = prev.find(i => i.id === item.id);
                return existing ? prev.map(i => i.id === item.id ? { ...i, qty: i.qty + 1 } : i) : [...prev, { ...item, qty: 1 }];
            });

            const removeItem = (itemId) => setCart(prev => prev.filter(i => i.id !== itemId));
            const updateQty = (itemId, delta) => setCart(prev => prev.map(i => i.id === itemId ? { ...i, qty: Math.max(1, i.qty + delta) } : i));

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

            const filteredMenu = menu.filter(item => item.name.toLowerCase().includes(searchTerm.toLowerCase()) || item.category.toLowerCase().includes(searchTerm.toLowerCase()));

            return (
                <div className="h-screen bg-transparent flex flex-col overflow-hidden">
                    <header className={`backdrop-blur-md border-b px-4 py-3 flex justify-between items-center sticky top-0 z-10 ${theme.colors.card} ${theme.colors.cardBorder}`}>
                        <div className="flex items-center gap-2">
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-white ${theme.colors.primary}`}><Utensils size={16} /></div>
                            <h1 className={`font-bold ${theme.colors.text}`}>Campus Eats</h1>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className={`text-xs font-medium px-3 py-1 rounded-full border ${theme.colors.secondary} ${theme.colors.text} ${theme.colors.cardBorder}`}>{userProfile?.name || "Student"}</span>
                            <button onClick={logout} className="p-2 text-slate-400 hover:text-red-400 transition-colors"><LogOut size={18} /></button>
                        </div>
                    </header>

                    <main className="flex-1 overflow-y-auto pb-24 relative">
                        {activeTab === "menu" && (
                            <div className="h-full flex flex-col">
                                <div className="p-4 space-y-6 flex-1 overflow-y-auto pb-20 relative">
                                    <div className="relative z-10">
                                        <Search className="absolute left-3 top-3 text-slate-400" size={20} />
                                        <input type="text" placeholder="Search food..." className={`w-full pl-10 pr-4 py-3 rounded-xl border outline-none ${theme.colors.card} ${theme.colors.cardBorder} ${theme.colors.text} focus:ring-2 ${theme.colors.primaryRing}`} value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pb-10">
                                        {filteredMenu.map(item => (
                                            <Card key={item.id} className="flex flex-col gap-3 hover:bg-white/10 transition-colors">
                                                <div className="flex justify-between items-start">
                                                    <div className={`w-12 h-12 rounded-full flex items-center justify-center text-2xl ${theme.colors.secondary}`}>{item.image}</div>
                                                    <span className={`text-sm font-semibold px-2 py-1 rounded-md ${theme.colors.secondary} ${theme.colors.text}`}>{formatCurrency(item.price)}</span>
                                                </div>
                                                <div><h3 className={`font-bold ${theme.colors.text}`}>{item.name}</h3><p className={`text-xs line-clamp-2 mt-1 ${theme.colors.textMuted}`}>{item.desc}</p></div>
                                                <Button variant="secondary" className={`w-full mt-auto py-2 text-sm ${theme.colors.accent} border-current opacity-80 hover:opacity-100`} onClick={() => addItem(item)}>Add to Cart</Button>
                                            </Card>
                                        ))}
                                    </div>
                                </div>
                                <GradualBlur position="bottom" height="8rem" strength={3} opacity={1} className="pointer-events-none" />
                                {cartCount > 0 && (
                                    <div className="fixed bottom-24 left-4 right-4 z-30">
                                        <button onClick={() => setActiveTab("cart")} className={`w-full p-4 rounded-xl shadow-xl flex justify-between items-center animate-in slide-in-from-bottom-4 border ${theme.colors.primary} ${theme.colors.buttonText} border-white/20`}>
                                            <div className="flex items-center gap-3">
                                                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs bg-white text-black`}>{cartCount}</div>
                                                <span className="font-medium">View Cart</span>
                                            </div>
                                            <span className="font-bold">{formatCurrency(cartTotal)}</span>
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}

                        {activeTab === "cart" && (
                            <div className="p-4 max-w-2xl mx-auto h-full flex flex-col">
                                <h2 className={`text-2xl font-bold mb-6 ${theme.colors.text}`}>Your Cart</h2>
                                {cart.length === 0 ? (
                                    <div className={`flex-1 flex flex-col items-center justify-center space-y-4 ${theme.colors.textMuted}`}>
                                        <ShoppingBag size={64} strokeWidth={1} /><p>Your cart is empty</p><Button variant="ghost" onClick={() => setActiveTab("menu")}>Browse Menu</Button>
                                    </div>
                                ) : (
                                    <div className="space-y-4 flex-1">
                                        {cart.map(item => (
                                            <div key={item.id} className={`p-4 rounded-xl border flex items-center gap-4 shadow-sm ${theme.colors.card} ${theme.colors.cardBorder}`}>
                                                <div className="text-2xl">{item.image}</div>
                                                <div className="flex-1"><h4 className={`font-semibold ${theme.colors.text}`}>{item.name}</h4><p className={`text-sm ${theme.colors.textMuted}`}>{formatCurrency(item.price)}</p></div>
                                                <div className={`flex items-center gap-3 rounded-lg p-1 ${theme.colors.secondary}`}>
                                                    <button onClick={() => updateQty(item.id, -1)} className={`p-1 rounded-md transition-colors ${theme.colors.text} hover:bg-white/10`}><Minus size={14}/></button>
                                                    <span className={`text-sm font-medium w-4 text-center ${theme.colors.text}`}>{item.qty}</span>
                                                    <button onClick={() => updateQty(item.id, 1)} className={`p-1 rounded-md transition-colors ${theme.colors.text} hover:bg-white/10`}><Plus size={14}/></button>
                                                </div>
                                                <button onClick={() => removeItem(item.id)} className="text-slate-400 hover:text-red-400 p-2"><Trash2 size={18} /></button>
                                            </div>
                                        ))}
                                        <div className={`mt-8 p-6 rounded-2xl border shadow-sm space-y-4 ${theme.colors.card} ${theme.colors.cardBorder}`}>
                                            <div className={`flex justify-between ${theme.colors.textMuted}`}><span>Subtotal</span><span>{formatCurrency(cartTotal)}</span></div>
                                            <div className={`flex justify-between font-bold text-xl pt-4 border-t ${theme.colors.cardBorder} ${theme.colors.text}`}><span>Total</span><span>{formatCurrency(cartTotal)}</span></div>
                                            <Button onClick={handlePlaceOrder} className="w-full py-4 text-lg">Place Order</Button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {activeTab === "orders" && (
                            <div className="p-4 max-w-2xl mx-auto">
                                <h2 className={`text-2xl font-bold mb-6 ${theme.colors.text}`}>Order History</h2>
                                <div className="space-y-6">
                                    {orders.filter(o => o.studentUid === user.uid).sort((a,b) => b.timestamp - a.timestamp).map(order => (
                                        <Card key={order.orderId} className={`overflow-hidden border-l-4 ${order.orderStatus === "Served" ? 'border-l-emerald-500 opacity-80' : `border-l-${theme.colors.primary.split('-')[1]}-500`}`}>
                                            {order.orderStatus === "Placed" && (
                                                <div className={`-m-4 mb-4 p-6 flex flex-col items-center justify-center text-center border-b ${theme.colors.secondary} ${theme.colors.cardBorder}`}>
                                                    <div className="bg-white p-2 rounded-xl mb-3 shadow-sm"><QrCode size={80} className="text-black"/></div>
                                                    <h3 className={`text-4xl font-black tracking-wider font-mono ${theme.colors.text}`}>{order.orderId.split('-')[1]}</h3>
                                                    <p className={`text-xs mt-2 ${theme.colors.textMuted}`}>Show to staff</p>
                                                </div>
                                            )}
                                            <div className="flex justify-between items-start mb-4">
                                                <div><h3 className={`font-bold ${theme.colors.text}`}>Order #{order.orderId.split('-')[1]}</h3><p className={`text-xs mt-1 ${theme.colors.textMuted}`}>{new Date(order.createdAt).toLocaleString()}</p></div>
                                                <span className={`font-bold ${theme.colors.text}`}>{formatCurrency(order.totalAmount)}</span>
                                            </div>
                                            <div className="space-y-2">{order.items.map((item, i) => <div key={i} className={`flex justify-between text-sm border-b pb-2 last:pb-0 last:border-0 ${theme.colors.textMuted} ${theme.colors.cardBorder}`}><span>{item.qty}x {item.name}</span><span>{formatCurrency(item.price*item.qty)}</span></div>)}</div>
                                            {order.orderStatus === "Served" && <div className={`mt-4 pt-3 border-t text-center ${theme.colors.cardBorder}`}><p className="text-xs text-emerald-400 font-medium flex items-center justify-center gap-1"><CheckCircle size={12}/> Picked Up</p></div>}
                                        </Card>
                                    ))}
                                    {orders.filter(o => o.studentUid === user.uid).length === 0 && <div className={`text-center py-10 ${theme.colors.textMuted}`}>No orders yet</div>}
                                </div>
                            </div>
                        )}

                        {activeTab === "profile" && (
                            <div className="p-4 max-w-md mx-auto">
                                <h2 className={`text-2xl font-bold mb-6 ${theme.colors.text}`}>My Profile</h2>
                                <Card className="space-y-4">
                                    <div className="flex justify-center mb-4"><div className={`w-20 h-20 rounded-full flex items-center justify-center text-2xl font-bold border ${theme.colors.secondary} ${theme.colors.accent} ${theme.colors.cardBorder}`}>{profileForm.name ? profileForm.name[0].toUpperCase() : <User />}</div></div>
                                    <Input label="Full Name" value={profileForm.name} onChange={e => setProfileForm({...profileForm, name: e.target.value})} />
                                    <Input label="Student ID" value={profileForm.studentId} onChange={e => setProfileForm({...profileForm, studentId: e.target.value})} />
                                    <Input label="Phone" value={profileForm.phone} onChange={e => setProfileForm({...profileForm, phone: e.target.value})} />
                                    <div className="pt-4"><Button onClick={() => updateUserProfile(profileForm)} className="w-full">Save Changes</Button></div>
                                </Card>
                            </div>
                        )}
                    </main>

                    <nav className={`border-t flex justify-around items-center p-2 pb-safe sticky bottom-0 z-50 ${theme.colors.bg} ${theme.colors.cardBorder}`}>
                        {[{id:"menu",icon:Utensils,label:"Menu"},{id:"cart",icon:ShoppingBag,label:"Cart",badge:cartCount},{id:"orders",icon:Clock,label:"Orders"},{id:"profile",icon:User,label:"Profile"}].map(tab => (
                            <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex flex-col items-center p-2 rounded-xl transition-all w-16 ${activeTab===tab.id ? `${theme.colors.accent} ${theme.colors.secondary}` : `${theme.colors.textMuted} hover:${theme.colors.text}`}`}>
                                <div className="relative"><tab.icon size={22} strokeWidth={activeTab===tab.id?2.5:2}/>{tab.badge>0&&<span className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-bold">{tab.badge}</span>}</div><span className="text-[10px] font-medium mt-1">{tab.label}</span>
                            </button>
                        ))}
                    </nav>
                </div>
            );
        };

        const StaffApp = ({ orders, updateOrder, logout, menu, onUpdateMenu, onDeleteMenu, onAddMenu }) => {
            const { theme } = useContext(ThemeContext);
            const [activeTab, setActiveTab] = useState("dashboard");
            const [filter, setFilter] = useState("Placed");
            const [verifyModalOpen, setVerifyModalOpen] = useState(false);
            const [selectedOrder, setSelectedOrder] = useState(null);
            const [verificationCode, setVerificationCode] = useState("");
            const [isEditingMenu, setIsEditingMenu] = useState(false);
            const [menuForm, setMenuForm] = useState({ name: "", price: "", category: "", desc: "", image: "🍲" });
            const [editingItemId, setEditingItemId] = useState(null);

            const filteredOrders = orders.filter(o => filter === "All" ? true : o.orderStatus === filter).sort((a,b) => b.timestamp - a.timestamp);
            const stats = { pending: orders.filter(o => o.orderStatus === "Placed").length, served: orders.filter(o => o.orderStatus === "Served").length, revenue: orders.reduce((acc, o) => acc + o.totalAmount, 0) };

            const handleVerify = () => {
                if (selectedOrder && verificationCode === selectedOrder.orderId.split('-')[1]) {
                    updateOrder(selectedOrder.orderId, { orderStatus: "Served" });
                    setVerifyModalOpen(false); setVerificationCode(""); setSelectedOrder(null);
                } else alert("Incorrect Code!");
            };

            const handleSaveMenu = () => {
                if (!menuForm.name || !menuForm.price) return alert("Name and Price required");
                const itemData = { ...menuForm, price: Number(menuForm.price), available: true };
                editingItemId ? onUpdateMenu(editingItemId, itemData) : onAddMenu({ ...itemData, id: Date.now() });
                setIsEditingMenu(false); setMenuForm({ name: "", price: "", category: "", desc: "", image: "🍲" }); setEditingItemId(null);
            };

            return (
                <div className="min-h-screen bg-transparent flex flex-col">
                    <header className={`border-b px-6 py-4 flex justify-between items-center shadow-lg sticky top-0 z-20 ${theme.colors.card} ${theme.colors.cardBorder}`}>
                        <div className="flex items-center gap-3"><ChefHat className="text-orange-400" /><div><h1 className={`font-bold text-lg leading-none ${theme.colors.text}`}>Kitchen Dashboard</h1><p className={`text-xs ${theme.colors.textMuted}`}>Manage orders efficiently</p></div></div>
                        <div className="flex gap-2">
                            <button onClick={() => setActiveTab("dashboard")} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'dashboard' ? `${theme.colors.primary} text-white` : `${theme.colors.textMuted} hover:${theme.colors.text}`}`}>Orders</button>
                            <button onClick={() => setActiveTab("menu")} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'menu' ? `${theme.colors.primary} text-white` : `${theme.colors.textMuted} hover:${theme.colors.text}`}`}>Menu</button>
                            <button onClick={logout} className={`ml-4 p-2 rounded-lg transition-colors border ${theme.colors.secondary} ${theme.colors.textMuted} hover:${theme.colors.text} ${theme.colors.cardBorder}`}><LogOut size={18}/></button>
                        </div>
                    </header>

                    <main className="flex-1 p-6 max-w-7xl mx-auto w-full">
                        {activeTab === "dashboard" && (
                            <>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                                    <Card className="flex items-center gap-4 border-l-4 border-l-blue-500"><div className="p-3 bg-blue-500/10 text-blue-400 rounded-full"><Clock/></div><div><p className={`text-sm ${theme.colors.textMuted}`}>Pending Orders</p><p className={`text-2xl font-bold ${theme.colors.text}`}>{stats.pending}</p></div></Card>
                                    <Card className="flex items-center gap-4 border-l-4 border-l-emerald-500"><div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-full"><CheckCircle/></div><div><p className={`text-sm ${theme.colors.textMuted}`}>Completed</p><p className={`text-2xl font-bold ${theme.colors.text}`}>{stats.served}</p></div></Card>
                                    <Card className="flex items-center gap-4 border-l-4 border-l-indigo-500"><div className="p-3 bg-indigo-500/10 text-indigo-400 rounded-full"><CreditCard/></div><div><p className={`text-sm ${theme.colors.textMuted}`}>Total Revenue</p><p className={`text-2xl font-bold ${theme.colors.text}`}>{formatCurrency(stats.revenue)}</p></div></Card>
                                </div>
                                <div className="flex gap-2 mb-6 overflow-x-auto pb-2">{["Placed", "Served", "All"].map(f => <button key={f} onClick={() => setFilter(f)} className={`px-5 py-2 rounded-full font-medium text-sm transition-all whitespace-nowrap ${filter === f ? `${theme.colors.primary} text-white` : `${theme.colors.secondary} ${theme.colors.textMuted} hover:${theme.colors.text}`}`}>{f === "Placed" ? "Pending" : f}</button>)}</div>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {filteredOrders.map(order => (
                                        <Card key={order.orderId} className={`flex flex-col h-full hover:bg-white/5 transition-all ${order.orderStatus === "Served" ? "opacity-60" : ""}`}>
                                            <div className={`flex justify-between items-start mb-4 pb-4 border-b ${theme.colors.cardBorder}`}><div><h3 className={`font-bold text-lg ${theme.colors.text}`}>{order.studentName}</h3><p className={`text-xs ${theme.colors.textMuted}`}>{new Date(order.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p></div><p className={`font-bold px-2 py-1 rounded ${theme.colors.secondary} ${theme.colors.text}`}>{formatCurrency(order.totalAmount)}</p></div>
                                            <div className="flex-1 space-y-3 mb-6">{order.items.map((item, i) => <div key={i} className={`flex justify-between items-center text-sm ${theme.colors.textMuted}`}><div className="flex items-center gap-2"><span className={`font-bold px-2 py-0.5 rounded text-xs ${theme.colors.secondary} ${theme.colors.text}`}>{item.qty}x</span><span>{item.name}</span></div></div>)}</div>
                                            {order.orderStatus === "Placed" ? <Button variant="secondary" onClick={() => { setSelectedOrder(order); setVerifyModalOpen(true); }} className="w-full mt-auto">Verify & Serve <QrCode size={18}/></Button> : <div className="mt-auto text-center py-2 bg-emerald-500/10 text-emerald-400 rounded-lg font-medium text-sm border border-emerald-500/20"><CheckCircle size={16} className="inline mr-2"/> Served</div>}
                                        </Card>
                                    ))}
                                    {filteredOrders.length === 0 && <div className={`col-span-full flex flex-col items-center justify-center py-20 ${theme.colors.textMuted}`}><Coffee size={48} className="mb-4 opacity-20"/><p>No orders found.</p></div>}
                                </div>
                            </>
                        )}
                        {activeTab === "menu" && (
                            <div className="max-w-4xl mx-auto">
                                <div className="flex justify-between items-center mb-6"><h2 className={`text-2xl font-bold ${theme.colors.text}`}>Menu Management</h2><Button onClick={() => { setMenuForm({ name: "", price: "", category: "", desc: "", image: "🍲" }); setEditingItemId(null); setIsEditingMenu(true); }}><PlusCircle size={20}/> Add Item</Button></div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">{menu.map(item => <div key={item.id} className={`p-4 rounded-xl shadow-sm border flex items-start gap-4 ${theme.colors.card} ${theme.colors.cardBorder}`}><div className={`w-16 h-16 rounded-lg flex items-center justify-center text-3xl ${theme.colors.secondary}`}>{item.image}</div><div className="flex-1"><div className="flex justify-between"><h3 className={`font-bold ${theme.colors.text}`}>{item.name}</h3><span className={`font-medium ${theme.colors.textMuted}`}>{formatCurrency(item.price)}</span></div><p className={`text-sm mb-2 ${theme.colors.textMuted}`}>{item.category}</p><div className="flex gap-2 mt-2"><button onClick={() => { setMenuForm(item); setEditingItemId(item.docId); setIsEditingMenu(true); }} className={`p-1.5 rounded-lg transition-colors text-blue-400 hover:bg-blue-500/10`}><Edit size={16}/></button><button onClick={() => onDeleteMenu(item.docId)} className={`p-1.5 rounded-lg transition-colors text-red-400 hover:bg-red-500/10`}><Trash2 size={16}/></button></div></div></div>)}</div>
                            </div>
                        )}
                    </main>

                    {verifyModalOpen && (
                        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                            <Card className="w-full max-w-sm p-6 animate-in fade-in zoom-in-95">
                                <div className="text-center mb-6"><div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${theme.colors.secondary} ${theme.colors.accent}`}><QrCode size={32}/></div><h3 className={`text-xl font-bold ${theme.colors.text}`}>Verify Order</h3><p className={`text-sm mt-2 ${theme.colors.textMuted}`}>Enter 4-digit code</p></div>
                                <input autoFocus type="text" maxLength={4} placeholder="0000" className={`w-full text-center text-3xl tracking-[1em] font-mono font-bold border-b-2 outline-none py-4 mb-6 bg-transparent ${theme.colors.text} ${theme.colors.cardBorder} focus:border-current`} value={verificationCode} onChange={e => setVerificationCode(e.target.value)} />
                                <div className="grid grid-cols-2 gap-3"><Button variant="secondary" onClick={() => setVerifyModalOpen(false)}>Cancel</Button><Button onClick={handleVerify}>Confirm</Button></div>
                            </Card>
                        </div>
                    )}

                    {isEditingMenu && (
                        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                            <Card className="w-full max-w-md p-6 overflow-y-auto max-h-[90vh]">
                                <div className="flex justify-between items-center mb-6"><h3 className={`text-xl font-bold ${theme.colors.text}`}>{editingItemId ? "Edit Item" : "New Item"}</h3><button onClick={() => setIsEditingMenu(false)} className={theme.colors.textMuted}><X/></button></div>
                                <div className="space-y-4"><Input label="Name" value={menuForm.name} onChange={e => setMenuForm({...menuForm, name: e.target.value})} /><div className="grid grid-cols-2 gap-4"><Input label="Price" type="number" value={menuForm.price} onChange={e => setMenuForm({...menuForm, price: e.target.value})} /><Input label="Category" value={menuForm.category} onChange={e => setMenuForm({...menuForm, category: e.target.value})} /></div><Input label="Description" value={menuForm.desc} onChange={e => setMenuForm({...menuForm, desc: e.target.value})} /><Input label="Emoji" value={menuForm.image} onChange={e => setMenuForm({...menuForm, image: e.target.value})} /><div className="pt-4"><Button className="w-full" onClick={handleSaveMenu}>Save Item</Button></div></div>
                            </Card>
                        </div>
                    )}
                </div>
            );
        };

        /* ================= MAIN CONTROLLER ================= */

        const AppWithBackground = ({ children, theme }) => (
            <>
                <div style={{ position: "fixed", inset: 0, zIndex: -1 }}>
                    <DarkVeil hueShift={theme.colors.hueShift} speed={0.2} warpAmount={0.3} />
                </div>
                <div className={`relative z-10 min-h-screen ${theme.colors.bg} bg-opacity-30 transition-colors duration-700`}>{children}</div>
            </>
        );

        const App = () => {
            const [step, setStep] = useState("role");
            const [role, setRole] = useState(null);
            const [user, setUser] = useState(null);
            const [userProfile, setUserProfile] = useState(null);
            const [menu, setMenu] = useState([]);
            const [orders, setOrders] = useState([]);
            const [currentTheme, setCurrentTheme] = useState(THEMES.midnight);

            useEffect(() => {
                const unsubscribeAuth = onAuthStateChanged(auth, async (currentUser) => {
                    if (currentUser) {
                        const userDocSnap = await getDoc(doc(db, "artifacts", APP_ID, "users", currentUser.uid));
                        if (userDocSnap.exists()) {
                            setUser(currentUser);
                            const data = userDocSnap.data();
                            setUserProfile(data);
                            setRole(data.role); 
                            setStep("app");
                        } else { setUser(null); }
                    } else { setUser(null); setUserProfile(null); setStep("role"); }
                });
                return () => unsubscribeAuth();
            }, []);

            useEffect(() => {
                const menuRef = collection(db, "artifacts", APP_ID, "public", "data", "menu");
                const unsubscribeMenu = onSnapshot(menuRef, (s) => {
                    const loaded = s.docs.map(d => ({ ...d.data(), docId: d.id }));
                    setMenu(loaded.length ? loaded : (INITIAL_MENU.forEach(i => addDoc(menuRef, i)), INITIAL_MENU));
                });
                if (!user) return unsubscribeMenu;
                const unsubscribeOrders = onSnapshot(collection(db, "artifacts", APP_ID, "public", "data", "orders"), (s) => setOrders(s.docs.map(d => ({ ...d.data(), docId: d.id }))));
                return () => { unsubscribeMenu(); unsubscribeOrders(); };
            }, [user]);

            const actions = {
                handleLogin: async (e, p, m="email") => m==="google" ? signInWithPopup(auth, googleProvider) : signInWithEmailAndPassword(auth, e, p),
                handleSignup: async (e, p, k, m="email") => {
                    if (k !== MASTER_KEY) throw new Error("Invalid Key");
                    const cred = m==="google" ? await signInWithPopup(auth, googleProvider) : await createUserWithEmailAndPassword(auth, e, p);
                    await setDoc(doc(db, "artifacts", APP_ID, "users", cred.user.uid), { uid: cred.user.uid, role, email: cred.user.email, name: cred.user.displayName||"", provider: m, createdAt: new Date().toISOString() });
                },
                handleLogout: async () => { await signOut(auth); setStep("role"); setRole(null); },
                addToOrder: async (d) => addDoc(collection(db, "artifacts", APP_ID, "public", "data", "orders"), d),
                updateOrder: async (id, u) => { const o = orders.find(x => x.orderId === id); if(o) updateDoc(doc(db, "artifacts", APP_ID, "public", "data", "orders", o.docId), u); },
                updateUserProfile: async (d) => { if(!user)return; await setDoc(doc(db, "artifacts", APP_ID, "users", user.uid), d, {merge:true}); setUserProfile(p=>({...p,...d})); },
                // Menu actions
                onAddMenu: async (i) => addDoc(collection(db, "artifacts", APP_ID, "public", "data", "menu"), i),
                onUpdateMenu: async (id, u) => updateDoc(doc(db, "artifacts", APP_ID, "public", "data", "menu", id), u),
                onDeleteMenu: async (id) => deleteDoc(doc(db, "artifacts", APP_ID, "public", "data", "menu", id))
            };

            return (
                <ThemeContext.Provider value={{ theme: currentTheme, setTheme: setCurrentTheme }}>
                    <AppWithBackground theme={currentTheme}>
                        <ThemeSelector />
                        {step === "role" && <RoleSelector onSelect={(r) => { setRole(r); setStep("auth"); }} />}
                        {step === "auth" && <AuthScreen role={role} onLogin={actions.handleLogin} onSignup={actions.handleSignup} setStep={setStep} setRole={setRole} />}
                        {step === "app" && user && userProfile && (userProfile.role === "student" ? 
                            <StudentApp menu={menu} orders={orders} addToOrder={actions.addToOrder} user={user} userProfile={userProfile} updateUserProfile={actions.updateUserProfile} logout={actions.handleLogout} /> : 
                            <StaffApp orders={orders} menu={menu} updateOrder={actions.updateOrder} onAddMenu={actions.onAddMenu} onUpdateMenu={actions.onUpdateMenu} onDeleteMenu={actions.onDeleteMenu} logout={actions.handleLogout} />
                        )}
                        {!user && step === "app" && <div className="h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-current"></div></div>}
                    </AppWithBackground>
                </ThemeContext.Provider>
            );
        };

        const root = createRoot(document.getElementById("root"));
        root.render(<App />);
    </script>
</body>
</html>

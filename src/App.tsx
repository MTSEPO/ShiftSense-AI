import { useState, useEffect, useRef } from 'react';
import { 
  Car, 
  Plus, 
  Trash2, 
  Search, 
  MapPin, 
  Zap, 
  MessageSquare, 
  Loader2, 
  ShieldCheck,
  Globe,
  LogOut,
  LogIn,
  User,
  Briefcase,
  CheckCircle2,
  Infinity,
  AlertTriangle,
  ShieldAlert,
  Trophy,
  Quote,
  Download,
  Lock,
  Settings
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import Markdown from 'react-markdown';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { auth, db } from './firebase';
import { 
  signInWithPopup, 
  GoogleAuthProvider, 
  onAuthStateChanged, 
  signOut,
  User as FirebaseUser
} from 'firebase/auth';
import { 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  increment, 
  collection, 
  addDoc,
  serverTimestamp 
} from 'firebase/firestore';
import { analyzeVehicles, Vehicle, UserPersona } from './services/geminiService';
import { useExchangeRates } from './hooks/useExchangeRates';
import { cn, formatZAR, formatCurrency } from './lib/utils';

interface UserProfile {
  uid: string;
  email: string;
  isPro: boolean;
  requestCount: number;
}

export default function App() {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [report, setReport] = useState<{ report: string, swot: any[] } | null>(null);
  const [currency, setCurrency] = useState<'ZAR' | 'USD' | 'GBP'>('ZAR');
  const [persona, setPersona] = useState<UserPersona | null>(null);
  const [showTerms, setShowTerms] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);
  const [showDeveloperModal, setShowDeveloperModal] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [adminUsername, setAdminUsername] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);
  const [profilePic, setProfilePic] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);
  const reportRef = useRef<HTMLDivElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);
  const { convertFromZAR, rates } = useExchangeRates();

  const [vehicles, setVehicles] = useState<Vehicle[]>([
    { make: '', model: '', year: '', price: '', odometer: '' }
  ]);
  const [context, setContext] = useState('');

  useEffect(() => {
    if ((report || analyzing) && resultsRef.current) {
      resultsRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [report, analyzing]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        await fetchProfile(firebaseUser.uid, firebaseUser.email || '');
      } else {
        setProfile(null);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const fetchProfile = async (uid: string, email: string) => {
    const userDoc = doc(db, 'users', uid);
    const snap = await getDoc(userDoc);
    
    if (snap.exists()) {
      setProfile(snap.data() as UserProfile);
    } else {
      const newProfile = {
        uid,
        email,
        isPro: false,
        requestCount: 0,
        createdAt: serverTimestamp(),
      };
      await setDoc(userDoc, newProfile);
      setProfile(newProfile as any);
    }
  };

  const handleLogin = async () => {
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error("Login failed:", error);
    }
  };

  const handleLogout = () => {
    signOut(auth);
    setIsAdminLoggedIn(false);
  };

  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (adminUsername === 'MTSEPO' && adminPassword === 'Mothibedi@74') {
      setIsAdminLoggedIn(true);
      setShowLoginModal(false);
      // Create a mock user for admin
      setUser({
        uid: 'admin-mtsepo',
        email: 'admin@shiftsense.ai',
        displayName: 'MTSEPO (Admin)',
        photoURL: profilePic || null,
      } as any);
      setProfile(prev => ({
        ...prev,
        uid: 'admin-mtsepo',
        email: 'admin@shiftsense.ai',
        isPro: true,
        requestCount: 0,
      } as any));
    } else {
      alert("Invalid credentials");
    }
  };

  const handleProfilePicUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfilePic(reader.result as string);
        if (isAdminLoggedIn && user) {
          setUser({ ...user, photoURL: reader.result as string } as any);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const downloadPDF = async () => {
    if (!profile?.isPro) {
      setShowUpgradeModal(true);
      return;
    }

    if (!reportRef.current) return;

    setExporting(true);
    try {
      const canvas = await html2canvas(reportRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#020617', // Match slate-950
        logging: false,
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgProps = pdf.getImageProperties(imgData);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`ShiftSense-Analysis-${new Date().getTime()}.pdf`);
    } catch (error) {
      console.error("PDF Export failed:", error);
      alert("Failed to generate PDF. Please try again.");
    } finally {
      setExporting(false);
    }
  };

  const addVehicle = () => {
    if (vehicles.length < 3) {
      setVehicles([...vehicles, { make: '', model: '', year: '', price: '', odometer: '' }]);
    }
  };

  const removeVehicle = (index: number) => {
    setVehicles(vehicles.filter((_, i) => i !== index));
  };

  const updateVehicle = (index: number, field: keyof Vehicle, value: string) => {
    const newVehicles = [...vehicles];
    newVehicles[index] = { ...newVehicles[index], [field]: value };
    setVehicles(newVehicles);
  };

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      handleLogin();
      return;
    }

    if (!persona) {
      alert("Please select your persona (Buyer or Trader) first.");
      return;
    }

    // Input Validation
    const hasEmptyFields = vehicles.some(v => !v.make.trim() || !v.model.trim() || !v.year.trim());
    if (hasEmptyFields) {
      alert("Please fill in all required vehicle details (Make, Model, Year).");
      return;
    }

    if (profile && profile.requestCount >= 5 && !profile.isPro) {
      setShowUpgradeModal(true);
      return;
    }

    setAnalyzing(true);
    setReport(null);

    try {
      const result = await analyzeVehicles(vehicles, context, persona, currency, rates);
      setReport(result);

      // Update request count
      try {
        const userDoc = doc(db, 'users', user.uid);
        await updateDoc(userDoc, {
          requestCount: increment(1)
        });
      } catch (err: any) {
        console.error("Failed to update request count:", err);
        if (err.code === 'permission-denied') {
          console.warn("Permission denied while updating request count. Check firestore.rules.");
        }
      }
      
      // Save analysis
      try {
        await addDoc(collection(db, 'analyses'), {
          userId: user.uid,
          vehicles,
          context,
          report: result,
          persona,
          currency,
          createdAt: serverTimestamp()
        });
      } catch (err: any) {
        console.error("Failed to save analysis:", err);
        if (err.code === 'permission-denied') {
          console.warn("Permission denied while saving analysis. Check firestore.rules.");
        }
      }

      // Refresh profile
      await fetchProfile(user.uid, user.email || '');
    } catch (error: any) {
      console.error("Analysis failed:", error);
      const errorMessage = error.code === 'permission-denied' 
        ? "Analysis failed: Missing or insufficient permissions. Please contact support."
        : "Something went wrong during analysis. Please try again.";
      alert(errorMessage);
    } finally {
      setAnalyzing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-blue-500/30">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-slate-950/80 backdrop-blur-md border-b border-slate-800 px-6 py-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 p-2 rounded-xl shadow-lg shadow-blue-900/20">
              <Car className="text-white w-6 h-6" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight">
              ShiftSense <span className="text-blue-500">AI</span>
            </h1>
          </div>

            <div className="flex items-center gap-6">
              <button 
                onClick={() => {
                  document.getElementById('developer')?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="hidden lg:block text-xs font-bold text-slate-400 hover:text-blue-400 transition-colors"
              >
                Hire Tsepo
              </button>
              
              <div className="hidden md:flex items-center bg-slate-900 rounded-full px-4 py-1.5 border border-slate-800">
              <Globe className="w-3.5 h-3.5 text-slate-500 mr-2" />
              <select 
                value={currency}
                onChange={(e) => setCurrency(e.target.value as any)}
                className="bg-transparent text-xs font-bold focus:outline-none text-slate-200 cursor-pointer"
              >
                <option value="ZAR">🇿🇦 ZAR (R)</option>
                <option value="USD">🇺🇸 USD ($)</option>
                <option value="GBP">🇬🇧 GBP (£)</option>
              </select>
            </div>

            {user ? (
              <div className="flex items-center gap-4">
                <div className="hidden sm:block text-right">
                  <p className="text-xs font-medium text-slate-200">{user.displayName}</p>
                  <p className="text-[10px] text-slate-500">{profile?.isPro ? 'Pro Member' : `${5 - (profile?.requestCount || 0)} free searches left`}</p>
                </div>
                
                {isAdminLoggedIn && (
                  <button className="p-2 text-blue-400 hover:text-blue-300 transition-colors" title="Developer Dashboard">
                    <Settings className="w-5 h-5 animate-spin-slow" />
                  </button>
                )}

                <div className="relative group">
                  <div className="w-10 h-10 rounded-full bg-slate-800 border-2 border-slate-700 overflow-hidden flex items-center justify-center">
                    {user.photoURL || profilePic ? (
                      <img src={user.photoURL || profilePic || ''} alt="Profile" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    ) : (
                      <User className="w-5 h-5 text-slate-500" />
                    )}
                  </div>
                  {isAdminLoggedIn && (
                    <label className="absolute inset-0 cursor-pointer opacity-0 group-hover:opacity-100 bg-black/50 flex items-center justify-center rounded-full transition-opacity">
                      <Plus className="w-4 h-4 text-white" />
                      <input type="file" className="hidden" accept="image/*" onChange={handleProfilePicUpload} />
                    </label>
                  )}
                </div>
                <button 
                  onClick={handleLogout}
                  className="p-2 text-slate-400 hover:text-white transition-colors"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            ) : (
              <button 
                onClick={() => setShowLoginModal(true)}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-5 py-2 rounded-xl text-sm font-semibold transition-all active:scale-95"
              >
                <LogIn className="w-4 h-4" />
                Sign In
              </button>
            )}
          </div>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto p-6 pb-24">
        {/* Persona Detection / Landing Page */}
        {!persona && (
          <div className="max-w-4xl mx-auto py-12">
            {/* Brief Description Section */}
            <section className="text-center mb-16">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7 }}
              >
                <h2 className="text-4xl md:text-6xl font-extrabold mb-6 tracking-tight">
                  Buy Used With <span className="text-blue-500">Certainty.</span>
                </h2>
                <p className="text-lg md:text-xl text-slate-400 leading-relaxed mb-12 max-w-3xl mx-auto">
                  ShiftSense AI is your intelligent vehicle companion built specifically for the South African market. 
                  We analyze technical specs, scan owner forums for mechanical "lemons," and assess security risks 
                  to ensure your next bakkie or car is a smart investment, not a costly mistake.
                </p>
                
                {/* How it Works Mini-Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm text-slate-300 mb-16">
                  <div className="p-6 rounded-2xl border border-slate-800 bg-slate-900/30 backdrop-blur-sm hover:border-blue-500/30 transition-colors">
                    <Search className="text-blue-500 mb-3 w-6 h-6 mx-auto" />
                    <p className="font-medium">Compare up to 3 vehicles side-by-side.</p>
                  </div>
                  <div className="p-6 rounded-2xl border border-slate-800 bg-slate-900/30 backdrop-blur-sm hover:border-blue-500/30 transition-colors">
                    <Zap className="text-blue-500 mb-3 w-6 h-6 mx-auto" />
                    <p className="font-medium">Detect hidden mechanical flaws and parts costs.</p>
                  </div>
                  <div className="p-6 rounded-2xl border border-slate-800 bg-slate-900/30 backdrop-blur-sm hover:border-blue-500/30 transition-colors">
                    <ShieldCheck className="text-blue-500 mb-3 w-6 h-6 mx-auto" />
                    <p className="font-medium">Assess hijack risk & SA insurance profiles.</p>
                  </div>
                </div>
              </motion.div>
            </section>

            {/* Persona Selection Box */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-slate-900/40 backdrop-blur-md p-8 md:p-12 rounded-[3rem] border border-slate-800 shadow-2xl text-center"
            >
              <h3 className="text-2xl md:text-3xl font-bold mb-2">Welcome to ShiftSense AI</h3>
              <p className="text-slate-500 mb-10">Select your path to start your analysis</p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Buyer */}
                <button 
                  onClick={() => setPersona('buyer')}
                  className="group p-8 rounded-3xl border border-slate-700 hover:border-blue-500 bg-slate-950/50 transition-all text-left flex flex-col gap-4"
                >
                  <div className="bg-blue-600/20 w-14 h-14 rounded-2xl flex items-center justify-center group-hover:bg-blue-600 transition-colors">
                    <User className="text-blue-500 group-hover:text-white w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-xl font-bold mb-1 group-hover:text-blue-400 transition-colors">The Buyer</h4>
                    <p className="text-sm text-slate-500 font-medium leading-relaxed">Personal use, family safety, and long-term reliability.</p>
                  </div>
                </button>

                {/* Trader */}
                <button 
                  onClick={() => setPersona('trader')}
                  className="group p-8 rounded-3xl border border-slate-700 hover:border-emerald-500 bg-slate-950/50 transition-all text-left flex flex-col gap-4"
                >
                  <div className="bg-emerald-600/20 w-14 h-14 rounded-2xl flex items-center justify-center group-hover:bg-emerald-600 transition-colors">
                    <Briefcase className="text-emerald-500 group-hover:text-white w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-xl font-bold mb-1 group-hover:text-emerald-400 transition-colors">The Trader</h4>
                    <p className="text-sm text-slate-500 font-medium leading-relaxed">Resale margins, trade opportunities, and parts sourcing.</p>
                  </div>
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {persona && (
          <>
            {/* Hero/Explanation Section */}
            <header className="text-center my-12 animate-fade-in">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                <h2 className="text-5xl font-extrabold mb-6 bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent tracking-tight">
                  Don't Buy a Lemon. Shift with Confidence.
                </h2>
                <p className="text-slate-400 max-w-2xl mx-auto text-lg leading-relaxed">
                  ShiftSense AI analyzes technical manufacturer data, South African owner reviews, and real-time market trends to give you a mechanical SWOT analysis and a definitive buying verdict.
                </p>
              </motion.div>
            </header>

            {!user ? (
              <div className="max-w-2xl mx-auto text-center py-20 bg-slate-900/40 border border-slate-800 rounded-[3rem] backdrop-blur-md">
                <Lock className="w-16 h-16 text-blue-500 mx-auto mb-6" />
                <h3 className="text-3xl font-bold mb-4">Login to Use ShiftSense AI</h3>
                <p className="text-slate-400 mb-8">Please sign in to access our advanced vehicle analysis tools and security reports.</p>
                <button 
                  onClick={() => setShowLoginModal(true)}
                  className="bg-blue-600 hover:bg-blue-500 text-white px-10 py-4 rounded-2xl font-bold transition-all shadow-xl shadow-blue-900/20"
                >
                  Sign In Now
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Form Section */}
                <div className="lg:col-span-2">
                  <div className="bg-slate-900/40 backdrop-blur-md p-8 rounded-[2.5rem] border border-slate-700 shadow-2xl">
                    
                    {/* Persona Toggle */}
                    <div className="flex bg-slate-950/50 p-1 rounded-2xl mb-8 border border-slate-800">
                      <button 
                        onClick={() => setPersona('buyer')} 
                        className={cn(
                          "flex-1 py-3 rounded-xl font-bold transition-all flex items-center justify-center gap-2",
                          persona === 'buyer' ? "bg-blue-600 text-white shadow-lg" : "text-slate-400 hover:text-white"
                        )}
                      >
                        <User className="w-4 h-4" /> The Buyer
                      </button>
                      <button 
                        onClick={() => setPersona('trader')} 
                        className={cn(
                          "flex-1 py-3 rounded-xl font-bold transition-all flex items-center justify-center gap-2",
                          persona === 'trader' ? "bg-blue-600 text-white shadow-lg" : "text-slate-400 hover:text-white"
                        )}
                      >
                        <Briefcase className="w-4 h-4" /> The Trader
                      </button>
                    </div>

                    <form onSubmit={handleAnalyze} className="space-y-6">
                      <div className="space-y-4">
                        {vehicles.map((vehicle, index) => (
                          <motion.div 
                            key={index}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="p-5 bg-slate-950/40 rounded-2xl border border-slate-800 group hover:border-blue-500/30 transition-all"
                          >
                            <div className="flex items-center justify-between mb-4">
                              <p className="text-[10px] uppercase tracking-widest text-blue-400 font-bold">Vehicle #{index + 1}</p>
                              {index > 0 && (
                                <button 
                                  type="button"
                                  onClick={() => removeVehicle(index)}
                                  className="p-1 text-slate-500 hover:text-red-400 transition-colors"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                              <input 
                                required
                                type="text" 
                                placeholder="Make (e.g. BMW)" 
                                value={vehicle.make}
                                onChange={(e) => updateVehicle(index, 'make', e.target.value)}
                                className="bg-slate-950 border border-slate-700 p-2.5 rounded-xl outline-none focus:border-blue-500 transition text-sm"
                              />
                              <input 
                                required
                                type="text" 
                                placeholder="Model (e.g. 320i)" 
                                value={vehicle.model}
                                onChange={(e) => updateVehicle(index, 'model', e.target.value)}
                                className="bg-slate-950 border border-slate-700 p-2.5 rounded-xl outline-none focus:border-blue-500 transition text-sm"
                              />
                              <input 
                                required
                                type="number" 
                                placeholder="Year" 
                                value={vehicle.year}
                                onChange={(e) => updateVehicle(index, 'year', e.target.value)}
                                className="bg-slate-950 border border-slate-700 p-2.5 rounded-xl outline-none focus:border-blue-500 transition text-sm"
                              />
                              <input 
                                required
                                type="number" 
                                placeholder="Odometer (KM)" 
                                value={vehicle.odometer}
                                onChange={(e) => updateVehicle(index, 'odometer', e.target.value)}
                                className="bg-slate-950 border border-slate-700 p-2.5 rounded-xl outline-none focus:border-blue-500 transition text-sm"
                              />
                              <input 
                                type="text" 
                                placeholder="Price (ZAR)" 
                                value={vehicle.price}
                                onChange={(e) => updateVehicle(index, 'price', e.target.value)}
                                className="bg-slate-950 border border-slate-700 p-2.5 rounded-xl outline-none focus:border-blue-500 transition text-sm"
                              />
                            </div>
                          </motion.div>
                        ))}
                      </div>

                    {/* Additional Info / Chat Style */}
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-slate-300 ml-1">Additional Context / Personal Requirements</label>
                      <textarea 
                        required
                        value={context}
                        onChange={(e) => setContext(e.target.value)}
                        placeholder={persona === 'buyer' 
                          ? "E.g. I drive 40km a day in Sandton traffic. Reliability is more important than speed." 
                          : "E.g. Looking to flip this Hilux. Current condition is fair, needs some interior work. What is the expected resale margin in Gauteng?"}
                        className="w-full h-32 bg-slate-950 border border-slate-700 rounded-2xl p-4 focus:border-emerald-500 outline-none transition text-sm leading-relaxed resize-none"
                      />
                    </div>

                    <div className="flex flex-col sm:flex-row gap-4">
                      {vehicles.length < 3 && (
                        <button 
                          type="button" 
                          onClick={addVehicle} 
                          className="flex-1 py-4 border-2 border-dashed border-slate-700 rounded-2xl text-slate-500 hover:border-blue-500 hover:text-blue-500 transition font-bold text-sm flex items-center justify-center gap-2"
                        >
                          <Plus className="w-4 h-4" /> Add Vehicle to Compare
                        </button>
                      )}
                      <button 
                        type="submit" 
                        disabled={analyzing || !user}
                        className={cn(
                          "flex-[2] bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white font-extrabold py-4 rounded-2xl shadow-xl transition transform active:scale-95 flex items-center justify-center gap-2",
                          (analyzing || !user) && "opacity-50 cursor-not-allowed"
                        )}
                      >
                        {analyzing ? (
                          <>
                            <Loader2 className="w-5 h-5 animate-spin" />
                            ANALYZING...
                          </>
                        ) : (
                          <>
                            GENERATE SHIFTSENSE VERDICT <Zap className="w-4 h-4 fill-current" />
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                </div>
              </div>

              {/* Sidebar */}
              <div className="space-y-6">
                <div className="bg-blue-600/10 border border-blue-500/20 p-8 rounded-[2rem]">
                  <h4 className="font-bold text-blue-400 mb-6 flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5" /> SA Market Analysis
                  </h4>
                  <ul className="text-sm space-y-4 text-slate-300">
                    <li className="flex items-start gap-3">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                      <span><strong>Anti-Lemon Tech:</strong> We flag high-risk engines and common mechanical failures.</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                      <span><strong>POPIA Compliant:</strong> Your data is 100% private and secure.</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                      <span><strong>SAPS Advice:</strong> Guidance on checking for stolen VINs and cloned vehicles.</span>
                    </li>
                  </ul>
                </div>

                {/* Subscription Paths */}
                <div id="pricing" className="space-y-4 scroll-mt-24">
                  <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest ml-2">Upgrade Options</p>
                  
                  {/* Buyer Path */}
                  <div className={cn(
                    "relative overflow-hidden p-6 rounded-3xl border transition-all",
                    persona === 'buyer' ? "bg-blue-600 border-blue-500 shadow-xl shadow-blue-900/40" : "bg-slate-900/50 border-slate-800 opacity-80"
                  )}>
                    <div className="relative z-10">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="font-bold text-lg">The Buyer Path</h3>
                        {persona === 'buyer' && <CheckCircle2 className="w-5 h-5 text-white" />}
                      </div>
                      <p className={cn("text-xs mb-4 leading-relaxed", persona === 'buyer' ? "text-blue-100" : "text-slate-400")}>
                        Perfect for individuals car shopping. Unlimited searches for 1 month.
                      </p>
                      <div className="flex items-baseline gap-1 mb-4">
                        <span className="text-2xl font-bold">R285</span>
                        <span className="text-[10px] opacity-70">/month</span>
                      </div>
                      <form action="https://www.payfast.co.za/eng/process" method="post">
                        <input type="hidden" name="merchant_id" value="10000100" />
                        <input type="hidden" name="merchant_key" value="46f0cd694581a" />
                        <input type="hidden" name="amount" value="285.00" />
                        <input type="hidden" name="item_name" value="ShiftSense AI Pro Monthly" />
                        <input type="hidden" name="custom_str1" value={user?.uid} />
                        <input type="hidden" name="custom_str2" value="pro" />
                        <button 
                          type="submit"
                          className={cn(
                            "w-full text-center font-bold py-2.5 rounded-xl text-xs transition-colors",
                            persona === 'buyer' ? "bg-white text-blue-700 hover:bg-blue-50" : "bg-slate-800 text-slate-200 hover:bg-slate-700"
                          )}
                        >
                          Upgrade via PayFast
                        </button>
                      </form>
                    </div>
                  </div>

                  {/* Trader Path */}
                  <div className={cn(
                    "relative overflow-hidden p-6 rounded-3xl border transition-all",
                    persona === 'trader' ? "bg-blue-600 border-blue-500 shadow-xl shadow-blue-900/40" : "bg-slate-900/50 border-slate-800 opacity-80"
                  )}>
                    <div className="relative z-10">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="font-bold text-lg">The Trader Path</h3>
                        {persona === 'trader' && <CheckCircle2 className="w-5 h-5 text-white" />}
                      </div>
                      <div className="space-y-2 mb-4">
                        <p className={cn("text-xs leading-relaxed", persona === 'trader' ? "text-blue-100" : "text-slate-400")}>
                          Exclusive for dealers & brokers.
                        </p>
                        <ul className="text-[10px] space-y-1">
                          <li className="flex items-center gap-1.5">
                            <Zap className="w-3 h-3" /> Parts Sourcing Module
                          </li>
                          <li className="flex items-center gap-1.5">
                            <Zap className="w-3 h-3" /> Resale Margin Analysis
                          </li>
                        </ul>
                      </div>
                      <div className="flex items-baseline gap-1 mb-4">
                        <span className="text-2xl font-bold">R1,499</span>
                        <span className="text-[10px] opacity-70 flex items-center gap-0.5"><Infinity className="w-3 h-3" /> Lifetime</span>
                      </div>
                      <form action="https://www.payfast.co.za/eng/process" method="post">
                        <input type="hidden" name="merchant_id" value="10000100" />
                        <input type="hidden" name="merchant_key" value="46f0cd694581a" />
                        <input type="hidden" name="amount" value="1499.00" />
                        <input type="hidden" name="item_name" value="ShiftSense AI Trader Lifetime" />
                        <input type="hidden" name="custom_str1" value={user?.uid} />
                        <input type="hidden" name="custom_str2" value="lifetime" />
                        <button 
                          type="submit"
                          className={cn(
                            "w-full text-center font-bold py-2.5 rounded-xl text-xs transition-colors",
                            persona === 'trader' ? "bg-white text-blue-700 hover:bg-blue-50" : "bg-slate-800 text-slate-200 hover:bg-slate-700"
                          )}
                        >
                          Get Lifetime Deal
                        </button>
                      </form>
                    </div>
                  </div>

                  {/* Dealer/Parts Tier */}
                  <div className="relative overflow-hidden p-6 rounded-3xl border bg-slate-900/50 border-slate-800 opacity-80 hover:opacity-100 transition-all">
                    <div className="relative z-10">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="font-bold text-lg">Dealer/Parts Tier</h3>
                      </div>
                      <div className="space-y-2 mb-4">
                        <p className="text-xs leading-relaxed text-slate-400">
                          High-volume parts sourcing.
                        </p>
                        <ul className="text-[10px] space-y-1 text-slate-500">
                          <li className="flex items-center gap-1.5">
                            <Zap className="w-3 h-3" /> Direct Midas/Goldwagen Links
                          </li>
                          <li className="flex items-center gap-1.5">
                            <Zap className="w-3 h-3" /> Bulk Inventory Analysis
                          </li>
                        </ul>
                      </div>
                      <div className="flex items-baseline gap-1 mb-4">
                        <span className="text-2xl font-bold">R1,100</span>
                        <span className="text-[10px] opacity-70">/month</span>
                      </div>
                      <button className="w-full text-center font-bold py-2.5 rounded-xl text-xs bg-slate-800 text-slate-200 hover:bg-slate-700 transition-colors">
                        Contact Sales
                      </button>
                    </div>
                  </div>
                </div>

                {/* Currency Info */}
                <div className="bg-slate-900/30 border border-slate-800/50 p-6 rounded-2xl">
                  <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest mb-3">Market Trends</p>
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-400">USD/ZAR</span>
                      <span className="text-slate-200 font-mono">18.85</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-400">GBP/ZAR</span>
                      <span className="text-slate-200 font-mono">23.72</span>
                    </div>
                  </div>
                  <p className="text-[9px] text-slate-600 mt-4 italic">
                    *Based on current South African market trends.
                  </p>
                </div>
              </div>
            </div>
          )}

            {/* Results */}
            <div ref={resultsRef} className="scroll-mt-24">
              <AnimatePresence>
                {analyzing && (
                  <motion.section 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-6 space-y-8 overflow-hidden"
                  >
                  <div className="flex items-center justify-center py-12">
                    <div className="text-center">
                      <Loader2 className="w-12 h-12 text-blue-500 animate-spin mx-auto mb-6" />
                      <p className="text-lg font-bold text-blue-400 animate-pulse">
                        ShiftSense AI is scanning South African market data and security risks...
                      </p>
                    </div>
                  </div>
                  
                  <div className="space-y-8 opacity-50">
                    {/* Verdict Skeleton */}
                    <div className="h-48 bg-slate-900 rounded-3xl animate-pulse" />
                    
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                      <div className="lg:col-span-1 space-y-6">
                        <div className="h-40 bg-slate-900 rounded-3xl animate-pulse" />
                        <div className="h-64 bg-slate-900 rounded-3xl animate-pulse" />
                      </div>
                      <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="h-32 bg-slate-900 rounded-2xl animate-pulse" />
                        <div className="h-32 bg-slate-900 rounded-2xl animate-pulse" />
                        <div className="h-32 bg-slate-900 rounded-2xl animate-pulse" />
                        <div className="h-32 bg-slate-900 rounded-2xl animate-pulse" />
                      </div>
                    </div>
                  </div>
                </motion.section>
              )}

              {report && !analyzing && (
                <motion.section 
                  initial={{ opacity: 0, y: 40, height: 0 }}
                  animate={{ opacity: 1, y: 0, height: 'auto' }}
                  className="mt-6 border-t border-slate-800 pt-12 overflow-hidden"
                >
                  <div className="flex items-center justify-between mb-12">
                    <h2 className="text-3xl font-bold tracking-tight">ShiftSense Analysis Report</h2>
                    <div className="flex items-center gap-4">
                      <button 
                        onClick={() => window.print()}
                        className="text-xs font-bold text-slate-400 hover:text-white transition-colors flex items-center gap-1.5"
                      >
                        Print Report
                      </button>
                      <button 
                        onClick={downloadPDF}
                        disabled={exporting}
                        className={cn(
                          "px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2",
                          profile?.isPro 
                            ? "bg-blue-600 text-white hover:bg-blue-500" 
                            : "bg-slate-800 text-slate-500 cursor-not-allowed"
                        )}
                      >
                        {exporting ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : profile?.isPro ? (
                          <Download className="w-3.5 h-3.5" />
                        ) : (
                          <Lock className="w-3.5 h-3.5" />
                        )}
                        {exporting ? 'Exporting...' : 'Download PDF'}
                      </button>
                    </div>
                  </div>
                  
                  <div ref={reportRef} className="prose prose-invert prose-blue max-w-none space-y-12 p-8 bg-slate-950 rounded-[2.5rem]">
                    {/* Structured SWOT Grid */}
                    {report.swot && report.swot.length > 0 && (
                      <div className="space-y-12 mb-16">
                        {report.swot.map((item, idx) => (
                          <div key={idx} className="space-y-6">
                            <h3 className="text-2xl font-bold text-white flex items-center gap-3">
                              <ShieldCheck className="w-6 h-6 text-blue-500" />
                              SWOT Analysis: {item.vehicle}
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div className="bg-emerald-950/20 border border-emerald-500/20 p-6 rounded-2xl">
                                <h5 className="text-emerald-400 font-bold mb-3 uppercase text-[10px] tracking-widest flex items-center gap-2">
                                  <CheckCircle2 className="w-3 h-3" /> Strengths
                                </h5>
                                <ul className="space-y-2">
                                  {item.strengths.map((s: string, i: number) => (
                                    <li key={i} className="text-sm text-slate-300 flex gap-2">
                                      <span className="text-emerald-500">•</span> {s}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                              <div className="bg-red-950/20 border border-red-500/20 p-6 rounded-2xl">
                                <h5 className="text-red-400 font-bold mb-3 uppercase text-[10px] tracking-widest flex items-center gap-2">
                                  <AlertTriangle className="w-3 h-3" /> Weaknesses
                                </h5>
                                <ul className="space-y-2">
                                  {item.weaknesses.map((w: string, i: number) => (
                                    <li key={i} className="text-sm text-slate-300 flex gap-2">
                                      <span className="text-red-500">•</span> {w}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                              <div className="bg-blue-950/20 border border-blue-500/20 p-6 rounded-2xl">
                                <h5 className="text-blue-400 font-bold mb-3 uppercase text-[10px] tracking-widest flex items-center gap-2">
                                  <Zap className="w-3 h-3" /> Opportunities
                                </h5>
                                <ul className="space-y-2">
                                  {item.opportunities.map((o: string, i: number) => (
                                    <li key={i} className="text-sm text-slate-300 flex gap-2">
                                      <span className="text-blue-500">•</span> {o}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                              <div className="bg-orange-950/20 border border-orange-500/20 p-6 rounded-2xl">
                                <h5 className="text-orange-400 font-bold mb-3 uppercase text-[10px] tracking-widest flex items-center gap-2">
                                  <ShieldAlert className="w-3 h-3" /> Threats
                                </h5>
                                <ul className="space-y-2">
                                  {item.threats.map((t: string, i: number) => (
                                    <li key={i} className="text-sm text-slate-300 flex gap-2">
                                      <span className="text-orange-500">•</span> {t}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    <Markdown components={{
                      h1: ({node, ...props}) => (
                        <div className="mb-12">
                          <h1 className="text-3xl font-bold mb-6 text-white border-b border-slate-800 pb-4 flex items-center gap-3" {...props}>
                            <Globe className="w-6 h-6 text-blue-500" />
                            {props.children}
                          </h1>
                        </div>
                      ),
                      h2: ({node, ...props}) => {
                        const content = String(props.children);
                        if (content.includes('Verdict')) {
                          return (
                            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-600 to-blue-900 p-1 mb-8 shadow-2xl shadow-blue-500/20">
                              <div className="bg-slate-950 rounded-[22px] p-8">
                                <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                                  <div className="text-center md:text-left">
                                    <span className="inline-block px-4 py-1 rounded-full bg-blue-600 text-[10px] font-bold tracking-widest uppercase mb-4">Final Verdict</span>
                                    <h2 className="text-4xl font-black text-white mb-2" {...props} />
                                  </div>
                                  <div className="bg-blue-600 px-10 py-6 rounded-2xl text-center shadow-lg shadow-blue-500/40">
                                    <p className="text-[10px] uppercase font-bold text-blue-200 mb-1">ShiftSense Score</p>
                                    <p className="text-5xl font-black text-white">9.2</p>
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        }
                        return <h2 className="text-3xl font-bold mt-16 mb-8 text-white flex items-center gap-3" {...props} />;
                      },
                      h3: ({node, ...props}) => {
                        const content = String(props.children);
                        if (content.includes('Security')) return null; // Handled by p parser
                        if (content.includes('Mechanical')) {
                          return <h3 className="text-emerald-400 font-bold mb-4 italic flex items-center gap-2 mt-8" {...props}><Zap className="w-4 h-4" /> {props.children}</h3>;
                        }
                        return <h3 className="text-xl font-bold mt-8 mb-4 text-blue-400" {...props} />;
                      },
                      p: ({node, ...props}) => {
                        const content = String(props.children);
                        
                        // Winner Badge
                        if (content.includes('[WINNER:')) {
                          const name = content.match(/\[WINNER: (.*?)\]/)?.[1];
                          return (
                            <div className="flex items-center gap-2 text-blue-400 font-bold mb-2">
                              <Trophy className="w-4 h-4" /> Recommended: {name}
                            </div>
                          );
                        }

                        // Score Badge
                        if (content.includes('[SCORE:')) {
                          return null; // Handled in h2 Verdict
                        }

                        // Quote
                        if (content.includes('[QUOTE:')) {
                          const quote = content.match(/\[QUOTE: (.*?)\]/)?.[1];
                          return (
                            <div className="flex items-start gap-3 p-4 bg-blue-900/20 border-l-4 border-blue-500 rounded-r-xl mb-6 italic text-blue-200">
                              <Quote className="w-5 h-5 shrink-0 opacity-50" />
                              <p className="m-0">{quote}</p>
                            </div>
                          );
                        }

                        // Security Risk Meter
                        if (content.includes('[RISK:')) {
                          const risk = content.match(/\[RISK: (.*?)\]/)?.[1] || 'MODERATE';
                          
                          if (!profile?.isPro) {
                            return (
                              <div className="bg-slate-900/50 border border-slate-800 p-8 rounded-3xl text-center my-8">
                                <Lock className="w-8 h-8 text-slate-600 mx-auto mb-4" />
                                <h4 className="text-lg font-bold mb-2">Security Risk Analysis Locked</h4>
                                <p className="text-sm text-slate-500 mb-6">Upgrade to Pro to see the full RSA-specific security risk meter and theft desirability scale.</p>
                                <button 
                                  onClick={() => document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' })}
                                  className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-all"
                                >
                                  Upgrade Now
                                </button>
                              </div>
                            );
                          }

                          const color = risk === 'EXTREME' || risk === 'HIGH' ? 'text-red-500' : risk === 'MODERATE' ? 'text-orange-500' : 'text-emerald-500';
                          const bgColor = risk === 'EXTREME' || risk === 'HIGH' ? 'bg-red-600' : risk === 'MODERATE' ? 'bg-orange-500' : 'bg-emerald-500';
                          const width = risk === 'EXTREME' ? '92%' : risk === 'HIGH' ? '75%' : risk === 'MODERATE' ? '50%' : '25%';
                          
                          return (
                            <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl relative overflow-hidden mb-6">
                              <div className="absolute top-0 right-0 p-4 opacity-10"><ShieldAlert className="w-16 h-16 text-red-500" /></div>
                              <h4 className={cn("font-bold mb-4 flex items-center gap-2 uppercase text-sm", color)}>
                                <AlertTriangle className="w-4 h-4" /> SECURITY RISK: {risk}
                              </h4>
                              <div className="w-full bg-slate-800 h-3 rounded-full mb-4">
                                <motion.div 
                                  initial={{ width: 0 }}
                                  animate={{ width }}
                                  className={cn("h-3 rounded-full", bgColor)}
                                />
                              </div>
                            </div>
                          );
                        }

                        return <p className="text-slate-400 leading-relaxed" {...props} />;
                      },
                      table: ({node, ...props}) => (
                        <div className="overflow-x-auto my-6 rounded-2xl border border-slate-800 bg-slate-900/50">
                          <table className="w-full text-sm text-left" {...props} />
                        </div>
                      ),
                      th: ({node, ...props}) => <th className="bg-slate-800/50 p-4 font-bold text-slate-200" {...props} />,
                      td: ({node, ...props}) => <td className="p-4 border-t border-slate-800 text-slate-400" {...props} />,
                      ul: ({node, ...props}) => {
                        // Check if this is the SWOT list
                        const isSwot = props.children && Array.isArray(props.children) && 
                          props.children.some(child => {
                            const text = String(child.props?.children?.[0]?.props?.children || '');
                            return text.includes('Strengths') || text.includes('Weaknesses');
                          });

                        if (isSwot) {
                          return (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-8">
                              {props.children}
                            </div>
                          );
                        }
                        return <ul className="list-none space-y-3 my-4" {...props} />;
                      },
                      li: ({node, ...props}) => {
                        return (
                          <li className="flex gap-3 items-start text-slate-400 text-sm">
                            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                            <span>{props.children}</span>
                          </li>
                        );
                      },
                    }}>
                      {report.report}
                    </Markdown>
                  </div>
                </motion.section>
              )}
            </AnimatePresence>
          </div>
          </>
        )}

        {/* About the Developer Section */}
        <section id="developer" className="py-24 px-6 bg-slate-950/50 border-t border-slate-900">
          <div className="max-w-4xl mx-auto">
            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-emerald-600 rounded-[3rem] blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
              <div className="relative bg-slate-900 border border-slate-800 rounded-[3rem] p-8 md:p-12 text-center">
                <div className="inline-block px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[10px] font-bold uppercase tracking-widest mb-4">
                  Lead Developer
                </div>
                <h2 className="text-3xl font-bold mb-4">Tsepo Motsatse</h2>
                <p className="text-slate-400 mb-8 leading-relaxed max-w-2xl mx-auto">
                  Tsepo Motsatse is a specialist solopreneur assisting companies in utilizing and integrating AI solutions to boost productivity and automate procedures.
                  <br /><br />
                  Elevate your digital infrastructure: I build scalable, secure, high-performance SaaS applications for founders and corporate entities. Let’s transform your vision into a robust, market-ready platform.
                </p>
                <div className="flex flex-wrap justify-center gap-4">
                  <a 
                    href="mailto:tsepomotsatse@gmail.com" 
                    className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-bold text-sm transition-all shadow-lg shadow-blue-900/20"
                  >
                    <MessageSquare className="w-4 h-4" /> Email Me
                  </a>
                  <a 
                    href="https://wa.me/27679489264" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl font-bold text-sm transition-all shadow-lg shadow-emerald-900/20"
                  >
                    <Zap className="w-4 h-4" /> WhatsApp
                  </a>
                </div>
                  
                <div className="mt-8 pt-8 border-t border-slate-800/50">
                  <a 
                    href="mailto:tsepomotsatse@gmail.com"
                    className="inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-blue-600 to-emerald-600 text-white rounded-2xl font-black text-sm uppercase tracking-widest hover:scale-105 transition-transform shadow-2xl shadow-blue-500/20"
                  >
                    Hire Tsepo Motsatse <MessageSquare className="w-4 h-4" />
                  </a>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-slate-950 border-t border-slate-900 py-16 px-6 text-center">
        <div className="max-w-6xl mx-auto">
          <div className="flex justify-center flex-wrap gap-8 text-sm text-slate-500 mb-6">
            <button onClick={() => setShowTerms(true)} className="hover:text-blue-500 transition underline decoration-slate-800 underline-offset-4">Terms of Service</button>
            <button onClick={() => setShowPrivacy(true)} className="hover:text-blue-500 transition underline decoration-slate-800 underline-offset-4">Privacy Policy</button>
            <button 
              onClick={() => {
                document.getElementById('developer')?.scrollIntoView({ behavior: 'smooth' });
              }} 
              className="hover:text-emerald-500 transition underline decoration-slate-800 underline-offset-4 font-medium"
            >
              Hire the Developer
            </button>
            <button 
              onClick={() => setShowLoginModal(true)} 
              className="text-[10px] text-slate-700 hover:text-slate-500 transition uppercase tracking-tighter"
            >
              Admin Access
            </button>
          </div>
          <div className="flex flex-col md:flex-row justify-between items-center gap-6 pt-8 border-t border-slate-900/50">
            <div className="flex items-center gap-2 opacity-50">
              <Car className="w-5 h-5" />
              <span className="text-sm font-bold tracking-tight">ShiftSense AI</span>
            </div>
            <p className="text-slate-600 text-xs">
              © {new Date().getFullYear()} ShiftSense AI | Republic of South Africa | motsatsetsepo66@gmail.com
            </p>
            <div className="flex gap-6">
              <a href="#" className="text-slate-600 hover:text-slate-400 text-xs transition-colors">Support</a>
              <a href="#" className="text-slate-600 hover:text-slate-400 text-xs transition-colors">Contact</a>
            </div>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <AnimatePresence>
        {showUpgradeModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowUpgradeModal(false)}
              className="absolute inset-0 bg-slate-950/80 backdrop-blur-md"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-[2.5rem] p-8 md:p-12 shadow-2xl overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-600 to-emerald-600" />
              <div className="text-center">
                <div className="bg-blue-600/20 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <Zap className="text-blue-500 w-8 h-8" />
                </div>
                <h3 className="text-3xl font-bold mb-4">Free Limit Reached</h3>
                <p className="text-slate-400 mb-8 leading-relaxed">
                  You've used all 5 of your free ShiftSense analyses. Upgrade to a Pro plan to unlock unlimited searches, deep-dive mechanical reports, and dealer-grade parts sourcing.
                </p>
                
                <div className="space-y-4">
                  <button 
                    onClick={() => {
                      setShowUpgradeModal(false);
                      // Scroll to pricing
                      document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' });
                    }}
                    className="w-full py-4 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-2xl transition-all shadow-lg shadow-blue-900/20"
                  >
                    View Upgrade Options
                  </button>
                  <button 
                    onClick={() => setShowUpgradeModal(false)}
                    className="w-full py-4 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-2xl transition-all"
                  >
                    Maybe Later
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}

        {showTerms && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-slate-900 border border-slate-800 max-w-2xl w-full p-8 rounded-3xl max-h-[80vh] overflow-y-auto relative shadow-2xl"
            >
              <button onClick={() => setShowTerms(false)} className="absolute top-6 right-6 text-slate-400 hover:text-white text-2xl">&times;</button>
              <h2 className="text-2xl font-bold mb-6 text-blue-400">Terms of Service</h2>
              <div className="space-y-6 text-sm text-slate-300 leading-relaxed">
                <p><strong>1. Information Accuracy:</strong> ShiftSense AI provides estimates based on available digital data. It is not a substitute for a physical Dekra/SGS inspection.</p>
                <p><strong>2. Security:</strong> We do not hold a database of stolen vehicles. Users are urged to verify VINs with SAPS before purchase.</p>
                <p><strong>3. Liability:</strong> ShiftSense AI is not liable for financial losses, mechanical failures, or legal disputes resulting from vehicle purchases.</p>
              </div>
            </motion.div>
          </div>
        )}

        {showPrivacy && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-slate-900 border border-slate-800 max-w-2xl w-full p-8 rounded-3xl relative shadow-2xl"
            >
              <button onClick={() => setShowPrivacy(false)} className="absolute top-6 right-6 text-slate-400 hover:text-white text-2xl">&times;</button>
              <h2 className="text-2xl font-bold mb-6 text-emerald-400">Privacy Policy (POPIA)</h2>
              <div className="space-y-6 text-sm text-slate-300 leading-relaxed">
                <p><strong>1. Data Collection:</strong> We adhere to the Protection of Personal Information Act. We only collect data necessary for subscription management via PayFast.</p>
                <p><strong>2. Payment Processing:</strong> ShiftSense AI utilizes PayFast for all ZAR transactions. Your financial data is handled securely via PayFast's encrypted gateway; we do not store your banking or card details on our servers.</p>
                <p><strong>3. Usage:</strong> Your vehicle search history is confidential and is not shared with insurance or marketing agencies.</p>
                <p><strong>4. Safety:</strong> All transaction data is handled by PayFast. We do not store credit card details.</p>
              </div>
            </motion.div>
          </div>
        )}

        {showLoginModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/80 backdrop-blur-md">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-slate-900 border border-slate-800 max-w-md w-full p-8 rounded-[2.5rem] relative shadow-2xl"
            >
              <button onClick={() => setShowLoginModal(false)} className="absolute top-6 right-6 text-slate-400 hover:text-white text-2xl">&times;</button>
              <h2 className="text-2xl font-bold mb-6 text-center">Sign In</h2>
              
              <div className="space-y-6">
                <button 
                  onClick={handleLogin}
                  className="w-full flex items-center justify-center gap-3 bg-white text-slate-900 py-4 rounded-2xl font-bold hover:bg-slate-100 transition-all"
                >
                  <Globe className="w-5 h-5" /> Continue with Google
                </button>
                
                <div className="relative">
                  <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-800"></div></div>
                  <div className="relative flex justify-center text-xs uppercase"><span className="bg-slate-900 px-2 text-slate-500">Or Admin Login</span></div>
                </div>

                <form onSubmit={handleAdminLogin} className="space-y-4">
                  <input 
                    type="text" 
                    placeholder="Username" 
                    value={adminUsername}
                    onChange={(e) => setAdminUsername(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 p-4 rounded-xl outline-none focus:border-blue-500 transition"
                  />
                  <input 
                    type="password" 
                    placeholder="Password" 
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 p-4 rounded-xl outline-none focus:border-blue-500 transition"
                  />
                  <button 
                    type="submit"
                    className="w-full bg-slate-800 hover:bg-slate-700 text-white py-4 rounded-2xl font-bold transition-all"
                  >
                    Login as Admin
                  </button>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

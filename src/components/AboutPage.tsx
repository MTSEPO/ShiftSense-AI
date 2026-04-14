import { motion } from 'motion/react';
import { 
  ShieldAlert, 
  Wrench, 
  UserCheck, 
  FileText, 
  ArrowRight, 
  MessageSquare,
  Linkedin,
  Github,
  Globe,
  Mail
} from 'lucide-react';
import { cn } from '../lib/utils';

interface AboutPageProps {
  onBack: () => void;
}

export default function AboutPage({ onBack }: AboutPageProps) {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-blue-500/30">
      {/* Hero Section */}
      <section className="relative py-24 px-6 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(37,99,235,0.1),transparent_50%)]" />
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight mb-6 bg-gradient-to-r from-white via-blue-100 to-slate-400 bg-clip-text text-transparent">
              Revolutionizing the South African Used Vehicle Market.
            </h1>
            <p className="text-xl md:text-2xl text-slate-400 leading-relaxed max-w-3xl mx-auto">
              ShiftSense AI combines advanced artificial intelligence with deep local market insights to ensure you never buy a 'lemon' again.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Overview Section */}
      <section className="py-20 px-6 bg-slate-900/30">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="bg-slate-900/50 border border-slate-800 p-10 md:p-16 rounded-[3rem] backdrop-blur-xl shadow-2xl relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/5 rounded-full blur-3xl -mr-32 -mt-32" />
            <h2 className="text-3xl font-bold mb-8 flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
                <Globe className="w-6 h-6 text-white" />
              </div>
              The Vision
            </h2>
            <p className="text-lg md:text-xl text-slate-300 leading-relaxed">
              ShiftSense AI is a sophisticated SaaS platform engineered specifically for the unique landscape of the South African automotive market. We bridge the gap between manufacturer specifications and real-world mechanical reliability. By analyzing technical data, owner reviews, and localized security risks, we empower buyers to make safer choices and traders to maximize their margins.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Key Features Grid */}
      <section className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">How It Works</h2>
            <p className="text-slate-400">Advanced diagnostic intelligence at your fingertips.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {[
              {
                title: "Security Risk Meter",
                desc: "Identify high-risk hijacking targets and insurance requirements specific to RSA (e.g., Hilux, Polo, Ranger).",
                icon: ShieldAlert,
                color: "text-red-400",
                bg: "bg-red-400/10"
              },
              {
                title: "Mechanical 'Lemon' Detection",
                desc: "Spot common engine, gearbox, and suspension failures before you commit to a purchase.",
                icon: Wrench,
                color: "text-amber-400",
                bg: "bg-amber-400/10"
              },
              {
                title: "Persona-Driven Verdicts",
                desc: "Tailored reports for 'The Buyer' (Safety & Longevity) and 'The Trader' (Resale & Margins).",
                icon: UserCheck,
                color: "text-blue-400",
                bg: "bg-blue-400/10"
              },
              {
                title: "Official Appraisal PDF",
                desc: "Downloadable professional reports for negotiations and physical inspections.",
                icon: FileText,
                color: "text-emerald-400",
                bg: "bg-emerald-400/10"
              }
            ].map((feature, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="bg-slate-900/50 border border-slate-800 p-8 rounded-[2.5rem] hover:border-slate-700 transition-all group"
              >
                <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center mb-6 transition-transform group-hover:scale-110", feature.bg)}>
                  <feature.icon className={cn("w-7 h-7", feature.color)} />
                </div>
                <h3 className="text-2xl font-bold mb-4">{feature.title}</h3>
                <p className="text-slate-400 leading-relaxed">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Developer Section */}
      <section id="developer" className="py-24 px-6 bg-slate-900/30">
        <div className="max-w-5xl mx-auto">
          <div className="bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 rounded-[3rem] p-10 md:p-16 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl -mr-48 -mt-48" />
            
            <div className="flex flex-col md:flex-row gap-12 items-center relative z-10">
              <div className="w-48 h-48 md:w-64 md:h-64 rounded-[2.5rem] bg-slate-800 border-4 border-slate-700 overflow-hidden shrink-0 shadow-2xl rotate-3">
                <img 
                  src="https://picsum.photos/seed/tsepo/400/400" 
                  alt="Tsepo Motsatse" 
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>
              
              <div className="flex-1 text-center md:text-left">
                <div className="inline-block px-4 py-1.5 bg-blue-600/20 rounded-full text-blue-400 text-xs font-bold uppercase tracking-widest mb-6">
                  Lead Developer
                </div>
                <h2 className="text-4xl font-bold mb-6">Tsepo Motsatse</h2>
                <p className="text-lg text-slate-300 leading-relaxed mb-8">
                  Tsepo Motsatse is a specialist solopreneur assisting companies in utilizing and integrating AI solutions to boost productivity and automate procedures. With a deep understanding of the South African automotive landscape, he engineered ShiftSense AI to solve real-world problems for local car buyers.
                </p>
                
                <div className="flex flex-wrap justify-center md:justify-start gap-4 mb-10">
                  <a href="mailto:motsatsetsepo66@gmail.com" className="p-3 bg-slate-800 rounded-xl hover:bg-slate-700 transition-colors text-slate-300 hover:text-white">
                    <Mail className="w-5 h-5" />
                  </a>
                  <a href="#" className="p-3 bg-slate-800 rounded-xl hover:bg-slate-700 transition-colors text-slate-300 hover:text-white">
                    <Linkedin className="w-5 h-5" />
                  </a>
                  <a href="#" className="p-3 bg-slate-800 rounded-xl hover:bg-slate-700 transition-colors text-slate-300 hover:text-white">
                    <Github className="w-5 h-5" />
                  </a>
                </div>

                <a 
                  href="https://wa.me/27721234567" // Example WhatsApp link
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white font-extrabold px-8 py-4 rounded-2xl shadow-xl transition transform active:scale-95 group"
                >
                  Hire the Developer for Your Next AI Project
                  <MessageSquare className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer CTA */}
      <section className="py-24 px-6 text-center">
        <button 
          onClick={onBack}
          className="inline-flex items-center gap-2 text-slate-400 hover:text-blue-400 font-bold transition-colors group"
        >
          <ArrowRight className="w-5 h-5 rotate-180 group-hover:-translate-x-1 transition-transform" />
          Back to Dashboard
        </button>
      </section>
    </div>
  );
}

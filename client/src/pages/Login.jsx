import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Building2, Lock, User, Sparkles, MapPin, ArrowRight, Star, ShieldCheck, KeyRound } from 'lucide-react';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username || !password) return;
    setSubmitting(true);
    const res = await login(username, password);
    setSubmitting(false);
    if (res.success) {
      navigate('/');
    }
  };

  const handleQuickLogin = async (u, p) => {
    setUsername(u);
    setPassword(p);
    setSubmitting(true);
    const res = await login(u, p);
    setSubmitting(false);
    if (res.success) {
      navigate('/');
    }
  };

  return (
    <div className="min-h-screen bg-[#F6F2EB] flex items-center justify-center p-4 lg:p-8 relative overflow-hidden">
      {/* Decorative ambient background glows */}
      <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-gold-400/10 rounded-full blur-[100px] pointer-events-none"></div>
      <div className="absolute bottom-0 left-1/4 w-[500px] h-[500px] bg-navy-900/10 rounded-full blur-[100px] pointer-events-none"></div>

      <div className="w-full max-w-4xl bg-white rounded-3xl shadow-2xl border border-[#E8DFD0] overflow-hidden grid grid-cols-1 md:grid-cols-5 relative z-10">
        {/* Left Side: Heritage Hotel Branding (2 cols on md) */}
        <div className="md:col-span-2 bg-gradient-to-br from-navy-950 via-navy-900 to-navy-800 p-8 text-white flex flex-col justify-between relative overflow-hidden">
          <div className="absolute -top-12 -left-12 w-48 h-48 bg-gold-500/15 rounded-full blur-2xl pointer-events-none"></div>

          <div className="relative z-10">
            {/* Stars */}
            <div className="flex items-center gap-1 text-gold-400 mb-3">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-3.5 h-3.5 fill-gold-400" />
              ))}
            </div>

            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-gold-400 to-gold-600 flex items-center justify-center text-navy-900 shadow-lg shadow-gold-500/30 mb-4">
              <Building2 className="w-7 h-7 stroke-[2.2]" />
            </div>

            <h1 className="font-serif-heading text-2xl lg:text-3xl font-bold text-white tracking-wide leading-tight">
              Grand Horrizon
            </h1>
            <p className="text-xs text-gold-400 uppercase tracking-widest font-semibold mt-1">
              White Town, Puducherry
            </p>

            <div className="mt-4 flex items-start gap-1.5 text-xs text-slate-300 leading-relaxed">
              <MapPin className="w-4 h-4 text-gold-400 shrink-0 mt-0.5" />
              <span>Plot 24, Demo Avenue, White Town, Puducherry – 605001</span>
            </div>
          </div>

          <div className="relative z-10 mt-8 pt-6 border-t border-white/10 space-y-3 text-xs text-slate-300">
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-gold-400"></div>
              <span>French Colonial Heritage Suites</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400"></div>
              <span>Real-Time SQLite Database Persistence</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-blue-400"></div>
              <span>Multi-Role Access Control (RBAC)</span>
            </div>
          </div>

          <div className="relative z-10 mt-6 pt-4 text-[11px] text-slate-400 border-t border-white/5">
            Academic DBMS Project • SQLite Engine
          </div>
        </div>

        {/* Right Side: Login Form & Demo Credentials (3 cols on md) */}
        <div className="md:col-span-3 p-8 lg:p-10 flex flex-col justify-between bg-white">
          <div>
            <div className="mb-6">
              <h2 className="font-serif-heading text-2xl font-bold text-navy-900 tracking-tight">
                System Sign In
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Enter your credentials to manage hotel reservations and billing.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Operator Username
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="e.g. admin / reception / accounts"
                    required
                    className="w-full pl-10 pr-4 py-2.5 bg-[#FAF7F2] border border-[#E8DFD0] rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-gold-500/50 focus:border-gold-500 transition-all text-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Secure Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter password"
                    required
                    className="w-full pl-10 pr-4 py-2.5 bg-[#FAF7F2] border border-[#E8DFD0] rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-gold-500/50 focus:border-gold-500 transition-all text-slate-900"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3 px-4 bg-navy-900 hover:bg-navy-800 text-white font-bold text-xs rounded-xl shadow-md hover:shadow-lg transition-all duration-200 flex items-center justify-center gap-2 mt-2 disabled:opacity-70"
              >
                {submitting ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <>
                    <span>Enter Management Portal</span>
                    <ArrowRight className="w-4 h-4 text-gold-400" />
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Quick Demo Role Logins */}
          <div className="mt-8 pt-6 border-t border-[#E8DFD0]">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-gold-500" /> 1-Click Role Logins
              </span>
              <span className="text-[10px] text-slate-400 font-medium">Click button to sign in</span>
            </div>

            <div className="grid grid-cols-3 gap-2.5">
              <button
                type="button"
                onClick={() => handleQuickLogin('admin', 'admin123')}
                className="p-2.5 rounded-xl border border-[#E8DFD0] hover:border-gold-500 hover:bg-cream-100 transition-all text-left group"
              >
                <p className="text-xs font-bold text-navy-900 group-hover:text-gold-600">Admin</p>
                <p className="text-[10px] text-slate-400 font-mono mt-0.5">admin123</p>
                <span className="inline-block text-[9px] uppercase font-bold text-emerald-600 mt-1">Full CRUD</span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('reception', 'reception123')}
                className="p-2.5 rounded-xl border border-[#E8DFD0] hover:border-gold-500 hover:bg-cream-100 transition-all text-left group"
              >
                <p className="text-xs font-bold text-navy-900 group-hover:text-gold-600">Reception</p>
                <p className="text-[10px] text-slate-400 font-mono mt-0.5">reception123</p>
                <span className="inline-block text-[9px] uppercase font-bold text-blue-600 mt-1">Bookings</span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('accounts', 'accounts123')}
                className="p-2.5 rounded-xl border border-[#E8DFD0] hover:border-gold-500 hover:bg-cream-100 transition-all text-left group"
              >
                <p className="text-xs font-bold text-navy-900 group-hover:text-gold-600">Accounts</p>
                <p className="text-[10px] text-slate-400 font-mono mt-0.5">accounts123</p>
                <span className="inline-block text-[9px] uppercase font-bold text-amber-600 mt-1">Billing</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Footer attribution */}
      <footer className="mt-5 text-center relative z-10">
        <p className="text-[11px] text-slate-400 tracking-wider">
          Designed and developed by <span className="font-semibold text-slate-600">Anish & Abhijat</span>
        </p>
      </footer>
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { MapPin, Calendar, Database, Sparkles, Clock, Crown, Shield } from 'lucide-react';

export default function Header() {
  const { user } = useAuth();
  const [time, setTime] = useState(new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const today = new Date().toLocaleDateString('en-IN', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });

  return (
    <header className="bg-white/95 backdrop-blur-md border-b border-[#EBE4D8] px-6 lg:px-8 py-3 flex flex-wrap items-center justify-between gap-3 shrink-0 shadow-[0_2px_10px_rgba(0,0,0,0.02)] sticky top-0 z-30">
      {/* Hotel Location & Star Rating */}
      <div className="flex items-center gap-3">
        <div className="hidden sm:flex items-center gap-1.5 text-xs text-slate-600 bg-[#F7F3EC] px-3.5 py-1.5 rounded-full border border-[#E8DFD0]">
          <MapPin className="w-3.5 h-3.5 text-gold-600 shrink-0" />
          <span className="font-medium text-slate-700">
            Grand Horrizon • Plot 24, Demo Avenue, White Town, Puducherry – 605001
          </span>
        </div>

        {/* Database Live Heartbeat Badge */}
        <div className="flex items-center gap-1.5 text-[11px] font-mono text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="font-semibold">SQLite Active</span>
        </div>
      </div>

      {/* Date, Time & User Role Badge */}
      <div className="flex items-center gap-3">
        <div className="hidden md:flex items-center gap-2 text-xs text-slate-500 font-mono bg-slate-50 px-3 py-1 rounded-lg border border-slate-200">
          <Clock className="w-3.5 h-3.5 text-slate-400" />
          <span>{today} • {time}</span>
        </div>

        <div className="flex items-center gap-2.5 pl-2 border-l border-slate-200">
          <div className="w-8 h-8 rounded-full bg-navy-900 border-2 border-gold-400 flex items-center justify-center text-gold-400 font-bold text-xs shadow-xs">
            {user?.full_name?.charAt(0) || 'U'}
          </div>
          <div className="text-right">
            <p className="text-xs font-bold text-navy-900 leading-tight">
              {user?.full_name?.split(' ')[0]}
            </p>
            <span className="inline-flex items-center text-[10px] uppercase font-bold tracking-wider text-gold-600">
              {user?.role}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}

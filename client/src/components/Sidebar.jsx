import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  Users,
  BedDouble,
  CalendarCheck,
  Receipt,
  CreditCard,
  Database,
  LogOut,
  ShieldCheck,
  Building2,
  Sparkles,
  Star
} from 'lucide-react';

export default function Sidebar() {
  const { user, logout, hasRole } = useAuth();

  const navItems = [
    {
      label: 'Dashboard',
      path: '/',
      icon: LayoutDashboard,
      show: true,
      badge: 'Live'
    },
    {
      label: 'Guest Directory',
      path: '/guests',
      icon: Users,
      show: hasRole('admin', 'receptionist'),
      badge: null
    },
    {
      label: 'Rooms & Suites',
      path: '/rooms',
      icon: BedDouble,
      show: true,
      badge: null
    },
    {
      label: 'Reservations',
      path: '/reservations',
      icon: CalendarCheck,
      show: hasRole('admin', 'receptionist'),
      badge: null
    },
    {
      label: 'Tax Billing & Invoices',
      path: '/billing',
      icon: Receipt,
      show: hasRole('admin', 'accountant'),
      badge: null
    },
    {
      label: 'Payment Ledger',
      path: '/payments',
      icon: CreditCard,
      show: hasRole('admin', 'accountant'),
      badge: null
    },
    {
      label: 'Database & SQL Engine',
      path: '/database',
      icon: Database,
      show: hasRole('admin'),
      badge: 'DBMS'
    }
  ];

  return (
    <aside className="w-64 bg-navy-900 text-slate-200 flex flex-col shrink-0 border-r border-navy-800 min-h-screen relative shadow-2xl z-40">
      {/* Brand Header */}
      <div className="p-6 border-b border-navy-800/90 relative overflow-hidden">
        {/* Subtle decorative glow */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-gold-500/10 rounded-full blur-2xl pointer-events-none"></div>

        <div className="flex items-center gap-3 relative z-10">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-gold-400 via-gold-500 to-gold-600 flex items-center justify-center text-navy-900 shadow-lg shadow-gold-500/25 border border-gold-300">
            <Building2 className="w-6 h-6 stroke-[2.2]" />
          </div>
          <div>
            <div className="flex items-center gap-0.5 text-gold-400 mb-0.5">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-2.5 h-2.5 fill-gold-400" />
              ))}
            </div>
            <h1 className="font-serif-heading text-lg font-bold text-white tracking-wide leading-tight">
              Grand Horrizon
            </h1>
            <p className="text-[10px] text-gold-400/90 font-medium tracking-wider uppercase">
              White Town, Puducherry
            </p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3.5 py-6 space-y-1 overflow-y-auto">
        <p className="px-3 text-[10px] font-bold text-slate-400/80 uppercase tracking-widest mb-3">
          Management Modules
        </p>
        {navItems
          .filter(item => item.show)
          .map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === '/'}
                className={({ isActive }) =>
                  `flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all duration-200 group ${
                    isActive
                      ? 'bg-gradient-to-r from-gold-500 to-gold-600 text-navy-900 font-bold shadow-md shadow-gold-500/20'
                      : 'text-slate-300 hover:text-white hover:bg-navy-800/70'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <div className="flex items-center gap-3">
                      <Icon className={`w-4 h-4 shrink-0 transition-transform group-hover:scale-110 ${isActive ? 'text-navy-900' : 'text-gold-400/70 group-hover:text-gold-400'}`} />
                      <span className="truncate">{item.label}</span>
                    </div>
                    {item.badge && (
                      <span className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-md ${
                        isActive
                          ? 'bg-navy-900 text-gold-400'
                          : 'bg-navy-800 text-gold-400 border border-gold-500/30'
                      }`}>
                        {item.badge}
                      </span>
                    )}
                  </>
                )}
              </NavLink>
            );
          })}
      </nav>

      {/* Database engine status indicator */}
      <div className="mx-3.5 mb-3 p-3 rounded-xl bg-navy-950/70 border border-navy-800/80 text-[11px]">
        <div className="flex items-center justify-between text-slate-400 mb-1">
          <span className="text-[10px] uppercase font-bold tracking-wider">DBMS Engine</span>
          <span className="text-[10px] text-emerald-400 font-mono font-bold">SQLite v3</span>
        </div>
        <p className="text-[10px] text-slate-400 font-mono truncate">
          server/database/hotel.db
        </p>
      </div>

      {/* User profile footer */}
      <div className="p-4 border-t border-navy-800/90 bg-navy-950/90">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="w-8 h-8 rounded-full bg-navy-800 border border-gold-500/40 flex items-center justify-center text-gold-400 shrink-0 font-bold text-xs shadow-inner">
              {user?.full_name?.charAt(0) || 'U'}
            </div>
            <div className="truncate">
              <p className="text-xs font-semibold text-white truncate">{user?.full_name}</p>
              <div className="flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-gold-400 shrink-0" />
                <span className="text-[10px] text-gold-400 capitalize font-medium">
                  {user?.role} Portal
                </span>
              </div>
            </div>
          </div>
          <button
            onClick={logout}
            title="Log out of system"
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-navy-800 transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>

        {/* Developer attribution in sidebar footer */}
        <div className="mt-2.5 pt-2 border-t border-navy-800/80 text-center">
          <p className="text-[9px] text-slate-400/80 tracking-wider">
            Designed and developed by <span className="text-gold-400 font-medium">Anish & Abhijat</span>
          </p>
        </div>
      </div>
    </aside>
  );
}

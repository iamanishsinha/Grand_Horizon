import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';

export default function Layout() {
  return (
    <div className="flex h-screen overflow-hidden bg-cream-canvas">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto p-6 lg:p-8 flex flex-col justify-between">
          <div className="flex-1">
            <Outlet />
          </div>
          <footer className="mt-12 pt-6 pb-2 border-t border-[#E8DFD0] text-center no-print">
            <p className="text-[11px] text-slate-400 tracking-wider">
              Grand Horrizon Hotel Management System • Designed and developed by <span className="font-semibold text-slate-600">Anish & Abhijat</span>
            </p>
          </footer>
        </main>
      </div>
    </div>
  );
}

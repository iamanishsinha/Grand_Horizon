import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ allowedRoles }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-cream-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-gold-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm font-medium text-slate-600">Loading Grand Horrizon portal...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return (
      <div className="p-8 max-w-lg mx-auto text-center mt-20 bg-white rounded-xl shadow border border-slate-200">
        <div className="w-14 h-14 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold">
          !
        </div>
        <h2 className="text-xl font-bold text-slate-800 mb-2">Access Restricted</h2>
        <p className="text-sm text-slate-600 mb-6">
          Your role (<span className="font-semibold capitalize text-slate-800">{user.role}</span>) does not have permission to access this module. Please contact the administrator.
        </p>
        <a
          href="/"
          className="inline-block px-5 py-2.5 bg-navy-800 text-white font-medium text-sm rounded-lg hover:bg-navy-900 transition-colors"
        >
          Return to Dashboard
        </a>
      </div>
    );
  }

  return <Outlet />;
}

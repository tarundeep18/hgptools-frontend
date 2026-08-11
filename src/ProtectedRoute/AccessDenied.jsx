import React from 'react';
import { LockKeyhole, ArrowLeft, Home } from 'lucide-react';

const AccessDenied = () => {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-6">
      <div className="max-w-md w-full text-center">
        {/* Icon Header */}
        <div className="mb-8 flex justify-center">
          <div className="relative">
            <div className="absolute inset-0 bg-red-100 rounded-full scale-150 blur-xl opacity-50"></div>
            <div className="relative bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
              <LockKeyhole className="w-12 h-12 text-red-500" />
            </div>
          </div>
        </div>

        {/* Text Content */}
        <h1 className="text-4xl font-bold text-slate-900 mb-4 tracking-tight">
          Access Denied
        </h1>
        <p className="text-slate-600 mb-8 leading-relaxed">
          You do not have the required permissions to view the Admin Dashboard. 
          Please contact your system administrator if you believe this is an error.
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button 
            onClick={() => window.history.back()}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-white border border-slate-200 text-slate-700 font-medium rounded-lg hover:bg-slate-50 transition-all shadow-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            Go Back
          </button>
          
          <button 
            onClick={() => window.location.href = '/'}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-all shadow-md shadow-indigo-200"
          >
            <Home className="w-4 h-4" />
            Return Home
          </button>
        </div>

        {/* Support Footer */}
        <div className="mt-12 pt-8 border-t border-slate-200">
          <p className="text-sm text-slate-400">
            Error Code: <span className="font-mono font-semibold">403_FORBIDDEN</span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default AccessDenied;
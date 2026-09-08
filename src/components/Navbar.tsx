'use client';

import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import { LogOut, Upload, LayoutDashboard, Sparkles, ShieldCheck } from 'lucide-react';

export function Navbar() {
  const { data: session } = useSession();

  return (
    <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-slate-200/80 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center space-x-2.5 group">
          <div className="bg-gradient-to-tr from-violet-600 via-indigo-600 to-purple-500 text-white p-2 rounded-xl shadow-md shadow-indigo-500/20 group-hover:scale-105 transition-transform duration-200">
            <Sparkles className="w-5 h-5" />
          </div>
          <div className="flex flex-col">
            <span className="font-extrabold text-lg tracking-tight text-slate-900 group-hover:text-violet-600 transition-colors">
              PDF Intelligence
            </span>
            <span className="text-[10px] text-slate-400 font-semibold tracking-wider uppercase -mt-1">
              AI Document Platform
            </span>
          </div>
        </Link>

        <nav className="flex items-center space-x-3">
          {session ? (
            <>
              <Link
                href="/dashboard"
                className="flex items-center space-x-1.5 text-xs font-semibold text-slate-700 hover:text-violet-600 px-3.5 py-2 rounded-lg hover:bg-slate-100/80 transition-all duration-150"
              >
                <LayoutDashboard className="w-4 h-4 text-slate-500" />
                <span>Dashboard</span>
              </Link>
              <Link
                href="/upload"
                className="flex items-center space-x-1.5 text-xs font-semibold text-white bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 px-4 py-2 rounded-lg shadow-sm hover:shadow-md hover:shadow-indigo-500/20 transition-all duration-200"
              >
                <Upload className="w-4 h-4" />
                <span>Upload PDF</span>
              </Link>
              <div className="flex items-center space-x-3 pl-3 border-l border-slate-200/80">
                <div className="flex items-center space-x-2 text-xs font-semibold text-slate-700">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-violet-100 to-indigo-100 border border-violet-200 text-violet-700 flex items-center justify-center font-bold shadow-xs">
                    {session.user?.name?.[0]?.toUpperCase() || session.user?.email?.[0]?.toUpperCase() || 'U'}
                  </div>
                  <span className="hidden sm:inline font-medium text-slate-800">
                    {session.user?.name || session.user?.email}
                  </span>
                </div>
                <button
                  onClick={() => signOut({ callbackUrl: '/' })}
                  className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  title="Sign out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            </>
          ) : (
            <div className="flex items-center space-x-2.5">
              <Link
                href="/login"
                className="text-xs font-semibold text-slate-700 hover:text-violet-600 px-4 py-2 rounded-lg hover:bg-slate-100/80 transition-all"
              >
                Log in
              </Link>
              <Link
                href="/signup"
                className="text-xs font-semibold text-white bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 px-4 py-2 rounded-lg shadow-sm hover:shadow-md hover:shadow-indigo-500/20 transition-all"
              >
                Sign up
              </Link>
            </div>
          )}
        </nav>
      </div>
    </header>
  );
}

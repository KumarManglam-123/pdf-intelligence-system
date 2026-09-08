'use client';

import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import { FileText, LogOut, Upload, User, LayoutDashboard, Sparkles } from 'lucide-react';

export function Navbar() {
  const { data: session } = useSession();

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-slate-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center space-x-2 font-bold text-xl text-slate-900 hover:opacity-90 transition">
          <div className="bg-blue-600 text-white p-2 rounded-lg flex items-center justify-center">
            <Sparkles className="w-5 h-5" />
          </div>
          <span>PDF Intelligence</span>
        </Link>

        <nav className="flex items-center space-x-4">
          {session ? (
            <>
              <Link
                href="/dashboard"
                className="flex items-center space-x-1 text-sm font-medium text-slate-700 hover:text-blue-600 px-3 py-2 rounded-md hover:bg-slate-100 transition"
              >
                <LayoutDashboard className="w-4 h-4" />
                <span>Dashboard</span>
              </Link>
              <Link
                href="/upload"
                className="flex items-center space-x-1 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 px-3.5 py-2 rounded-md shadow-sm transition"
              >
                <Upload className="w-4 h-4" />
                <span>Upload PDF</span>
              </Link>
              <div className="flex items-center space-x-3 pl-3 border-l border-slate-200">
                <div className="flex items-center space-x-2 text-sm font-medium text-slate-700">
                  <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
                    {session.user?.name?.[0]?.toUpperCase() || session.user?.email?.[0]?.toUpperCase() || 'U'}
                  </div>
                  <span className="hidden sm:inline">{session.user?.name || session.user?.email}</span>
                </div>
                <button
                  onClick={() => signOut({ callbackUrl: '/' })}
                  className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-md transition"
                  title="Sign out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            </>
          ) : (
            <div className="flex items-center space-x-3">
              <Link
                href="/login"
                className="text-sm font-medium text-slate-700 hover:text-blue-600 px-3.5 py-2 rounded-md hover:bg-slate-100 transition"
              >
                Log in
              </Link>
              <Link
                href="/signup"
                className="text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 px-3.5 py-2 rounded-md shadow-sm transition"
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

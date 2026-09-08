'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Search, Upload, FileText, Sparkles, Loader2, Command } from 'lucide-react';
import { SummaryCard } from '@/components/SummaryCard';

export default function DashboardPage() {
  const [pdfs, setPdfs] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);

  const fetchPdfs = async (query = '') => {
    setSearching(!!query);
    try {
      const res = await fetch(`/api/pdfs/search?q=${encodeURIComponent(query)}`);
      const data = await res.json();
      if (res.ok && data.pdfs) {
        setPdfs(data.pdfs);
      }
    } catch (err) {
      console.error('Failed to fetch PDFs:', err);
    } finally {
      setLoading(false);
      setSearching(false);
    }
  };

  useEffect(() => {
    fetchPdfs();
  }, []);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearchQuery(val);

    const timeout = setTimeout(() => {
      fetchPdfs(val);
    }, 300);

    return () => clearTimeout(timeout);
  };

  const handleDeleteSuccess = (deletedId: string) => {
    setPdfs((prev) => prev.filter((p) => p.id !== deletedId));
  };

  return (
    <div className="space-y-8">
      {/* Dashboard Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-slate-200/80">
        <div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight flex items-center space-x-2">
            <span>Document Dashboard</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Manage your uploaded PDFs, grounded AI summaries, and vector similarity search
          </p>
        </div>

        <Link
          href="/upload"
          className="inline-flex items-center justify-center space-x-2 px-5 py-3 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white font-bold text-xs rounded-xl shadow-md shadow-indigo-500/20 hover:shadow-lg transition-all"
        >
          <Upload className="w-4 h-4" />
          <span>Upload New PDF</span>
        </Link>
      </div>

      {/* Search Bar & Document Count */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-96">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={handleSearchChange}
            placeholder="Search filename or semantic vector content..."
            className="w-full pl-10 pr-10 py-2.5 bg-white border border-slate-200/90 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-violet-500 shadow-xs transition-all"
          />
          {searching ? (
            <Loader2 className="w-4 h-4 text-violet-600 animate-spin absolute right-3.5 top-1/2 -translate-y-1/2" />
          ) : (
            <div className="hidden sm:flex items-center space-x-0.5 absolute right-3 top-1/2 -translate-y-1/2 bg-slate-100 text-slate-400 px-1.5 py-0.5 rounded text-[10px] font-mono border border-slate-200">
              <Command className="w-2.5 h-2.5" />
              <span>K</span>
            </div>
          )}
        </div>

        <div className="text-xs text-slate-500 font-semibold bg-slate-100/80 px-3 py-1.5 rounded-lg border border-slate-200/60">
          Showing <span className="text-violet-700 font-extrabold">{pdfs.length}</span> documents
        </div>
      </div>

      {/* Grid of PDF Cards */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((n) => (
            <div key={n} className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs animate-pulse space-y-4">
              <div className="h-6 bg-slate-200 rounded w-3/4" />
              <div className="h-20 bg-slate-100 rounded-xl" />
              <div className="h-9 bg-slate-200 rounded-xl" />
            </div>
          ))}
        </div>
      ) : pdfs.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200/90 p-12 text-center space-y-4 max-w-md mx-auto my-12 shadow-sm">
          <div className="p-4 bg-gradient-to-tr from-violet-100 to-indigo-100 text-violet-600 rounded-2xl w-fit mx-auto shadow-xs border border-violet-200/60">
            <FileText className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-base font-extrabold text-slate-900">
              {searchQuery ? 'No matching documents found' : 'No documents uploaded yet'}
            </h3>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              {searchQuery
                ? 'Try tweaking your search term or upload a new PDF.'
                : 'Upload a PDF to generate AI summaries and ask interactive questions.'}
            </p>
          </div>
          {!searchQuery && (
            <Link
              href="/upload"
              className="inline-flex items-center space-x-2 px-5 py-2.5 bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-bold text-xs rounded-xl shadow-md transition"
            >
              <Upload className="w-4 h-4" />
              <span>Upload your first PDF</span>
            </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {pdfs.map((pdf) => (
            <SummaryCard key={pdf.id} pdf={pdf} onDelete={handleDeleteSuccess} />
          ))}
        </div>
      )}
    </div>
  );
}

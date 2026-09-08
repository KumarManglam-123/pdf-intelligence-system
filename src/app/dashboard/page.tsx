'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Search, Upload, FileText, Sparkles, Loader2 } from 'lucide-react';
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
    
    // Debounce search API calls
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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900">Document Dashboard</h1>
          <p className="text-sm text-slate-600 mt-1">Manage your uploaded PDFs, AI summaries, and vector search</p>
        </div>

        <Link
          href="/upload"
          className="inline-flex items-center justify-center space-x-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm rounded-lg shadow-sm transition"
        >
          <Upload className="w-4 h-4" />
          <span>Upload New PDF</span>
        </Link>
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-96">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={handleSearchChange}
            placeholder="Search by filename or semantic content..."
            className="w-full pl-10 pr-10 py-2.5 bg-white border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
          />
          {searching && (
            <Loader2 className="w-4 h-4 text-blue-600 animate-spin absolute right-3.5 top-1/2 -translate-y-1/2" />
          )}
        </div>

        <p className="text-xs text-slate-500 font-medium">
          Showing <span className="font-bold text-slate-800">{pdfs.length}</span> documents
        </p>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-16 space-y-3">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
          <p className="text-sm font-medium text-slate-600">Loading your documents...</p>
        </div>
      ) : pdfs.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center space-y-4 max-w-md mx-auto my-12 shadow-sm">
          <div className="p-4 bg-blue-50 text-blue-600 rounded-full w-fit mx-auto">
            <FileText className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900">
              {searchQuery ? 'No matching documents found' : 'No documents uploaded yet'}
            </h3>
            <p className="text-sm text-slate-500 mt-1">
              {searchQuery
                ? 'Try tweaking your search term or upload a new PDF.'
                : 'Upload a PDF to generate AI summaries and ask interactive questions.'}
            </p>
          </div>
          {!searchQuery && (
            <Link
              href="/upload"
              className="inline-flex items-center space-x-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm rounded-lg transition shadow-sm"
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

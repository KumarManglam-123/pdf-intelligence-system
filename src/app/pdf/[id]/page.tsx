'use client';

import { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { FileText, Sparkles, MessageSquare, Share2, ArrowLeft, Loader2, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { PdfViewer } from '@/components/PdfViewer';
import { CommentSidebar } from '@/components/CommentSidebar';
import { ChatPanel } from '@/components/ChatPanel';
import { ShareModal } from '@/components/ShareModal';

export default function PdfViewerPage() {
  const params = useParams();
  const searchParams = useSearchParams();

  const pdfId = params.id as string;
  const token = searchParams.get('token') || undefined;

  const [pdf, setPdf] = useState<any>(null);
  const [isOwner, setIsOwner] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'chat' | 'comments'>('chat');
  const [showSummary, setShowSummary] = useState(true);
  const [isShareOpen, setIsShareOpen] = useState(false);

  useEffect(() => {
    async function loadPdf() {
      try {
        const url = `/api/pdfs/${pdfId}${token ? `?token=${token}` : ''}`;
        const res = await fetch(url);
        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || 'Failed to load PDF');
        }

        setPdf(data.pdf);
        setIsOwner(data.isOwner);
      } catch (err: any) {
        setError(err.message || 'Access denied or PDF not found');
      } finally {
        setLoading(false);
      }
    }
    loadPdf();
  }, [pdfId, token]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-3">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
        <p className="text-sm font-medium text-slate-600">Loading document workspace...</p>
      </div>
    );
  }

  if (error || !pdf) {
    return (
      <div className="max-w-md mx-auto my-16 bg-white p-8 rounded-xl border border-slate-200 text-center space-y-4 shadow-sm">
        <div className="p-3 bg-red-50 text-red-600 rounded-full w-fit mx-auto">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-slate-900">Access Restricted</h2>
        <p className="text-sm text-slate-600">{error || 'Could not access PDF.'}</p>
        <Link
          href="/dashboard"
          className="inline-flex items-center space-x-2 text-sm text-blue-600 hover:underline font-semibold"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Dashboard</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Navigation Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200">
        <div className="flex items-center space-x-3">
          <Link
            href="/dashboard"
            className="p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-200 rounded-lg transition"
            title="Back to Dashboard"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-xl font-extrabold text-slate-900 flex items-center space-x-2">
              <FileText className="w-5 h-5 text-blue-600 flex-shrink-0" />
              <span>{pdf.filename}</span>
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Uploaded on {new Date(pdf.createdAt).toLocaleDateString()} • {isOwner ? 'Owner Access' : 'Invited Guest View'}
            </p>
          </div>
        </div>

        {isOwner && (
          <button
            onClick={() => setIsShareOpen(true)}
            className="inline-flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-sm transition"
          >
            <Share2 className="w-4 h-4" />
            <span>Share PDF</span>
          </button>
        )}
      </div>

      {/* AI Summary Banner at Top */}
      <div className="bg-white rounded-xl border border-blue-200 shadow-sm overflow-hidden">
        <button
          onClick={() => setShowSummary(!showSummary)}
          className="w-full bg-blue-50/70 px-4 py-3 flex items-center justify-between hover:bg-blue-100/60 transition text-left"
        >
          <div className="flex items-center space-x-2 text-blue-800 font-bold text-sm">
            <Sparkles className="w-4 h-4 text-blue-600" />
            <span>AI Document Summary</span>
          </div>
          {showSummary ? <ChevronUp className="w-4 h-4 text-blue-700" /> : <ChevronDown className="w-4 h-4 text-blue-700" />}
        </button>

        {showSummary && (
          <div className="p-4 text-sm text-slate-700 leading-relaxed border-t border-blue-100">
            {pdf.summary || 'Summary unavailable.'}
          </div>
        )}
      </div>

      {/* Main Workspace Layout (PDF Viewer + Interactive Right Panel) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left/Center PDF Viewer (7 cols) */}
        <div className="lg:col-span-7 h-full min-h-[600px]">
          <PdfViewer blobUrl={pdf.blobUrl} filename={pdf.filename} />
        </div>

        {/* Right Tabbed Panel: AI Chat & Comments (5 cols) */}
        <div className="lg:col-span-5 flex flex-col h-[650px]">
          <div className="flex items-center bg-slate-200 p-1 rounded-xl mb-3">
            <button
              onClick={() => setActiveTab('chat')}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition flex items-center justify-center space-x-1.5 ${
                activeTab === 'chat' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Sparkles className="w-4 h-4" />
              <span>AI Chat (RAG)</span>
            </button>
            <button
              onClick={() => setActiveTab('comments')}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition flex items-center justify-center space-x-1.5 ${
                activeTab === 'comments' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <MessageSquare className="w-4 h-4" />
              <span>Comments</span>
            </button>
          </div>

          <div className="flex-1 overflow-hidden">
            {activeTab === 'chat' ? (
              <ChatPanel pdfId={pdfId} shareToken={token} />
            ) : (
              <CommentSidebar pdfId={pdfId} shareToken={token} />
            )}
          </div>
        </div>
      </div>

      <ShareModal
        pdfId={pdfId}
        isOpen={isShareOpen}
        onClose={() => setIsShareOpen(false)}
      />
    </div>
  );
}

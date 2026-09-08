'use client';

import { useState } from 'react';
import Link from 'next/link';
import { FileText, Calendar, Sparkles, Share2, Trash2, ArrowRight, Shield } from 'lucide-react';
import { ShareModal } from '@/components/ShareModal';

interface SummaryCardProps {
  pdf: {
    id: string;
    filename: string;
    summary: string;
    createdAt: string | Date;
    shares?: { token: string }[];
  };
  onDelete?: (id: string) => void;
}

export function SummaryCard({ pdf, onDelete }: SummaryCardProps) {
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const existingToken = pdf.shares && pdf.shares.length > 0 ? pdf.shares[0].token : undefined;

  const handleDelete = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!confirm(`Are you sure you want to delete "${pdf.filename}"?`)) return;

    setIsDeleting(true);
    try {
      const res = await fetch(`/api/pdfs/${pdf.id}`, {
        method: 'DELETE',
      });
      if (res.ok && onDelete) {
        onDelete(pdf.id);
      } else {
        alert('Failed to delete PDF.');
      }
    } catch (err) {
      console.error('Delete error:', err);
    } finally {
      setIsDeleting(false);
    }
  };

  const formattedDate = new Date(pdf.createdAt).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <>
      <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-sm hover:-translate-y-1 hover:shadow-lg hover:shadow-violet-500/10 hover:border-violet-300 transition-all duration-200 flex flex-col justify-between group relative overflow-hidden">
        {/* Subtle accent bar at top */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-violet-500 to-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />

        <div>
          <div className="flex items-start justify-between mb-3.5">
            <div className="flex items-center space-x-3 min-w-0 pr-2">
              <div className="bg-gradient-to-br from-violet-100 to-indigo-50 text-violet-700 p-2.5 rounded-xl border border-violet-200/60 flex-shrink-0 group-hover:scale-105 transition-transform duration-200">
                <FileText className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <h3 className="font-bold text-sm text-slate-900 truncate group-hover:text-violet-600 transition-colors" title={pdf.filename}>
                  {pdf.filename}
                </h3>
                <div className="flex items-center space-x-2 text-[11px] text-slate-400 mt-0.5 font-medium">
                  <span className="inline-flex items-center space-x-1">
                    <Calendar className="w-3 h-3" />
                    <span>{formattedDate}</span>
                  </span>
                  <span>•</span>
                  <span className="text-violet-600 font-semibold bg-violet-50 px-1.5 py-0.2 rounded text-[10px]">
                    PDF Document
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-1">
              <button
                onClick={() => setIsShareOpen(true)}
                className="p-1.5 text-slate-400 hover:text-violet-600 hover:bg-violet-50 rounded-lg transition-colors"
                title="Share document"
              >
                <Share2 className="w-4 h-4" />
              </button>
              {onDelete && (
                <button
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                  title="Delete document"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          <div className="bg-gradient-to-br from-violet-50/70 via-slate-50 to-indigo-50/50 p-3.5 rounded-xl border border-violet-100/70 mb-4">
            <div className="flex items-center space-x-1.5 text-xs font-bold text-violet-700 mb-1.5">
              <Sparkles className="w-3.5 h-3.5 text-violet-600" />
              <span>AI Grounded Summary</span>
            </div>
            <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed font-normal">
              {pdf.summary || 'No summary available.'}
            </p>
          </div>
        </div>

        <Link
          href={`/pdf/${pdf.id}`}
          className="w-full py-2.5 bg-slate-100 hover:bg-gradient-to-r hover:from-violet-600 hover:to-indigo-600 text-slate-700 hover:text-white text-xs font-bold rounded-xl transition-all duration-200 flex items-center justify-center space-x-1.5 group/btn shadow-2xs"
        >
          <span>Open Document Workspace</span>
          <ArrowRight className="w-3.5 h-3.5 group-hover/btn:translate-x-0.5 transition-transform" />
        </Link>
      </div>

      <ShareModal
        pdfId={pdf.id}
        isOpen={isShareOpen}
        onClose={() => setIsShareOpen(false)}
        existingToken={existingToken}
      />
    </>
  );
}

'use client';

import { useState } from 'react';
import Link from 'next/link';
import { FileText, Calendar, Sparkles, Share2, Trash2, ArrowRight } from 'lucide-react';
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
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition flex flex-col justify-between group">
        <div>
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center space-x-3 overflow-hidden">
              <div className="bg-blue-50 text-blue-600 p-2.5 rounded-lg flex-shrink-0">
                <FileText className="w-6 h-6" />
              </div>
              <div className="min-w-0">
                <h3 className="font-bold text-slate-900 truncate group-hover:text-blue-600 transition" title={pdf.filename}>
                  {pdf.filename}
                </h3>
                <div className="flex items-center space-x-1 text-xs text-slate-500 mt-0.5">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>{formattedDate}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-1">
              <button
                onClick={() => setIsShareOpen(true)}
                className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition"
                title="Share document"
              >
                <Share2 className="w-4 h-4" />
              </button>
              {onDelete && (
                <button
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition disabled:opacity-50"
                  title="Delete document"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-100 mb-4">
            <div className="flex items-center space-x-1.5 text-xs font-semibold text-blue-700 mb-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              <span>AI Summary</span>
            </div>
            <p className="text-xs text-slate-600 line-clamp-4 leading-relaxed">
              {pdf.summary || 'No summary available.'}
            </p>
          </div>
        </div>

        <Link
          href={`/pdf/${pdf.id}`}
          className="w-full py-2 bg-slate-100 hover:bg-blue-600 text-slate-700 hover:text-white text-xs font-semibold rounded-lg transition flex items-center justify-center space-x-1.5"
        >
          <span>Open PDF & AI Chat</span>
          <ArrowRight className="w-3.5 h-3.5" />
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

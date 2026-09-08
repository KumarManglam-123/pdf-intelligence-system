'use client';

import { useState } from 'react';
import { Share2, Copy, Check, X, Link as LinkIcon, Loader2 } from 'lucide-react';

interface ShareModalProps {
  pdfId: string;
  isOpen: boolean;
  onClose: () => void;
  existingToken?: string;
}

export function ShareModal({ pdfId, isOpen, onClose, existingToken }: ShareModalProps) {
  const [token, setToken] = useState(existingToken || '');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const shareUrl = token ? `${window.location.origin}/share/${token}` : '';

  const generateShareLink = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/pdfs/${pdfId}/share`, {
        method: 'POST',
      });
      const data = await res.json();
      if (res.ok && data.share?.token) {
        setToken(data.share.token);
      }
    } catch (err) {
      console.error('Failed to generate share link:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (!shareUrl) return;
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl relative border border-slate-200">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1 rounded-md"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center space-x-3 mb-4">
          <div className="bg-blue-100 text-blue-600 p-2.5 rounded-lg">
            <Share2 className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900">Share PDF</h3>
            <p className="text-xs text-slate-500">Anyone with this link can view & comment on this PDF</p>
          </div>
        </div>

        {!token ? (
          <button
            onClick={generateShareLink}
            disabled={loading}
            className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-medium rounded-lg transition flex items-center justify-center space-x-2 text-sm mt-4"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <LinkIcon className="w-4 h-4" />
                <span>Generate Shareable Link</span>
              </>
            )}
          </button>
        ) : (
          <div className="space-y-3 mt-4">
            <label className="block text-xs font-semibold text-slate-700">Shareable Link</label>
            <div className="flex items-center space-x-2">
              <input
                type="text"
                readOnly
                value={shareUrl}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-800 font-mono select-all focus:outline-none"
              />
              <button
                onClick={handleCopy}
                className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-lg flex items-center space-x-1.5 transition flex-shrink-0"
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-300" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    <span>Copy</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

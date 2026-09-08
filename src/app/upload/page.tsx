'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { UploadCloud, FileText, CheckCircle2, AlertCircle, Loader2, Sparkles } from 'lucide-react';

export default function UploadPage() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [statusMessage, setStatusMessage] = useState('');

  const MAX_FILE_SIZE = 15 * 1024 * 1024; // 15MB

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError('');
    if (e.target.files && e.target.files[0]) {
      const selected = e.target.files[0];
      if (!selected.name.toLowerCase().endsWith('.pdf') && selected.type !== 'application/pdf') {
        setError('Please select a valid PDF document (.pdf)');
        setFile(null);
        return;
      }
      if (selected.size > MAX_FILE_SIZE) {
        setError('File size exceeds the 15MB limit. Please upload a smaller PDF document.');
        setFile(null);
        return;
      }
      setFile(selected);
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;

    setError('');
    setLoading(true);
    setStatusMessage('Uploading document and extracting text...');

    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/pdfs/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to upload PDF');
      }

      setStatusMessage('Processing complete! Redirecting to PDF viewer...');
      setTimeout(() => {
        router.push(`/pdf/${data.pdf.id}`);
      }, 500);
    } catch (err: any) {
      setError(err.message || 'An error occurred while uploading.');
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto my-8 bg-white p-8 sm:p-10 rounded-2xl border border-slate-200/90 shadow-xl shadow-slate-200/50">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center p-3 bg-gradient-to-tr from-violet-600 to-indigo-600 text-white rounded-2xl mb-4 shadow-md shadow-indigo-500/20">
          <UploadCloud className="w-6 h-6" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">Upload PDF Document</h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1.5">
          Upload any PDF file to generate intelligent AI summaries and enable vector RAG document chat.
        </p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50/80 border border-red-200 text-red-700 text-xs rounded-xl flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleUpload} className="space-y-6">
        <div className="border-2 border-dashed border-slate-300 hover:border-violet-500 rounded-2xl p-8 text-center bg-slate-50/60 hover:bg-violet-50/30 transition-all cursor-pointer relative group">
          <input
            type="file"
            accept=".pdf,application/pdf"
            onChange={handleFileChange}
            disabled={loading}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
          />
          <div className="flex flex-col items-center justify-center space-y-3">
            <div className="p-4 bg-gradient-to-tr from-violet-100 to-indigo-50 text-violet-600 rounded-2xl group-hover:scale-110 transition-transform border border-violet-200/60 shadow-xs">
              <UploadCloud className="w-7 h-7" />
            </div>
            <div>
              <p className="text-slate-800 font-bold text-sm">
                Click to browse or drag and drop your PDF here
              </p>
              <p className="text-slate-400 text-xs mt-1">Supports PDF files up to 15MB</p>
            </div>
          </div>
        </div>

        {file && (
          <div className="p-4 bg-violet-50/60 border border-violet-200/80 rounded-xl flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <FileText className="w-5 h-5 text-violet-600" />
              <div>
                <p className="text-xs font-bold text-slate-900">{file.name}</p>
                <p className="text-[10px] text-slate-500 font-medium">{(file.size / (1024 * 1024)).toFixed(2)} MB</p>
              </div>
            </div>
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
          </div>
        )}

        {loading && (
          <div className="p-4 bg-indigo-50/80 border border-indigo-200 rounded-xl flex items-center space-x-3 text-indigo-900 text-xs">
            <Loader2 className="w-5 h-5 animate-spin text-indigo-600 flex-shrink-0" />
            <div>
              <p className="font-bold">{statusMessage}</p>
              <p className="text-[11px] text-indigo-700 mt-0.5">
                Extracting text, generating Groq AI summary & vector chunk embeddings...
              </p>
            </div>
          </div>
        )}

        <button
          type="submit"
          disabled={!file || loading}
          className="w-full py-3.5 bg-gradient-to-r from-violet-600 via-indigo-600 to-purple-600 hover:from-violet-700 hover:to-indigo-700 disabled:opacity-50 text-white font-bold rounded-xl shadow-md shadow-indigo-500/20 transition-all flex items-center justify-center space-x-2 text-xs"
        >
          {loading ? (
            <span>Processing PDF...</span>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              <span>Upload & Analyze PDF</span>
            </>
          )}
        </button>
      </form>
    </div>
  );
}

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { UploadCloud, FileText, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';

export default function UploadPage() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [statusMessage, setStatusMessage] = useState('');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError('');
    if (e.target.files && e.target.files[0]) {
      const selected = e.target.files[0];
      if (!selected.name.toLowerCase().endsWith('.pdf') && selected.type !== 'application/pdf') {
        setError('Please select a valid PDF document (.pdf)');
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
    <div className="max-w-2xl mx-auto my-8 bg-white p-8 rounded-xl border border-slate-200 shadow-sm">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-extrabold text-slate-900">Upload PDF Document</h1>
        <p className="text-slate-600 mt-2">
          Upload any PDF file to generate intelligent AI summaries and enable vector RAG document chat.
        </p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg flex items-center space-x-2">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleUpload} className="space-y-6">
        <div className="border-2 border-dashed border-slate-300 hover:border-blue-500 rounded-xl p-8 text-center bg-slate-50 transition cursor-pointer relative">
          <input
            type="file"
            accept=".pdf,application/pdf"
            onChange={handleFileChange}
            disabled={loading}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
          />
          <div className="flex flex-col items-center justify-center space-y-3">
            <div className="p-4 bg-blue-100 text-blue-600 rounded-full">
              <UploadCloud className="w-8 h-8" />
            </div>
            <div>
              <p className="text-slate-700 font-semibold text-base">
                Click to browse or drag and drop your PDF here
              </p>
              <p className="text-slate-500 text-xs mt-1">Supports PDF files up to 20MB</p>
            </div>
          </div>
        </div>

        {file && (
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <FileText className="w-6 h-6 text-blue-600" />
              <div>
                <p className="text-sm font-semibold text-slate-900">{file.name}</p>
                <p className="text-xs text-slate-500">{(file.size / (1024 * 1024)).toFixed(2)} MB</p>
              </div>
            </div>
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
          </div>
        )}

        {loading && (
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg flex items-center space-x-3 text-amber-800 text-sm">
            <Loader2 className="w-5 h-5 animate-spin text-amber-600 flex-shrink-0" />
            <div>
              <p className="font-semibold">{statusMessage}</p>
              <p className="text-xs text-amber-700 mt-0.5">
                Extracting text, generating Groq AI summary & vector chunk embeddings...
              </p>
            </div>
          </div>
        )}

        <button
          type="submit"
          disabled={!file || loading}
          className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold rounded-lg shadow-sm transition flex items-center justify-center space-x-2 text-base"
        >
          {loading ? (
            <span>Processing PDF...</span>
          ) : (
            <>
              <UploadCloud className="w-5 h-5" />
              <span>Upload & Analyze PDF</span>
            </>
          )}
        </button>
      </form>
    </div>
  );
}

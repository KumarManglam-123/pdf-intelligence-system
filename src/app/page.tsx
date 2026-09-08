import Link from 'next/link';
import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import { Sparkles, FileText, MessageSquare, ShieldCheck, Share2, Zap } from 'lucide-react';

export default async function HomePage() {
  const session = await getServerSession(authOptions);

  if (session) {
    redirect('/dashboard');
  }

  return (
    <div className="py-12 sm:py-20 flex flex-col items-center justify-center text-center">
      <div className="inline-flex items-center space-x-2 bg-blue-50 border border-blue-200 text-blue-700 px-4 py-1.5 rounded-full text-sm font-semibold mb-8">
        <Sparkles className="w-4 h-4" />
        <span>Powered by Groq LLM & Vector RAG Retrieval</span>
      </div>

      <h1 className="text-4xl sm:text-6xl font-extrabold text-slate-900 tracking-tight max-w-4xl leading-tight mb-6">
        Intelligent PDF Summaries, RAG Chat & Seamless Collaboration
      </h1>

      <p className="text-lg sm:text-xl text-slate-600 max-w-2xl mb-10">
        Upload your PDF documents, get instant grounded AI summaries, chat intelligently with long documents, and collaborate via secure shareable links.
      </p>

      <div className="flex flex-col sm:flex-row items-center gap-4 mb-16">
        <Link
          href="/signup"
          className="w-full sm:w-auto px-8 py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-md hover:shadow-lg transition text-lg"
        >
          Get Started Free
        </Link>
        <Link
          href="/login"
          className="w-full sm:w-auto px-8 py-3.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 font-semibold rounded-lg shadow-sm transition text-lg"
        >
          Sign In
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-left max-w-5xl w-full">
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition">
          <div className="bg-blue-100 text-blue-600 p-3 rounded-lg w-fit mb-4">
            <Zap className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-lg text-slate-900 mb-2">Instant Grounded Summary</h3>
          <p className="text-slate-600 text-sm">
            Groq Llama 3.3 model analyzes your PDF text and extracts 3–5 core grounded bullet points without generic fluff.
          </p>
        </div>

        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition">
          <div className="bg-blue-100 text-blue-600 p-3 rounded-lg w-fit mb-4">
            <MessageSquare className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-lg text-slate-900 mb-2">Vector RAG AI Chat</h3>
          <p className="text-slate-600 text-sm">
            Semantic chunking and embedding search retrieves exact document context to answer questions with zero hallucination.
          </p>
        </div>

        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition">
          <div className="bg-blue-100 text-blue-600 p-3 rounded-lg w-fit mb-4">
            <Share2 className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-lg text-slate-900 mb-2">Share & Collaborate</h3>
          <p className="text-slate-600 text-sm">
            Generate secure public access tokens. Invited guests can read PDFs and participate in interactive document comments.
          </p>
        </div>
      </div>
    </div>
  );
}

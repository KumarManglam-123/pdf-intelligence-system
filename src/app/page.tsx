import Link from 'next/link';
import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import { Sparkles, FileText, MessageSquare, Share2, Zap, ShieldCheck, ArrowRight, Database, Bot } from 'lucide-react';

export default async function HomePage() {
  const session = await getServerSession(authOptions);

  if (session) {
    redirect('/dashboard');
  }

  return (
    <div className="py-12 sm:py-24 flex flex-col items-center justify-center text-center">
      {/* Badge */}
      <div className="inline-flex items-center space-x-2 bg-gradient-to-r from-violet-50 to-indigo-50 border border-violet-200/80 text-violet-700 px-4 py-1.5 rounded-full text-xs font-bold mb-8 shadow-xs hover:scale-105 transition-transform">
        <Sparkles className="w-4 h-4 text-violet-600 animate-pulse" />
        <span>Powered by Groq LLM & Vector RAG Retrieval</span>
      </div>

      {/* Main Hero Headline */}
      <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold text-slate-900 tracking-tight max-w-5xl leading-[1.1] mb-6">
        Transform PDFs into <br className="hidden sm:inline" />
        <span className="text-gradient">Intelligent Conversations</span>
      </h1>

      {/* Subtitle */}
      <p className="text-base sm:text-xl text-slate-600 max-w-2xl mb-10 leading-relaxed font-normal">
        Upload complex PDF documents, generate instant 3–5 sentence grounded summaries, chat interactively with vector RAG search, and collaborate via secure share links.
      </p>

      {/* CTA Buttons */}
      <div className="flex flex-col sm:flex-row items-center gap-4 mb-20">
        <Link
          href="/signup"
          className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-violet-600 via-indigo-600 to-purple-600 hover:from-violet-700 hover:to-indigo-700 text-white font-bold rounded-xl shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 hover:-translate-y-0.5 transition-all text-base flex items-center justify-center space-x-2"
        >
          <span>Get Started Free</span>
          <ArrowRight className="w-5 h-5" />
        </Link>
        <Link
          href="/login"
          className="w-full sm:w-auto px-8 py-4 bg-white hover:bg-slate-100 text-slate-800 border border-slate-300/80 font-bold rounded-xl shadow-xs hover:shadow-md transition-all text-base"
        >
          Sign In to Workspace
        </Link>
      </div>

      {/* Feature Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-left max-w-6xl w-full">
        <div className="bg-white p-7 rounded-2xl border border-slate-200/90 shadow-sm hover:-translate-y-1 hover:shadow-xl hover:shadow-violet-500/10 hover:border-violet-300 transition-all duration-200 group">
          <div className="bg-gradient-to-tr from-violet-100 to-indigo-50 text-violet-600 p-3.5 rounded-xl w-fit mb-5 border border-violet-200/60 group-hover:scale-110 transition-transform">
            <Zap className="w-6 h-6 text-violet-600" />
          </div>
          <h3 className="font-extrabold text-lg text-slate-900 mb-2 group-hover:text-violet-600 transition-colors">
            Grounded AI Summaries
          </h3>
          <p className="text-slate-600 text-xs leading-relaxed">
            Groq LLM models analyze document text to extract 3–5 core grounded bullet points without generic boilerplate.
          </p>
        </div>

        <div className="bg-white p-7 rounded-2xl border border-slate-200/90 shadow-sm hover:-translate-y-1 hover:shadow-xl hover:shadow-violet-500/10 hover:border-violet-300 transition-all duration-200 group">
          <div className="bg-gradient-to-tr from-violet-100 to-indigo-50 text-violet-600 p-3.5 rounded-xl w-fit mb-5 border border-violet-200/60 group-hover:scale-110 transition-transform">
            <Bot className="w-6 h-6 text-violet-600" />
          </div>
          <h3 className="font-extrabold text-lg text-slate-900 mb-2 group-hover:text-violet-600 transition-colors">
            Vector RAG AI Chat
          </h3>
          <p className="text-slate-600 text-xs leading-relaxed">
            Semantic chunking & vector embeddings retrieve top-k document context to answer questions with zero hallucination.
          </p>
        </div>

        <div className="bg-white p-7 rounded-2xl border border-slate-200/90 shadow-sm hover:-translate-y-1 hover:shadow-xl hover:shadow-violet-500/10 hover:border-violet-300 transition-all duration-200 group">
          <div className="bg-gradient-to-tr from-violet-100 to-indigo-50 text-violet-600 p-3.5 rounded-xl w-fit mb-5 border border-violet-200/60 group-hover:scale-110 transition-transform">
            <Share2 className="w-6 h-6 text-violet-600" />
          </div>
          <h3 className="font-extrabold text-lg text-slate-900 mb-2 group-hover:text-violet-600 transition-colors">
            Secure Share Links
          </h3>
          <p className="text-slate-600 text-xs leading-relaxed">
            Generate unique public access tokens. Invited guest viewers can read PDFs and participate in interactive document comments.
          </p>
        </div>
      </div>
    </div>
  );
}

'use client';

import { useState, useEffect, useRef } from 'react';
import { Sparkles, Send, Bot, Loader2 } from 'lucide-react';

interface ChatMessage {
  id?: string;
  role: 'user' | 'assistant';
  content: string;
}

interface ChatPanelProps {
  pdfId: string;
  shareToken?: string;
}

function formatModelBadge(rawModelName: string) {
  if (!rawModelName) return 'Groq GPT-OSS 120B';
  if (rawModelName.includes('gpt-oss-120b')) return 'Groq GPT-OSS 120B';
  if (rawModelName.includes('llama-3.3')) return 'Groq Llama 3.3';
  if (rawModelName.includes('llama-3.1')) return 'Groq Llama 3.1';
  if (rawModelName.includes('mixtral')) return 'Groq Mixtral 8x7B';
  
  const clean = rawModelName.split('/').pop() || rawModelName;
  return `Groq ${clean.toUpperCase()}`;
}

export function ChatPanel({ pdfId, shareToken }: ChatPanelProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [streamingContent, setStreamingContent] = useState('');
  const [modelName, setModelName] = useState<string>('openai/gpt-oss-120b');
  const [sessionId] = useState(() => {
    if (typeof window !== 'undefined') {
      const key = `pdf_session_${pdfId}`;
      let saved = localStorage.getItem(key);
      if (!saved) {
        saved = 'session_' + Math.random().toString(36).substring(2, 12);
        localStorage.setItem(key, saved);
      }
      return saved;
    }
    return 'session_' + Math.random().toString(36).substring(2, 12);
  });

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const fetchHistory = async () => {
    try {
      const url = `/api/pdfs/${pdfId}/chat?sessionId=${sessionId}${shareToken ? `&token=${shareToken}` : ''}`;
      const res = await fetch(url);
      const data = await res.json();
      if (res.ok && data.messages) {
        setMessages(data.messages);
        if (data.modelName) setModelName(data.modelName);
      }
    } catch (err) {
      console.error('Failed to fetch chat history:', err);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [pdfId, shareToken]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingContent]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userQuery = input.trim();
    setInput('');
    setLoading(true);
    setStreamingContent('');

    // Optimistically append user message
    setMessages((prev) => [...prev, { role: 'user', content: userQuery }]);

    try {
      const res = await fetch(`/api/pdfs/${pdfId}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userQuery,
          sessionId,
          token: shareToken,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Chat request failed');
      }

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      let fullText = '';

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunkStr = decoder.decode(value, { stream: true });
          fullText += chunkStr;
          setStreamingContent(fullText);
        }
      }

      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: fullText || 'I cannot find the answer to that in the provided document.' },
      ]);
      setStreamingContent('');
    } catch (err: any) {
      console.error('Chat error:', err);
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: `Error: ${err.message || 'Failed to get response.'}` },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden">
      {/* AI Panel Header */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 px-4 py-3 border-b border-slate-800 text-white flex items-center justify-between">
        <div className="flex items-center space-x-2.5">
          <div className="bg-gradient-to-tr from-violet-500 to-indigo-500 p-1.5 rounded-lg shadow-sm">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <div>
            <h3 className="font-bold text-xs tracking-wide text-white">RAG Intelligence Assistant</h3>
            <p className="text-[10px] text-slate-400">Grounded strictly in top-k document chunks</p>
          </div>
        </div>
        <span className="text-[10px] bg-violet-500/20 text-violet-300 border border-violet-400/30 px-2 py-0.5 rounded-full font-semibold">
          {formatModelBadge(modelName)}
        </span>
      </div>

      {/* Messages Feed */}
      <div className="flex-1 p-4 overflow-y-auto space-y-4 max-h-[460px] bg-slate-50/50">
        {messages.length === 0 && !streamingContent ? (
          <div className="text-center py-12 space-y-3 max-w-xs mx-auto">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-violet-100 to-indigo-100 border border-violet-200 text-violet-600 flex items-center justify-center mx-auto shadow-xs">
              <Bot className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-900">Ask Document Questions</p>
              <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                The AI analyzes vector chunk embeddings to answer with high precision and zero hallucination.
              </p>
            </div>
          </div>
        ) : (
          messages.map((msg, index) => (
            <div
              key={index}
              className={`flex items-start space-x-2.5 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {msg.role === 'assistant' && (
                <div className="w-7 h-7 rounded-xl bg-gradient-to-tr from-violet-600 to-indigo-600 text-white flex items-center justify-center flex-shrink-0 shadow-xs mt-0.5">
                  <Bot className="w-4 h-4" />
                </div>
              )}
              <div
                className={`max-w-[85%] px-4 py-3 rounded-2xl text-xs leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-br-xs shadow-xs font-medium'
                    : 'bg-white text-slate-800 rounded-bl-xs border border-slate-200/90 shadow-xs'
                }`}
              >
                {msg.content}
              </div>
              {msg.role === 'user' && (
                <div className="w-7 h-7 rounded-xl bg-slate-800 text-white flex items-center justify-center flex-shrink-0 text-[11px] font-bold mt-0.5 shadow-xs">
                  U
                </div>
              )}
            </div>
          ))
        )}

        {/* Live streaming token response indicator */}
        {streamingContent && (
          <div className="flex items-start space-x-2.5 justify-start">
            <div className="w-7 h-7 rounded-xl bg-gradient-to-tr from-violet-600 to-indigo-600 text-white flex items-center justify-center flex-shrink-0 shadow-xs mt-0.5">
              <Bot className="w-4 h-4 animate-pulse" />
            </div>
            <div className="max-w-[85%] px-4 py-3 rounded-2xl text-xs leading-relaxed bg-white text-slate-800 rounded-bl-xs border border-slate-200/90 shadow-xs">
              {streamingContent}
              <span className="inline-block w-1.5 h-3 bg-violet-600 ml-1 animate-pulse" />
            </div>
          </div>
        )}

        {loading && !streamingContent && (
          <div className="flex items-center space-x-2 text-xs text-slate-400 p-2">
            <Loader2 className="w-3.5 h-3.5 animate-spin text-violet-600" />
            <span>Retrieving vector chunks and generating response...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Box */}
      <form onSubmit={handleSend} className="p-3 bg-white border-t border-slate-200/80">
        <div className="flex items-center space-x-2 bg-slate-50 border border-slate-300/80 rounded-xl p-2 focus-within:ring-2 focus-within:ring-violet-500 focus-within:bg-white transition-all shadow-xs">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={loading}
            placeholder="Ask a question about this document..."
            className="w-full px-2 py-1 text-xs text-slate-800 bg-transparent focus:outline-none disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="p-2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 disabled:opacity-40 text-white rounded-lg transition-all shadow-xs"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </button>
        </div>
      </form>
    </div>
  );
}

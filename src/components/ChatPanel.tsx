'use client';

import { useState, useEffect, useRef } from 'react';
import { Sparkles, Send, User, Bot, Loader2, RefreshCw } from 'lucide-react';

interface ChatMessage {
  id?: string;
  role: 'user' | 'assistant';
  content: string;
}

interface ChatPanelProps {
  pdfId: string;
  shareToken?: string;
}

export function ChatPanel({ pdfId, shareToken }: ChatPanelProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [streamingContent, setStreamingContent] = useState('');
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

    // Optimistically add user message to list
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

      // Append assistant message once streaming completes
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
    <div className="flex flex-col h-full bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="bg-slate-50 px-4 py-3 border-b border-slate-200 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="bg-blue-600 text-white p-1 rounded-md">
            <Sparkles className="w-3.5 h-3.5" />
          </div>
          <h3 className="font-bold text-sm text-slate-900">AI Document Assistant</h3>
        </div>
        <span className="text-[10px] bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full font-medium border border-blue-200">
          RAG Grounded (Top-K Chunks)
        </span>
      </div>

      <div className="flex-1 p-4 overflow-y-auto space-y-3 max-h-[450px]">
        {messages.length === 0 && !streamingContent ? (
          <div className="text-center py-8 space-y-2 max-w-xs mx-auto">
            <Bot className="w-8 h-8 text-blue-500 mx-auto opacity-70" />
            <p className="text-xs font-semibold text-slate-700">Ask questions about this PDF</p>
            <p className="text-[11px] text-slate-500">
              The AI retrieves top relevant document excerpts to answer with high precision and zero hallucination.
            </p>
          </div>
        ) : (
          messages.map((msg, index) => (
            <div
              key={index}
              className={`flex items-start space-x-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {msg.role === 'assistant' && (
                <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Bot className="w-3.5 h-3.5" />
                </div>
              )}
              <div
                className={`max-w-[85%] px-3.5 py-2.5 rounded-xl text-xs leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-blue-600 text-white rounded-br-none'
                    : 'bg-slate-100 text-slate-800 rounded-bl-none border border-slate-200'
                }`}
              >
                {msg.content}
              </div>
              {msg.role === 'user' && (
                <div className="w-6 h-6 rounded-full bg-slate-700 text-white flex items-center justify-center flex-shrink-0 text-[10px] font-bold mt-0.5">
                  U
                </div>
              )}
            </div>
          ))
        )}

        {/* Live streaming token response rendering */}
        {streamingContent && (
          <div className="flex items-start space-x-2 justify-start">
            <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center flex-shrink-0 mt-0.5">
              <Bot className="w-3.5 h-3.5 animate-pulse" />
            </div>
            <div className="max-w-[85%] px-3.5 py-2.5 rounded-xl text-xs leading-relaxed bg-slate-100 text-slate-800 rounded-bl-none border border-slate-200">
              {streamingContent}
              <span className="inline-block w-1.5 h-3 bg-blue-600 ml-1 animate-pulse" />
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSend} className="p-3 bg-slate-50 border-t border-slate-200">
        <div className="flex items-center space-x-2 bg-white border border-slate-300 rounded-lg p-1.5 focus-within:ring-1 focus-within:ring-blue-500 shadow-sm">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={loading}
            placeholder="Ask a question about this document..."
            className="w-full px-2 py-1 text-xs text-slate-800 focus:outline-none disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="p-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-md transition"
          >
            {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
          </button>
        </div>
      </form>
    </div>
  );
}

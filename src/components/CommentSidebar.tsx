'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { MessageSquare, Send, Reply, Loader2, Bold, Italic, Code } from 'lucide-react';

interface Comment {
  id: string;
  pdfId: string;
  authorName: string;
  authorUserId: string | null;
  body: string;
  createdAt: string;
  parentCommentId: string | null;
}

interface CommentSidebarProps {
  pdfId: string;
  shareToken?: string;
}

export function CommentSidebar({ pdfId, shareToken }: CommentSidebarProps) {
  const { data: session } = useSession();
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [body, setBody] = useState('');
  const [guestName, setGuestName] = useState('');
  const [replyingToId, setReplyingToId] = useState<string | null>(null);

  const fetchComments = async () => {
    try {
      const url = `/api/pdfs/${pdfId}/comments${shareToken ? `?token=${shareToken}` : ''}`;
      const res = await fetch(url);
      const data = await res.json();
      if (res.ok && data.comments) {
        setComments(data.comments);
      }
    } catch (err) {
      console.error('Failed to fetch comments:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComments();
  }, [pdfId, shareToken]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!body.trim()) return;

    if (!session && !guestName.trim()) {
      alert('Please enter your name to post a comment as a guest.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`/api/pdfs/${pdfId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          body: body.trim(),
          authorName: session?.user?.name || session?.user?.email || guestName.trim(),
          parentCommentId: replyingToId,
          token: shareToken,
        }),
      });

      if (res.ok) {
        setBody('');
        setReplyingToId(null);
        await fetchComments();
      } else {
        const errorData = await res.json();
        alert(errorData.error || 'Failed to post comment.');
      }
    } catch (err) {
      console.error('Error posting comment:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const insertFormatting = (syntax: string) => {
    setBody((prev) => `${prev}${syntax}`);
  };

  const renderMarkdown = (text: string) => {
    const lines = text.split('\n');
    return lines.map((line, idx) => {
      let formatted = line
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        .replace(/`(.*?)`/g, '<code class="bg-slate-100 px-1 py-0.5 rounded font-mono text-[11px] text-violet-600 border border-slate-200">$1</code>');

      if (line.trim().startsWith('- ')) {
        return (
          <li key={idx} className="ml-4 list-disc text-xs" dangerouslySetInnerHTML={{ __html: formatted.slice(2) }} />
        );
      }

      return (
        <p key={idx} className="text-xs text-slate-700 leading-relaxed mb-1" dangerouslySetInnerHTML={{ __html: formatted }} />
      );
    });
  };

  const rootComments = comments.filter((c) => !c.parentCommentId);
  const getReplies = (parentId: string) => comments.filter((c) => c.parentCommentId === parentId);

  return (
    <div className="flex flex-col h-full bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden">
      <div className="bg-slate-900 px-4 py-3 border-b border-slate-800 text-white flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <MessageSquare className="w-4 h-4 text-violet-400" />
          <h3 className="font-bold text-xs tracking-wide">Document Discussion</h3>
        </div>
        <span className="text-[10px] bg-slate-800 text-slate-300 border border-slate-700 px-2 py-0.5 rounded-full font-semibold">
          {comments.length} Comments
        </span>
      </div>

      <div className="flex-1 p-4 overflow-y-auto space-y-4 max-h-[460px] bg-slate-50/50">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 text-violet-600 animate-spin" />
          </div>
        ) : rootComments.length === 0 ? (
          <p className="text-xs text-slate-400 text-center py-12">No comments yet. Start the conversation!</p>
        ) : (
          rootComments.map((comment) => {
            const replies = getReplies(comment.id);
            return (
              <div key={comment.id} className="space-y-2">
                <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-2xs">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-violet-500 to-indigo-500 text-white text-[10px] font-bold flex items-center justify-center shadow-xs">
                        {comment.authorName[0]?.toUpperCase() || 'U'}
                      </div>
                      <span className="font-bold text-xs text-slate-900">{comment.authorName}</span>
                    </div>
                    <span className="text-[10px] text-slate-400 font-medium">
                      {new Date(comment.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  <div className="pl-8">{renderMarkdown(comment.body)}</div>

                  <button
                    onClick={() => setReplyingToId(replyingToId === comment.id ? null : comment.id)}
                    className="mt-2 text-[11px] text-violet-600 hover:text-violet-800 flex items-center space-x-1 font-semibold pl-8"
                  >
                    <Reply className="w-3 h-3" />
                    <span>{replyingToId === comment.id ? 'Cancel Reply' : 'Reply'}</span>
                  </button>
                </div>

                {replies.length > 0 && (
                  <div className="pl-6 space-y-2 border-l-2 border-violet-200 ml-3">
                    {replies.map((reply) => (
                      <div key={reply.id} className="bg-slate-100/70 p-3 rounded-xl border border-slate-200/60">
                        <div className="flex items-center justify-between mb-1.5">
                          <div className="flex items-center space-x-2">
                            <div className="w-5 h-5 rounded-full bg-slate-700 text-white text-[9px] font-bold flex items-center justify-center">
                              {reply.authorName[0]?.toUpperCase() || 'U'}
                            </div>
                            <span className="font-bold text-xs text-slate-800">{reply.authorName}</span>
                          </div>
                          <span className="text-[10px] text-slate-400">
                            {new Date(reply.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <div className="pl-7">{renderMarkdown(reply.body)}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      <form onSubmit={handleSubmit} className="p-3 bg-white border-t border-slate-200/80 space-y-2">
        {!session && (
          <input
            type="text"
            required
            value={guestName}
            onChange={(e) => setGuestName(e.target.value)}
            placeholder="Your display name (required for guest comments)"
            className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300/80 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-violet-500"
          />
        )}

        {replyingToId && (
          <div className="flex items-center justify-between bg-violet-50 border border-violet-200 px-2.5 py-1 rounded-md text-xs text-violet-800 font-medium">
            <span>Replying to comment...</span>
            <button onClick={() => setReplyingToId(null)} className="font-bold hover:underline">
              ✕
            </button>
          </div>
        )}

        <div className="border border-slate-300/80 rounded-xl bg-slate-50 p-1.5 focus-within:ring-2 focus-within:ring-violet-500 focus-within:bg-white transition-all shadow-xs">
          <textarea
            rows={2}
            required
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder={replyingToId ? 'Write a reply...' : 'Add a comment (Markdown supported)...'}
            className="w-full p-1 text-xs text-slate-800 bg-transparent focus:outline-none resize-none"
          />
        </div>

        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center space-x-1">
            <button
              type="button"
              onClick={() => insertFormatting('**bold**')}
              className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded"
              title="Bold"
            >
              <Bold className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => insertFormatting('*italic*')}
              className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded"
              title="Italic"
            >
              <Italic className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => insertFormatting('`code`')}
              className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded"
              title="Code"
            >
              <Code className="w-3.5 h-3.5" />
            </button>
          </div>

          <button
            type="submit"
            disabled={submitting || !body.trim()}
            className="px-3.5 py-1.5 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 disabled:opacity-40 text-white font-semibold text-xs rounded-lg transition-all shadow-xs flex items-center space-x-1"
          >
            {submitting ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <>
                <span>Post</span>
                <Send className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

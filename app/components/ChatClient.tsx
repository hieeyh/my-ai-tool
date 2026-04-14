'use client';

import { useChat } from '@ai-sdk/react';
import { useEffect, useRef, useState, useTransition } from 'react';
import {
  createConversation,
  deleteConversation,
  getMessages,
} from '../../lib/actions';
import { signOut } from 'next-auth/react';

type Conversation = {
  id: string;
  title: string;
  updatedAt: Date;
  messages: { content: string }[];
};

type User = {
  id?: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
};

type Props = {
  conversations: Conversation[];
  user: User;
};

export default function ChatClient({ conversations: initialConversations, user }: Props) {
  const [conversations, setConversations] = useState(initialConversations);
  const [currentId, setCurrentId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const bottomRef = useRef<HTMLDivElement>(null);

  const chatHelpers = useChat({
    api: '/api/chat',
    body: { conversationId: currentId },
  });

  const messages = chatHelpers.messages;
  const input: string = (chatHelpers as unknown as { input: string }).input ?? '';
  const handleInputChange = (chatHelpers as unknown as { handleInputChange: React.ChangeEventHandler<HTMLTextAreaElement> }).handleInputChange ?? (() => {});
  const handleSubmit = chatHelpers.handleSubmit;
  const isLoading = chatHelpers.isLoading;
  const stop = chatHelpers.stop;
  const setMessages = chatHelpers.setMessages;

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleNewChat = () => {
    if (!user.id) return;
    startTransition(async () => {
      const conv = await createConversation(user.id!);
      setConversations((prev) => [{ ...conv, messages: [] }, ...prev]);
      setCurrentId(conv.id);
      setMessages([]);
    });
  };

  const handleSelectConversation = (id: string) => {
    if (!user.id) return;
    startTransition(async () => {
      setCurrentId(id);
      const msgs = await getMessages(id, user.id!);
      setMessages(
        msgs.map((m) => ({
          id: m.id,
          role: m.role as 'user' | 'assistant',
          content: m.content,
          parts: [{ type: 'text' as const, text: m.content }],
        }))
      );
    });
  };

  const handleDelete = (e: React.MouseEvent, id: string) => {
    if (!user.id) return;
    e.stopPropagation();
    startTransition(async () => {
      await deleteConversation(id, user.id!);
      setConversations((prev) => prev.filter((c) => c.id !== id));
      if (currentId === id) {
        setCurrentId(null);
        setMessages([]);
      }
    });
  };

  return (
    <div className="flex h-screen bg-zinc-50 dark:bg-zinc-950">
      {/* 左侧边栏 */}
      <aside className="w-64 flex-shrink-0 flex flex-col border-r border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
        <div className="p-3">
          <button
            onClick={handleNewChat}
            disabled={isPending}
            className="w-full flex items-center gap-2 rounded-xl border border-zinc-200 dark:border-zinc-700 px-3 py-2.5 text-sm text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors disabled:opacity-50"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="8" y1="3" x2="8" y2="13" />
              <line x1="3" y1="8" x2="13" y2="8" />
            </svg>
            新建对话
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-2 pb-2">
          {conversations.length === 0 ? (
            <p className="text-xs text-zinc-400 text-center py-8">暂无对话记录</p>
          ) : (
            <ul className="space-y-0.5">
              {conversations.map((conv) => (
                <li key={conv.id}>
                  <button
                    onClick={() => handleSelectConversation(conv.id)}
                    className={`w-full text-left rounded-lg px-3 py-2.5 group flex items-start justify-between gap-2 transition-colors ${
                      currentId === conv.id
                        ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100'
                        : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800/50'
                    }`}
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{conv.title}</p>
                      {conv.messages[0] && (
                        <p className="text-xs text-zinc-400 truncate mt-0.5">
                          {conv.messages[0].content}
                        </p>
                      )}
                    </div>
                    <button
                      onClick={(e) => handleDelete(e, conv.id)}
                      className="flex-shrink-0 opacity-0 group-hover:opacity-100 text-zinc-400 hover:text-red-500 transition-all"
                    >
                      <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                        <line x1="4" y1="4" x2="12" y2="12" />
                        <line x1="12" y1="4" x2="4" y2="12" />
                      </svg>
                    </button>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* 底部用户信息 */}
        <div className="border-t border-zinc-200 dark:border-zinc-800 p-3">
          <div className="flex items-center gap-2">
            {user.image ? (
              <img src={user.image} alt="" className="w-7 h-7 rounded-full" />
            ) : (
              <div className="w-7 h-7 rounded-full bg-zinc-200 dark:bg-zinc-700 flex items-center justify-center">
                <span className="text-xs font-medium text-zinc-600 dark:text-zinc-300">
                  {user.name?.[0] ?? '?'}
                </span>
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-zinc-700 dark:text-zinc-300 truncate">
                {user.name ?? user.email}
              </p>
            </div>
            <button
              onClick={() => signOut()}
              className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors"
              title="退出登录"
            >
              <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M6 2H3a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h3" />
                <polyline points="11,11 14,8 11,5" />
                <line x1="14" y1="8" x2="6" y2="8" />
              </svg>
            </button>
          </div>
        </div>
      </aside>

      {/* 右侧对话区 */}
      <div className="flex flex-col flex-1 min-w-0">
        <header className="border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-6 py-4 flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-black dark:bg-white flex items-center justify-center">
            <span className="text-white dark:text-black text-sm font-bold">AI</span>
          </div>
          <div>
            <h1 className="font-semibold text-zinc-900 dark:text-zinc-100 text-sm">AI 助手</h1>
            <p className="text-xs text-zinc-400">由 DeepSeek 驱动</p>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto px-4 py-6">
          <div className="max-w-2xl mx-auto space-y-6">
            {messages.length === 0 && (
              <div className="text-center py-20">
                <div className="w-16 h-16 rounded-2xl bg-black dark:bg-white mx-auto mb-4 flex items-center justify-center">
                  <span className="text-white dark:text-black text-2xl font-bold">AI</span>
                </div>
                <h2 className="text-xl font-semibold text-zinc-800 dark:text-zinc-200 mb-2">
                  {currentId ? '开始对话' : `你好，${user.name ?? ''}！`}
                </h2>
                <p className="text-zinc-400 text-sm">
                  {currentId ? '输入任何问题，我来回答' : '点击左侧「新建对话」开始'}
                </p>
              </div>
            )}

            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {message.role === 'assistant' && (
                  <div className="w-8 h-8 rounded-full bg-black dark:bg-white flex-shrink-0 flex items-center justify-center mt-1">
                    <span className="text-white dark:text-black text-xs font-bold">AI</span>
                  </div>
                )}
                <div className={`max-w-[75%] rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap ${
                  message.role === 'user'
                    ? 'bg-black text-white dark:bg-white dark:text-black rounded-tr-sm'
                    : 'bg-white text-zinc-800 dark:bg-zinc-800 dark:text-zinc-100 border border-zinc-100 dark:border-zinc-700 rounded-tl-sm'
                }`}>
                  {message.content}
                  {message.role === 'assistant' && isLoading && message === messages[messages.length - 1] && (
                    <span className="inline-flex gap-1 ml-1">
                      <span className="w-1 h-1 rounded-full bg-zinc-400 animate-bounce [animation-delay:0ms]" />
                      <span className="w-1 h-1 rounded-full bg-zinc-400 animate-bounce [animation-delay:150ms]" />
                      <span className="w-1 h-1 rounded-full bg-zinc-400 animate-bounce [animation-delay:300ms]" />
                    </span>
                  )}
                </div>
                {message.role === 'user' && (
                  <div className="w-8 h-8 rounded-full bg-zinc-200 dark:bg-zinc-700 flex-shrink-0 flex items-center justify-center mt-1">
                    {user.image ? (
                      <img src={user.image} alt="" className="w-8 h-8 rounded-full" />
                    ) : (
                      <span className="text-zinc-600 dark:text-zinc-300 text-xs font-bold">我</span>
                    )}
                  </div>
                )}
              </div>
            ))}
            <div ref={bottomRef} />
          </div>
        </main>

        <div className="border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-4 py-4">
          <form
            onSubmit={(e) => {
              if (!currentId) { e.preventDefault(); return; }
              handleSubmit(e);
            }}
            className="max-w-2xl mx-auto flex gap-3 items-end"
          >
            <textarea
              value={input}
              onChange={handleInputChange}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  if (input.trim() && !isLoading && currentId) {
                    handleSubmit(e as unknown as React.FormEvent<HTMLFormElement>);
                  }
                }
              }}
              placeholder={currentId ? '输入消息...（Enter 发送）' : '请先新建对话'}
              disabled={!currentId}
              rows={1}
              className="flex-1 resize-none rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 px-4 py-3 text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white focus:border-transparent transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              style={{ maxHeight: '120px', overflowY: 'auto' }}
            />
            {isLoading ? (
              <button type="button" onClick={stop} className="flex-shrink-0 w-10 h-10 rounded-xl bg-red-500 hover:bg-red-600 text-white flex items-center justify-center transition-colors">
                <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
                  <rect x="2" y="2" width="10" height="10" rx="1" />
                </svg>
              </button>
            ) : (
              <button type="submit" disabled={!input.trim() || !currentId} className="flex-shrink-0 w-10 h-10 rounded-xl bg-black dark:bg-white text-white dark:text-black hover:bg-zinc-800 dark:hover:bg-zinc-200 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center transition-colors">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="8" y1="13" x2="8" y2="3" />
                  <polyline points="4,7 8,3 12,7" />
                </svg>
              </button>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}

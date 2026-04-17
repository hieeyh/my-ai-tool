'use client';

import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport } from 'ai';
import { useEffect, useRef, useState } from 'react';
import MarkdownContent from './MarkdownContent';
import { trpc } from '../../lib/trpc/client';
import { signOut } from 'next-auth/react';

type Conversation = {
  id: string;
  title: string;
  updatedAt: Date | string;
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

// ai@6: UIMessage 没有 content 字段，文本在 parts[].text 里
function getMessageText(message: { parts: Array<{ type: string; text?: string }> }): string {
  return message.parts
    .filter((p) => p.type === 'text')
    .map((p) => p.text ?? '')
    .join('');
}

export default function ChatClient({ conversations: initialConversations, user }: Props) {
  const [conversations, setConversations] = useState(initialConversations);
  const [currentId, setCurrentId] = useState<string | null>(
    initialConversations[0]?.id ?? null
  );
  const [inputValue, setInputValue] = useState('');
  const [isSwitching, setIsSwitching] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  // 初始加载第一个对话的消息
  const utils = trpc.useUtils();
  const { messages, sendMessage, stop, status, setMessages } = useChat({
    transport: new DefaultChatTransport({ api: '/api/chat' }),
  });

  useEffect(() => {
    if (initialConversations[0]?.id) {
      handleSelectConversation(initialConversations[0].id);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // tRPC mutations
  const createMutation = trpc.conversation.create.useMutation({
    onSuccess: (conv) => {
      setConversations((prev) => [{ ...conv, messages: [] }, ...prev]);
      setCurrentId(conv.id);
      setMessages([]);
    },
  });

  const deleteMutation = trpc.conversation.delete.useMutation({
    onSuccess: (_, { conversationId }) => {
      setConversations((prev) => prev.filter((c) => c.id !== conversationId));
      if (currentId === conversationId) {
        setCurrentId(null);
        setMessages([]);
      }
    },
  });



  const isLoading = status === 'submitted' || status === 'streaming';
  const isPending = createMutation.isPending || deleteMutation.isPending;

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = () => {
    if (!inputValue.trim() || !currentId || isLoading) return;

    // 如果是第一条消息，立即更新本地侧边栏标题
    const isFirstMessage = messages.length === 0;
    if (isFirstMessage) {
      const newTitle = inputValue.slice(0, 20);
      setConversations((prev) =>
        prev.map((c) => (c.id === currentId ? { ...c, title: newTitle } : c))
      );
    }

    sendMessage({ text: inputValue }, { body: { conversationId: currentId } });
    setInputValue('');
  };

  const handleNewChat = () => {
    createMutation.mutate();
  };

  const handleSelectConversation = async (id: string) => {
    if (id === currentId) return;
    setCurrentId(id);
    setMessages([]);
    setIsSwitching(true);
    try {
      const msgs = await utils.conversation.getMessages.fetch({ conversationId: id });
      setMessages(
        msgs.map((m) => ({
          id: m.id,
          role: m.role as 'user' | 'assistant',
          parts: [{ type: 'text' as const, text: m.content }],
        }))
      );
    } finally {
      setIsSwitching(false);
    }
  };

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    deleteMutation.mutate({ conversationId: id });
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
                  <div
                    onClick={() => handleSelectConversation(conv.id)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => e.key === 'Enter' && handleSelectConversation(conv.id)}
                    className={`w-full cursor-pointer text-left rounded-lg px-3 py-2.5 group flex items-start justify-between gap-2 transition-colors ${
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
                  </div>
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
            {/* 切换对话时的加载状态 */}
            {isSwitching && (
              <div className="space-y-4 animate-pulse">
                {[1, 2, 3].map((i) => (
                  <div key={i} className={`flex gap-3 ${i % 2 === 0 ? 'justify-end' : 'justify-start'}`}>
                    <div className={`h-10 rounded-2xl bg-zinc-100 dark:bg-zinc-800 ${i % 2 === 0 ? 'w-48' : 'w-64'}`} />
                  </div>
                ))}
              </div>
            )}

            {!isSwitching && messages.length === 0 && (
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
                <div className={`max-w-[75%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                  message.role === 'user'
                    ? 'bg-black text-white dark:bg-white dark:text-black rounded-tr-sm whitespace-pre-wrap'
                    : 'bg-white text-zinc-800 dark:bg-zinc-800 dark:text-zinc-100 border border-zinc-100 dark:border-zinc-700 rounded-tl-sm'
                }`}>
                  {message.role === 'assistant' ? (
                    <MarkdownContent
                      content={getMessageText(message)}
                      isStreaming={isLoading && message === messages[messages.length - 1]}
                    />
                  ) : (
                    getMessageText(message)
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
          <div className="max-w-2xl mx-auto flex gap-3 items-end">
            <textarea
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder={currentId ? '输入消息...（Enter 发送）' : '请先新建对话'}
              disabled={!currentId}
              rows={1}
              className="flex-1 resize-none rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 px-4 py-3 text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white focus:border-transparent transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              style={{ maxHeight: '120px', overflowY: 'auto' }}
            />
            {isLoading ? (
              <button type="button" onClick={() => stop()} className="flex-shrink-0 w-10 h-10 rounded-xl bg-red-500 hover:bg-red-600 text-white flex items-center justify-center transition-colors">
                <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
                  <rect x="2" y="2" width="10" height="10" rx="1" />
                </svg>
              </button>
            ) : (
              <button
                onClick={handleSend}
                disabled={!inputValue.trim() || !currentId}
                className="flex-shrink-0 w-10 h-10 rounded-xl bg-black dark:bg-white text-white dark:text-black hover:bg-zinc-800 dark:hover:bg-zinc-200 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center transition-colors"
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="8" y1="13" x2="8" y2="3" />
                  <polyline points="4,7 8,3 12,7" />
                </svg>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

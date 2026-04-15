'use client';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import 'highlight.js/styles/github.css';

type Props = {
  content: string;
  isStreaming?: boolean;
};

export default function MarkdownContent({ content, isStreaming }: Props) {
  return (
    <div className="markdown-body prose prose-sm max-w-none dark:prose-invert">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeHighlight]}
        components={{
          // 代码块：带语言标签和复制按钮
          pre({ children, ...props }) {
            return (
              <pre
                {...props}
                className="relative rounded-lg bg-zinc-900 dark:bg-zinc-950 p-4 overflow-x-auto text-xs my-3"
              >
                {children}
              </pre>
            );
          },
          // 行内代码
          code({ children, className, ...props }) {
            const isBlock = !!className;
            if (isBlock) {
              return (
                <code className={`${className} text-zinc-100`} {...props}>
                  {children}
                </code>
              );
            }
            return (
              <code
                className="bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 px-1.5 py-0.5 rounded text-xs font-mono"
                {...props}
              >
                {children}
              </code>
            );
          },
          // 链接：新标签打开
          a({ children, href, ...props }) {
            return (
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-500 hover:underline"
                {...props}
              >
                {children}
              </a>
            );
          },
          // 段落
          p({ children, ...props }) {
            return (
              <p className="my-1.5 leading-relaxed" {...props}>
                {children}
              </p>
            );
          },
          // 无序列表
          ul({ children, ...props }) {
            return (
              <ul className="my-2 ml-4 list-disc space-y-1" {...props}>
                {children}
              </ul>
            );
          },
          // 有序列表
          ol({ children, ...props }) {
            return (
              <ol className="my-2 ml-4 list-decimal space-y-1" {...props}>
                {children}
              </ol>
            );
          },
          // 标题
          h1({ children, ...props }) {
            return <h1 className="text-lg font-bold mt-4 mb-2" {...props}>{children}</h1>;
          },
          h2({ children, ...props }) {
            return <h2 className="text-base font-bold mt-3 mb-1.5" {...props}>{children}</h2>;
          },
          h3({ children, ...props }) {
            return <h3 className="text-sm font-bold mt-2 mb-1" {...props}>{children}</h3>;
          },
          // 分隔线
          hr() {
            return <hr className="my-3 border-zinc-200 dark:border-zinc-700" />;
          },
          // 引用块
          blockquote({ children, ...props }) {
            return (
              <blockquote
                className="border-l-4 border-zinc-300 dark:border-zinc-600 pl-3 my-2 text-zinc-500 dark:text-zinc-400 italic"
                {...props}
              >
                {children}
              </blockquote>
            );
          },
          // 表格
          table({ children, ...props }) {
            return (
              <div className="overflow-x-auto my-3">
                <table className="min-w-full text-xs border-collapse" {...props}>
                  {children}
                </table>
              </div>
            );
          },
          th({ children, ...props }) {
            return (
              <th
                className="border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 px-3 py-1.5 text-left font-semibold"
                {...props}
              >
                {children}
              </th>
            );
          },
          td({ children, ...props }) {
            return (
              <td
                className="border border-zinc-200 dark:border-zinc-700 px-3 py-1.5"
                {...props}
              >
                {children}
              </td>
            );
          },
        }}
      >
        {content}
      </ReactMarkdown>
      {/* 流式输出时的光标动效 */}
      {isStreaming && (
        <span className="inline-block w-1.5 h-4 bg-zinc-400 animate-pulse ml-0.5 align-middle rounded-sm" />
      )}
    </div>
  );
}

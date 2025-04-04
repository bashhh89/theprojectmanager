'use client';

import React from 'react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';
import { Components } from 'react-markdown';

interface MarkdownProps {
  content: string;
  className?: string;
}

interface CodeProps {
  node?: any;
  inline?: boolean;
  className?: string;
  children?: React.ReactNode;
}

export function Markdown({ content, className }: MarkdownProps) {
  const components: Components = {
    code({ node, inline, className, children, ...props }: CodeProps) {
      const match = /language-(\w+)/.exec(className || '');
      const language = match ? match[1] : '';

      if (!inline && language) {
        return (
          <div className="relative group">
            <div className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(String(children));
                }}
                className="p-1 text-xs bg-background/80 hover:bg-background rounded border shadow-sm"
              >
                Copy
              </button>
            </div>
            <SyntaxHighlighter
              {...props}
              style={vscDarkPlus}
              language={language}
              PreTag="div"
              customStyle={{
                margin: 0,
                borderRadius: '0.375rem',
              }}
            >
              {String(children).replace(/\n$/, '')}
            </SyntaxHighlighter>
          </div>
        );
      }

      return (
        <code className={className} {...props}>
          {children}
        </code>
      );
    },
    // Add custom components for other markdown elements
    h1: ({ children }) => (
      <h1 className="scroll-m-20 text-4xl font-bold tracking-tight">
        {children}
      </h1>
    ),
    h2: ({ children }) => (
      <h2 className="scroll-m-20 text-3xl font-semibold tracking-tight">
        {children}
      </h2>
    ),
    h3: ({ children }) => (
      <h3 className="scroll-m-20 text-2xl font-semibold tracking-tight">
        {children}
      </h3>
    ),
    h4: ({ children }) => (
      <h4 className="scroll-m-20 text-xl font-semibold tracking-tight">
        {children}
      </h4>
    ),
    p: ({ children }) => <p className="leading-7 [&:not(:first-child)]:mt-6">{children}</p>,
    a: ({ children, href }) => (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="font-medium underline underline-offset-4"
      >
        {children}
      </a>
    ),
    ul: ({ children }) => (
      <ul className="my-6 ml-6 list-disc [&>li]:mt-2">{children}</ul>
    ),
    ol: ({ children }) => (
      <ol className="my-6 ml-6 list-decimal [&>li]:mt-2">{children}</ol>
    ),
    blockquote: ({ children }) => (
      <blockquote className="mt-6 border-l-2 pl-6 italic">
        {children}
      </blockquote>
    ),
    img: ({ src, alt }) => (
      <img
        src={src}
        alt={alt}
        className="rounded-lg border bg-muted"
        loading="lazy"
      />
    ),
    table: ({ children }) => (
      <div className="my-6 w-full overflow-x-auto rounded-lg border dark:border-zinc-700">
        <table className="caption-bottom text-sm">{children}</table>
      </div>
    ),
    thead: ({ children }) => <thead className="[&_tr]:border-b">{children}</thead>,
    tbody: ({ children }) => <tbody className="[&_tr:last-child]:border-0">{children}</tbody>,
    tr: ({ children }) => <tr className="border-b border-border transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">{children}</tr>,
    th: ({ children }) => (
      <th className="h-12 px-8 text-left align-middle font-semibold text-foreground [&:has([role=checkbox])]:pr-0">
        {children}
      </th>
    ),
    td: ({ children }) => (
      <td className="px-8 py-4 align-middle [&:has([role=checkbox])]:pr-0">
        {children}
      </td>
    ),
  };

  return (
    <div className={className}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[rehypeKatex]}
        components={components}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
} 
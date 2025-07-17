"use client";

import ReactMarkdown, { type Components } from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface MarkdownDisplayProps {
  content: string; 
}

const customComponents: Components = {
  h1: ({node, ...props}) => <h1 className="text-3xl font-headline font-bold mt-6 mb-4 text-primary" {...props} />,
  h2: ({node, ...props}) => <h2 className="text-2xl font-headline font-semibold mt-5 mb-3 border-b border-border pb-2 text-primary/90" {...props} />,
  h3: ({node, ...props}) => <h3 className="text-xl font-headline font-semibold mt-4 mb-2 text-primary/80" {...props} />,
  p: ({node, ...props}) => <p className="mb-4 leading-relaxed text-foreground/90" {...props} />,
  a: ({node, ...props}) => <a className="text-accent hover:text-primary underline transition-colors duration-200" {...props} />,
  ul: ({node, ...props}) => <ul className="list-disc pl-6 mb-4 space-y-1 text-foreground/90" {...props} />,
  ol: ({node, ...props}) => <ol className="list-decimal pl-6 mb-4 space-y-1 text-foreground/90" {...props} />,
  li: ({node, ...props}) => <li className="mb-1" {...props} />,
  blockquote: ({node, ...props}) => <blockquote className="border-l-4 border-primary pl-4 italic text-muted-foreground my-4" {...props} />,
  code: ({inline, className, children, ...props}: React.HTMLAttributes<HTMLElement> & {inline?: boolean}) => {
    const match = /language-(\w+)/.exec(className || '');
    return !inline && match ? (
      <pre className="font-code bg-muted p-3 rounded-md overflow-x-auto text-sm my-4 shadow-sm">
        <code className={className} {...props}>
          {children}
        </code>
      </pre>
    ) : (
      <code className="font-code bg-muted/70 text-accent-foreground px-1.5 py-0.5 rounded-md text-sm" {...props}>
        {children}
      </code>
    );
  },
  table: ({node, ...props}) => <table className="min-w-full border-collapse border border-border my-4 text-sm shadow-sm" {...props} />,
  thead: ({node, ...props}) => <thead className="bg-secondary/50" {...props} />,
  th: ({node, ...props}) => <th className="border border-border px-3 py-2 text-left font-semibold text-foreground" {...props} />,
  td: ({node, ...props}) => <td className="border border-border px-3 py-2 text-foreground/90" {...props} />,
  hr: ({node, ...props}) => <hr className="my-6 border-border" {...props} />,
};


export default function MarkdownDisplay({ content }: MarkdownDisplayProps) {
  if (!content || content.trim() === "") {
    return <p className="text-muted-foreground italic">No content to display.</p>;
  }
  return (
    <div className="markdown-content selection:bg-primary/20">
      <ReactMarkdown
        components={customComponents}
        remarkPlugins={[remarkGfm]}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}

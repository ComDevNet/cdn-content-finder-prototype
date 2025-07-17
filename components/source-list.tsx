
"use client";

import { Link } from 'lucide-react';
import type { Source } from '@/ai/flows/gather-relevant-content';

interface SourceListProps {
  sources: Source[];
}

export default function SourceList({ sources }: SourceListProps) {
  if (!sources || sources.length === 0) {
    return <p className="text-muted-foreground italic">No sources provided.</p>;
  }

  return (
    <div className="space-y-4">
      {sources.map((source, index) => (
        <div key={index} className="flex items-start">
          <Link className="h-4 w-4 text-accent mr-3 mt-1 shrink-0" />
          <div className="flex flex-col">
            <a
              href={source.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-accent hover:text-primary hover:underline transition-colors duration-200 font-semibold"
              aria-label={`Source ${index + 1}: ${source.title}`}
            >
              {source.title}
            </a>
            <p className="text-sm text-muted-foreground mt-1">
              {source.snippet}
            </p>
            <a
              href={source.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-primary/80 hover:underline break-all"
            >
              {source.url}
            </a>
          </div>
        </div>
      ))}
    </div>
  );
}

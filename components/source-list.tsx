"use client";

import { Link } from 'lucide-react';

interface SourceListProps {
  sources: string[]; // Now expects an array of URLs
}

export default function SourceList({ sources }: SourceListProps) {
  if (!sources || sources.length === 0) {
    return <p className="text-muted-foreground italic">No sources provided.</p>;
  }

  return (
    <ul className="space-y-3">
      {sources.map((sourceUrl, index) => (
        <li key={index} className="font-code text-sm flex items-start">
          <Link className="h-4 w-4 text-accent mr-2 mt-0.5 shrink-0" />
          <a
            href={sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-accent hover:text-primary hover:underline transition-colors duration-200 break-all"
            aria-label={`Source ${index + 1}: ${sourceUrl}`}
          >
            {sourceUrl}
          </a>
        </li>
      ))}
    </ul>
  );
}

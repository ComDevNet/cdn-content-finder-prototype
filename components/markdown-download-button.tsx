
"use client";

import { Button } from '@/components/ui/button';
import { FileText } from 'lucide-react';

interface MarkdownDownloadButtonProps {
  content: string;
  prompt: string;
  audience: string;
  fileName?: string;
}

export default function MarkdownDownloadButton({ 
  content,
  prompt,
  audience,
  fileName: providedFileName 
}: MarkdownDownloadButtonProps) {
  
  const handleDownload = () => {
    const blob = new Blob([content], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    
    const defaultFileName = `cdn-content-${prompt.replace(/[^\w\s]/gi, '').replace(/\s+/g, '-').toLowerCase().substring(0,30)}-${audience.replace(/\s+/g, '-').toLowerCase()}.md`;
    a.download = providedFileName || defaultFileName;
    a.href = url;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <Button onClick={handleDownload} variant="outline" className="rounded-lg border-primary text-primary hover:bg-primary/10 hover:text-primary transition-all duration-300 ease-in-out transform hover:scale-105 focus:ring-4 focus:ring-primary/30">
      <FileText className="mr-2 h-4 w-4" />
      Download Markdown
    </Button>
  );
}

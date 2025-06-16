
"use client";

import { Button } from '@/components/ui/button';
import { FileJson } from 'lucide-react';

interface JsonDownloadButtonProps {
  content: string;
  prompt: string;
  audience: string;
  fileName?: string;
}

export default function JsonDownloadButton({ 
  content, 
  prompt,
  audience,
  fileName: providedFileName
}: JsonDownloadButtonProps) {
  
  const handleDownload = () => {
    const dataToSave = {
      prompt: prompt,
      audience: audience,
      generatedMarkdownContent: content,
    };
    const jsonString = JSON.stringify(dataToSave, null, 2);
    const blob = new Blob([jsonString], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    
    const defaultFileName = `cdn-content-${prompt.replace(/[^\w\s]/gi, '').replace(/\s+/g, '-').toLowerCase().substring(0,30)}-${audience.replace(/\s+/g, '-').toLowerCase()}.json`;
    a.download = providedFileName || defaultFileName;
    a.href = url;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <Button onClick={handleDownload} variant="outline" className="rounded-lg border-primary text-primary hover:bg-primary/10 hover:text-primary transition-all duration-300 ease-in-out transform hover:scale-105 focus:ring-4 focus:ring-primary/30">
      <FileJson className="mr-2 h-4 w-4" />
      Download JSON
    </Button>
  );
}

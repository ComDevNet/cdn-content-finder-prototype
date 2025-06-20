
"use client";

import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';

interface ImageDownloadButtonProps {
  imageDataUri: string;
  fileName?: string;
}

export default function ImageDownloadButton({ 
  imageDataUri, 
  fileName = "ai-generated-image.png"
}: ImageDownloadButtonProps) {
  
  const handleDownload = () => {
    const a = document.createElement('a');
    a.href = imageDataUri;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <Button 
      onClick={handleDownload} 
      variant="outline" 
      size="sm" 
      className="absolute top-2 right-2 bg-background/70 hover:bg-background/90 text-foreground opacity-0 group-hover:opacity-100 transition-opacity duration-300"
    >
      <Download className="mr-2 h-4 w-4" />
      Download
    </Button>
  );
}

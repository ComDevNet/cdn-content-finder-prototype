
"use client";

import { Button } from '@/components/ui/button';
import { FileJson } from 'lucide-react';

interface JsonDownloadButtonProps {
  content: string;
  prompt: string;
  audience: string;
  fileName?: string;
}

interface ContentNode {
  type: 'heading1' | 'heading2' | 'heading3' | 'paragraph' | 'list' | 'code' | 'blockquote' | 'hr';
  text?: string;
  items?: string[];
  language?: string;
}

export default function JsonDownloadButton({ 
  content, 
  prompt,
  audience,
  fileName: providedFileName
}: JsonDownloadButtonProps) {

  const parseMarkdownToJson = (markdown: string): ContentNode[] => {
    const lines = markdown.split('\n');
    const nodes: ContentNode[] = [];
    let currentList: string[] | null = null;
    let inCodeBlock = false;
    let codeBlockText = '';
    let codeBlockLang = '';

    const pushListIfExists = () => {
      if (currentList) {
        nodes.push({ type: 'list', items: currentList });
        currentList = null;
      }
    };

    for (const line of lines) {
      // Handle code blocks
      if (line.startsWith('```')) {
        if (inCodeBlock) {
          // End of code block
          nodes.push({ type: 'code', text: codeBlockText.trim(), language: codeBlockLang });
          inCodeBlock = false;
          codeBlockText = '';
          codeBlockLang = '';
        } else {
          // Start of code block
          pushListIfExists();
          inCodeBlock = true;
          codeBlockLang = line.substring(3).trim();
        }
        continue;
      }

      if (inCodeBlock) {
        codeBlockText += line + '\n';
        continue;
      }
      
      const trimmedLine = line.trim();

      // Headings
      if (trimmedLine.startsWith('# ')) {
        pushListIfExists();
        nodes.push({ type: 'heading1', text: trimmedLine.substring(2).trim() });
      } else if (trimmedLine.startsWith('## ')) {
        pushListIfExists();
        nodes.push({ type: 'heading2', text: trimmedLine.substring(3).trim() });
      } else if (trimmedLine.startsWith('### ')) {
        pushListIfExists();
        nodes.push({ type: 'heading3', text: trimmedLine.substring(4).trim() });
      } 
      // List items
      else if (trimmedLine.startsWith('- ') || trimmedLine.startsWith('* ') || trimmedLine.match(/^\d+\.\s/)) {
        if (!currentList) {
          currentList = [];
        }
        // Preserve inline markdown by just removing the list marker
        currentList.push(line.replace(/^(\s*[-*]|\s*\d+\.)\s+/, ''));
      }
      // Blockquotes
      else if (trimmedLine.startsWith('> ')) {
        pushListIfExists();
        nodes.push({ type: 'blockquote', text: trimmedLine.substring(2).trim() });
      }
      // Horizontal Rule
      else if (['---', '***', '___'].includes(trimmedLine) && trimmedLine.length === 3) {
        pushListIfExists();
        nodes.push({ type: 'hr' });
      }
      // Paragraphs (and end of lists)
      else if (trimmedLine) {
        pushListIfExists();
        nodes.push({ type: 'paragraph', text: line }); // Use original line to preserve indentation if any
      } else {
         // Blank line also ends a list
         pushListIfExists();
      }
    }
    // Add any remaining list
    pushListIfExists();

    return nodes;
  };
  
  const handleDownload = () => {
    const structuredContent = parseMarkdownToJson(content);
    
    const dataToSave = {
      prompt: prompt,
      audience: audience,
      content: structuredContent,
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

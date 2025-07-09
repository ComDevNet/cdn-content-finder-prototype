
"use client";

import { Document, Packer, Paragraph, TextRun, HeadingLevel } from 'docx';
import { saveAs } from 'file-saver';
import { Button } from '@/components/ui/button';
import { FileText } from 'lucide-react';

interface DocxDownloadButtonProps {
  content: string;
  prompt: string;
  fileName?: string;
}

export default function DocxDownloadButton({
  content,
  prompt,
  fileName = "aggregated-content.docx"
}: DocxDownloadButtonProps) {

  // This function parses a line of text for inline markdown and returns an array of TextRun objects.
  const parseInlineMarkdown = (text: string): TextRun[] => {
      const runs: TextRun[] = [];
      // Regex to find **bold**, *italic*, or plain text segments
      const regex = /(\*\*.*?\*\*|\*.*?\*|[^*]+)/g;
      let match;

      while ((match = regex.exec(text)) !== null) {
          const segment = match[0];
          if (segment.startsWith('**') && segment.endsWith('**')) {
              runs.push(new TextRun({ text: segment.slice(2, -2), bold: true }));
          } else if (segment.startsWith('*') && segment.endsWith('*')) {
              runs.push(new TextRun({ text: segment.slice(1, -1), italics: true }));
          } else {
              runs.push(new TextRun(segment));
          }
      }
      return runs;
  };

  const parseMarkdown = (markdown: string): Paragraph[] => {
    const paragraphs: Paragraph[] = [];
    // Split by newlines to process line by line, then group them logically.
    const lines = markdown.split('\n');
    let inList = false;

    for (let i = 0; i < lines.length; i++) {
        let line = lines[i].trim();

        if (line.startsWith('# ')) {
            paragraphs.push(new Paragraph({ children: parseInlineMarkdown(line.substring(2)), heading: HeadingLevel.HEADING_1 }));
            inList = false;
        } else if (line.startsWith('## ')) {
            paragraphs.push(new Paragraph({ children: parseInlineMarkdown(line.substring(3)), heading: HeadingLevel.HEADING_2 }));
            inList = false;
        } else if (line.startsWith('### ')) {
            paragraphs.push(new Paragraph({ children: parseInlineMarkdown(line.substring(4)), heading: HeadingLevel.HEADING_3 }));
            inList = false;
        } else if (line.startsWith('- ') || line.startsWith('* ')) {
            paragraphs.push(new Paragraph({
                children: parseInlineMarkdown(line.substring(2)),
                bullet: { level: 0 },
            }));
            inList = true;
        } else if (line.match(/^\d+\.\s/)) {
            paragraphs.push(new Paragraph({
                children: parseInlineMarkdown(line.replace(/^\d+\.\s/, '')),
                numbering: { reference: "default-numbering", level: 0 },
            }));
            inList = true;
        } else if (line === '') {
            // Empty line indicates a break, could be between paragraphs or end of list
            inList = false;
            // Add a single empty paragraph for spacing, but not too many.
            if (paragraphs.length > 0) {
              paragraphs.push(new Paragraph({ text: ''}));
            }
        } else {
            // Regular paragraph text
            paragraphs.push(new Paragraph({
                children: parseInlineMarkdown(line),
                spacing: { after: 120 }
            }));
            inList = false;
        }
    }
    return paragraphs.filter(p => p); // Filter out any potential undefined entries
  };
  
  const generateDocx = async () => {
    const doc = new Document({
      numbering: {
        config: [
          {
            reference: "default-numbering",
            levels: [
              {
                level: 0,
                format: "decimal",
                text: "%1.",
                style: {
                  paragraph: {
                    indent: { left: 720, hanging: 360 },
                  },
                },
              },
            ],
          },
        ],
      },
      sections: [{
        properties: {},
        children: [
          new Paragraph({
            text: "CDN Content Finder",
            heading: HeadingLevel.TITLE,
            alignment: 'center'
          }),
          new Paragraph({ text: "", spacing: { after: 200 } }),
          new Paragraph({
            children: [
              new TextRun({ text: "User Prompt: ", bold: true }),
              new TextRun(prompt)
            ]
          }),
          new Paragraph({ text: "", spacing: { after: 400 } }),
          ...parseMarkdown(content),
        ],
      }],
      styles: {
        paragraphStyles: [
          {
            id: "Heading1",
            name: "Heading 1",
            basedOn: "Normal",
            next: "Normal",
            run: {
              size: 32, // 16pt
              bold: true,
              color: "333333",
            },
            paragraph: {
              spacing: { after: 240, before: 480 }, // 12pt after, 24pt before
            },
          },
          {
            id: "Heading2",
            name: "Heading 2",
            basedOn: "Normal",
            next: "Normal",
            run: {
              size: 28, // 14pt
              bold: true,
              color: "333333",
            },
            paragraph: {
              spacing: { after: 240, before: 480 },
            },
          },
          {
            id: "Heading3",
            name: "Heading 3",
            basedOn: "Normal",
            next: "Normal",
            run: {
              size: 24, // 12pt
              bold: true,
              color: "333333",
            },
            paragraph: {
              spacing: { after: 240, before: 480 },
            },
          },
        ],
      }
    });

    const blob = await Packer.toBlob(doc);
    saveAs(blob, fileName);
  };

  return (
    <Button onClick={generateDocx} variant="outline" className="rounded-lg border-primary text-primary hover:bg-primary/10 hover:text-primary transition-all duration-300 ease-in-out transform hover:scale-105 focus:ring-4 focus:ring-primary/30">
      <FileText className="mr-2 h-4 w-4" />
      Download DOCX
    </Button>
  );
}

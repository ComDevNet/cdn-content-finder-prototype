
"use client";

import { jsPDF, type TextOptionsLight } from 'jspdf';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';

interface PdfDownloadButtonProps {
  content: string;
  prompt: string;
  fileName?: string;
}

export default function PdfDownloadButton({
  content,
  prompt,
  fileName = "aggregated-content.pdf"
}: PdfDownloadButtonProps) {

  const handleDownload = () => {
    const doc = new jsPDF({
      orientation: 'p', // Portrait orientation
      unit: 'mm',
      format: 'a4' // Standard A4
    });

    const pageHeight = doc.internal.pageSize.getHeight();
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 15; // mm
    const usableWidth = pageWidth - margin * 2;
    let currentY = margin;

    // --- Style Constants ---
    const FONT_FAMILY_SANS = "helvetica";
    const FONT_FAMILY_MONO = "courier";

    const FONT_STYLE_NORMAL = "normal";
    const FONT_STYLE_BOLD = "bold";
    const FONT_STYLE_ITALIC = "italic";
    const FONT_STYLE_BOLD_ITALIC = "bolditalic";

    const COLOR_TEXT_PRIMARY = "#333333";
    const COLOR_TEXT_HEADING = "#1A1A1A";
    const COLOR_TEXT_MUTED = "#666666";
    const COLOR_ACCENT = "#D35400"; // Orange accent
    const COLOR_CODE_BACKGROUND = "#F0F0F0";
    const COLOR_BORDER = "#CCCCCC";

    const FONT_SIZE_MAIN_TITLE = 18;
    const FONT_SIZE_SECTION_TITLE = 14;
    const FONT_SIZE_H1 = 16;
    const FONT_SIZE_H2 = 14;
    const FONT_SIZE_H3 = 12;
    const FONT_SIZE_BODY = 10;
    const FONT_SIZE_CODE = 9;
    const FONT_SIZE_SMALL = 8;

    const getLineHeightMm = (fontSizePt: number, multiplier: number = 1.4) => fontSizePt * 0.352778 * multiplier;

    const PARAGRAPH_SPACING = 3;
    const HEADING_SPACING_TOP = 5;
    const HEADING_SPACING_BOTTOM = 2;
    const SECTION_SPACING = 7;
    const CODE_BLOCK_PADDING = 3;
    const BLOCKQUOTE_PADDING_LEFT = 5;
    const BLOCKQUOTE_BAR_WIDTH = 1;
    const BLOCKQUOTE_BAR_PADDING = 2;
    const LIST_INDENT = 5;
    const HR_HEIGHT = 0.5;
    const HR_MARGIN = 4;

    const addPageIfNeeded = (heightNeeded: number) => {
        if (currentY + heightNeeded > pageHeight - margin) {
            doc.addPage();
            currentY = margin;
            return true;
        }
        return false;
    };
    
    // --- Advanced Inline Parser ---
    const renderTextWithInlineFormatting = (text: string, x: number, y: number, options: {
        fontSize?: number,
        fontFamily?: string,
        fontStyle?: string,
        color?: string,
        isListItem?: boolean
    } = {}) => {
        const {
            fontSize = FONT_SIZE_BODY,
            fontFamily = FONT_FAMILY_SANS,
            fontStyle = FONT_STYLE_NORMAL,
            color = COLOR_TEXT_PRIMARY,
            isListItem = false
        } = options;
        
        doc.setFont(fontFamily, fontStyle);
        doc.setFontSize(fontSize);
        doc.setTextColor(color);

        const textLines = doc.splitTextToSize(text, usableWidth - (isListItem ? LIST_INDENT * 2 : 0) );
        const lineHeight = getLineHeightMm(fontSize);

        textLines.forEach((line: string, index: number) => {
            let currentX = x;
            if (isListItem && index > 0) {
                currentX += LIST_INDENT; // Indent wrapped lines of list items
            }
            
            addPageIfNeeded(lineHeight);
            
            // Regex to find **bold**, *italic*, ***bolditalic*** or plain text segments
            const regex = /(\*\*\*.*?\*\*\*|\*\*.*?\*\*|\*.*?\*|`.*?`|[^`*]+)/g;
            let match;
            const segments = line.match(regex)?.filter(s => s) || [];

            segments.forEach(segment => {
                let segmentText = segment;
                let segmentStyle = fontStyle;
                let segmentFontFamily = fontFamily;

                if (segment.startsWith('***') && segment.endsWith('***')) {
                    segmentText = segment.slice(3, -3);
                    segmentStyle = FONT_STYLE_BOLD_ITALIC;
                } else if (segment.startsWith('**') && segment.endsWith('**')) {
                    segmentText = segment.slice(2, -2);
                    segmentStyle = FONT_STYLE_BOLD;
                } else if (segment.startsWith('*') && segment.endsWith('*')) {
                    segmentText = segment.slice(1, -1);
                    segmentStyle = FONT_STYLE_ITALIC;
                } else if (segment.startsWith('`') && segment.endsWith('`')) {
                    segmentText = segment.slice(1, -1);
                    segmentFontFamily = FONT_FAMILY_MONO;
                }

                doc.setFont(segmentFontFamily, segmentStyle);
                doc.text(segmentText, currentX, currentY);
                currentX += doc.getTextWidth(segmentText);
            });
            
            currentY += lineHeight;
        });
    }

    // --- Report Title & Header ---
    currentY += HEADING_SPACING_TOP / 2;
    renderTextWithInlineFormatting(`CDN Content Finder Report`, margin + usableWidth / 2, currentY, { fontSize: FONT_SIZE_MAIN_TITLE, fontStyle: FONT_STYLE_BOLD, color: COLOR_TEXT_HEADING });
    currentY += SECTION_SPACING;
    
    renderTextWithInlineFormatting(`User Prompt:`, margin, currentY, { fontSize: FONT_SIZE_SECTION_TITLE, fontStyle: FONT_STYLE_BOLD, color: COLOR_TEXT_HEADING });
    currentY += PARAGRAPH_SPACING / 2;
    renderTextWithInlineFormatting(prompt, margin, currentY);
    currentY += SECTION_SPACING;

    doc.setDrawColor(COLOR_BORDER);
    doc.setLineWidth(HR_HEIGHT);
    doc.line(margin, currentY, pageWidth - margin, currentY);
    currentY += HR_MARGIN * 1.5;

    renderTextWithInlineFormatting(`Aggregated Content:`, margin, currentY, { fontSize: FONT_SIZE_SECTION_TITLE, fontStyle: FONT_STYLE_BOLD, color: COLOR_TEXT_HEADING });
    currentY += PARAGRAPH_SPACING;

    // --- Content Parsing Logic ---
    const lines = content.split('\n');
    let listType: 'ul' | 'ol' | null = null;
    let olCounter = 1;
    let inCodeBlock = false;
    let codeBlockText = '';

    for (const line of lines) {
        if (line.startsWith("```")) {
            if (inCodeBlock) {
                // End of code block
                inCodeBlock = false;
                addPageIfNeeded(CODE_BLOCK_PADDING * 2 + getLineHeightMm(FONT_SIZE_CODE, 1.3) * codeBlockText.split('\n').length);
                const blockStartY = currentY;
                doc.setFillColor(COLOR_CODE_BACKGROUND);
                doc.rect(margin, blockStartY, usableWidth, currentY - blockStartY + CODE_BLOCK_PADDING * 2, 'F');
                currentY = blockStartY + CODE_BLOCK_PADDING; // Reset for text render
                renderTextWithInlineFormatting(codeBlockText, margin + CODE_BLOCK_PADDING, currentY, {fontFamily: FONT_FAMILY_MONO, fontSize: FONT_SIZE_CODE});
                currentY += CODE_BLOCK_PADDING; // Add padding at the bottom
                codeBlockText = '';
            } else {
                inCodeBlock = true;
            }
            continue;
        }

        if (inCodeBlock) {
            codeBlockText += line + '\n';
            continue;
        }

        const trimmedLine = line.trim();

        if (listType && !trimmedLine.startsWith('- ') && !trimmedLine.startsWith('* ') && !trimmedLine.match(/^\d+\.\s/)) {
            listType = null;
            olCounter = 1;
        }

        if (trimmedLine.startsWith('#')) {
            currentY += HEADING_SPACING_TOP;
            let level = 0;
            while (trimmedLine[level] === '#') level++;
            const text = trimmedLine.substring(level).trim();
            let fontSize = FONT_SIZE_H3;
            if (level === 1) fontSize = FONT_SIZE_H1;
            if (level === 2) fontSize = FONT_SIZE_H2;
            renderTextWithInlineFormatting(text, margin, currentY, { fontSize, fontStyle: FONT_STYLE_BOLD, color: COLOR_TEXT_HEADING });
            currentY += HEADING_SPACING_BOTTOM;

        } else if (trimmedLine.startsWith('>')) {
            const text = trimmedLine.substring(1).trim();
            const quoteHeight = getLineHeightMm(FONT_SIZE_BODY) * doc.splitTextToSize(text, usableWidth - BLOCKQUOTE_PADDING_LEFT - BLOCKQUOTE_BAR_WIDTH - BLOCKQUOTE_BAR_PADDING).length;
            addPageIfNeeded(quoteHeight);
            
            const startY = currentY;
            renderTextWithInlineFormatting(text, margin + BLOCKQUOTE_PADDING_LEFT + BLOCKQUOTE_BAR_WIDTH + BLOCKQUOTE_BAR_PADDING, currentY, { fontStyle: FONT_STYLE_ITALIC, color: COLOR_TEXT_MUTED });
            const endY = currentY;
            
            doc.setDrawColor(COLOR_ACCENT);
            doc.setLineWidth(BLOCKQUOTE_BAR_WIDTH);
            doc.rect(margin + BLOCKQUOTE_PADDING_LEFT / 2, startY - getLineHeightMm(FONT_SIZE_BODY)*0.2, BLOCKQUOTE_BAR_WIDTH, endY - startY - getLineHeightMm(FONT_SIZE_BODY)*0.2);

        } else if (trimmedLine.startsWith('- ') || trimmedLine.startsWith('* ')) {
            const text = trimmedLine.substring(2);
            listType = 'ul';
            renderTextWithInlineFormatting(`•  ${text}`, margin + LIST_INDENT, currentY, { isListItem: true });
        
        } else if (trimmedLine.match(/^\d+\.\s/)) {
            const text = trimmedLine.replace(/^\d+\.\s/, '');
            if (listType !== 'ol') {
                olCounter = 1;
            }
            listType = 'ol';
            renderTextWithInlineFormatting(`${olCounter++}.  ${text}`, margin + LIST_INDENT, currentY, { isListItem: true });

        } else if (trimmedLine === '---' || trimmedLine === '***') {
            currentY += HR_MARGIN;
            addPageIfNeeded(HR_HEIGHT + HR_MARGIN);
            doc.setDrawColor(COLOR_BORDER);
            doc.setLineWidth(HR_HEIGHT);
            doc.line(margin, currentY, pageWidth - margin, currentY);
            currentY += HR_MARGIN;
        
        } else if (trimmedLine) {
            renderTextWithInlineFormatting(trimmedLine, margin, currentY);
            currentY += PARAGRAPH_SPACING / 2;
        } else {
             // It's a blank line, add some space
             currentY += PARAGRAPH_SPACING;
        }
    }

    // --- Footer (Page Number) ---
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFont(FONT_FAMILY_SANS, FONT_STYLE_NORMAL);
      doc.setFontSize(FONT_SIZE_SMALL);
      doc.setTextColor(COLOR_TEXT_MUTED);
      doc.text(
        `Page ${i} of ${pageCount}`,
        pageWidth - margin,
        pageHeight - margin / 2,
        { align: 'right' }
      );
    }

    doc.save(fileName);
  };

  return (
    <Button onClick={handleDownload} variant="outline" className="rounded-lg border-primary text-primary hover:bg-primary/10 hover:text-primary transition-all duration-300 ease-in-out transform hover:scale-105 focus:ring-4 focus:ring-primary/30">
      <Download className="mr-2 h-4 w-4" />
      Download PDF
    </Button>
  );
}

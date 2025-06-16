
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

    const COLOR_TEXT_PRIMARY = "#333333";
    const COLOR_TEXT_HEADING = "#1A1A1A";
    const COLOR_TEXT_MUTED = "#666666";
    const COLOR_ACCENT = "#D35400"; // Orange accent
    const COLOR_CODE_BACKGROUND = "#F0F0F0"; // Lighter gray for code background
    const COLOR_BORDER = "#CCCCCC";

    const FONT_SIZE_MAIN_TITLE = 18;
    const FONT_SIZE_SECTION_TITLE = 14;
    const FONT_SIZE_H1 = 16;
    const FONT_SIZE_H2 = 14;
    const FONT_SIZE_H3 = 12;
    const FONT_SIZE_BODY = 10;
    const FONT_SIZE_CODE = 9;
    const FONT_SIZE_SMALL = 8;

    // Convert pt to mm: 1pt = 0.352778 mm. Line height usually 1.2-1.5x font size.
    const getLineHeightMm = (fontSizePt: number, multiplier: number = 1.4) => fontSizePt * 0.352778 * multiplier;

    const PARAGRAPH_SPACING = 3; // mm
    const HEADING_SPACING_TOP = 5;
    const HEADING_SPACING_BOTTOM = 2;
    const SECTION_SPACING = 7;
    const CODE_BLOCK_PADDING = 3; // Padding inside code block rect
    const BLOCKQUOTE_PADDING_LEFT = 5; // Total left padding for blockquote text
    const BLOCKQUOTE_BAR_WIDTH = 1;
    const BLOCKQUOTE_BAR_PADDING = 2; // Space between bar and text
    const LIST_INDENT = 5; // Indent for the bullet/number
    const HR_HEIGHT = 0.5; // mm for the line thickness
    const HR_MARGIN = 4; // mm above and below HR

    // --- Helper function to add text and handle pagination ---
    const addTextLinesHelper = (
      textLinesToAdd: string[],
      x: number,
      fontFamily: string,
      fontSize: number,
      fontStyle: string,
      color: string,
      lineHeightMultiplier: number = 1.4,
      options: TextOptionsLight = {}
    ) => {
      doc.setFont(fontFamily, fontStyle);
      doc.setFontSize(fontSize);
      doc.setTextColor(color);
      const lineHeight = getLineHeightMm(fontSize, lineHeightMultiplier);

      textLinesToAdd.forEach((line: string) => {
        if (currentY + lineHeight > pageHeight - margin) {
          doc.addPage();
          currentY = margin;
          doc.setFont(fontFamily, fontStyle);
          doc.setFontSize(fontSize);
          doc.setTextColor(color);
        }
        doc.text(line, x, currentY, options);
        currentY += lineHeight;
      });
    };

    // --- Report Title ---
    currentY += HEADING_SPACING_TOP / 2;
    addTextLinesHelper(
      ["CDN Content Finder Report"], margin + usableWidth / 2,
      FONT_FAMILY_SANS, FONT_SIZE_MAIN_TITLE, FONT_STYLE_BOLD, COLOR_TEXT_HEADING, 1.2, { align: 'center' }
    );
    currentY += SECTION_SPACING;

    // --- User Prompt Section ---
    addTextLinesHelper(
      ["User Prompt:"], margin,
      FONT_FAMILY_SANS, FONT_SIZE_SECTION_TITLE, FONT_STYLE_BOLD, COLOR_TEXT_HEADING, 1.2
    );
    currentY += PARAGRAPH_SPACING / 2;
    const promptLines = doc.splitTextToSize(prompt, usableWidth);
    addTextLinesHelper(
      promptLines, margin,
      FONT_FAMILY_SANS, FONT_SIZE_BODY, FONT_STYLE_NORMAL, COLOR_TEXT_PRIMARY, 1.4
    );
    currentY += SECTION_SPACING;
    
    doc.setDrawColor(COLOR_BORDER);
    doc.setLineWidth(HR_HEIGHT);
    doc.line(margin, currentY, pageWidth - margin, currentY);
    currentY += HR_MARGIN * 1.5;

    // --- Aggregated Content Section ---
    addTextLinesHelper(
      ["Aggregated Content:"], margin,
      FONT_FAMILY_SANS, FONT_SIZE_SECTION_TITLE, FONT_STYLE_BOLD, COLOR_TEXT_HEADING, 1.2
    );
    currentY += PARAGRAPH_SPACING;

    const contentBlocks = content.split(/\n{2,}/); // Split by 2+ newlines

    contentBlocks.forEach((block) => {
      block = block.trim();
      if (!block) return;

      if (block.startsWith("```") && block.endsWith("```") && block.length >= 6) {
          const codeText = block.substring(3, block.length - 3).trim();
          const codeLines = codeText.split('\n'); // Don't use splitTextToSize for code
          
          currentY += PARAGRAPH_SPACING / 2;
          const codeBlockStartY = currentY;
          let codeBlockVisualHeight = CODE_BLOCK_PADDING * 2;
          codeLines.forEach(() => {
            codeBlockVisualHeight += getLineHeightMm(FONT_SIZE_CODE, 1.3);
          });
          
          if (currentY + codeBlockVisualHeight > pageHeight - margin && currentY > margin + 5) { // Avoid adding page if already at top
            doc.addPage();
            currentY = margin;
          }
          const actualCodeBlockDrawStartY = currentY; // Y for drawing rect, after potential page break

          doc.setFillColor(COLOR_CODE_BACKGROUND);
          doc.rect(margin, actualCodeBlockDrawStartY, usableWidth, codeBlockVisualHeight, 'F');
          
          currentY = actualCodeBlockDrawStartY + CODE_BLOCK_PADDING; // Set Y for first line of text
          addTextLinesHelper(codeLines, margin + CODE_BLOCK_PADDING, FONT_FAMILY_MONO, FONT_SIZE_CODE, FONT_STYLE_NORMAL, COLOR_TEXT_PRIMARY, 1.3);
          currentY = actualCodeBlockDrawStartY + codeBlockVisualHeight; // Ensure currentY is accurately set after the block
          currentY += PARAGRAPH_SPACING;
      }
      else if (block.startsWith("#")) {
        currentY += HEADING_SPACING_TOP;
        let level = 0;
        while (block[level] === '#') level++;
        const headingText = block.substring(level).trim();
        let fontSize = FONT_SIZE_H3;
        if (level === 1) fontSize = FONT_SIZE_H1;
        else if (level === 2) fontSize = FONT_SIZE_H2;
        
        const lines = doc.splitTextToSize(headingText, usableWidth);
        addTextLinesHelper(lines, margin, FONT_FAMILY_SANS, fontSize, FONT_STYLE_BOLD, COLOR_TEXT_HEADING, 1.2);
        currentY += HEADING_SPACING_BOTTOM;
      }
      else if (block === "---" || block === "***" || block === "___") {
        currentY += HR_MARGIN;
        doc.setDrawColor(COLOR_BORDER);
        doc.setLineWidth(HR_HEIGHT);
        doc.line(margin, currentY, pageWidth - margin, currentY);
        currentY += HR_MARGIN + PARAGRAPH_SPACING / 2;
      }
      else if (block.startsWith(">")) {
        currentY += PARAGRAPH_SPACING / 2;
        const quoteText = block.split('\n').map(q => q.replace(/^>\s?/, '').trim()).join('\n');
        const lines = doc.splitTextToSize(quoteText, usableWidth - (BLOCKQUOTE_PADDING_LEFT + BLOCKQUOTE_BAR_WIDTH + BLOCKQUOTE_BAR_PADDING));
        
        const blockquoteTextStartY = currentY;
        addTextLinesHelper(lines, margin + BLOCKQUOTE_PADDING_LEFT + BLOCKQUOTE_BAR_WIDTH + BLOCKQUOTE_BAR_PADDING, FONT_FAMILY_SANS, FONT_SIZE_BODY, FONT_STYLE_ITALIC, COLOR_TEXT_MUTED, 1.4);
        const blockquoteTextEndY = currentY; 
        
        if (blockquoteTextStartY < blockquoteTextEndY) { // Only draw bar if there was text
            doc.setDrawColor(COLOR_ACCENT);
            doc.setLineWidth(BLOCKQUOTE_BAR_WIDTH);
            const barTopY = blockquoteTextStartY - getLineHeightMm(FONT_SIZE_BODY, 1.4) * 0.2; // Align better with text
            const barBottomY = blockquoteTextEndY - getLineHeightMm(FONT_SIZE_BODY, 1.4) * 0.8; // Align better
            doc.line(margin + BLOCKQUOTE_PADDING_LEFT, barTopY, margin + BLOCKQUOTE_PADDING_LEFT, barBottomY);
        }
        currentY += PARAGRAPH_SPACING;
      }
      else if (block.startsWith("- ") || block.startsWith("* ") || /^\d+\.\s/.test(block)) {
        const listItems = block.split('\n');
        listItems.forEach(item => {
          item = item.trim();
          if (!item) return;
          
          let bullet = "• ";
          let itemText = item;
          const listItemIndent = margin + LIST_INDENT;

          if (item.startsWith("- ")) itemText = item.substring(2);
          else if (item.startsWith("* ")) itemText = item.substring(2);
          else if (/^\d+\.\s/.test(item)) {
            const match = item.match(/^(\d+)\.\s/);
            if (match) {
              bullet = match[1] + ". ";
              itemText = item.substring(match[0].length);
            }
          }
          
          const bulletWidth = doc.getTextWidth(bullet);
          const textLines = doc.splitTextToSize(itemText, usableWidth - LIST_INDENT - bulletWidth);
          
          if (textLines.length > 0) {
            addTextLinesHelper([bullet + textLines[0]], listItemIndent, FONT_FAMILY_SANS, FONT_SIZE_BODY, FONT_STYLE_NORMAL, COLOR_TEXT_PRIMARY, 1.4);
            for (let i = 1; i < textLines.length; i++) {
              // Add manual indent for wrapped lines of a list item
              addTextLinesHelper([textLines[i]], listItemIndent + bulletWidth, FONT_FAMILY_SANS, FONT_SIZE_BODY, FONT_STYLE_NORMAL, COLOR_TEXT_PRIMARY, 1.4);
            }
          } else if (itemText.trim() !== "") { // Single line item, no wrap
             addTextLinesHelper([bullet + itemText], listItemIndent, FONT_FAMILY_SANS, FONT_SIZE_BODY, FONT_STYLE_NORMAL, COLOR_TEXT_PRIMARY, 1.4);
          }
        });
        currentY += PARAGRAPH_SPACING / 2;
      }
      else { // Paragraphs
        const lines = doc.splitTextToSize(block, usableWidth);
        addTextLinesHelper(lines, margin, FONT_FAMILY_SANS, FONT_SIZE_BODY, FONT_STYLE_NORMAL, COLOR_TEXT_PRIMARY, 1.4);
        currentY += PARAGRAPH_SPACING;
      }
    });

    doc.save(fileName);
  };

  return (
    <Button onClick={handleDownload} variant="outline" className="rounded-lg border-primary text-primary hover:bg-primary/10 hover:text-primary transition-all duration-300 ease-in-out transform hover:scale-105 focus:ring-4 focus:ring-primary/30">
      <Download className="mr-2 h-4 w-4" />
      Download PDF
    </Button>
  );
}

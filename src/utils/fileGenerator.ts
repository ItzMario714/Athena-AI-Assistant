import { jsPDF } from "jspdf";
import { Document, Packer, Paragraph, TextRun } from "docx";
import { saveAs } from "file-saver";

export const generatePDF = (content: string, filename: string = "Research_Report.pdf", title: string = "Research Report") => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 15;
  const maxLineWidth = pageWidth - margin * 2;
  
  // Title
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text(title, margin, 20);
  
  // Content
  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  const splitText = doc.splitTextToSize(content, maxLineWidth);
  
  let cursorY = 35;
  const lineHeight = 7;
  
  for (let i = 0; i < splitText.length; i++) {
    if (cursorY + lineHeight > pageHeight - margin) {
      doc.addPage();
      cursorY = margin + 10;
    }
    doc.text(splitText[i], margin, cursorY);
    cursorY += lineHeight;
  }
  
  doc.save(filename);
};

export const generateDocx = async (content: string, filename: string = "Research_Report.docx", title: string = "Research Report") => {
  const doc = new Document({
    sections: [
      {
        properties: {},
        children: [
          new Paragraph({
            children: [
              new TextRun({
                text: title,
                bold: true,
                size: 32,
              }),
            ],
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: "\n",
              }),
            ],
          }),
          new Paragraph({
            children: [
              new TextRun(content),
            ],
          }),
        ],
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  saveAs(blob, filename);
};

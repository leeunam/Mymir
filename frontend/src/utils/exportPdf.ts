import jsPDF from "jspdf";

export async function exportToPdf(content: string, path: string) {
  const pdf = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 20;
  const contentWidth = pageWidth - margin * 2;

  // Cores
  const violet = [109, 40, 217] as [number, number, number];
  const darkBg = [15, 23, 42] as [number, number, number];
  const lightGray = [148, 163, 184] as [number, number, number];
  const white = [248, 250, 252] as [number, number, number];
  const borderGray = [51, 65, 85] as [number, number, number];

  // Fundo escuro
  pdf.setFillColor(...darkBg);
  pdf.rect(0, 0, pageWidth, pageHeight, "F");

  // Header com barra violet
  pdf.setFillColor(...violet);
  pdf.rect(0, 0, pageWidth, 18, "F");

  // Logo/título no header
  pdf.setTextColor(...white);
  pdf.setFontSize(11);
  pdf.setFont("helvetica", "bold");
  pdf.text("MYMIR", margin, 11);

  // Subtítulo do path no header
  const pathLabels: Record<string, string> = {
    news: "Notícias Principais",
    trends: "Tendências e Análise",
    projects: "Projetos em Destaque",
    followup: "Análise Aprofundada",
  };
  pdf.setFontSize(9);
  pdf.setFont("helvetica", "normal");
  pdf.setTextColor(196, 181, 253);
  const label = pathLabels[path] || "Relatório";
  pdf.text(label, pageWidth - margin - pdf.getTextWidth(label), 11);

  // Data no header
  const dateStr = new Date().toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
  pdf.setFontSize(8);
  pdf.setTextColor(167, 139, 250);
  pdf.text(dateStr, margin, 25);

  // Linha divisória sutil
  pdf.setDrawColor(...borderGray);
  pdf.setLineWidth(0.3);
  pdf.line(margin, 28, pageWidth - margin, 28);

  let y = 36;

  // Processa o markdown de forma simples linha por linha
  const lines = content.split("\n");

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) {
      y += 3;
      continue;
    }

    // Verifica se precisa de nova página
    if (y > pageHeight - margin - 10) {
      pdf.addPage();
      pdf.setFillColor(...darkBg);
      pdf.rect(0, 0, pageWidth, pageHeight, "F");
      pdf.setFillColor(...violet);
      pdf.rect(0, 0, pageWidth, 8, "F");
      y = 18;
    }

    // H1 e H2
    if (line.startsWith("## ") || line.startsWith("# ")) {
      const text = line.replace(/^#+\s/, "");
      pdf.setTextColor(...violet);
      pdf.setFontSize(13);
      pdf.setFont("helvetica", "bold");
      const wrapped = pdf.splitTextToSize(text, contentWidth);
      pdf.text(wrapped, margin, y);
      y += wrapped.length * 6 + 3;
      pdf.setDrawColor(...violet);
      pdf.setLineWidth(0.5);
      pdf.line(margin, y - 1, margin + 30, y - 1);
      y += 3;
      continue;
    }

    // H3
    if (line.startsWith("### ")) {
      const text = line.replace(/^###\s/, "");
      pdf.setTextColor(167, 139, 250);
      pdf.setFontSize(11);
      pdf.setFont("helvetica", "bold");
      const wrapped = pdf.splitTextToSize(text, contentWidth);
      pdf.text(wrapped, margin, y);
      y += wrapped.length * 5.5 + 2;
      continue;
    }

    // Negrito
    if (line.startsWith("**") && line.includes("**", 2)) {
      const text = line.replace(/\*\*/g, "");
      pdf.setTextColor(...white);
      pdf.setFontSize(10);
      pdf.setFont("helvetica", "bold");
      const wrapped = pdf.splitTextToSize(text, contentWidth);
      pdf.text(wrapped, margin, y);
      y += wrapped.length * 5 + 1;
      continue;
    }

    // Listas (- ou *)
    if (line.startsWith("- ") || line.startsWith("* ")) {
      const text = line.replace(/^[-*]\s/, "");
      pdf.setTextColor(...lightGray);
      pdf.setFontSize(9);
      pdf.setFont("helvetica", "normal");
      pdf.setFillColor(...violet);
      pdf.circle(margin + 1.5, y - 1.5, 0.8, "F");
      const wrapped = pdf.splitTextToSize(text.replace(/\*\*/g, ""), contentWidth - 6);
      pdf.text(wrapped, margin + 5, y);
      y += wrapped.length * 4.5 + 1;
      continue;
    }

    // Numeração (1. 2. etc)
    if (/^\d+\./.test(line)) {
      const num = line.match(/^(\d+\.)/)?.[1] || "";
      const text = line.replace(/^\d+\.\s*/, "").replace(/\*\*/g, "");
      pdf.setTextColor(167, 139, 250);
      pdf.setFontSize(9);
      pdf.setFont("helvetica", "bold");
      pdf.text(num, margin, y);
      pdf.setTextColor(...white);
      pdf.setFont("helvetica", "normal");
      const wrapped = pdf.splitTextToSize(text, contentWidth - 8);
      pdf.text(wrapped, margin + 7, y);
      y += wrapped.length * 4.5 + 2;
      continue;
    }

    // Texto normal
    const cleanText = line.replace(/\*\*/g, "").replace(/\*/g, "");
    pdf.setTextColor(...lightGray);
    pdf.setFontSize(9);
    pdf.setFont("helvetica", "normal");
    const wrapped = pdf.splitTextToSize(cleanText, contentWidth);
    pdf.text(wrapped, margin, y);
    y += wrapped.length * 4.5 + 1;
  }

  // Footer em todas as páginas
  const totalPages = pdf.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    pdf.setPage(i);
    pdf.setFillColor(...darkBg);
    pdf.rect(0, pageHeight - 12, pageWidth, 12, "F");
    pdf.setDrawColor(...borderGray);
    pdf.line(margin, pageHeight - 12, pageWidth - margin, pageHeight - 12);
    pdf.setTextColor(...lightGray);
    pdf.setFontSize(7);
    pdf.setFont("helvetica", "normal");
    pdf.text("Gerado por Mymir AI", margin, pageHeight - 5);
    pdf.text(`Página ${i} de ${totalPages}`, pageWidth - margin - 18, pageHeight - 5);
  }

  const dateFile = new Date().toISOString().split("T")[0];
  const fileName = `mymir-${path}-${dateFile}.pdf`;
  pdf.save(fileName);
}

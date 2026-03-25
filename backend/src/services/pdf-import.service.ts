import { PDFParse } from "pdf-parse";

type ParsedInvoiceData = {
  invoice_type: string | null;
  point_of_sale: string | null;
  invoice_number: string | null;
  invoice_date: string | null;
  total_amount: number | null;
  raw_text: string;
};

const normalizeAmount = (value: string): number | null => {
  const cleaned = value.replace(/\./g, "").replace(",", ".").trim();
  const num = Number(cleaned);
  return Number.isNaN(num) ? null : num;
};

export const parseInvoicePdf = async (
  fileBuffer: Buffer
): Promise<ParsedInvoiceData> => {
  const parser = new PDFParse({ data: fileBuffer });
  const result = await parser.getText();
  const text = result.text.replace(/\s+/g, " ").trim();

  const typeMatch =
    text.match(/\bFACTURA\s+([ABCEM])\b/i) ||
    text.match(/\b([ABCEM])\s+FACTURA\b/i);

  const posNumMatch =
    text.match(/Punto de Venta:\s*Comp\.?\s*Nro:\s*(\d{5})\s+(\d{8})/i) ||
    text.match(/Comp\.?\s*Nro:\s*(\d{5})\s+(\d{8})/i);

  const invoice_type = typeMatch?.[1]?.toUpperCase() ?? null;
  const point_of_sale = posNumMatch?.[1]?.padStart(4, "0") ?? null;
  const invoice_number = posNumMatch?.[2]?.padStart(8, "0") ?? null;

  const dateMatches = [...text.matchAll(/\b\d{2}\/\d{2}\/\d{4}\b/g)].map(
    (m) => m[0]
  );

  let invoice_date: string | null = null;
  if (dateMatches.length >= 4) {
    const [dd, mm, yyyy] = dateMatches[3].split("/");
    invoice_date = `${yyyy}-${mm}-${dd}`;
  }

  let total_amount: number | null = null;
  const amountMatches = [...text.matchAll(/\b\d+(?:[.,]\d{3})*(?:[.,]\d{2})\b/g)]
    .map((m) => normalizeAmount(m[0]))
    .filter((n): n is number => n !== null && n > 100);

  if (amountMatches.length) {
    total_amount = Math.max(...amountMatches);
  }

  return {
    invoice_type,
    point_of_sale,
    invoice_number,
    invoice_date,
    total_amount,
    raw_text: text,
  };
};
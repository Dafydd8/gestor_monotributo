import { PDFParse } from "pdf-parse";

type ParsedInvoiceData = {
  invoice_type: string | null;
  point_of_sale: string | null;
  invoice_number: string | null;
  invoice_date: string | null;
  total_amount: number | null;
  client_name: string | null;
  client_cuit: string | null;
  raw_text: string;
};

const normalizeAmount = (value: string): number | null => {
  const cleaned = value.replace(/\./g, "").replace(",", ".").trim();
  const num = Number(cleaned);
  return Number.isNaN(num) ? null : num;
};

const normalizeCuit = (value: string): string | null => {
  const digits = value.replace(/\D/g, "");
  return digits.length === 11 ? digits : null;
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
  const point_of_sale = posNumMatch?.[1] ?? null;
  const invoice_number = posNumMatch?.[2] ?? null;

  let invoice_date: string | null = null;

  const periodIndex = text.indexOf("Período Facturado Desde");

  if (periodIndex !== -1) {
    // agarramos un pedazo de texto después del label
    const after = text.slice(periodIndex, periodIndex + 200);

    // buscamos fechas en ese pedazo
    const matches = [...after.matchAll(/\b\d{2}\/\d{2}\/\d{4}\b/g)];

    if (matches.length > 0) {
      const [dd, mm, yyyy] = matches[0][0].split("/");
      invoice_date = `${yyyy}-${mm}-${dd}`;
    }
  }

  let total_amount: number | null = null;
  const amountMatches = [...text.matchAll(/\b\d+(?:[.,]\d{3})*(?:[.,]\d{2})\b/g)]
    .map((m) => normalizeAmount(m[0]))
    .filter((n): n is number => n !== null && n > 100);

  if (amountMatches.length) {
    total_amount = Math.max(...amountMatches);
  }

  let client_name: string | null = null;
  let client_cuit: string | null = null;

  const receiverMatch = text.match(
    /Apellido y Nombre \/ Raz[oó]n Social:\s*Domicilio:\s*(.*?)\s+CUIT:\s*Ingresos Brutos:/i
  );

  if (receiverMatch?.[1]) {
    const block = receiverMatch[1].trim();

    const cuitMatch = block.match(/\b(\d{11})\b/);
    if (cuitMatch) {
      client_cuit = normalizeCuit(cuitMatch[1]);

      const afterCuit = block.slice(cuitMatch.index! + cuitMatch[1].length).trim();

      const stopTokens = [
        " Coronel ",
        " Entre Rios ",
        " Avenida ",
        " Av. ",
        " Calle ",
        " Ruta ",
        " Otros medios de pago",
      ];

      let cutIndex = afterCuit.length;

      for (const token of stopTokens) {
        const idx = afterCuit.indexOf(token);
        if (idx !== -1 && idx < cutIndex) {
          cutIndex = idx;
        }
      }

      client_name = afterCuit.slice(0, cutIndex).trim();
    }
  }

  return {
    invoice_type,
    point_of_sale,
    invoice_number,
    invoice_date,
    total_amount,
    client_name,
    client_cuit,
    raw_text: text,
  };
};
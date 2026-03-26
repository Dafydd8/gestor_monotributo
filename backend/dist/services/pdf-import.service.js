"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseInvoicePdf = void 0;
const pdf_parse_1 = require("pdf-parse");
const normalizeAmount = (value) => {
    const cleaned = value.replace(/\./g, "").replace(",", ".").trim();
    const num = Number(cleaned);
    return Number.isNaN(num) ? null : num;
};
const normalizeCuit = (value) => {
    const digits = value.replace(/\D/g, "");
    return digits.length === 11 ? digits : null;
};
const parseInvoicePdf = async (fileBuffer) => {
    const parser = new pdf_parse_1.PDFParse({ data: fileBuffer });
    const result = await parser.getText();
    const text = result.text.replace(/\s+/g, " ").trim();
    const typeMatch = text.match(/\bFACTURA\s+([ABCEM])\b/i) ||
        text.match(/\b([ABCEM])\s+FACTURA\b/i);
    const posNumMatch = text.match(/Punto de Venta:\s*Comp\.?\s*Nro:\s*(\d{5})\s+(\d{8})/i) ||
        text.match(/Comp\.?\s*Nro:\s*(\d{5})\s+(\d{8})/i);
    const invoice_type = typeMatch?.[1]?.toUpperCase() ?? null;
    const point_of_sale = posNumMatch?.[1] ?? null;
    const invoice_number = posNumMatch?.[2] ?? null;
    const dateMatches = [...text.matchAll(/\b\d{2}\/\d{2}\/\d{4}\b/g)].map((m) => m[0]);
    let invoice_date = null;
    if (dateMatches.length >= 4) {
        const [dd, mm, yyyy] = dateMatches[3].split("/");
        invoice_date = `${yyyy}-${mm}-${dd}`;
    }
    let total_amount = null;
    const amountMatches = [...text.matchAll(/\b\d+(?:[.,]\d{3})*(?:[.,]\d{2})\b/g)]
        .map((m) => normalizeAmount(m[0]))
        .filter((n) => n !== null && n > 100);
    if (amountMatches.length) {
        total_amount = Math.max(...amountMatches);
    }
    let client_name = null;
    let client_cuit = null;
    const receiverMatch = text.match(/Apellido y Nombre \/ Raz[oó]n Social:\s*Domicilio:\s*(.*?)\s+CUIT:\s*Ingresos Brutos:/i);
    if (receiverMatch?.[1]) {
        const block = receiverMatch[1].trim();
        const cuitMatch = block.match(/\b(\d{11})\b/);
        if (cuitMatch) {
            client_cuit = normalizeCuit(cuitMatch[1]);
            const afterCuit = block.slice(cuitMatch.index + cuitMatch[1].length).trim();
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
exports.parseInvoicePdf = parseInvoicePdf;

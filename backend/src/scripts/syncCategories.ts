import "dotenv/config";
import axios from "axios";
import * as cheerio from "cheerio";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});

const prisma = new PrismaClient({ adapter });

const SOURCE_URL = "https://www.afip.gob.ar/monotributo/categorias.asp";

type ParsedCategory = {
  code: string;
  max_annual_income: number;
  max_surface_m2: number | null;
  max_electric_consumption: number | null;
  max_rent_amount: number | null;
  max_unit_price: number | null;
  effective_from: Date;
};

function parseMoney(value: string): number | null {
  const cleaned = value
    .replace(/\$/g, "")
    .replace(/\s+/g, "")
    .replace(/\./g, "")
    .replace(",", ".")
    .trim();

  const num = Number(cleaned);
  return Number.isNaN(num) ? null : num;
}

function parseIntegerLike(value: string): number | null {
  const match = value.match(/(\d+(?:[.,]\d+)?)/);
  if (!match) return null;

  const normalized = match[1].replace(/\./g, "").replace(",", ".");
  const num = Number(normalized);
  return Number.isNaN(num) ? null : num;
}

function parseEffectiveFrom(text: string): Date {
  const match = text.match(/Valores de aplicación desde el (\d{1,2})\/(\d{1,2})\/(\d{4})/i);
  if (!match) {
    throw new Error("No se pudo detectar effective_from en la página");
  }

  const [, dd, mm, yyyy] = match;
  return new Date(`${yyyy}-${mm.padStart(2, "0")}-${dd.padStart(2, "0")}T00:00:00.000Z`);
}

async function fetchCategories(): Promise<ParsedCategory[]> {
  const { data: html } = await axios.get<string>(SOURCE_URL, {
    timeout: 30000,
    headers: {
      "User-Agent": "gestor-monotributo/1.0",
    },
  });

  const $ = cheerio.load(html);
  const pageText = $("body").text().replace(/\s+/g, " ").trim();
  const effectiveFrom = parseEffectiveFrom(pageText);

  const categories: ParsedCategory[] = [];

  // La página parseada viene bastante plana; cada fila empieza con la letra y luego los valores.
  const rowRegex =
    /\b([A-K])\s+\$([\d.,]+)\s+Hasta\s+(\d+)\s*m2\s+Hasta\s+(\d+)\s*Kw\s+\$([\d.,]+)\s+\$([\d.,]+)\s+/g;

  for (const match of pageText.matchAll(rowRegex)) {
    const [, code, annual, surface, electric, rent, unitPrice] = match;

    categories.push({
      code,
      max_annual_income: parseMoney(annual)!,
      max_surface_m2: parseIntegerLike(surface),
      max_electric_consumption: parseIntegerLike(electric),
      max_rent_amount: parseMoney(rent),
      max_unit_price: parseMoney(unitPrice),
      effective_from: effectiveFrom,
    });
  }

  if (categories.length === 0) {
    throw new Error("No se pudieron parsear categorías desde la página oficial");
  }

  return categories;
}

async function syncCategories() {
  const categories = await fetchCategories();

  for (const category of categories) {
    await prisma.category.upsert({
      where: {
        code_effective_from: {
          code: category.code,
          effective_from: category.effective_from,
        },
      },
      update: {
        max_annual_income: category.max_annual_income,
        max_surface_m2: category.max_surface_m2,
        max_electric_consumption: category.max_electric_consumption,
        max_rent_amount: category.max_rent_amount,
        max_unit_price: category.max_unit_price,
        is_active: true,
      },
      create: {
        code: category.code,
        max_annual_income: category.max_annual_income,
        max_surface_m2: category.max_surface_m2,
        max_electric_consumption: category.max_electric_consumption,
        max_rent_amount: category.max_rent_amount,
        max_unit_price: category.max_unit_price,
        effective_from: category.effective_from,
        is_active: true,
      },
    });
  }

  console.log(`Categorías sincronizadas: ${categories.length}`);
}

syncCategories()
  .catch((error) => {
    console.error("Error sincronizando categorías:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
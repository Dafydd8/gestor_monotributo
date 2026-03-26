"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const axios_1 = __importDefault(require("axios"));
const cheerio = __importStar(require("cheerio"));
const adapter_pg_1 = require("@prisma/adapter-pg");
const client_1 = require("../generated/prisma/client");
const adapter = new adapter_pg_1.PrismaPg({
    connectionString: process.env.DATABASE_URL,
});
const prisma = new client_1.PrismaClient({ adapter });
const SOURCE_URL = "https://www.afip.gob.ar/monotributo/categorias.asp";
function parseMoney(value) {
    const cleaned = value
        .replace(/\$/g, "")
        .replace(/\s+/g, "")
        .replace(/\./g, "")
        .replace(",", ".")
        .trim();
    const num = Number(cleaned);
    return Number.isNaN(num) ? null : num;
}
function parseIntegerLike(value) {
    const match = value.match(/(\d+(?:[.,]\d+)?)/);
    if (!match)
        return null;
    const normalized = match[1].replace(/\./g, "").replace(",", ".");
    const num = Number(normalized);
    return Number.isNaN(num) ? null : num;
}
function parseEffectiveFrom(text) {
    const match = text.match(/Valores de aplicación desde el (\d{1,2})\/(\d{1,2})\/(\d{4})/i);
    if (!match) {
        throw new Error("No se pudo detectar effective_from en la página");
    }
    const [, dd, mm, yyyy] = match;
    return new Date(`${yyyy}-${mm.padStart(2, "0")}-${dd.padStart(2, "0")}T00:00:00.000Z`);
}
async function fetchCategories() {
    const { data: html } = await axios_1.default.get(SOURCE_URL, {
        timeout: 30000,
        headers: {
            "User-Agent": "gestor-monotributo/1.0",
        },
    });
    const $ = cheerio.load(html);
    const pageText = $("body").text().replace(/\s+/g, " ").trim();
    const effectiveFrom = parseEffectiveFrom(pageText);
    const categories = [];
    // La página parseada viene bastante plana; cada fila empieza con la letra y luego los valores.
    const rowRegex = /\b([A-K])\s+\$([\d.,]+)\s+Hasta\s+(\d+)\s*m2\s+Hasta\s+(\d+)\s*Kw\s+\$([\d.,]+)\s+\$([\d.,]+)\s+/g;
    for (const match of pageText.matchAll(rowRegex)) {
        const [, code, annual, surface, electric, rent, unitPrice] = match;
        categories.push({
            code,
            max_annual_income: parseMoney(annual),
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

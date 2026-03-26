"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCurrentCategories = exports.getCategoriesOverview = void 0;
const db_1 = require("../db");
const formatPeriodLabel = (date) => {
    const month = date.getMonth();
    const year = date.getFullYear();
    if (month === 0 || month === 1)
        return `Ene ${year} – Jun ${year}`;
    if (month === 6 || month === 7)
        return `Jul ${year} – Dic ${year}`;
    return `${date.toISOString().slice(0, 10)}`;
};
const getCategoriesOverview = async (userId, projectedIpc = 15) => {
    const user = await db_1.prisma.user.findUnique({
        where: { id: userId },
        include: { current_category: true },
    });
    const allCategories = await db_1.prisma.category.findMany({
        orderBy: [{ effective_from: "desc" }, { max_annual_income: "asc" }],
    });
    if (!allCategories.length) {
        throw new Error("NO_CATEGORIES");
    }
    let currentPeriodCategories = await db_1.prisma.category.findMany({
        where: { is_active: true },
        orderBy: [{ effective_from: "desc" }, { max_annual_income: "asc" }],
    });
    if (!currentPeriodCategories.length) {
        const latestEffectiveFrom = allCategories[0].effective_from;
        currentPeriodCategories = allCategories.filter((c) => c.effective_from.getTime() === latestEffectiveFrom.getTime());
    }
    else {
        const latestActiveEffectiveFrom = currentPeriodCategories[0].effective_from;
        currentPeriodCategories = currentPeriodCategories.filter((c) => c.effective_from.getTime() === latestActiveEffectiveFrom.getTime());
    }
    const currentPeriodEffectiveFrom = currentPeriodCategories[0].effective_from;
    const rows = currentPeriodCategories.map((category) => ({
        id: category.id,
        code: category.code,
        max_annual_income: category.max_annual_income,
        projected_annual_income: category.max_annual_income * (1 + projectedIpc / 100),
        is_current: user?.current_category_id === category.id,
    }));
    const grouped = new Map();
    for (const category of allCategories) {
        const key = category.effective_from.toISOString();
        if (!grouped.has(key)) {
            grouped.set(key, {
                label: formatPeriodLabel(category.effective_from),
                effective_from: category.effective_from.toISOString().slice(0, 10),
                effective_to: category.effective_to
                    ? category.effective_to.toISOString().slice(0, 10)
                    : null,
                categories: [],
            });
        }
        grouped.get(key).categories.push({
            id: category.id,
            code: category.code,
            max_annual_income: category.max_annual_income,
        });
    }
    return {
        projected_ipc: projectedIpc,
        current_period_label: formatPeriodLabel(currentPeriodEffectiveFrom),
        current_category_code: user?.current_category?.code ?? null,
        categories: rows,
        historical_periods: Array.from(grouped.values()),
    };
};
exports.getCategoriesOverview = getCategoriesOverview;
const getCurrentCategories = async () => {
    const activeCategories = await db_1.prisma.category.findMany({
        where: { is_active: true },
        orderBy: { max_annual_income: "asc" },
    });
    if (activeCategories.length > 0) {
        const latestEffectiveFrom = activeCategories[0].effective_from;
        return activeCategories
            .filter((category) => category.effective_from.getTime() === latestEffectiveFrom.getTime())
            .map((category) => ({
            id: category.id,
            code: category.code,
        }));
    }
    const latestCategory = await db_1.prisma.category.findFirst({
        orderBy: { effective_from: "desc" },
    });
    if (!latestCategory)
        return [];
    const latestBlock = await db_1.prisma.category.findMany({
        where: {
            effective_from: latestCategory.effective_from,
        },
        orderBy: { max_annual_income: "asc" },
    });
    return latestBlock.map((category) => ({
        id: category.id,
        code: category.code,
    }));
};
exports.getCurrentCategories = getCurrentCategories;

// ─── Inventory Service ────────────────────────────────────────────────────────
import prisma from '../../config/database.js';

// ── Products ──────────────────────────────────────────────────────────────────

export const listProducts = async () => {
    const products = await prisma.product.findMany({
        where: { active: true },
        include: { lots: true },
        orderBy: { name: 'asc' },
    });

    return products.map(p => {
        const totalStock = p.lots.reduce((sum, l) => sum + l.quantity, 0);
        const now = new Date();
        const in90days = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);
        const lotsExpiringSoon = p.lots.filter(l => l.expiryDate && l.expiryDate < in90days);
        const lotsFefo = [...p.lots].sort((a, b) => {
            if (!a.expiryDate) return 1;
            if (!b.expiryDate) return -1;
            return a.expiryDate.getTime() - b.expiryDate.getTime();
        });

        return {
            id: p.id,
            name: p.name,
            sku: p.sku,
            category: p.category,
            minReorder: p.minReorder,
            stockTotal: totalStock,
            isLowStock: totalStock <= p.minReorder,
            lotsExpiringSoon: lotsExpiringSoon.length,
            lots: lotsFefo.map(l => ({
                id: l.id,
                lotNumber: l.lotNumber,
                expiryDate: l.expiryDate?.toISOString().split('T')[0] ?? null,
                quantity: l.quantity,
                location: l.location,
                status: l.status,
            })),
        };
    });
};

export const createProduct = async (data: {
    name: string;
    sku: string;
    category: string;
    minReorder: number;
}) => {
    return prisma.product.create({ data });
};

export const updateProduct = async (id: string, data: Partial<{
    name: string;
    sku: string;
    category: string;
    minReorder: number;
    active: boolean;
}>) => {
    return prisma.product.update({ where: { id }, data });
};

// ── Lots ──────────────────────────────────────────────────────────────────────

export const addLot = async (data: {
    productId: string;
    lotNumber: string;
    expiryDate?: string;
    quantity: number;
    location?: string;
}) => {
    const lot = await prisma.lot.create({
        data: {
            productId: data.productId,
            lotNumber: data.lotNumber,
            expiryDate: data.expiryDate ? new Date(data.expiryDate) : undefined,
            quantity: data.quantity,
            location: data.location ?? 'Almacén Central',
        },
    });

    await prisma.stockMovement.create({
        data: {
            productId: data.productId,
            lotId: lot.id,
            type: 'in',
            quantity: data.quantity,
            reason: `Entrada lote ${data.lotNumber}`,
        },
    });

    return lot;
};

// ── Stock movements ───────────────────────────────────────────────────────────

export const adjustStock = async (data: {
    productId: string;
    lotId?: string;
    quantity: number;       // positivo = entrada, negativo = salida
    reason: string;
    userId?: string;
}) => {
    // Actualizar cantidad del lote si se indica
    if (data.lotId && data.quantity !== 0) {
        await prisma.lot.update({
            where: { id: data.lotId },
            data: { quantity: { increment: data.quantity } },
        });
    }

    return prisma.stockMovement.create({
        data: {
            productId: data.productId,
            lotId: data.lotId,
            type: data.quantity > 0 ? 'in' : 'out',
            quantity: Math.abs(data.quantity),
            reason: data.reason,
            userId: data.userId,
        },
    });
};

export const listMovements = async (productId?: string) => {
    return prisma.stockMovement.findMany({
        where: productId ? { productId } : undefined,
        include: { product: { select: { name: true, sku: true } } },
        orderBy: { createdAt: 'desc' },
        take: 200,
    });
};

// ── Stats / KPIs ──────────────────────────────────────────────────────────────

export const getStats = async () => {
    const products = await prisma.product.findMany({
        where: { active: true },
        include: { lots: true },
    });

    const now = new Date();
    const in90days = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);

    const allLots = products.flatMap(p => p.lots);
    const lowStock = products.filter(p => {
        const total = p.lots.reduce((s, l) => s + l.quantity, 0);
        return total <= p.minReorder;
    });
    const expiringSoon = allLots.filter(l => l.expiryDate && l.expiryDate < in90days);

    return {
        totalProducts: products.length,
        lowStockCount: lowStock.length,
        expiringSoonCount: expiringSoon.length,
        totalLots: allLots.length,
    };
};

// ── AI Pre-order ──────────────────────────────────────────────────────────────

export const generatePreOrder = async () => {
    const products = await prisma.product.findMany({
        where: { active: true },
        include: { lots: true },
    });

    const critical = products
        .map(p => {
            const stock = p.lots.reduce((s, l) => s + l.quantity, 0);
            return { ...p, stockTotal: stock };
        })
        .filter(p => p.stockTotal <= p.minReorder)
        .map(p => ({
            id: p.id,
            name: p.name,
            sku: p.sku,
            category: p.category,
            stockActual: p.stockTotal,
            minReorder: p.minReorder,
            suggested: Math.max(p.minReorder * 3 - p.stockTotal, 1),
        }));

    return { critical, generatedAt: new Date().toISOString() };
};

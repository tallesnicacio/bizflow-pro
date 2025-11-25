'use server';

import { prisma } from './prisma';
import { revalidatePath } from 'next/cache';
import { convertDecimalToNumber } from './decimal-utils';
import { requireAuth, validateTenantAccess } from './auth-helpers';

// ============= SUPPLIER ACTIONS =============

export async function getSuppliers() {
    const { tenantId } = await requireAuth();

    const suppliers = await prisma.supplier.findMany({
        where: { tenantId },
        orderBy: { name: 'asc' },
    });
    return suppliers;
}

export async function createSupplier(data: {
    name: string;
    code?: string;
    email?: string;
    phone?: string;
    address?: string;
    country?: string;
    currency?: string;
}) {
    const { tenantId } = await requireAuth();

    const supplier = await prisma.supplier.create({
        data: {
            ...data,
            tenantId,
        },
    });
    revalidatePath('/purchasing/suppliers');
    return supplier;
}

// ============= PURCHASE ORDER ACTIONS =============

export async function getPurchaseOrders() {
    const { tenantId } = await requireAuth();

    const orders = await prisma.purchaseOrder.findMany({
        where: { tenantId },
        include: {
            supplier: true,
            container: true,
            items: true,
        },
        orderBy: { createdAt: 'desc' },
    });

    return orders.map(order => ({
        ...order,
        totalAmount: convertDecimalToNumber(order.totalAmount),
        items: order.items.map(item => ({
            ...item,
            unitPrice: convertDecimalToNumber(item.unitPrice),
            totalPrice: convertDecimalToNumber(item.totalPrice),
        })),
    }));
}

export async function createPurchaseOrder(data: {
    number: string;
    supplierId: string;
    currency?: string;
    items: Array<{
        description: string;
        quantity: number;
        unitPrice: number;
    }>;
}) {
    const { tenantId } = await requireAuth();

    // Validate supplier belongs to tenant
    const supplier = await prisma.supplier.findUnique({
        where: { id: data.supplierId },
        select: { tenantId: true },
    });

    if (!supplier) {
        throw new Error('Supplier not found');
    }

    validateTenantAccess(supplier.tenantId, tenantId);

    const totalAmount = data.items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);

    const order = await prisma.purchaseOrder.create({
        data: {
            number: data.number,
            supplierId: data.supplierId,
            currency: data.currency || 'USD',
            tenantId,
            totalAmount,
            items: {
                create: data.items.map(item => ({
                    description: item.description,
                    quantity: item.quantity,
                    unitPrice: item.unitPrice,
                    totalPrice: item.quantity * item.unitPrice,
                })),
            },
        },
    });

    revalidatePath('/purchasing/orders');
    return order;
}

// ============= CONTAINER ACTIONS =============

export async function getContainers() {
    const { tenantId } = await requireAuth();

    const containers = await prisma.container.findMany({
        where: { tenantId },
        include: {
            purchaseOrders: {
                include: {
                    supplier: true,
                    items: true,
                },
            },
        },
        orderBy: { createdAt: 'desc' },
    });

    return containers.map(container => ({
        ...container,
        freightCost: convertDecimalToNumber(container.freightCost),
        customsCost: convertDecimalToNumber(container.customsCost),
        truckingCost: convertDecimalToNumber(container.truckingCost),
        otherCosts: convertDecimalToNumber(container.otherCosts),
        totalLandedCost: convertDecimalToNumber(container.totalLandedCost),
    }));
}

export async function createContainer(data: {
    number: string;
    etd?: Date;
    eta?: Date;
}) {
    const { tenantId } = await requireAuth();

    const container = await prisma.container.create({
        data: {
            number: data.number,
            etd: data.etd,
            eta: data.eta,
            tenantId,
            status: 'PLANNED',
        },
    });
    revalidatePath('/purchasing/containers');
    return container;
}

export async function addPOToContainer(containerId: string, purchaseOrderId: string) {
    const { tenantId } = await requireAuth();

    // Validate container belongs to tenant
    const container = await prisma.container.findUnique({
        where: { id: containerId },
        select: { tenantId: true },
    });

    if (!container) {
        throw new Error('Container not found');
    }

    validateTenantAccess(container.tenantId, tenantId);

    // Validate purchase order belongs to tenant
    const purchaseOrder = await prisma.purchaseOrder.findUnique({
        where: { id: purchaseOrderId },
        select: { tenantId: true },
    });

    if (!purchaseOrder) {
        throw new Error('Purchase order not found');
    }

    validateTenantAccess(purchaseOrder.tenantId, tenantId);

    const order = await prisma.purchaseOrder.update({
        where: { id: purchaseOrderId },
        data: { containerId },
    });
    revalidatePath('/purchasing/containers');
    return order;
}

export async function updateContainerCosts(containerId: string, costs: {
    freightCost?: number;
    customsCost?: number;
    truckingCost?: number;
    otherCosts?: number;
}) {
    const { tenantId } = await requireAuth();

    // Validate container belongs to tenant
    const existingContainer = await prisma.container.findUnique({
        where: { id: containerId },
        select: { tenantId: true },
    });

    if (!existingContainer) {
        throw new Error('Container not found');
    }

    validateTenantAccess(existingContainer.tenantId, tenantId);

    const container = await prisma.container.update({
        where: { id: containerId },
        data: costs,
    });
    revalidatePath('/purchasing/containers');
    return container;
}

// ============= RECEIVING LOGIC =============

export async function receiveContainer(containerId: string) {
    const { tenantId } = await requireAuth();

    // 1. Get Container with POs and Items
    const container = await prisma.container.findUnique({
        where: { id: containerId },
        include: {
            purchaseOrders: {
                include: {
                    items: true,
                },
            },
        },
    });

    if (!container) throw new Error('Container not found');

    // Validate container belongs to tenant
    validateTenantAccess(container.tenantId, tenantId);

    if (container.status === 'RECEIVED') throw new Error('Container already received');

    // 2. Calculate Total Value of Goods
    let totalGoodsValue = 0;
    const allItems: any[] = [];

    container.purchaseOrders.forEach(po => {
        po.items.forEach(item => {
            if (!item.received) {
                const itemTotal = Number(item.totalPrice);
                totalGoodsValue += itemTotal;
                allItems.push({ ...item, poNumber: po.number });
            }
        });
    });

    if (totalGoodsValue === 0) throw new Error('No items to receive or total value is 0');

    // 3. Calculate Total Landed Costs
    const totalCosts =
        Number(container.freightCost) +
        Number(container.customsCost) +
        Number(container.truckingCost) +
        Number(container.otherCosts);

    // 4. Create Inventory Items with Landed Cost
    const createdProducts = [];

    for (const item of allItems) {
        const itemValue = Number(item.totalPrice);
        const costRatio = itemValue / totalGoodsValue;
        const allocatedCost = totalCosts * costRatio;
        const totalItemCost = itemValue + allocatedCost;
        const unitCost = totalItemCost / item.quantity;

        // Create Product in Inventory (Simplified: assuming each PO Item is a Product)
        // In a real scenario, we might match existing SKUs
        const product = await prisma.product.create({
            data: {
                sku: `${item.poNumber}-${item.description.substring(0, 3).toUpperCase()}-${Date.now()}`,
                name: item.description,
                description: `Imported from PO ${item.poNumber} in Container ${container.number}`,
                price: unitCost * 1.5, // Set selling price with markup (e.g. 50%)
                stock: item.quantity,
                tenantId: container.tenantId,
            },
        });

        // Mark PO Item as received
        await prisma.purchaseOrderItem.update({
            where: { id: item.id },
            data: { received: true },
        });

        createdProducts.push(product);
    }

    // 5. Update Container Status
    await prisma.container.update({
        where: { id: containerId },
        data: {
            status: 'RECEIVED',
            arrivalDate: new Date(),
            totalLandedCost: totalCosts,
        },
    });

    // 6. Update PO Statuses
    for (const po of container.purchaseOrders) {
        await prisma.purchaseOrder.update({
            where: { id: po.id },
            data: { status: 'COMPLETED' },
        });
    }

    revalidatePath('/purchasing/containers');
    revalidatePath('/inventory');

    return { success: true, productsCreated: createdProducts.length };
}

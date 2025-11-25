'use server';

import { prisma } from './prisma';
import { convertDecimalToNumber } from './decimal-utils';
import { requireAuth } from './auth-helpers';

export async function getDashboardStats() {
    const { tenantId } = await requireAuth();

    const [
        totalRevenue,
        activeOrders,
        lowStockCount,
        newLeads
    ] = await Promise.all([
        // 1. Total Revenue (Sum of completed orders)
        prisma.order.aggregate({
            where: { tenantId, status: 'COMPLETED' },
            _sum: { total: true }
        }),
        // 2. Active Orders (Pending)
        prisma.order.count({
            where: { tenantId, status: 'PENDING' }
        }),
        // 3. Low Stock Items (< 10)
        prisma.product.count({
            where: { tenantId, stock: { lt: 10 } }
        }),
        // 4. New Leads (Created in last 30 days)
        prisma.contact.count({
            where: {
                tenantId,
                stage: 'LEAD',
                createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
            }
        })
    ]);

    return {
        revenue: Number(totalRevenue._sum.total || 0),
        activeOrders,
        lowStockCount,
        newLeads
    };
}

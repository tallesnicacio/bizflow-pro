'use server';

import { prisma } from './prisma';
import { auth } from '@/auth';

export async function getDashboardStats() {
    const session = await auth();
    if (!session?.user?.tenantId) return null;
    const tenantId = session.user.tenantId;

    // 1. Total Revenue (Current Month)
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const orders = await prisma.order.findMany({
        where: {
            tenantId,
            createdAt: { gte: startOfMonth },
            status: { not: 'CANCELLED' }
        },
        select: { total: true }
    });

    const revenue = orders.reduce((acc, order) => acc + Number(order.total), 0);

    // 2. Active Leads (Open Opportunities)
    const activeLeads = await prisma.opportunity.count({
        where: {
            tenantId,
            status: 'OPEN'
        }
    });

    // 3. Pending Jobs (Fabrication)
    const pendingJobs = await prisma.job.count({
        where: {
            tenantId,
            status: { in: ['PENDING', 'IN_PROGRESS'] }
        }
    });

    // 4. Inventory Value (Available Slabs)
    // Note: This is an approximation. Ideally we'd sum (slab area * price).
    // For now, let's sum the price of Products * Stock, but since we have Slabs, 
    // let's try to be more accurate if possible, or stick to a simple metric.
    // Let's use Product price * stock for simplicity and speed.

    const products = await prisma.product.findMany({
        where: { tenantId },
        select: { price: true, stock: true }
    });

    const inventoryValue = products.reduce((acc, product) => {
        return acc + (Number(product.price) * product.stock);
    }, 0);

    return {
        revenue,
        activeLeads,
        pendingJobs,
        inventoryValue
    };
}

export async function getRecentActivity() {
    const session = await auth();
    if (!session?.user?.tenantId) return [];
    const tenantId = session.user.tenantId;

    // Fetch recent orders
    const recentOrders = await prisma.order.findMany({
        where: { tenantId },
        orderBy: { createdAt: 'desc' },
        take: 5,
        include: { contact: true }
    });

    // Fetch recent contacts
    const recentContacts = await prisma.contact.findMany({
        where: { tenantId },
        orderBy: { createdAt: 'desc' },
        take: 5
    });

    // Combine and sort
    const activity = [
        ...recentOrders.map(o => ({
            id: o.id,
            type: 'ORDER',
            title: `Novo Pedido #${o.id.slice(-4)}`,
            description: `${o.customerName || 'Cliente'} - $${Number(o.total).toFixed(2)}`,
            date: o.createdAt,
        })),
        ...recentContacts.map(c => ({
            id: c.id,
            type: 'CONTACT',
            title: `Novo Lead: ${c.name}`,
            description: c.email,
            date: c.createdAt,
        }))
    ].sort((a, b) => b.date.getTime() - a.date.getTime()).slice(0, 5);

    return activity;
}

export async function getRevenueHistory() {
    const session = await auth();
    if (!session?.user?.tenantId) return [];
    const tenantId = session.user.tenantId;

    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
    sixMonthsAgo.setDate(1); // Start of that month

    const orders = await prisma.order.findMany({
        where: {
            tenantId,
            createdAt: { gte: sixMonthsAgo },
            status: { not: 'CANCELLED' }
        },
        select: {
            total: true,
            createdAt: true
        }
    });

    // Group by month
    const monthlyRevenue = new Map<string, number>();

    // Initialize last 6 months with 0
    for (let i = 0; i < 6; i++) {
        const d = new Date();
        d.setMonth(d.getMonth() - i);
        const key = d.toLocaleString('default', { month: 'short' });
        monthlyRevenue.set(key, 0);
    }

    orders.forEach(order => {
        const month = order.createdAt.toLocaleString('default', { month: 'short' });
        const current = monthlyRevenue.get(month) || 0;
        monthlyRevenue.set(month, current + Number(order.total));
    });

    // Convert to array and reverse to show chronological order
    return Array.from(monthlyRevenue.entries())
        .map(([name, value]) => ({ name, value }))
        .reverse();
}

export async function getPipelineFunnel() {
    const session = await auth();
    if (!session?.user?.tenantId) return [];
    const tenantId = session.user.tenantId;

    // Get all stages first to ensure order
    const pipelines = await prisma.pipeline.findFirst({
        where: { tenantId },
        include: {
            stages: {
                orderBy: { order: 'asc' },
                include: {
                    _count: {
                        select: { opportunities: true }
                    }
                }
            }
        }
    });

    if (!pipelines) return [];

    return pipelines.stages.map(stage => ({
        name: stage.name,
        value: stage._count.opportunities,
        fill: stage.color || '#8884d8'
    }));
}

'use server';

import { stripe } from './stripe';
import { prisma } from './prisma';
import { auth } from '@/auth';
import { redirect } from 'next/navigation';

export async function createCheckoutSession(orderId: string) {
    const session = await auth();
    if (!session?.user) {
        throw new Error('Unauthorized');
    }

    const order = await prisma.order.findUnique({
        where: { id: orderId },
        include: { items: { include: { product: true } } }
    });

    if (!order) {
        throw new Error('Order not found');
    }

    // Create Stripe Checkout Session
    const checkoutSession = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: order.items.map((item) => ({
            price_data: {
                currency: 'usd',
                product_data: {
                    name: item.product.name,
                },
                unit_amount: Math.round(Number(item.price) * 100), // Cents
            },
            quantity: item.quantity,
        })),
        mode: 'payment',
        success_url: `${process.env.NEXTAUTH_URL}/orders?success=true`,
        cancel_url: `${process.env.NEXTAUTH_URL}/orders?canceled=true`,
        metadata: {
            orderId: order.id,
            tenantId: order.tenantId,
        },
    });

    if (checkoutSession.url) {
        redirect(checkoutSession.url);
    }
}

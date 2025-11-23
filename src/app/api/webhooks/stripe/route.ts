import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { prisma } from '@/lib/prisma';
import Stripe from 'stripe';

export async function POST(req: Request) {
    const body = await req.text();
    const signature = (await headers()).get('Stripe-Signature') as string;

    let event: Stripe.Event;

    try {
        event = stripe.webhooks.constructEvent(
            body,
            signature,
            process.env.STRIPE_WEBHOOK_SECRET!
        );
    } catch (error: any) {
        return new NextResponse(`Webhook Error: ${error.message}`, { status: 400 });
    }

    const session = event.data.object as Stripe.Checkout.Session;

    if (event.type === 'checkout.session.completed') {
        const orderId = session.metadata?.orderId;

        if (orderId) {
            await prisma.order.update({
                where: { id: orderId },
                data: { status: 'COMPLETED' }, // Or PAID if we had that status
            });
            console.log(`[Stripe] Order ${orderId} marked as COMPLETED`);
        }
    }

    return new NextResponse(null, { status: 200 });
}

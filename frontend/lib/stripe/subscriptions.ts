'use server';
import Stripe from 'stripe';
import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { db } from "../db/db";

export async function createSubscriptionCheckout(priceId: string) {
    const session = await auth();
    if (!session?.user) throw new Error('Not authenticated');

    if (!session.user.id) throw new Error('User ID not found');

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
    const user = await db
        .selectFrom('users')
        .select('stripeCustomerId')
        .where('id', '=', Number(session.user.id))
        .executeTakeFirst();

    const checkoutSession = await stripe.checkout.sessions.create({
        mode: 'subscription',
        payment_method_types: ['card'],
        line_items: [{ price: priceId, quantity: 1 }],
        success_url: `${process.env.NEXT_PUBLIC_URL}/d?success=true`,
        cancel_url: `${process.env.NEXT_PUBLIC_URL}/pricing`,

        customer: user?.stripeCustomerId || undefined,
        customer_email: !user?.stripeCustomerId ? session.user.email || undefined : undefined,
        metadata: {
            userId: session.user.id
        },


    });
    //@ts-expect-error description: stripe

    redirect(checkoutSession.url)

}
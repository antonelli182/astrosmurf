'use server';

import { auth } from "@/auth";
import Stripe from "stripe";
import { db } from "../db/db";
import { redirect } from "next/navigation";

export async function redirectToCustomerPortal() {
    const session = await auth();
    if (!session?.user) throw new Error('Not authenticated');
    const user = await db.selectFrom('users').select('stripeCustomerId').where('id', '=',
        //@ts-expect-error description: stripe

        session.user.id).executeTakeFirst()

    if (!user?.stripeCustomerId) {
        throw new Error('No Stripe customer found');
    }
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
    const portalSession = await stripe.billingPortal.sessions.create({
        customer: user.stripeCustomerId,
        return_url: `${process.env.NEXT_PUBLIC_URL}/d`
    });

    redirect(portalSession.url)
}
'use server'

import Stripe from 'stripe';
import { redirect } from 'next/navigation';
import { auth } from '@/auth';

export async function createCheckoutSession(priceId: string) {
    const session = await auth()
    if (!session?.user) {
        redirect("/")
    }

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
        apiVersion: '2025-09-30.clover',
    })

    const checkoutSession = await stripe.checkout.sessions.create({
        //@ts-expect-error description: stripe
        mode: "payment",
        payment_method_types: ['card', 'wechat_pay'],
        payment_method_options: {
            "wechat_pay": {
                "client": "web"
            }
        },
        line_items: [
            {
                price: priceId,
                quantity: 1
            }
        ],
        success_url: `${process.env.NEXT_PUBLIC_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${process.env.NEXT_PUBLIC_URL}/pricing`,
        //IMPORTANT
        metadata: {
            userId: session.user.id,
            userEmail: session.user.email
        },
        customer_email: session.user.email
    })

    redirect(checkoutSession.url!)
}
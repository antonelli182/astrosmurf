import { db } from "@/lib/db/db";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import Stripe from "stripe";
import { sql } from "kysely";

// Initialize Stripe lazily to avoid build-time errors
function getStripe() {
    return new Stripe(process.env.STRIPE_SECRET_KEY!)
}

function getWebhookSecret() {
    return process.env.STRIPE_WEBHOOK_SECRET!
}

export async function POST(req: Request) {
    const body = await req.text();
    const signature = (await headers()).get('stripe-signature')
    let event: Stripe.Event

    const stripe = getStripe()
    const webhookSecret = getWebhookSecret()

    try {
        event = stripe.webhooks.constructEvent(body, signature!, webhookSecret)
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        console.error(' Webhook signature verification failed:', message)
        return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
    }

    console.log('verified event:', event.type)

    try {
        switch (event.type) {
            case 'checkout.session.completed':
                if (event.data.object.mode === 'payment') {
                    await handleOneTimePayment(event.data.object)
                } else if (event.data.object.mode === 'subscription') {
                    await handleSubscriptionCreated(event.data.object)
                }
                break
            case 'customer.subscription.created':
                await handleSubscriptionChange(event.data.object);
                break
            case 'customer.subscription.deleted':
                await handleSubscriptionCanceled(event.data.object);
                break

        }
    } catch (error) {
        console.error('Error processing webhook event:', error);
    }
    return NextResponse.json({ received: true })
}



async function handleOneTimePayment(session: Stripe.Checkout.Session) {
    const { userId } = session.metadata!;

    const existingPurchase = await db.selectFrom('credit_purchases').selectAll().where('stripe_session_id', '=', session.id).executeTakeFirst()
    if (existingPurchase?.status === 'COMPLETED') {
        console.log('Already Processed', session.id)
        return
    }
    if (session.metadata?.credits) {
        const credits = parseInt(session.metadata.credits);
        const builder = db.transaction()
        await builder.execute(async (tx) => {
            tx.updateTable('users').set((eb) => ({ credits: eb('credits', '+', credits) })).where('stripeCustomerId', '=', userId)
            tx.insertInto('credit_purchases').values({ user_id: Number(userId), stripe_session_id: session.id, stripe_payment_intent_id: session.payment_intent as string, credits, amount: session.amount_total!, status: 'COMPLETED' })
        })
        console.log(`✅ Added ${credits} credits to user ${userId}`);
    }
    //confirmation email, grant access, etc
}

async function handleSubscriptionCreated(session: Stripe.Checkout.Session) {
    const { userId } = session.metadata!;
    const subscriptionId = session.subscription as string;

    const stripe = getStripe()
    const subscription = await stripe.subscriptions.retrieve(subscriptionId)

    await db.insertInto('subscriptions')
        .values({
            user_id: Number(userId),
            stripe_subscription_id: subscription.id,
            stripe_price_id: subscription.items.data[0].price.id,
            stripe_current_period_end: new Date(subscription.items.data[0].current_period_end * 1000),
            status: subscription.status
        }).onConflict((oc) =>
            oc.column('user_id').doUpdateSet({
                stripe_subscription_id: subscription.id,
                stripe_price_id: subscription.items.data[0].price.id,
                stripe_current_period_end: new Date(subscription.items.data[0].current_period_end * 1000),
                status: subscription.status,
                updated_at: sql`now()`
            })
        ).execute()

    await db.updateTable('users').set({
        "stripeCustomerId": subscription.customer as string
        //@ts-expect-error description: stripe

    }).where('id', '=', userId).execute()
    console.log(`subscription created for user ${userId}`)
}

export async function handleSubscriptionChange(subscription: Stripe.Subscription) {
    await db
        .updateTable('subscriptions')
        .set({
            stripe_price_id: subscription.items.data[0].price.id,
            status: subscription.status,
            stripe_current_period_end: new Date(subscription.items.data[0].current_period_end * 1000),
            updated_at: sql`now()`,
        })
        .where('stripe_subscription_id', '=', subscription.id)
        .execute();

    console.log(`✅ Subscription updated: ${subscription.id}`);
}

export async function handleSubscriptionCanceled(subscription: Stripe.Subscription) {
    await db
        .updateTable('subscriptions')
        .set({ status: 'canceled', updated_at: sql`now()` })
        .where('stripe_subscription_id', '=', subscription.id)
        .execute();

    console.log(`✅ Subscription canceled: ${subscription.id}`);
}

export async function handleInvoicePaid(invoice: Stripe.Invoice) {
    //@ts-expect-error description: stripe

    const subscriptionId = invoice.subscription as string;

    await db
        .updateTable('subscriptions')
        .set({
            stripe_current_period_end: new Date(invoice.period_end * 1000),
            status: 'active',
            updated_at: sql`now()`,
        })
        .where('stripe_subscription_id', '=', subscriptionId)
        .execute();

    console.log(`✅ Invoice paid for subscription: ${subscriptionId}`);
}



export async function handlePaymentFailed(invoice: Stripe.Invoice) {
    //@ts-expect-error description: stripe

    const subscriptionId = invoice.subscription as string;

    await db
        .updateTable('subscriptions')
        .set({ status: 'past_due', updated_at: sql`now()` })
        .where('stripe_subscription_id', '=', subscriptionId)
        .execute();

    console.log(`❌ Payment failed for subscription: ${subscriptionId}`);
}
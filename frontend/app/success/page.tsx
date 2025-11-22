import { redirect } from "next/navigation";
import Link from "next/link";
import Stripe from "stripe";

async function SuccessPage({ searchParams }: {
    searchParams: { session_id?: string }
}) {
    if (!searchParams.session_id) {
        redirect("/")
    }
    
    // Initialize Stripe inside the function to avoid build-time errors
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)
    const session = await stripe.checkout.sessions.retrieve(searchParams.session_id)

    if (session.payment_status !== 'paid') {
        redirect('/pricing');
    }
    return (
        <div className="max-w-2xl mx-auto p-8">
            <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                <h1 className="text-2xl font-bold text-green-900 mb-2">
                    🎉 Payment Successful!
                </h1>
                <p className="text-green-800">
                    Thank you for your purchase, {session.customer_details?.email}
                </p>
                <p className="text-sm text-green-700 mt-2">
                    Order ID: {session.id}
                </p>
            </div>

            <div className="mt-6">
                <Link href="/d" className="text-blue-600 hover:underline">
                    Go to Dashboard →
                </Link>
            </div>
        </div>
    );
}

export default SuccessPage;
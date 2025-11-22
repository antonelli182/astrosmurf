import { auth } from '@/auth';
import { db } from '@/lib/db/db';
import { redirect } from 'next/navigation';
import Link from 'next/link';

export default async function DashboardPage() {
    const session = await auth();
    if (!session) redirect('/login');

    const user = await db.selectFrom('users')
        .leftJoin('subscriptions', "subscriptions.user_id", 'users.id')
        .selectAll()
        //@ts-expect-error description: stripe

        .where('users.id', '=', session.user.id)
        .executeTakeFirst()

    const hasActiveSubscription =
        //@ts-expect-error description: stripe

        user?.subscription?.status === 'active' &&
        //@ts-expect-error description: stripe

        new Date(user.subscription.stripeCurrentPeriodEnd) > new Date();

    return (
        <div>
            <h1>Dashboard</h1>

            {hasActiveSubscription ? (
                <div className="bg-green-50 p-4 rounded">
                    <p>✅ Premium Member</p>
                    <p className="text-sm">

                        Renews on {
                            //@ts-expect-error description: stripe

                            new Date(user.subscription.stripeCurrentPeriodEnd).toLocaleDateString()}
                    </p>
                </div>
            ) : (
                <div className="bg-gray-50 p-4 rounded">
                    <p>Free Plan</p>
                    <Link href="/pricing" className="text-blue-600">
                        Upgrade to Premium →
                    </Link>
                </div>
            )}
        </div>
    );
}
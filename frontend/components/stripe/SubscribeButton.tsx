import { Button } from "../ui/button";
import { createSubscriptionCheckout } from "@/lib/stripe/subscriptions";

function SubscribeButton({ priceId, label = "Buy Now" }: { priceId: string, label?: string }) {
    return (
        <form action={createSubscriptionCheckout.bind(null, priceId)}>
            <Button
                type="submit">
                {label}
            </Button>
        </form>
    );
}

export default SubscribeButton;
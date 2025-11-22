import Image from "next/image";
import Logo from "@/public/logo_black.svg"
import { ChevronLeft } from "lucide-react";
import SignOutButton from "@/components/auth/SignOutButton";
function DasboardPage() {
    return (
        <div className="w-full flex">
            <div className="w-full max-w-2xl mx-auto flex flex-col gap-2 p-4 items-center rounded-xl border">
                <Image src={Logo} alt="Align Arena Logo" className="w-20 h-20" />
                <h1 className="text-xl font-semibold">Thanks for signing up!</h1>
                <p className="text-gray-700">Insight is open to select beta users at this time. We&apos;ll notify you when your account has been enabled.</p>
                <a href="https://alignarena.com/insight" className="underline text-gray-700 flex gap-2 items-center"><ChevronLeft /> Back</a>
                <SignOutButton />
            </div>
        </div>
    );
}

export default DasboardPage;
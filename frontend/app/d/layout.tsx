import { auth } from "@/auth";
import { redirect } from "next/navigation";
import React from "react";
import Link from "next/link";
import SignOutButton from "@/components/auth/SignOutButton";

async function DashboardLayoutPage({ children }: { children: React.ReactNode }) {
    const session = await auth()
    if (!session?.user) {
        redirect("/")
    }
    return (
        <div className="flex h-screen">
            <aside className="w-64 bg-gray-900 text-white flex flex-col">
                <nav className="flex-1 p-4 space-y-2">
                    <Link
                        href="/d/images"
                        className="block px-4 py-2 rounded hover:bg-gray-800 transition-colors"
                    >
                        Images
                    </Link>
                    <Link
                        href="/d/articles"
                        className="block px-4 py-2 rounded hover:bg-gray-800 transition-colors"
                    >
                        Articles
                    </Link>
                </nav>
                <div className="p-4">
                    <SignOutButton />
                </div>
            </aside>
            <main className="flex-1 overflow-auto">
                {children}
            </main>
        </div>
    );
}

export default DashboardLayoutPage;
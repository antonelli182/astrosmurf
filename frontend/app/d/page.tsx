import { GenerationForm } from "@/components/generation-form"
import { fetchAllPersonas } from "@/lib/db/actions"
import Image from "next/image"

export default async function LandingPage() {
  const personas = await fetchAllPersonas()
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-4 md:p-8 relative overflow-hidden">

      <div className="w-full max-w-4xl space-y-12 relative z-10 flex flex-col items-center">

        {/* Header */}
        <div className="flex flex-col items-center text-center space-y-6">
          <div className="relative w-128 h-48 md:w-[40rem] md:h-64">
            <Image
              src="/logo_transparent.png"
              alt="Insight Logo"
              fill
              className="object-contain"
              priority
            />
          </div>
          <div className="space-y-2 max-w-xl">
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-white/60">
              Amplify Ideas
            </h1>
            <p className="text-lg text-muted-foreground">
              Transform any content into visual synthesis.
              Create memes, comics, or simplified summaries instantly.
            </p>
          </div>
        </div>

        {/* Main Content */}
        <div className="w-full max-w-2xl">
          {/*@ts-expect-error description: personas date format weird */}
          <GenerationForm personas={personas} />
        </div>

        {/* Footer */}
        <div className="text-center text-sm text-muted-foreground/50 pt-8">
          <p>© 2025 Astrosmurf FLUX. All rights reserved.</p>
        </div>

      </div>
    </main>
  )
}

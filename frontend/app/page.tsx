import { GenerationForm } from "@/components/generation-form"

export default function LandingPage() {
  return (
    <main className="min-h-screen p-4 md:p-8 font-mono flex flex-col items-center">
      <div className="w-full max-w-4xl space-y-8">
        
        {/* Terminal Header */}
        <div className="border-b-2 border-primary pb-4">
          <div className="flex justify-between items-center mb-2 text-xs md:text-sm opacity-70">
            <span>SESSION_ID: #99284</span>
            <span>STATUS: ONLINE</span>
          </div>
          <pre className="text-[10px] md:text-xs leading-[1] whitespace-pre font-bold text-primary overflow-x-hidden">
{`
  ___ _  _ ___ ___ ___ _  _ _____ 
 |_ _| \\| / __|_ _/ __| || |_   _|
  | || .\` \\\\__ \\\\| | (_ | __ | | |  
 |___|_|\\\\_|___/___\\\\___|_||_| |_|  
`}
          </pre>
          <p className="mt-4 text-sm md:text-base typing-cursor inline-block">
            &gt; SYSTEM_READY...
          </p>
        </div>

        {/* Main Content */}
        <div className="grid gap-8">
          <div className="border-l-2 border-primary pl-4 space-y-2">
            <h1 className="text-lg font-bold bg-primary text-black inline-block px-2">
              MISSION_OBJECTIVE
            </h1>
            <p className="text-sm md:text-base max-w-2xl opacity-80">
              &gt; INPUT: CONTENT_URL
              <br />
              &gt; OUTPUT: VISUAL_SYNTHESIS [MEME/COMIC/SIMPLIFY]
            </p>
          </div>

          <GenerationForm />
        </div>

        {/* Footer */}
        <div className="text-center text-xs opacity-50 pt-8 pb-4">
          <p>ASTROSMURF_CORP // v2.0.1</p>
        </div>

      </div>
    </main>
  )
}

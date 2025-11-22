"use client"

import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { scrapeUrlAction, generateConceptsAction, generateImageAction } from "@/app/actions"
import { ScrapedContent, Concept } from "@/lib/mock-ai"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"

type ProcessStatus = "idle" | "scraping" | "synthesizing" | "rendering" | "complete" | "error"

interface ProcessFlowProps {
  category: string
  url: string
}

export function ProcessFlow({ category, url }: ProcessFlowProps) {
  const [status, setStatus] = useState<ProcessStatus>("idle")
  const [progress, setProgress] = useState(0)
  const [scrapedData, setScrapedData] = useState<ScrapedContent | null>(null)
  const [concepts, setConcepts] = useState<Concept[]>([])
  const [error, setError] = useState<string | null>(null)
  const [logs, setLogs] = useState<string[]>([])

  const addLog = (msg: string) => setLogs(prev => [...prev, msg])

  useEffect(() => {
    let mounted = true

    const runProcess = async () => {
      if (status !== "idle") return
      
      try {
        // Step 1: Scraping
        setStatus("scraping")
        setProgress(10)
        addLog(`INIT_SCRAPE: ${new URL(url).hostname}`)
        
        const scraped = await scrapeUrlAction(url)
        if (!mounted) return
        setScrapedData(scraped)
        addLog(`DATA_ACQUIRED: [${scraped.title}]`)
        addLog(`METRICS: ${scraped.wordCount} words`)
        setProgress(40)

        // Step 2: Synthesizing
        setStatus("synthesizing")
        addLog(`ANALYZING_VECTOR: ${category.toUpperCase()}`)
        const generatedConcepts = await generateConceptsAction(category, scraped)
        if (!mounted) return
        setConcepts(generatedConcepts)
        addLog(`CONCEPTS_GENERATED: ${generatedConcepts.length}`)
        setProgress(70)

        // Step 3: Rendering
        setStatus("rendering")
        addLog(`RENDERING_VISUALS...`)
        
        // Generate images in parallel
        const conceptsWithImages = await Promise.all(generatedConcepts.map(async (concept, index) => {
            addLog(`GEN_IMG_[${index}]: "${concept.title}"`)
            const imageUrl = await generateImageAction(concept.prompt)
            return { ...concept, visual: imageUrl }
        }))
        
        if (!mounted) return
        setConcepts(conceptsWithImages)
        addLog(`SEQUENCE_COMPLETE`)
        setProgress(100)
        setStatus("complete")

      } catch (err) {
        console.error(err)
        if (!mounted) return
        setError(err instanceof Error ? err.message : "Unknown Error")
        addLog(`ERR_FATAL: ${err instanceof Error ? err.message : "Unknown"}`)
        setStatus("error")
      }
    }

    runProcess()

    return () => {
      mounted = false
    }
  }, [url, category, status])

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { staggerChildren: 0.2 }
    }
  }

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1 }
  }

  return (
    <div className="w-full max-w-6xl mx-auto p-4 space-y-8">
      {/* Header / Progress Section */}
      <div className="space-y-4">
        <div className="flex justify-between items-center flex-wrap gap-4">
            <div>
              <h2 className="text-2xl font-bold uppercase">PROCESS: {category}</h2>
              <p className="text-muted-foreground mt-1 text-xs font-mono">
                TARGET: {url}
              </p>
            </div>
            <Link href="/">
                <Button variant="outline" size="sm" className="uppercase text-xs">
                  &lt;&lt; ABORT
                </Button>
            </Link>
        </div>
        
        {status !== "complete" && status !== "error" && (
            <div className="space-y-4 bg-background p-6 border-2 border-primary">
                <div className="flex justify-between text-xs uppercase font-bold">
                    <span className="flex items-center gap-2">
                        {status === "scraping" ? "[*]" : status !== "scraping" ? "[X]" : "[ ]"} 
                        <span className={status !== "scraping" ? "opacity-50" : ""}>
                          01_SCRAPING
                        </span>
                    </span>
                     <span className="flex items-center gap-2">
                        {status === "synthesizing" ? "[*]" : (status === "rendering" || status === "complete") ? "[X]" : "[ ]"}
                        <span className={(status === "rendering" || status === "complete") ? "opacity-50" : status === "scraping" ? "opacity-30" : ""}>
                          02_ANALYSIS
                        </span>
                    </span>
                     <span className="flex items-center gap-2">
                        {status === "rendering" ? "[*]" : status === "complete" ? "[X]" : "[ ]"}
                        <span className={status === "complete" ? "opacity-50" : (status === "scraping" || status === "synthesizing") ? "opacity-30" : ""}>
                          03_GENERATION
                        </span>
                    </span>
                </div>
                <Progress value={progress} className="h-2 rounded-none border border-primary bg-transparent" />
                <div className="bg-black border border-primary p-2 text-primary text-[10px] font-mono h-32 overflow-y-auto font-bold leading-tight">
                    {logs.map((log, i) => (
                        <div key={i} className="mb-1">&gt; {log}</div>
                    ))}
                    <div className="animate-pulse">_</div>
                </div>
            </div>
        )}
      </div>

      {/* Results Grid */}
      {status === "complete" && (
        <>
          <div className="border-2 border-primary p-4 flex items-start gap-4">
            <div className="text-primary text-xl font-bold">[ OK ]</div>
            <div className="flex-grow">
              <h3 className="text-base font-bold text-primary mb-1 uppercase">
                &gt;&gt; SEQUENCE_COMPLETE
              </h3>
              <div className="flex gap-4 text-xs text-primary font-mono opacity-80">
                <span>&gt; INPUT: {scrapedData?.wordCount} WORDS</span>
                <span>&gt; OUTPUT: {concepts.length} VECTORS</span>
              </div>
            </div>
          </div>

          <motion.div 
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="grid grid-cols-1 md:grid-cols-3 gap-6"
          >
              {concepts.map((concept, idx) => (
                  <motion.div key={idx} variants={itemVariants}>
                      <Card className="h-full flex flex-col border-2 border-primary border-dashed hover:border-solid transition-all">
                          <div className="relative h-48 bg-black border-b-2 border-primary group overflow-hidden">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img 
                                  src={concept.visual} 
                                  alt={concept.title}
                                  className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity grayscale group-hover:grayscale-0"
                              />
                              <div className="absolute top-2 right-2 bg-black border border-primary text-primary text-[10px] px-1 uppercase font-bold">
                                  {concept.tone}
                              </div>
                              <div className="absolute bottom-2 left-2 bg-black text-primary text-[10px] px-1 font-mono">
                                  #{idx + 1}
                              </div>
                          </div>
                          <CardHeader className="p-4">
                              <CardTitle className="text-base uppercase font-bold truncate">{concept.title}</CardTitle>
                          </CardHeader>
                          <CardContent className="flex-grow space-y-2 p-4 pt-0">
                              <p className="text-xs leading-relaxed font-mono opacity-80 border-l-2 border-primary/50 pl-2">
                                  {concept.description}
                              </p>
                              <details className="bg-black p-2 border border-primary/30 cursor-pointer group open:bg-primary/5">
                                <summary className="text-[10px] font-bold uppercase text-primary/70 select-none group-hover:text-primary flex items-center gap-2">
                                  <span>[+]</span> PROMPT_DATA
                                </summary>
                                <p className="mt-2 text-[10px] text-primary/60 font-mono leading-relaxed">
                                  {concept.prompt}
                                </p>
                              </details>
                          </CardContent>
                           <CardFooter className="flex gap-2 p-4 pt-0">
                               <Button variant="outline" className="flex-1 text-[10px] h-6 uppercase">
                                  SAVE
                               </Button>
                               <Button variant="default" className="flex-1 text-[10px] h-6 uppercase">
                                  SHARE
                               </Button>
                           </CardFooter>
                      </Card>
                  </motion.div>
              ))}
          </motion.div>

          <div className="mt-8 p-4 border-2 border-primary">
            <h3 className="text-base font-bold mb-2 uppercase">&gt;&gt; ALTERNATE_VECTORS</h3>
            <div className="flex flex-wrap gap-2">
              <Link href={`/meme/${encodeURIComponent(url)}`}>
                <Button size="sm" variant={category === 'meme' ? 'secondary' : 'outline'} disabled={category === 'meme'} className="text-xs">
                  &gt; MEME
                </Button>
              </Link>
              <Link href={`/comic/${encodeURIComponent(url)}`}>
                <Button size="sm" variant={category === 'comic' ? 'secondary' : 'outline'} disabled={category === 'comic'} className="text-xs">
                  &gt; COMIC
                </Button>
              </Link>
              <Link href={`/simplify/${encodeURIComponent(url)}`}>
                <Button size="sm" variant={category === 'simplify' ? 'secondary' : 'outline'} disabled={category === 'simplify'} className="text-xs">
                  &gt; SIMPLIFY
                </Button>
              </Link>
            </div>
          </div>
        </>
      )}

      {status === "error" && (
        <div className="border-2 border-destructive p-6 text-destructive">
            <div className="flex items-center gap-4 mb-4">
                <AlertCircle className="w-8 h-8" />
                <h3 className="text-lg font-bold uppercase">&gt;&gt; SYSTEM_ERROR</h3>
            </div>
            <p className="font-mono mb-4 text-sm">CODE: {error}</p>
            <Button variant="destructive" onClick={() => window.location.reload()} className="uppercase font-bold text-xs">
                &gt; REBOOT
            </Button>
        </div>
      )}
    </div>
  )
}

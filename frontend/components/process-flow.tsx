"use client"

import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { generateContentAction } from "@/app/actions"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { AlertCircle, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"

type ProcessStatus = "idle" | "loading" | "complete" | "error"

interface ProcessFlowProps {
  category: string
  url: string
}

interface GenerationResult {
  success: boolean
  article_id: string
  media_id: string
  media_url: string
}

export function ProcessFlow({ category, url }: ProcessFlowProps) {
  const [status, setStatus] = useState<ProcessStatus>("idle")
  const [result, setResult] = useState<GenerationResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true

    const runProcess = async () => {
      if (status !== "idle") return
      
      setStatus("loading")
      
      try {
        console.log("Calling backend with:", { url, category });
        const data = await generateContentAction(url, category)
        
        if (!mounted) return
        
        setResult({
          success: data.success,
          article_id: data.article_id,
          media_id: data.media_id,
          media_url: data.media_url
        })
        setStatus("complete")

      } catch (err) {
        console.error(err)
        if (!mounted) return
        setError(err instanceof Error ? err.message : "Unknown Error")
        setStatus("error")
      }
    }

    runProcess()

    return () => {
      mounted = false
    }
  }, [url, category, status])

  return (
    <div className="w-full max-w-4xl mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary via-blue-400 to-cyan-400 bg-clip-text text-transparent drop-shadow-sm">
            Generation
          </h1>
          <p className="text-muted-foreground mt-1 text-sm break-all">
            {url}
          </p>
        </div>
        <Link href="/">
          <Button variant="outline" size="sm">
            Cancel
          </Button>
        </Link>
      </div>

      {/* Loading State */}
      {status === "loading" && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-4 bg-card border border-border rounded-lg">
              <Loader2 className="w-5 h-5 animate-spin text-primary" />
              <p className="text-lg font-medium text-foreground">
                Generating <span className="font-bold capitalize text-primary">{category}</span> for page{" "}
                <span className="text-primary font-mono text-sm font-semibold">
                  {(() => {
                    try {
                      return new URL(url).hostname;
                    } catch {
                      return url.length > 50 ? `${url.substring(0, 50)}...` : url;
                    }
                  })()}
                </span>
              </p>
            </div>
            
            <div className="space-y-3">
              <Skeleton className="h-64 w-full bg-muted/50" />
              <div className="grid grid-cols-3 gap-4">
                <Skeleton className="h-20 w-full bg-muted/50" />
                <Skeleton className="h-20 w-full bg-muted/50" />
                <Skeleton className="h-20 w-full bg-muted/50" />
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Success State */}
      {status === "complete" && result && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          <div className="rounded-lg border-2 border-green-600 bg-green-950/50 dark:bg-green-950/80 p-4 backdrop-blur-sm">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse shadow-lg shadow-green-500/50" />
              <h2 className="text-lg font-semibold text-green-400 dark:text-green-300">
                Generation Complete
              </h2>
            </div>
            <p className="text-sm text-green-300 dark:text-green-200">
              Successfully generated <span className="font-semibold capitalize text-green-400">{category}</span> content
            </p>
          </div>

          {/* Result Details */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-foreground">Generation Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2 p-3 bg-muted/30 rounded-md border border-border">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Article ID</p>
                  <p className="text-sm font-mono break-all text-foreground bg-background/50 p-2 rounded border border-border">{result.article_id}</p>
                </div>
                <div className="space-y-2 p-3 bg-muted/30 rounded-md border border-border">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Media ID</p>
                  <p className="text-sm font-mono break-all text-foreground bg-background/50 p-2 rounded border border-border">{result.media_id}</p>
                </div>
                <div className="space-y-2 p-3 bg-muted/30 rounded-md border border-border">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Category</p>
                  <p className="text-sm font-semibold capitalize text-primary">{category}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Generated Media */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-foreground">Generated Media</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="relative aspect-video w-full overflow-hidden rounded-lg border-2 border-border bg-muted/20">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={result.media_url}
                  alt={`Generated ${category} content`}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="mt-4">
                <a
                  href={result.media_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm font-medium text-primary hover:text-primary/80 hover:underline transition-colors"
                >
                  View full image →
                </a>
              </div>
            </CardContent>
          </Card>

          {/* Alternate Categories */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-foreground">Try Other Formats</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                <Link href={`/meme/${encodeURIComponent(url)}`}>
                  <Button
                    size="sm"
                    variant={category === "meme" ? "default" : "outline"}
                    disabled={category === "meme"}
                    className="font-medium"
                  >
                    Meme
                  </Button>
                </Link>
                <Link href={`/comic/${encodeURIComponent(url)}`}>
                  <Button
                    size="sm"
                    variant={category === "comic" ? "default" : "outline"}
                    disabled={category === "comic"}
                    className="font-medium"
                  >
                    Comic
                  </Button>
                </Link>
                <Link href={`/simplify/${encodeURIComponent(url)}`}>
                  <Button
                    size="sm"
                    variant={category === "simplify" ? "default" : "outline"}
                    disabled={category === "simplify"}
                    className="font-medium"
                  >
                    Simplify
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Error State */}
      {status === "error" && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-lg border-2 border-destructive bg-destructive/20 dark:bg-destructive/10 p-6 backdrop-blur-sm"
        >
          <div className="flex items-center gap-4 mb-4">
            <AlertCircle className="w-6 h-6 text-destructive" />
            <h3 className="text-lg font-semibold text-destructive">Generation Failed</h3>
          </div>
          <p className="text-sm text-destructive/90 dark:text-destructive-foreground mb-4 font-mono bg-destructive/10 p-3 rounded border border-destructive/30 break-all">{error}</p>
          <div className="flex gap-2">
            <Button variant="destructive" onClick={() => window.location.reload()} className="font-medium">
              Try Again
            </Button>
            <Link href="/">
              <Button variant="outline" className="font-medium">Go Back</Button>
            </Link>
          </div>
        </motion.div>
      )}
    </div>
  )
}

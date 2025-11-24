"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { normalizeUrl, isValidUrl as checkIsValidUrl } from "@/lib/utils"
import { Sparkles, Image as ImageIcon, BookOpen, Zap, ArrowRight, Loader2, Brain } from "lucide-react"
import { cn } from "@/lib/utils"
import { Personas } from "@/lib/db/schema"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

const contentTypes = {
  meme: {
    label: "Meme",
    description: "Create a viral image macro",
    icon: ImageIcon
  },
  comic: {
    label: "Comic",
    description: "Generate sequential art",
    icon: BookOpen
  },
  photorealistic_image: {
    label: "Photorealistic",
    description: "Make photorealistic images",
    icon: Zap
  },
  generate_explanation_video: {
    label: "Generate Explanation Ideas",
    description: "Generate explanation ideas",
    icon: Brain
  }
}

export function GenerationForm({ personas }: { personas: Personas[] }) {
  const router = useRouter()
  const [url, setUrl] = useState("")
  const [category, setCategory] = useState<"meme" | "comic" | "photorealistic image" | string>("meme")
  const [personaId, setPersonaId] = useState<string>("")
  const [isValidUrl, setIsValidUrl] = useState(true)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newUrl = e.target.value
    setUrl(newUrl)
    if (newUrl) {
      setIsValidUrl(checkIsValidUrl(newUrl))
    } else {
      setIsValidUrl(true)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!url || !isValidUrl) return

    setIsLoading(true)
    setError(null)

    try {
      const normalized = normalizeUrl(url)
      
      // Determine which endpoint to use based on category
      const endpoint = category === "generate_explanation_video" 
        ? `${process.env.NEXT_PUBLIC_BACKEND_URL}/manim`
        : `${process.env.NEXT_PUBLIC_BACKEND_URL}/generate`
      
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          link: normalized,
          style: category,
          persona_id: personaId ? parseInt(personaId) : null
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to generate content")
      }

      const data = await response.json()
      router.push("/d/articles")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong")
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <Card className="w-full border-border/50 bg-card/50 backdrop-blur-sm shadow-xl">
        <CardContent className="pt-6">
          <div className="flex flex-col items-center justify-center py-12 space-y-4">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <h3 className="text-lg font-semibold">Generating Content</h3>
            <p className="text-sm text-muted-foreground">This may take a few moments...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full border-border/50 bg-card/50 backdrop-blur-sm shadow-xl">
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="space-y-3">
            <Label htmlFor="url" className="text-sm font-medium text-foreground/80">
              Source Content
            </Label>
            <div className="relative">
              <Input
                id="url"
                type="text"
                placeholder="Paste article or video URL here..."
                value={url}
                onChange={handleUrlChange}
                className={cn(
                  "h-12 text-base bg-background/50 border-input transition-colors",
                  !isValidUrl && "border-destructive focus-visible:ring-destructive"
                )}
                required
                autoComplete="off"
              />
              {!isValidUrl && (
                <p className="absolute -bottom-5 left-0 text-xs text-destructive">Please enter a valid URL</p>
              )}
            </div>
          </div>

          {/* <div className="space-y-3">
            <Label htmlFor="persona" className="text-sm font-medium text-foreground/80">
              Persona (Optional)
            </Label>
            <Select value={personaId} onValueChange={setPersonaId}>
              <SelectTrigger className="h-12 text-base bg-background/50">
                <SelectValue placeholder="Select a persona (optional)" />
              </SelectTrigger>
              <SelectContent>
                {personas.map((persona) => (
                  //@ts-expect-error description: persona id weird
                  <SelectItem key={persona.id} value={persona.id.toString()}>
                    <div className="flex items-center gap-2">
                      <span>{persona.name}</span>
                      {persona.description && (
                        <span className="text-xs text-muted-foreground truncate max-w-[200px]">
                          - {persona.description}
                        </span>
                      )}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div> */}

          <div className="space-y-3">
            <Label className="text-sm font-medium text-foreground/80">Output Format</Label>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {Object.entries(contentTypes).map(([key, { label, description, icon: Icon }]) => (
                <div
                  key={key}
                  onClick={() => setCategory(key)}
                  className={cn(
                    "cursor-pointer rounded-xl border-2 p-4 transition-all hover:bg-accent/50",
                    category === key
                      ? "border-primary bg-primary/10 ring-1 ring-primary/20"
                      : "border-border/50 bg-background/20 opacity-70 hover:opacity-100 hover:border-primary/50"
                  )}
                >
                  <div className="flex flex-col items-center text-center space-y-2">
                    <div className={cn(
                      "p-2 rounded-full",
                      category === key ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"
                    )}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="font-semibold text-sm">{label}</div>
                      <div className="text-xs text-muted-foreground mt-1">{description}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {error && (
            <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}

          <Button
            type="submit"
            className="w-full h-12 text-base font-medium shadow-lg shadow-primary/20 transition-all hover:shadow-primary/40"
            disabled={!url || !isValidUrl || isLoading}
            size="lg"
          >
            <Sparkles className="mr-2 h-4 w-4" />
            Generate Content
            <ArrowRight className="ml-2 h-4 w-4 opacity-50" />
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}

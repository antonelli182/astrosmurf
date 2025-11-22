"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { normalizeUrl, isValidUrl as checkIsValidUrl } from "@/lib/utils"
import { Sparkles, Image as ImageIcon, BookOpen, Zap, ArrowRight } from "lucide-react"
import { cn } from "@/lib/utils"

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
  simplify: {
    label: "Simplify",
    description: "Reduce to core concepts",
    icon: Zap
  }
}

export function GenerationForm() {
  const router = useRouter()
  const [url, setUrl] = useState("")
  const [category, setCategory] = useState<"meme" | "comic" | "simplify">("meme")
  const [isValidUrl, setIsValidUrl] = useState(true)

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newUrl = e.target.value
    setUrl(newUrl)
    if (newUrl) {
      setIsValidUrl(checkIsValidUrl(newUrl))
    } else {
      setIsValidUrl(true)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!url || !isValidUrl) return
    
    const normalized = normalizeUrl(url)
    const encodedUrl = encodeURIComponent(normalized)
    router.push(`/${category}/${encodedUrl}`)
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
          
          <div className="space-y-3">
            <Label className="text-sm font-medium text-foreground/80">Output Format</Label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {Object.entries(contentTypes).map(([key, { label, description, icon: Icon }]) => (
                <div
                  key={key}
                  onClick={() => setCategory(key as "meme" | "comic" | "simplify")}
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

          <Button 
            type="submit" 
            className="w-full h-12 text-base font-medium shadow-lg shadow-primary/20 transition-all hover:shadow-primary/40" 
            disabled={!url || !isValidUrl}
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

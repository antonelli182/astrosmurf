"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { normalizeUrl, isValidUrl as checkIsValidUrl } from "@/lib/utils"

const contentTypes = {
  meme: {
    label: "MEME",
    description: "IMAGE_MACRO",
  },
  comic: {
    label: "COMIC",
    description: "SEQUENTIAL_ART",
  },
  simplify: {
    label: "SIMPLIFY",
    description: "TEXT_REDUCTION",
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
    <Card className="w-full max-w-2xl mx-auto border-2 border-primary border-solid">
      <CardHeader className="space-y-1 border-b-2 border-primary pb-4">
        <CardTitle className="text-xl uppercase tracking-widest">
          &gt;&gt; CONFIGURATION
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="url" className="text-sm font-bold uppercase">
              SOURCE_URL:
            </Label>
            <Input
              id="url"
              type="url"
              placeholder="https://..."
              value={url}
              onChange={handleUrlChange}
              className={`h-12 font-mono text-sm ${!isValidUrl ? 'border-destructive text-destructive' : ''}`}
              required
              autoComplete="off"
            />
            {!isValidUrl && (
              <p className="text-xs text-destructive uppercase">&gt;&gt; ERROR: INVALID_INPUT</p>
            )}
          </div>
          
          <div className="space-y-3">
            <Label className="text-sm font-bold uppercase">OUTPUT_VECTOR:</Label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {Object.entries(contentTypes).map(([key, { label, description }]) => (
                <Button
                  key={key}
                  type="button"
                  variant={category === key ? "default" : "outline"}
                  className={`flex flex-col items-start justify-center h-auto py-4 px-4 space-y-1 transition-all ${
                    category === key 
                      ? 'opacity-100' 
                      : 'opacity-60 hover:opacity-100'
                  }`}
                  onClick={() => setCategory(key as "meme" | "comic" | "simplify")}
                >
                  <div className="font-bold text-lg flex items-center gap-2">
                    {category === key ? '[x]' : '[ ]'} {label}
                  </div>
                  <div className="text-[10px] uppercase">{description}</div>
                </Button>
              ))}
            </div>
          </div>

          <Button 
            type="submit" 
            className="w-full h-14 text-lg font-bold mt-4 group relative overflow-hidden" 
            disabled={!url || !isValidUrl}
          >
            <span className="relative z-10 group-hover:animate-pulse">
              &gt;&gt; EXECUTE
            </span>
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}

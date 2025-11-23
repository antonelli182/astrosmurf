"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { uploadToS3 } from "@/lib/aws/s3"
import { createPersona } from "@/lib/db/actions"
import { Loader2, Upload, User, Sparkles } from "lucide-react"
import Image from "next/image"
import { generateImageFromText } from "@/lib/ai"

export function PersonaForm() {
    const router = useRouter()
    const [name, setName] = useState("")
    const [description, setDescription] = useState("")
    const [selectedFile, setSelectedFile] = useState<File | null>(null)
    const [previewUrl, setPreviewUrl] = useState<string | null>(null)
    const [imageMode, setImageMode] = useState<"upload" | "generate">("upload")
    const [isGenerating, setIsGenerating] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) {
            setSelectedFile(file)
            const reader = new FileReader()
            reader.onloadend = () => {
                setPreviewUrl(reader.result as string)
            }
            reader.readAsDataURL(file)
        }
    }

    const handleGenerateImage = async () => {
        if (!description) {
            setError("Please enter a description first")
            return
        }

        setIsGenerating(true)
        setError(null)

        try {
            const response = await generateImageFromText(description)

            const data = response.data.images[0]
            setPreviewUrl(data.url)
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to generate image")
        } finally {
            setIsGenerating(false)
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!name || !description) {
            setError("Please fill in all fields")
            return
        }

        if (!previewUrl) {
            if (imageMode === "upload") {
                setError("Please upload an image")
            } else {
                setError("Please generate an image")
            }
            return
        }

        setIsLoading(true)
        setError(null)

        try {
            let imageUrl: string

            if (imageMode === "generate") {
                imageUrl = previewUrl
            } else {
                const uploadResult = await uploadToS3(selectedFile!)

                if (!uploadResult.success || !uploadResult.url) {
                    throw new Error(uploadResult.error || "Failed to upload image")
                }

                imageUrl = uploadResult.url
            }

            await createPersona({
                name,
                description,
                imageUrl,
            })

            router.push("/d/personas")
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to create persona")
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <Card className="max-w-2xl mx-auto">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Create New Persona
                </CardTitle>
                <CardDescription>
                    Upload an image or generate one from your description
                </CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-4">
                        <Label>Image Source</Label>
                        <div className="flex gap-4">
                            <Button
                                type="button"
                                variant={imageMode === "upload" ? "default" : "outline"}
                                onClick={() => setImageMode("upload")}
                                className="flex-1"
                            >
                                <Upload className="mr-2 h-4 w-4" />
                                Upload
                            </Button>
                            <Button
                                type="button"
                                variant={imageMode === "generate" ? "default" : "outline"}
                                onClick={() => setImageMode("generate")}
                                className="flex-1"
                            >
                                <Sparkles className="mr-2 h-4 w-4" />
                                Generate
                            </Button>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="image">
                            {imageMode === "upload" ? "Upload Image" : "Image Preview"}
                        </Label>
                        <div className="flex items-center gap-4">
                            {previewUrl ? (
                                <div className="relative w-32 h-32 rounded-lg overflow-hidden border">
                                    <Image
                                        src={previewUrl}
                                        alt="Preview"
                                        fill
                                        className="object-cover"
                                    />
                                </div>
                            ) : (
                                <div className="w-32 h-32 rounded-lg border-2 border-dashed border-muted-foreground/25 flex items-center justify-center">
                                    {isGenerating ? (
                                        <Loader2 className="h-8 w-8 text-muted-foreground animate-spin" />
                                    ) : (
                                        <Upload className="h-8 w-8 text-muted-foreground" />
                                    )}
                                </div>
                            )}
                            <div className="flex-1">
                                {imageMode === "upload" ? (
                                    <Input
                                        id="image"
                                        type="file"
                                        accept="image/*"
                                        onChange={handleFileChange}
                                    />
                                ) : (
                                    <Button
                                        type="button"
                                        onClick={handleGenerateImage}
                                        disabled={isGenerating || !description}
                                        className="w-full"
                                    >
                                        {isGenerating ? (
                                            <>
                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                Generating...
                                            </>
                                        ) : (
                                            <>
                                                <Sparkles className="mr-2 h-4 w-4" />
                                                Generate from Description
                                            </>
                                        )}
                                    </Button>
                                )}
                            </div>
                        </div>
                        {imageMode === "generate" && !description && (
                            <p className="text-xs text-muted-foreground">
                                Fill in the description below first, then click generate
                            </p>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="name">Name</Label>
                        <Input
                            id="name"
                            type="text"
                            placeholder="Enter persona name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="description">Description</Label>
                        <Textarea
                            id="description"
                            placeholder="Describe the persona's characteristics, style, and personality"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            rows={4}
                            required
                        />
                    </div>

                    {error && (
                        <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
                            <p className="text-sm text-destructive">{error}</p>
                        </div>
                    )}

                    <Button
                        type="submit"
                        className="w-full"
                        disabled={isLoading}
                    >
                        {isLoading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Creating Persona...
                            </>
                        ) : (
                            "Create Persona"
                        )}
                    </Button>
                </form>
            </CardContent>
        </Card>
    )
}

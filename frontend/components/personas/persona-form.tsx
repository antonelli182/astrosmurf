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
import { Loader2, Upload, User } from "lucide-react"
import Image from "next/image"

export function PersonaForm() {
    const router = useRouter()
    const [name, setName] = useState("")
    const [description, setDescription] = useState("")
    const [selectedFile, setSelectedFile] = useState<File | null>(null)
    const [previewUrl, setPreviewUrl] = useState<string | null>(null)
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

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!name || !description || !selectedFile) {
            setError("Please fill in all fields")
            return
        }

        setIsLoading(true)
        setError(null)

        try {
            const uploadResult = await uploadToS3(selectedFile)

            if (!uploadResult.success || !uploadResult.url) {
                throw new Error(uploadResult.error || "Failed to upload image")
            }

            await createPersona({
                name,
                description,
                imageUrl: uploadResult.url,
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
                    Upload an image and describe your persona
                </CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-2">
                        <Label htmlFor="image">Image</Label>
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
                                    <Upload className="h-8 w-8 text-muted-foreground" />
                                </div>
                            )}
                            <div className="flex-1">
                                <Input
                                    id="image"
                                    type="file"
                                    accept="image/*"
                                    onChange={handleFileChange}
                                    required
                                />
                            </div>
                        </div>
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

"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { fetchAllPersonas } from "@/lib/db/actions"
import Image from "next/image"

type PersonaType = Awaited<ReturnType<typeof fetchAllPersonas>>[number]

interface PersonaDisplayProps {
    personas: PersonaType[]
}

function PersonaCard({ persona }: { persona: PersonaType }) {
    return (
        <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader>
                {persona.image_url && (
                    <div className="relative w-full h-48 mb-4 rounded-lg overflow-hidden">
                        <Image
                            src={persona.image_url}
                            alt={persona.name}
                            fill
                            className="object-cover"
                        />
                    </div>
                )}
                <CardTitle>{persona.name}</CardTitle>
                <CardDescription>
                    {persona.date_created
                        ? new Date(persona.date_created).toLocaleDateString()
                        : "No date"}
                </CardDescription>
            </CardHeader>
            <CardContent>
                <p className="text-sm text-muted-foreground line-clamp-3">
                    {persona.description || "No description"}
                </p>
            </CardContent>
        </Card>
    )
}

function PersonaDisplay({ personas }: PersonaDisplayProps) {
    if (personas.length === 0) {
        return (
            <div className="text-center py-12 text-muted-foreground">
                No personas found. Create your first persona!
            </div>
        )
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {personas.map((persona) => (
                <PersonaCard key={persona.id} persona={persona} />
            ))}
        </div>
    )
}

export default PersonaDisplay

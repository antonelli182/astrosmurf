import PersonaDisplay from "@/components/personas/persona-display"
import { fetchAllPersonas } from "@/lib/db/actions"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Plus } from "lucide-react"

async function PersonasPage() {
    const personas = await fetchAllPersonas()

    return (
        <div className="container mx-auto p-6">
            <div className="mb-6 flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold">Personas</h1>
                    <p className="text-muted-foreground mt-2">
                        Manage your content personas
                    </p>
                </div>
                <Link href="/d/personas/new">
                    <Button>
                        <Plus className="mr-2 h-4 w-4" />
                        Create Persona
                    </Button>
                </Link>
            </div>
            <PersonaDisplay personas={personas} />
        </div>
    )
}

export default PersonasPage

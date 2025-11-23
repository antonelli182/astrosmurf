import { PersonaForm } from "@/components/personas/persona-form";
import { fetchAllPersonas } from "@/lib/db/actions";

async function PersonasPage() {
    const personas = fetchAllPersonas()
    return (
        <PersonaForm />
    );
}

export default PersonasPage;
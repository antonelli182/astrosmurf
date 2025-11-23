"use client"

import { db } from "@/lib/db/db";
import { Input } from "./ui/input";
import { useForm } from "react-hook-form"
import { createPersona } from "@/lib/db/actions";
import { uploadFile } from "@/lib/aws/s3";

function PersonaForm() {
    const form = useForm({
        defaultValues: {
            name: "",
            description: "",
            image_url: ""
        }
    })

    const onsubmit = async () => {
        const image_url = await uploadFile(file)
        const res = await createPersona()

    }
    return (
        <form>
            <Input {...form.register("name")} />
            <Input {...form.register("description")} />
            <Input type="file" />

        </form>
    );
}

export default PersonaForm;
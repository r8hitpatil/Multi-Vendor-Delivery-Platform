import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";

export default function PageLoading(){
    return (
        <div className="flex flex-col items-center gap-4">
            <Button size="sm">
                <Spinner data-icon="inline-start"/>
                Loading...
            </Button>
        </div>
    )
}
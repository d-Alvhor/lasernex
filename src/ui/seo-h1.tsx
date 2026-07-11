import { cn } from "@/lib/utils";
import type { HTMLAttributes } from "react";

// El wordmark del nav es siempre un <span>: el <h1> real de cada página vive
// en su contenido (hero en la home, nombre en la página de producto).
export const SeoH1 = ({ className, ...props }: HTMLAttributes<HTMLSpanElement>) => {
	return <span {...props} className={cn("inline-block", className)} />;
};

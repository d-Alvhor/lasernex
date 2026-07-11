"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";
import type { ComponentProps } from "react";

// Tema por CLASE .dark (no prefers-color-scheme), coherente con el @custom-variant
// dark de globals.css. Por defecto claro ("Sala Blanca"); el usuario alterna a oscuro.
export function ThemeProvider({ children, ...props }: ComponentProps<typeof NextThemesProvider>) {
	return <NextThemesProvider {...props}>{children}</NextThemesProvider>;
}

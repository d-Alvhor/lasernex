"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

export function ThemeToggle({ className }: { className?: string }) {
	const { resolvedTheme, setTheme } = useTheme();
	const [mounted, setMounted] = useState(false);
	useEffect(() => setMounted(true), []);

	const isDark = resolvedTheme === "dark";

	return (
		<button
			type="button"
			onClick={() => setTheme(isDark ? "light" : "dark")}
			aria-label={isDark ? "Cambiar a tema claro" : "Cambiar a tema oscuro"}
			className={className}
		>
			{mounted ? (
				isDark ? (
					<Sun className="h-4 w-4" />
				) : (
					<Moon className="h-4 w-4" />
				)
			) : (
				<span className="block h-4 w-4" />
			)}
		</button>
	);
}

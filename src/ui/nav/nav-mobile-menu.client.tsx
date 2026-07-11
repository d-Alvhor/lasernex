"use client";

import {
	Drawer,
	DrawerContent,
	DrawerDescription,
	DrawerHeader,
	DrawerTitle,
	DrawerTrigger,
} from "@/components/ui/drawer";
import { MenuIcon } from "lucide-react";
import { type ReactNode, useState } from "react";

export const NavMobileMenu = ({ children }: { children: ReactNode }) => {
	const [isOpen, setIsOpen] = useState(false);
	return (
		<Drawer open={isOpen} onOpenChange={setIsOpen}>
			<DrawerTrigger aria-label="Abrir menú">
				<MenuIcon />
			</DrawerTrigger>
			<DrawerContent>
				<DrawerHeader>
					<DrawerTitle className="text-center">Menú</DrawerTitle>
					<DrawerDescription className="sr-only">Menú de navegación</DrawerDescription>
				</DrawerHeader>
				<div
					onClick={(e) => {
						if (e.target instanceof HTMLElement && e.target.closest("a")) {
							setIsOpen(false);
						}
					}}
				>
					{children}
				</div>
			</DrawerContent>
		</Drawer>
	);
};

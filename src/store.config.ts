// Categorías reales pendientes de que Álvaro defina el catálogo final
// (se corresponden con metadata.category en Stripe). De momento, genéricas
// para piezas impresas en 3D — cámbialas cuando haya catálogo real.
export const config = {
	categories: [
		{ name: "Decoración", slug: "decoracion" },
		{ name: "Organización", slug: "organizacion" },
	],

	social: {
		// Rellenar cuando existan perfiles reales de Lasernex
		x: "",
		instagram: "",
	},

	contact: {
		email: "shop.lasernex@gmail.com",
		phone: "",
		address: "",
	},
};

export type StoreConfig = typeof config;
export default config;

// Las categorías NO se configuran aquí: salen solas del metadata.category
// de los productos activos en Stripe (ver Commerce.categoryBrowse() en
// nav-menu.tsx, footer.tsx y sitemap.ts). Carla no necesita tocar código
// para añadir una categoría nueva, solo escribirla en el producto.
export const config = {
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

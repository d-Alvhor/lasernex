import { cn, deslugify } from "@/lib/utils";
import type * as Commerce from "commerce-kit";
import Image from "next/image";

// Placa DETERMINISTA para catálogo/producto. Si el producto tiene foto real
// (Carla la sube en Stripe), se muestra esa foto con un velo inferior para que
// el texto se lea encima de cualquier imagen. Si NO tiene foto, se genera el
// arte de "papel" cálido de siempre — así ningún producto se queda sin
// portada mientras se completa el catálogo.

const INK = "#26221e"; // tinta cálida
const MUTED = "#857c72"; // gris cálido para etiquetas
const HAIR = "rgba(38,34,30,0.09)"; // filete de textura

// Hash simple y estable a partir del id (determinista).
function hashId(id: string): number {
	let h = 0;
	for (let i = 0; i < id.length; i++) {
		h = (h * 31 + id.charCodeAt(i)) >>> 0;
	}
	return h;
}

// 5 tonos cálidos MUY desaturados para no romper la serenidad de galería.
const TINTS = ["36 12% 92%", "26 14% 91%", "44 11% 92%", "18 10% 93%", "50 10% 91%"];

function extractMeasure(name: string): string | null {
	const m = name.match(/(\d+(?:[.,]\d+)?)\s?(cm|mm)\b/i);
	const num = m?.[1];
	const unit = m?.[2];
	if (!num || !unit) return null;
	return `${num.replace(".", ",")} ${unit.toLowerCase()}`;
}

function RingsMotif({ seed }: { seed: number }) {
	const rings = 4 + (seed % 4);
	const rot = seed % 30;
	return (
		<svg
			aria-hidden
			viewBox="0 0 100 100"
			className="absolute inset-0 h-full w-full"
			style={{ transform: `rotate(${rot}deg)`, color: INK, opacity: 0.09 }}
			preserveAspectRatio="xMidYMid slice"
		>
			{Array.from({ length: rings }).map((_, i) => (
				<circle
					key={i}
					cx={50}
					cy={50}
					r={8 + i * (40 / rings)}
					fill="none"
					stroke="currentColor"
					strokeWidth={0.6}
				/>
			))}
		</svg>
	);
}

function HatchMotif({ seed }: { seed: number }) {
	const gap = 7 + (seed % 4);
	const id = `hatch-${seed}`;
	return (
		<svg
			aria-hidden
			viewBox="0 0 100 100"
			className="absolute inset-0 h-full w-full"
			style={{ color: INK, opacity: 0.08 }}
		>
			<defs>
				<pattern id={id} width={gap} height={gap} patternUnits="userSpaceOnUse">
					<path d={`M0 0 H${gap}`} stroke="currentColor" strokeWidth={0.5} />
					<path d={`M0 0 V${gap}`} stroke="currentColor" strokeWidth={0.5} />
				</pattern>
			</defs>
			<rect width="100" height="100" fill={`url(#${id})`} />
		</svg>
	);
}

export function ProductPlacard({
	product,
	priceFormatted,
	className,
	ratio = "aspect-[3/4]",
	variant = "card",
}: {
	product: Commerce.MappedProduct;
	priceFormatted?: string | null;
	className?: string;
	ratio?: string;
	variant?: "card" | "feature";
}) {
	const seed = hashId(product.id);
	const tint = TINTS[seed % TINTS.length];
	const initial = (product.name?.trim()?.[0] ?? "L").toUpperCase();
	const measure = extractMeasure(product.name ?? "");
	const category = product.metadata.category;
	const isOrg = category === "organizacion" || category === "organización";
	const photo = product.images[0];

	return (
		<article
			className={cn(
				"group/plc relative flex flex-col justify-end overflow-hidden border border-border transition-colors duration-300 group-hover:border-foreground/40",
				ratio,
				className,
			)}
			style={photo ? undefined : { backgroundColor: `hsl(${tint})` }}
		>
			{photo ? (
				<>
					<Image
						src={photo}
						alt={product.name}
						fill
						sizes={
							variant === "feature"
								? "(max-width: 1024px) 100vw, 50vw"
								: "(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
						}
						className="object-cover transition-transform duration-300 ease-out group-hover:scale-[1.03]"
					/>
					{/* Velo inferior: el texto tiene que leerse encima de cualquier foto */}
					<div
						aria-hidden
						className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/65 via-black/5 to-transparent"
					/>
				</>
			) : (
				<>
					{/* Textura de líneas de capa (parallax sutil en hover) — tinta fija sobre el papel */}
					<div
						aria-hidden
						className="pointer-events-none absolute inset-0 transition-transform duration-300 ease-out group-hover:translate-y-[2px]"
						style={{
							backgroundImage: `repeating-linear-gradient(to bottom, ${HAIR} 0, ${HAIR} 1px, transparent 1px, transparent 6px)`,
						}}
					/>
					{isOrg ? <HatchMotif seed={seed} /> : <RingsMotif seed={seed} />}
					{/* Glyph fantasma */}
					<span
						aria-hidden
						className={cn(
							"pointer-events-none absolute inset-0 flex items-center justify-center font-serif leading-none",
							variant === "feature" ? "text-[38vw] md:text-[22rem]" : "text-[9rem]",
						)}
						style={{ color: INK, opacity: 0.07 }}
					>
						{initial}
					</span>
				</>
			)}

			{priceFormatted &&
				(photo ? (
					<span className="absolute right-3 top-3 rounded-full bg-white/90 px-2 py-0.5 font-sans text-sm font-medium tabular-nums text-neutral-900">
						{priceFormatted}
					</span>
				) : (
					<span
						className="absolute right-3 top-3 font-sans text-sm font-medium tabular-nums"
						style={{ color: INK }}
					>
						{priceFormatted}
					</span>
				))}

			<div className="relative z-10 p-3">
				<h3
					className="truncate font-serif text-lg leading-tight"
					style={photo ? { color: "#fff" } : { color: INK }}
				>
					{product.name}
				</h3>
				<p
					className="mt-1 font-sans text-[10px] uppercase tracking-[0.18em]"
					style={photo ? { color: "rgba(255,255,255,0.75)" } : { color: MUTED }}
				>
					{category ? <span>{deslugify(category)}</span> : null}
					{measure ? (
						<span aria-hidden>
							{category ? " · " : ""}
							{measure}
						</span>
					) : null}
				</p>
			</div>

			{/* Disponibilidad — punto clay SIEMPRE con etiqueta (no sólo color) */}
			<div
				className="pointer-events-none absolute bottom-3 right-3 flex items-center gap-1.5 font-sans text-[10px] uppercase tracking-[0.16em] opacity-0 transition-opacity duration-300 group-hover:opacity-100"
				style={photo ? { color: "rgba(255,255,255,0.85)" } : { color: MUTED }}
			>
				<span
					aria-hidden
					className="h-1.5 w-1.5 rounded-full"
					style={{ backgroundColor: "hsl(14 42% 48%)" }}
				/>
				Bajo demanda
			</div>
		</article>
	);
}

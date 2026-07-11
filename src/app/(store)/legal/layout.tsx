export default function LegalLayout({ children }: Readonly<{ children: React.ReactNode }>) {
	return (
		<div className="mx-auto max-w-3xl py-8">
			{/* Aviso interno mientras falte el domicilio fiscal. Al rellenar [DOMICILIO]
			    en las páginas legales, quitar este bloque. */}
			<div
				role="note"
				className="mb-8 rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900"
			>
				<strong>Pendiente:</strong> falta añadir el domicilio fiscal (marcado como <code>[DOMICILIO]</code>)
				para completar el aviso legal antes de vender de forma efectiva.
			</div>
			<article className="prose prose-neutral max-w-none prose-headings:font-bold prose-a:text-neutral-900">
				{children}
			</article>
		</div>
	);
}

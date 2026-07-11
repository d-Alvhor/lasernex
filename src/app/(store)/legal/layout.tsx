export default function LegalLayout({ children }: Readonly<{ children: React.ReactNode }>) {
	return (
		<div className="mx-auto max-w-3xl py-8">
			<div
				role="note"
				className="mb-8 rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900"
			>
				<strong>Borrador pendiente de revisión legal.</strong> Los datos entre corchetes (<code>[…]</code>)
				son placeholders que hay que rellenar con los datos reales del negocio antes de publicar la tienda
				(ver <code>LEGAL.md</code> y <code>ROADMAP.md</code> en el repositorio).
			</div>
			<article className="prose prose-neutral max-w-none prose-headings:font-bold prose-a:text-neutral-900">
				{children}
			</article>
		</div>
	);
}

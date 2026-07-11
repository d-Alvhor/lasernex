export default function LegalLayout({ children }: Readonly<{ children: React.ReactNode }>) {
	return (
		<div className="mx-auto max-w-3xl py-12">
			<article className="prose prose-neutral max-w-none prose-headings:font-serif prose-headings:font-medium prose-a:text-foreground">
				{children}
			</article>
		</div>
	);
}

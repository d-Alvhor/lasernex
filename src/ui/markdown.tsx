import "server-only";

import ReactMarkdown from "react-markdown";

// Renderiza la descripción del producto (texto que la dueña escribe en Stripe)
// como markdown básico. Usamos react-markdown en vez de MDX a propósito:
// NO ejecuta JSX ni código, solo produce HTML seguro. Ver SECURITY.md.
export const Markdown = ({ source }: { source: string }) => {
	return <ReactMarkdown>{source}</ReactMarkdown>;
};

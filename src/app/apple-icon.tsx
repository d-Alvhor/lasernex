import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

// Monograma 7L (papel sobre tinta), dibujado con divs para el touch icon de iOS.
export default function AppleIcon() {
	const paper = "#faf7f2";
	const bar = (style: React.CSSProperties) => (
		<div style={{ position: "absolute", background: paper, ...style }} />
	);
	return new ImageResponse(
		<div
			style={{
				width: "100%",
				height: "100%",
				position: "relative",
				display: "flex",
				background: "#211e1b",
			}}
		>
			{/* 7 */}
			{bar({ left: 40, top: 47, width: 54, height: 19 })}
			{bar({ left: 75, top: 47, width: 19, height: 83 })}
			{/* L */}
			{bar({ left: 108, top: 47, width: 19, height: 83 })}
			{bar({ left: 108, top: 111, width: 43, height: 19 })}
		</div>,
		{ ...size },
	);
}

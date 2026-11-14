import { useEffect, useState } from "react";
import { cn } from "takibi-design-system";

/* 基礎のカタログで使う小さなコンポーネント。デザインシステムの公開 API ではない */

export function Section({
	title,
	description,
	children,
}: {
	title: string;
	description?: string;
	children: React.ReactNode;
}) {
	return (
		<section className="flex flex-col gap-4">
			<header className="flex flex-col gap-1">
				<h2 className="text-xl font-semibold tracking-snug text-fg-strong">{title}</h2>
				{description && <p className="max-w-prose text-sm text-fg-muted">{description}</p>}
			</header>
			{children}
		</section>
	);
}

export function Page({ children }: { children: React.ReactNode }) {
	return <div className="flex max-w-content flex-col gap-12">{children}</div>;
}

/** CSS 変数の今の値を読む。テーマを切り替えたら読み直す */
export function useCssVar(name: string) {
	const [value, setValue] = useState("");
	useEffect(() => {
		const read = () => setValue(getComputedStyle(document.documentElement).getPropertyValue(name).trim());
		read();
		const observer = new MutationObserver(read);
		observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
		return () => observer.disconnect();
	}, [name]);
	return value;
}

/** 計算済みの色を sRGB の 0〜1 に直す。ブラウザに解決させるので rgb() も var() も扱える */
function toRgb(color: string): [number, number, number, number] | null {
	if (!color) return null;
	const canvas = document.createElement("canvas");
	canvas.width = canvas.height = 1;
	const ctx = canvas.getContext("2d");
	if (!ctx) return null;
	ctx.fillStyle = "#000";
	ctx.fillStyle = color;
	ctx.fillRect(0, 0, 1, 1);
	const [r = 0, g = 0, b = 0, a = 255] = ctx.getImageData(0, 0, 1, 1).data;
	return [r / 255, g / 255, b / 255, a / 255];
}

function luminance([r, g, b]: [number, number, number, number]) {
	const lin = (c: number) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
	return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}

/** WCAG 2.x のコントラスト比 */
export function contrast(fg: string, bg: string) {
	const a = toRgb(fg);
	const b = toRgb(bg);
	if (!a || !b) return null;
	const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x) as [number, number];
	return (hi + 0.05) / (lo + 0.05);
}

export function ContrastBadge({ ratio, min = 4.5 }: { ratio: number | null; min?: number }) {
	if (ratio === null) return null;
	const pass = ratio >= min;
	return (
		<span
			className={cn(
				"inline-flex items-center gap-1 rounded-sm px-1.5 py-0.5 font-mono text-xs",
				pass ? "bg-success-soft text-success" : "bg-danger-soft text-danger",
			)}
			title={`基準 ${min}:1`}
		>
			{ratio.toFixed(2)}:1 {pass ? "合格" : "不足"}
		</span>
	);
}

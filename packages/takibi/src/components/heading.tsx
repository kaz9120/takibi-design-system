import { useRender } from "@base-ui/react/use-render";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../lib/cn";

export const headingVariants = cva("font-semibold text-balance text-fg-strong", {
	variants: {
		size: {
			sm: "text-sm tracking-normal",
			base: "text-base tracking-snug",
			lg: "text-lg tracking-snug",
			xl: "text-xl tracking-snug",
			"2xl": "text-2xl tracking-snug",
			"3xl": "text-3xl tracking-tight",
			"4xl": "text-4xl tracking-tight",
			"5xl": "text-5xl font-bold tracking-tight",
			"6xl": "text-6xl font-bold tracking-tight",
		},
	},
	defaultVariants: { size: "2xl" },
});

type HeadingLevel = 1 | 2 | 3 | 4 | 5 | 6;
type HeadingSize = NonNullable<VariantProps<typeof headingVariants>["size"]>;

/** 見出しの階層ごとの、既定の大きさ */
const sizeForLevel: Record<HeadingLevel, HeadingSize> = {
	1: "4xl",
	2: "3xl",
	3: "2xl",
	4: "xl",
	5: "lg",
	6: "base",
};

export type HeadingProps = useRender.ComponentProps<"h2"> &
	VariantProps<typeof headingVariants> & {
		/** 見出しの階層。h1〜h6 のどれで描くかを決める。省くと h2 */
		level?: HeadingLevel;
	};

/**
 * 見出し。階層（level）と見た目の大きさ（size）を分けて決められる。
 * ページの見出しの順番は level で正しく保ち、見た目だけを変えたいときは size を渡す。
 */
export function Heading({ level = 2, size, className, render, ref, ...props }: HeadingProps) {
	return useRender({
		defaultTagName: `h${level}`,
		render,
		ref,
		props: {
			"data-slot": "heading",
			...props,
			className: cn(headingVariants({ size: size ?? sizeForLevel[level] }), className),
		},
	});
}

/**
 * 見出しの上に添える小さなラベル。章の名前や分類に使う。
 * 12px で字間を広げ、fg-muted の色で置く。英字は大文字になる。
 */
export function Eyebrow({ className, render, ref, ...props }: useRender.ComponentProps<"p">) {
	return useRender({
		defaultTagName: "p",
		render,
		ref,
		props: {
			"data-slot": "eyebrow",
			...props,
			className: cn("text-xs font-medium tracking-mark text-fg-muted uppercase", className),
		},
	});
}

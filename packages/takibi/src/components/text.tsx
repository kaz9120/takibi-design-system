import { useRender } from "@base-ui/react/use-render";
import { cva, type VariantProps } from "class-variance-authority";
import type * as React from "react";
import { cn } from "../lib/cn";

export const textVariants = cva("text-pretty", {
	variants: {
		size: {
			/** 装飾ラベル、時刻だけ。本文には使わない */
			xs: "text-xs",
			/** UI の最小 */
			sm: "text-sm",
			/** 本文 */
			base: "text-base",
			/** 導入の段落 */
			lg: "text-lg",
			xl: "text-xl tracking-snug",
		},
		tone: {
			default: "text-fg",
			strong: "text-fg-strong",
			muted: "text-fg-muted",
			/** プレースホルダーと無効だけ。4.5:1 に届かないので本文には使わない */
			subtle: "text-fg-subtle",
		},
		weight: {
			regular: "font-normal",
			medium: "font-medium",
			semibold: "font-semibold",
		},
	},
	defaultVariants: { size: "base", tone: "default", weight: "regular" },
});

export type TextProps = useRender.ComponentProps<"p"> & VariantProps<typeof textVariants>;

/**
 * 本文の文字。大きさ、色の強さ、太さを決まった段階から選ぶ。
 * 既定では p で描く。文中の一部なら render={<span />} を渡す。
 */
export function Text({ size, tone, weight, className, render, ref, ...props }: TextProps) {
	return useRender({
		defaultTagName: "p",
		render,
		ref,
		props: {
			"data-slot": "text",
			...props,
			className: cn(textVariants({ size, tone, weight }), className),
		},
	});
}

export type QuoteProps = React.ComponentProps<"figure"> & {
	/** 誰の言葉か。人の名前や出典 */
	cite?: React.ReactNode;
	/** 出典の URL。blockquote の cite 属性になる */
	source?: string;
};

/**
 * 人の言葉やほかの文章の引用。左に線を引かず、薄い色の大きな引用符で始まりを示す。
 * 出典は cite に書き、本文の下に添える。
 */
export function Quote({ className, cite, source, children, ...props }: QuoteProps) {
	return (
		<figure data-slot="quote" className={cn("relative flex flex-col gap-3 pt-6", className)} {...props}>
			<span
				aria-hidden
				className="pointer-events-none absolute -top-1 left-0 text-5xl leading-none text-fg-subtle select-none"
			>
				“
			</span>
			<blockquote
				data-slot="quote-body"
				cite={source}
				className="text-lg leading-relaxed tracking-snug text-pretty text-fg-strong"
			>
				{children}
			</blockquote>
			{cite && (
				<figcaption data-slot="quote-cite" className="text-sm text-fg-muted">
					— {cite}
				</figcaption>
			)}
		</figure>
	);
}

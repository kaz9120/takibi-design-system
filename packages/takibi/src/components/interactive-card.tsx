import { useRender } from "@base-ui/react/use-render";
import { ArrowRight } from "lucide-react";
import type * as React from "react";
import { cn } from "../lib/cn";

/*
 * 持ち上がり: hover で 2px 上がり、枠線にブランドカラーが混ざって、外側に薄い光の影が付く。押すと 0.98 倍に沈み、離すとばねで戻る。
 * 動きは translate と scale に分けて持つので、持ち上がったまま押し込める。
 * 持ち上げと戻りは soft のばね、押し込みだけは速い減速にする。
 */
const lift = [
	"group/card relative flex flex-col gap-2 rounded-lg border border-line-subtle bg-surface-raised p-5 text-left text-fg shadow-[var(--shadow-card)]",
	"cursor-pointer outline-none select-none",
	"[--card-rim:color-mix(in_oklab,var(--color-brand)_32%,var(--color-line-subtle))]",
	"[--card-glow:0_0_0_1px_color-mix(in_oklab,var(--color-brand)_14%,transparent),0_10px_32px_-6px_color-mix(in_oklab,var(--color-brand)_24%,transparent)]",
	"[transition:translate_var(--duration-spring-soft)_var(--ease-spring-soft),scale_var(--duration-spring-press)_var(--ease-spring-press),box-shadow_var(--duration-base)_var(--ease-ember),border-color_var(--duration-base)_var(--ease-ember),background-color_var(--duration-fast)_var(--ease-standard)]",
	"hover:-translate-y-0.5 hover:border-(--card-rim) hover:shadow-[var(--shadow-card),var(--card-glow)]",
	"active:scale-(--press-scale-surface) active:[transition:translate_var(--duration-spring-soft)_var(--ease-spring-soft),scale_150ms_var(--ease-out-expo),box-shadow_var(--duration-base)_var(--ease-ember),border-color_var(--duration-base)_var(--ease-ember)]",
	"focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus",
	"aria-disabled:pointer-events-none aria-disabled:opacity-50",
];

export type InteractiveCardProps = useRender.ComponentProps<"button"> & {
	/** 渡すとリンク（a）になる。省くとボタンになる */
	href?: string;
};

/**
 * カード全体を押せるようにする。記事や記録の一覧から、詳しいページへ移るときに使う。
 * 中にほかのボタンやリンクは置かない（押せる場所が重なるため）。中に操作が要るなら Card を使う。
 */
export function InteractiveCard({ href, className, render, ref, ...props }: InteractiveCardProps) {
	return useRender({
		defaultTagName: href ? "a" : "button",
		render,
		ref,
		props: {
			"data-slot": "interactive-card",
			...(href ? { href } : { type: "button" }),
			...props,
			className: cn(lift, className),
		},
	});
}

export function InteractiveCardTitle({ className, ...props }: React.ComponentProps<"span">) {
	return (
		<span
			data-slot="interactive-card-title"
			className={cn(
				"flex items-center gap-2 text-base font-semibold tracking-snug text-fg-strong",
				className,
			)}
			{...props}
		/>
	);
}

export function InteractiveCardDescription({ className, ...props }: React.ComponentProps<"span">) {
	return (
		<span
			data-slot="interactive-card-description"
			className={cn("text-sm text-fg-muted", className)}
			{...props}
		/>
	);
}

/**
 * 進む向きを示す矢印。カードに hover すると、ばねで 3px 前へ寄り、ブランドカラーになる。
 * 押している間は、もう 1px 先へ出る。
 */
export function InteractiveCardArrow({ className, ...props }: React.ComponentProps<typeof ArrowRight>) {
	return (
		<ArrowRight
			data-slot="interactive-card-arrow"
			aria-hidden
			className={cn(
				"size-4 shrink-0 text-fg-subtle",
				"transition-[translate,color] duration-(--duration-spring-snappy) ease-spring-snappy",
				"group-hover/card:translate-x-[3px] group-hover/card:text-brand group-active/card:translate-x-1",
				className,
			)}
			{...props}
		/>
	);
}

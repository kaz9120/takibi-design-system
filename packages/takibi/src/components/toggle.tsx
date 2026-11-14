import { Toggle as BaseToggle } from "@base-ui/react/toggle";
import { cva, type VariantProps } from "class-variance-authority";
import type * as React from "react";
import { cn } from "../lib/cn";

export const toggleVariants = cva(
	[
		"inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium select-none",
		"text-fg-muted motion-press outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus",
		"hover:not-data-disabled:bg-surface-hover hover:not-data-disabled:text-fg",
		"data-pressed:bg-brand-soft data-pressed:text-brand hover:not-data-disabled:data-pressed:bg-brand-soft hover:not-data-disabled:data-pressed:text-brand",
		"data-disabled:cursor-not-allowed data-disabled:opacity-50",
		"[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
	],
	{
		variants: {
			variant: {
				/** 枠なし。ツールバーの中など、周りに区切りがあるとき */
				ghost: "bg-transparent",
				/** 枠あり。単独で置くとき */
				outline: "border border-line-strong data-pressed:border-brand",
			},
			size: {
				sm: "h-8 min-w-8 px-2",
				md: "h-9 min-w-9 px-2.5",
				lg: "h-11 min-w-11 px-3 text-base",
			},
		},
		defaultVariants: { variant: "ghost", size: "md" },
	},
);

export type ToggleProps = React.ComponentProps<typeof BaseToggle> & VariantProps<typeof toggleVariants>;

/**
 * 押すたびにオンとオフが切り替わるボタン。太字や表示の切り替えなど、その場で効く設定に使う。
 * アイコンだけのときは aria-label を付ける。
 */
export function Toggle({ className, variant, size, ...props }: ToggleProps) {
	return (
		<BaseToggle data-slot="toggle" className={cn(toggleVariants({ variant, size }), className)} {...props} />
	);
}

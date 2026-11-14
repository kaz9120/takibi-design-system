import { cva, type VariantProps } from "class-variance-authority";
import type * as React from "react";
import { cn } from "../lib/cn";

export const badgeVariants = cva(
	[
		"inline-flex w-fit shrink-0 items-center gap-1 whitespace-nowrap rounded-sm px-1.5 py-0.5 text-xs font-medium",
		"[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-3",
	],
	{
		variants: {
			variant: {
				/** 分類や件数など、色に意味を持たせないラベル */
				neutral: "bg-surface-hover text-fg-muted",
				/** 新機能など、目を留めてほしいもの */
				brand: "bg-brand-soft text-brand",
				success: "bg-success-soft text-success",
				warning: "bg-warning-soft text-warning",
				danger: "bg-danger-soft text-danger",
				info: "bg-info-soft text-info",
			},
		},
		defaultVariants: { variant: "neutral" },
	},
);

export type BadgeProps = React.ComponentProps<"span"> & VariantProps<typeof badgeVariants>;

/** 状態や分類を短い語で添える。押せるものには使わない（押せるならボタンにする） */
export function Badge({ className, variant, ...props }: BadgeProps) {
	return <span data-slot="badge" className={cn(badgeVariants({ variant }), className)} {...props} />;
}

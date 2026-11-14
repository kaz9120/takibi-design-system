import { cva, type VariantProps } from "class-variance-authority";
import { CircleAlert, Info, Lightbulb, TriangleAlert } from "lucide-react";
import type * as React from "react";
import { cn } from "../lib/cn";

/*
 * 面全体を薄い色にし、アイコンを角丸の小さな四角に載せて種類を示す。
 * 左の縁だけに色の線を引く飾りは、角丸の面と相性が悪いので使わない。
 */
export const calloutVariants = cva(
	"grid grid-cols-[auto_1fr] items-start gap-x-3 gap-y-1 rounded-lg border p-4 text-sm leading-relaxed",
	{
		variants: {
			variant: {
				/** 補足。知っておくと理解が深まること */
				note: "border-line-subtle bg-surface-raised [--callout-tone:var(--color-info)] [--callout-soft:var(--color-info-soft)]",
				/** こつ。知っていると楽になるやり方 */
				tip: "border-line-subtle bg-[color-mix(in_oklab,var(--color-success-soft)_50%,var(--color-surface-raised))] [--callout-tone:var(--color-success)] [--callout-soft:var(--color-success-soft)]",
				/** 注意。間違えやすいこと、手戻りになること */
				warning:
					"border-line-subtle bg-[color-mix(in_oklab,var(--color-warning-soft)_60%,var(--color-surface-raised))] [--callout-tone:var(--color-warning)] [--callout-soft:var(--color-warning-soft)]",
				/** 危険。データが消える、取り消せないこと */
				danger:
					"border-line-subtle bg-[color-mix(in_oklab,var(--color-danger-soft)_60%,var(--color-surface-raised))] [--callout-tone:var(--color-danger)] [--callout-soft:var(--color-danger-soft)]",
			},
		},
		defaultVariants: { variant: "note" },
	},
);

type CalloutVariant = NonNullable<VariantProps<typeof calloutVariants>["variant"]>;

const defaultIcons: Record<CalloutVariant, React.ComponentType<React.SVGProps<SVGSVGElement>>> = {
	note: Info,
	tip: Lightbulb,
	warning: TriangleAlert,
	danger: CircleAlert,
};

const defaultLabels: Record<CalloutVariant, string> = {
	note: "補足",
	tip: "こつ",
	warning: "注意",
	danger: "危険",
};

export type CalloutProps = React.ComponentProps<"aside"> &
	VariantProps<typeof calloutVariants> & {
		/** 左のアイコン。省くと variant に合うものを出す */
		icon?: React.ReactNode;
	};

/**
 * 文書の本文の中に、補足、こつ、注意を本文と分けて置く。
 * 操作の結果を知らせるなら Alert を、ページ全体の知らせなら Banner を使う。
 */
export function Callout({ className, variant, icon, children, ...props }: CalloutProps) {
	const resolved = variant ?? "note";
	const Icon = defaultIcons[resolved];
	return (
		<aside
			data-slot="callout"
			data-variant={resolved}
			aria-label={props["aria-label"] ?? defaultLabels[resolved]}
			className={cn(calloutVariants({ variant }), className)}
			{...props}
		>
			<span
				data-slot="callout-icon"
				aria-hidden
				className="row-span-2 flex size-7 items-center justify-center rounded-md bg-(--callout-soft) text-(--callout-tone) [&>svg]:size-4"
			>
				{icon ?? <Icon />}
			</span>
			{children}
		</aside>
	);
}

export function CalloutTitle({ className, ...props }: React.ComponentProps<"p">) {
	return (
		<p
			data-slot="callout-title"
			className={cn("col-start-2 pt-[3px] font-semibold text-fg-strong", className)}
			{...props}
		/>
	);
}

export function CalloutDescription({ className, ...props }: React.ComponentProps<"div">) {
	return (
		<div
			data-slot="callout-description"
			className={cn(
				"col-start-2 text-fg [&_a]:text-brand [&_a]:underline [&_a]:underline-offset-4 [&_code]:rounded-sm [&_code]:bg-surface-sunken [&_code]:px-1 [&_code]:py-0.5 [&_code]:font-mono [&_code]:text-[0.9em] [&_p+p]:mt-2",
				"[[data-slot=callout-icon]+&]:pt-[3px]",
				className,
			)}
			{...props}
		/>
	);
}

import { Fieldset as BaseFieldset } from "@base-ui/react/fieldset";
import { cva, type VariantProps } from "class-variance-authority";
import type * as React from "react";
import { cn } from "../lib/cn";

const fieldsetVariants = cva(
	"group/fieldset m-0 flex min-w-0 flex-col gap-4 border-0 p-0 data-disabled:cursor-not-allowed",
	{
		variants: {
			variant: {
				/** 枠なし。フォームの中の段落として使う */
				plain: "",
				/** カードの面に載せて、ほかのグループと分ける */
				card: "rounded-lg border border-line bg-surface-raised p-5 shadow-rim",
			},
		},
		defaultVariants: { variant: "plain" },
	},
);

export type FieldsetProps = React.ComponentProps<typeof BaseFieldset.Root> &
	VariantProps<typeof fieldsetVariants>;

/**
 * 関係する入力欄をまとめ、グループに名前を付ける。住所や通知の設定のように、一緒に読むと意味が通る欄に使う。
 * `disabled` を付けると、中の欄がまとめて無効になる。
 */
export function Fieldset({ className, variant, ...props }: FieldsetProps) {
	return (
		<BaseFieldset.Root
			data-slot="fieldset"
			className={cn(fieldsetVariants({ variant }), className)}
			{...props}
		/>
	);
}

/** グループの名前。Fieldset の最初に置く */
export function FieldsetLegend({ className, ...props }: React.ComponentProps<typeof BaseFieldset.Legend>) {
	return (
		<BaseFieldset.Legend
			data-slot="fieldset-legend"
			className={cn(
				"p-0 text-base font-semibold text-fg-strong data-disabled:opacity-50",
				"[&+[data-slot=fieldset-description]]:-mt-3",
				className,
			)}
			{...props}
		/>
	);
}

/** グループの補足。FieldsetLegend のすぐ後ろに置く */
export function FieldsetDescription({ className, ...props }: React.ComponentProps<"p">) {
	return (
		<p
			data-slot="fieldset-description"
			className={cn("text-sm text-fg-muted group-data-disabled/fieldset:opacity-50", className)}
			{...props}
		/>
	);
}

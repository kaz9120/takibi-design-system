import { Switch as BaseSwitch } from "@base-ui/react/switch";
import { cva, type VariantProps } from "class-variance-authority";
import type * as React from "react";
import { cn } from "../lib/cn";

const switchVariants = cva(
	[
		"relative inline-flex shrink-0 rounded-full border border-line-strong bg-surface-sunken [--inset:2px]",
		"transition-[background-color,border-color,box-shadow] duration-(--duration-base) ease-standard outline-none",
		"hover:not-data-disabled:border-line-hover",
		"focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus",
		"data-checked:border-brand data-checked:bg-brand hover:not-data-disabled:data-checked:border-brand-hover hover:not-data-disabled:data-checked:bg-brand-hover",
		"data-invalid:border-danger aria-invalid:border-danger",
		"data-disabled:cursor-not-allowed data-disabled:opacity-50",
	],
	{
		variants: {
			size: {
				sm: "h-5 w-8 [--thumb:14px]",
				md: "h-6 w-10 [--thumb:18px]",
			},
		},
		defaultVariants: { size: "md" },
	},
);

export type SwitchProps = React.ComponentProps<typeof BaseSwitch.Root> & VariantProps<typeof switchVariants>;

/**
 * 設定のオンとオフを切り替える。押した瞬間に効くものに使い、保存ボタンを待つ項目には Checkbox を使う。
 * `<label>` で囲むか Field の中に置いて、名前を付ける。
 * 押している間、ハンドルが進む側へ伸びる。離すと、進む側の端が先に動く。
 */
export function Switch({ className, size, ...props }: SwitchProps) {
	return (
		<BaseSwitch.Root data-slot="switch" className={cn(switchVariants({ size }), className)} {...props}>
			<BaseSwitch.Thumb
				data-slot="switch-thumb"
				className={cn(
					"motion-switch-thumb pointer-events-none block rounded-full bg-fg-muted shadow-rim",
					"data-checked:bg-fg-on-brand",
				)}
			/>
		</BaseSwitch.Root>
	);
}

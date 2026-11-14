import { Input as BaseInput } from "@base-ui/react/input";
import { cva, type VariantProps } from "class-variance-authority";
import type * as React from "react";
import { cn } from "../lib/cn";

/** 入力欄の面・枠・フォーカス・エラーの見た目。Textarea と共有する */
export const fieldControlClass = [
	"w-full min-w-0 rounded-md border border-line-strong bg-surface-sunken text-fg shadow-rim",
	"placeholder:text-fg-subtle selection:bg-brand-soft",
	"transition-[border-color,box-shadow] duration-(--duration-fast) ease-standard outline-none",
	"hover:not-disabled:not-focus:border-line-hover focus:border-brand focus:ring-3 focus:ring-brand-soft",
	"aria-invalid:border-danger aria-invalid:focus:ring-danger-soft data-invalid:border-danger data-invalid:focus:ring-danger-soft",
	"disabled:cursor-not-allowed disabled:opacity-50",
	"read-only:bg-surface read-only:focus:ring-0",
];

export const inputVariants = cva(
	[
		...fieldControlClass,
		"file:mr-3 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-fg",
	],
	{
		variants: {
			size: {
				sm: "h-8 px-2.5 text-sm",
				md: "h-9 px-3 text-sm",
				lg: "h-11 px-3.5 text-base",
			},
		},
		defaultVariants: { size: "md" },
	},
);

export type InputProps = Omit<React.ComponentProps<typeof BaseInput>, "size"> &
	VariantProps<typeof inputVariants>;

/**
 * 1 行の文字を入れる欄。ラベルや補足、エラーを添えるときは Field で囲む。
 * `aria-invalid` を付けるか Field の検証に通らないと、枠が danger の色になる。
 */
export function Input({ className, size, ...props }: InputProps) {
	return <BaseInput data-slot="input" className={cn(inputVariants({ size }), className)} {...props} />;
}

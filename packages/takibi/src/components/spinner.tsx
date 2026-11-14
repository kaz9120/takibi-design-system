import { cva, type VariantProps } from "class-variance-authority";
import type * as React from "react";
import { cn } from "../lib/cn";

const spinnerVariants = cva(
	"inline-block shrink-0 animate-spin rounded-full border-2 border-current border-r-transparent",
	{
		variants: {
			size: {
				sm: "size-3.5",
				md: "size-5",
				lg: "size-8",
			},
		},
		defaultVariants: { size: "md" },
	},
);

export type SpinnerProps = React.ComponentProps<"span"> &
	VariantProps<typeof spinnerVariants> & {
		/** 読み上げる文言。aria-hidden を付けたときは不要 */
		label?: string;
	};

/** 処理中を示す。短い待ち（数秒）に使い、長い待ちには進み具合を見せる */
export function Spinner({ className, size, label = "読み込み中", ...props }: SpinnerProps) {
	const hidden = props["aria-hidden"] === true || props["aria-hidden"] === "true";
	if (hidden) {
		return <span data-slot="spinner" className={cn(spinnerVariants({ size }), className)} {...props} />;
	}
	return (
		<span role="status" className="inline-flex">
			<span data-slot="spinner" className={cn(spinnerVariants({ size }), className)} {...props} />
			<span className="sr-only">{label}</span>
		</span>
	);
}

import type * as React from "react";
import { cn } from "../lib/cn";

/** キーボードのキーを示す。ショートカットの案内やメニューの右端に置く */
export function Kbd({ className, ...props }: React.ComponentProps<"kbd">) {
	return (
		<kbd
			data-slot="kbd"
			className={cn(
				"inline-flex h-5 min-w-5 w-fit items-center justify-center gap-1 rounded-sm border border-line-subtle bg-surface-sunken px-1",
				"font-mono text-xs font-medium text-fg-muted select-none",
				"[&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-3",
				className,
			)}
			{...props}
		/>
	);
}

/** 同時に押すキーの組み合わせをまとめる */
export function KbdGroup({ className, ...props }: React.ComponentProps<"kbd">) {
	return <kbd data-slot="kbd-group" className={cn("inline-flex items-center gap-1", className)} {...props} />;
}

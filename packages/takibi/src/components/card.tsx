import type * as React from "react";
import { cn } from "../lib/cn";

/**
 * ひとまとまりの情報を、カードの面と枠と影で囲み、ページから分けて見せる。
 * 中に操作を置くときは CardFooter に寄せる。
 */
export function Card({ className, ...props }: React.ComponentProps<"div">) {
	return (
		<div
			data-slot="card"
			className={cn(
				"flex flex-col gap-4 rounded-lg border border-line-subtle bg-surface-raised py-5 text-fg shadow-card",
				className,
			)}
			{...props}
		/>
	);
}

export function CardHeader({ className, ...props }: React.ComponentProps<"div">) {
	return <div data-slot="card-header" className={cn("flex flex-col gap-1 px-5", className)} {...props} />;
}

export function CardTitle({ className, ...props }: React.ComponentProps<"h3">) {
	return (
		<h3
			data-slot="card-title"
			className={cn("text-base font-semibold tracking-snug text-fg-strong", className)}
			{...props}
		/>
	);
}

export function CardDescription({ className, ...props }: React.ComponentProps<"p">) {
	return <p data-slot="card-description" className={cn("text-sm text-fg-muted", className)} {...props} />;
}

export function CardContent({ className, ...props }: React.ComponentProps<"div">) {
	return <div data-slot="card-content" className={cn("px-5 text-sm", className)} {...props} />;
}

export function CardFooter({ className, ...props }: React.ComponentProps<"div">) {
	return <div data-slot="card-footer" className={cn("flex items-center gap-2 px-5", className)} {...props} />;
}

import type * as React from "react";
import { cn } from "../lib/cn";

/**
 * 読み込み中の面。読み込んだあとの形と大きさに合わせて置き、レイアウトのずれを防ぐ。
 * スクリーンリーダーでは無視されるので、待っていることは別に伝える（aria-busy など）。
 */
export function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
	return (
		<div
			data-slot="skeleton"
			aria-hidden
			className={cn("motion-ember-pulse rounded-md", className)}
			{...props}
		/>
	);
}

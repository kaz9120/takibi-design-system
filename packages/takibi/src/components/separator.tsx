import { Separator as BaseSeparator } from "@base-ui/react/separator";
import type * as React from "react";
import { cn } from "../lib/cn";

/**
 * 内容のまとまりを線で分ける。余白だけで分けられるときは使わない。
 * 縦にするときは orientation="vertical" を渡し、親を flex にする。
 */
export function Separator({
	className,
	orientation = "horizontal",
	...props
}: React.ComponentProps<typeof BaseSeparator>) {
	return (
		<BaseSeparator
			data-slot="separator"
			orientation={orientation}
			className={cn(
				"shrink-0 bg-line-subtle",
				orientation === "horizontal" ? "h-px w-full" : "w-px self-stretch",
				className,
			)}
			{...props}
		/>
	);
}

import { useRender } from "@base-ui/react/use-render";
import { cn } from "../lib/cn";

export type VisuallyHiddenProps = useRender.ComponentProps<"span">;

/**
 * 画面には出さず、スクリーンリーダーにだけ読ませる。アイコンだけの要素に名前を添えるときなどに使う。
 * 見える文言で足りるときは使わない。
 */
export function VisuallyHidden({ className, render, ref, ...props }: VisuallyHiddenProps) {
	return useRender({
		defaultTagName: "span",
		render,
		ref,
		props: { "data-slot": "visually-hidden", ...props, className: cn("sr-only", className) },
	});
}

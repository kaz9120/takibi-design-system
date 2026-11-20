import { useRender } from "@base-ui/react/use-render";
import { cn } from "../lib/cn";

export type SkipLinkProps = useRender.ComponentProps<"a">;

/**
 * キーボードで操作する人が、繰り返し出るナビゲーションを飛ばして本文へ移るためのリンク。
 * ページの先頭に 1 つ置く。Tab を押したときだけ、左上に現れる。
 * 飛び先の要素には id と tabIndex={-1} を付け、フォーカスを受け取れるようにする。
 */
export function SkipLink({ className, render, ref, href = "#main", children, ...props }: SkipLinkProps) {
	return useRender({
		defaultTagName: "a",
		render,
		ref,
		props: {
			"data-slot": "skip-link",
			href,
			children: children ?? "本文へ移動",
			...props,
			className: cn(
				"fixed top-3 left-3 z-[100] inline-flex h-10 items-center gap-2 rounded-md border border-line bg-surface-overlay px-4",
				"text-sm font-medium text-fg-strong shadow-pop outline-none",
				// 隠れている間は左上の外に置く。出るときは着火の曲線で、消えるときは 150ms で速く
				"pointer-events-none -translate-x-3 -translate-y-[calc(100%+1.5rem)] opacity-0",
				"transition-[translate,opacity] duration-150 ease-out-expo",
				"focus:pointer-events-auto focus:translate-x-0 focus:translate-y-0 focus:opacity-100",
				"focus:duration-(--duration-ignite) focus:ease-ignite",
				"focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus",
				className,
			),
		},
	});
}

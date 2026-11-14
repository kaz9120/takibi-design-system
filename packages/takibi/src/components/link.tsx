import { useRender } from "@base-ui/react/use-render";
import { cva, type VariantProps } from "class-variance-authority";
import { ArrowUpRight } from "lucide-react";
import { cn } from "../lib/cn";

export const linkVariants = cva(
	[
		"group/link rounded-sm font-medium outline-none",
		"transition-colors duration-(--duration-fast) ease-standard",
		"focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus",
		"aria-disabled:pointer-events-none aria-disabled:text-fg-subtle",
	],
	{
		variants: {
			variant: {
				/** 本文の中のリンク。ブランドカラーで示す */
				default: "text-brand hover:text-brand-hover active:text-brand-active",
				/** 補足や足元のリンク。周りの文字と同じ色で、下線だけで示す */
				muted: "text-fg-muted hover:text-fg-strong active:text-fg",
			},
		},
		defaultVariants: { variant: "default" },
	},
);

/*
 * 下線は 2 枚の背景で描く。1 枚目は常に薄く敷いた線（色だけに頼らずリンクと分かるように）、
 * 2 枚目は hover で左から描かれる濃い線。離すと右へ抜けて消える。
 * 背景なので、折り返した行にもそれぞれ線が引かれる。
 */
const underline = [
	"[--link-rest:color-mix(in_oklab,currentColor_32%,transparent)]",
	"[background-image:linear-gradient(currentColor,currentColor),linear-gradient(var(--link-rest),var(--link-rest))]",
	"bg-no-repeat [background-position:100%_100%,0_100%] [background-size:0%_1px,100%_1px] pb-px",
	"transition-[background-size] duration-150 ease-out-expo",
	"group-hover/link:[background-position:0_100%,0_100%] group-hover/link:[background-size:100%_1px,100%_1px]",
	"group-hover/link:duration-(--duration-slow) group-hover/link:ease-ember",
	"group-focus-visible/link:[background-size:100%_1px,100%_1px]",
];

export type LinkProps = useRender.ComponentProps<"a"> &
	VariantProps<typeof linkVariants> & {
		/**
		 * 別のサイトへのリンク。矢印を添え、新しいタブで開く。
		 * 矢印は hover で右上へ 2px 動く
		 */
		external?: boolean;
	};

/**
 * 別のページや場所へ移るリンク。行動を起こすもの（保存、送信）にはボタンを使う。
 * ルーターのリンクにするときは `render={<RouterLink to="/" />}` を渡す。
 */
export function Link({
	className,
	variant,
	external,
	render,
	ref,
	children,
	target,
	rel,
	...props
}: LinkProps) {
	return useRender({
		defaultTagName: "a",
		render,
		ref,
		props: {
			"data-slot": "link",
			target: target ?? (external ? "_blank" : undefined),
			rel: rel ?? (external ? "noopener noreferrer" : undefined),
			...props,
			className: cn(linkVariants({ variant }), className),
			children: (
				<>
					<span data-slot="link-text" className={cn(underline)}>
						{children}
					</span>
					{external && (
						<>
							<ArrowUpRight
								aria-hidden
								data-slot="link-external-icon"
								className={cn(
									"ml-0.5 inline-block size-[0.9em] align-[-0.1em]",
									"transition-[translate] duration-150 ease-out-expo",
									"group-hover/link:translate-x-0.5 group-hover/link:-translate-y-0.5",
									"group-hover/link:duration-(--duration-spring-snappy) group-hover/link:ease-spring-snappy",
								)}
							/>
							<span className="sr-only">（新しいタブで開く）</span>
						</>
					)}
				</>
			),
		},
	});
}

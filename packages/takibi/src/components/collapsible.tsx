import { Collapsible as BaseCollapsible } from "@base-ui/react/collapsible";
import { ChevronDown } from "lucide-react";
import type * as React from "react";
import { cn } from "../lib/cn";

/**
 * 1 つの見出しで、1 つの中身を広げたりたたんだりする。詳しい設定や補足のように、
 * 普段は隠しておける内容に使う。見出しが複数並ぶなら Accordion を使う。
 */
export function Collapsible({ className, ...props }: React.ComponentProps<typeof BaseCollapsible.Root>) {
	return (
		<BaseCollapsible.Root data-slot="collapsible" className={cn("flex flex-col", className)} {...props} />
	);
}

export type CollapsibleTriggerProps = React.ComponentProps<typeof BaseCollapsible.Trigger> & {
	/** 右の矢印を出すか。render で別のコンポーネントにしたときは false にする */
	showIcon?: boolean;
};

/**
 * 開け閉めするボタン。押すと 0.97 倍に縮み、開くと矢印が 180 度回って上を向く。
 * 見た目を変えたいときは render で Button などに差し替え、showIcon を false にする。
 */
export function CollapsibleTrigger({
	className,
	children,
	showIcon = true,
	...props
}: CollapsibleTriggerProps) {
	return (
		<BaseCollapsible.Trigger
			data-slot="collapsible-trigger"
			className={cn(
				"group inline-flex h-9 items-center justify-between gap-2 self-start rounded-md px-3 -mx-3 text-sm font-medium text-fg",
				"motion-press outline-none hover:bg-surface-hover hover:text-fg-strong",
				"focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus",
				"data-disabled:cursor-not-allowed data-disabled:text-fg-subtle data-disabled:hover:bg-transparent",
				className,
			)}
			{...props}
		>
			{children}
			{showIcon && (
				<ChevronDown
					aria-hidden
					className="size-4 shrink-0 text-fg-muted transition-[rotate,color] duration-(--duration-spring-press) ease-spring-press group-hover:text-fg group-data-panel-open:rotate-180"
				/>
			)}
		</BaseCollapsible.Trigger>
	);
}

/**
 * 中身。開くと高さ 0 から伸び、閉じるときは同じ曲線で縮む（motion-fold）。
 * ページ内検索で見つけられるよう、閉じていても中身を DOM に残したいときは hiddenUntilFound を渡す。
 */
export function CollapsibleContent({
	className,
	children,
	...props
}: React.ComponentProps<typeof BaseCollapsible.Panel>) {
	return (
		<BaseCollapsible.Panel
			data-slot="collapsible-content"
			className="motion-fold text-sm text-fg-muted [&[hidden]:not([hidden='until-found'])]:hidden"
			{...props}
		>
			<div className={cn("pt-2", className)}>{children}</div>
		</BaseCollapsible.Panel>
	);
}

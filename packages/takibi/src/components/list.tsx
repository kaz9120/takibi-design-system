import { useRender } from "@base-ui/react/use-render";
import { cva, type VariantProps } from "class-variance-authority";
import { ChevronRight } from "lucide-react";
import type * as React from "react";
import { cn } from "../lib/cn";

export const listVariants = cva("flex flex-col gap-1.5 text-base text-fg", {
	variants: {
		variant: {
			/** 順番に意味のない並び。マーカーは控えめな点 */
			unordered: "list-disc pl-5 marker:text-fg-subtle",
			/** 手順など、順番に意味のある並び。番号は桁をそろえる */
			ordered: "list-decimal pl-6 marker:text-fg-muted marker:tabular-nums",
			/** マーカーを付けない並び */
			plain: "list-none",
		},
	},
	defaultVariants: { variant: "unordered" },
});

export type ListProps = React.ComponentProps<"ul"> & VariantProps<typeof listVariants>;

/**
 * 文章の中の箇条書き。ordered にすると ol になる。
 * 押せる行を並べるなら InteractiveList を使う。
 */
export function List({ className, variant, ref, ...props }: ListProps) {
	const shared = {
		"data-slot": "list",
		"data-variant": variant ?? "unordered",
		className: cn(listVariants({ variant }), className),
		...props,
	};
	if (variant === "ordered") return <ol {...shared} />;
	return <ul ref={ref} {...shared} />;
}

export function ListItem({ className, ...props }: React.ComponentProps<"li">) {
	return <li data-slot="list-item" className={cn("pl-1 leading-relaxed", className)} {...props} />;
}

/**
 * 押せる行の並び。設定の一覧や、記録の一覧のように、行ごとに移動や操作があるときに使う。
 * 行は InteractiveListItem と ListItemButton で組む。
 */
export function InteractiveList({ className, ...props }: React.ComponentProps<"ul">) {
	return (
		<ul
			data-slot="interactive-list"
			className={cn(
				"flex flex-col gap-0.5 rounded-lg border border-line-subtle bg-surface-raised p-1",
				className,
			)}
			{...props}
		/>
	);
}

/**
 * 1 行。hover で背景の色が付き、押すと行全体が 0.98 倍に縮み、離すと載る曲線で戻る。
 * 右端の操作（ListItemTrailing の中のボタン）を押したときは、行は縮まない。
 */
export function InteractiveListItem({ className, ...props }: React.ComponentProps<"li">) {
	return (
		<li
			data-slot="interactive-list-item"
			className={cn(
				"group/row relative isolate flex items-center gap-3 rounded-md px-3 py-2.5",
				"[transition:background-color_var(--duration-fast)_var(--ease-standard),scale_var(--duration-land)_var(--ease-land)]",
				"has-[[data-slot=list-item-button]:hover]:bg-surface-hover",
				"has-[[data-slot=list-item-button]:active]:scale-(--press-scale-surface)",
				"has-[[data-slot=list-item-button]:active]:[transition:background-color_var(--duration-fast)_var(--ease-standard),scale_150ms_var(--ease-out-expo)]",
				"has-[[data-slot=list-item-button]:focus-visible]:outline-2 has-[[data-slot=list-item-button]:focus-visible]:outline-focus",
				"has-[[data-slot=list-item-button][data-disabled]]:opacity-50",
				className,
			)}
			{...props}
		/>
	);
}

export type ListItemButtonProps = useRender.ComponentProps<"button"> & {
	disabled?: boolean;
};

/**
 * 行の主な操作。押せる範囲は行全体に広がる。リンクにするときは render={<a href="…" />} を渡す。
 * 中に ListItemLeading、ListItemTitle、ListItemDescription を置く。
 */
export function ListItemButton({ className, render, disabled, ref, ...props }: ListItemButtonProps) {
	return useRender({
		defaultTagName: "button",
		render,
		ref,
		props: {
			"data-slot": "list-item-button",
			"data-disabled": disabled ? "" : undefined,
			"aria-disabled": disabled || undefined,
			type: render ? undefined : "button",
			...props,
			onClick: disabled ? (e: React.MouseEvent) => e.preventDefault() : props.onClick,
			className: cn(
				"flex min-w-0 flex-1 items-center gap-3 text-left outline-none",
				// 押せる範囲を行全体に広げる。右端の操作はこの上に重ねる
				"after:absolute after:inset-0 after:z-0 after:rounded-[inherit] after:content-['']",
				disabled && "cursor-not-allowed",
				className,
			),
		},
	});
}

export function ListItemLeading({ className, ...props }: React.ComponentProps<"span">) {
	return (
		<span
			data-slot="list-item-leading"
			className={cn(
				"flex size-9 shrink-0 items-center justify-center rounded-md bg-surface-sunken text-fg-muted [&>svg]:size-4",
				className,
			)}
			{...props}
		/>
	);
}

/** タイトルと説明を縦に重ねる */
export function ListItemText({ className, ...props }: React.ComponentProps<"span">) {
	return <span data-slot="list-item-text" className={cn("flex min-w-0 flex-col", className)} {...props} />;
}

export function ListItemTitle({ className, ...props }: React.ComponentProps<"span">) {
	return (
		<span
			data-slot="list-item-title"
			className={cn("truncate text-sm font-medium text-fg-strong", className)}
			{...props}
		/>
	);
}

export function ListItemDescription({ className, ...props }: React.ComponentProps<"span">) {
	return (
		<span
			data-slot="list-item-description"
			className={cn("truncate text-sm text-fg-muted", className)}
			{...props}
		/>
	);
}

/** 右端。値や小さなボタンを置く。ボタンは行の押せる範囲の上に重なる */
export function ListItemTrailing({ className, ...props }: React.ComponentProps<"div">) {
	return (
		<div
			data-slot="list-item-trailing"
			className={cn("relative z-10 flex shrink-0 items-center gap-2 text-sm text-fg-muted", className)}
			{...props}
		/>
	);
}

/** 移動する行の右端の矢印。行に hover すると、右へ 2px 寄る */
export function ListItemChevron({ className, ...props }: React.ComponentProps<typeof ChevronRight>) {
	return (
		<ChevronRight
			data-slot="list-item-chevron"
			aria-hidden
			className={cn(
				"pointer-events-none ml-auto size-4 shrink-0 text-fg-subtle",
				"transition-[translate,color] duration-(--duration-pop) ease-pop",
				"group-has-[[data-slot=list-item-button]:hover]/row:translate-x-0.5 group-has-[[data-slot=list-item-button]:hover]/row:text-fg-muted",
				className,
			)}
			{...props}
		/>
	);
}

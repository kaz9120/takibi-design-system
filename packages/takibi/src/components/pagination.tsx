import { mergeProps } from "@base-ui/react/merge-props";
import { useRender } from "@base-ui/react/use-render";
import { ChevronLeft, ChevronRight, MoreHorizontal } from "lucide-react";
import type * as React from "react";
import { cn } from "../lib/cn";
import { Glide, GlideGroup } from "../lib/glide";

/**
 * 長い一覧を、ページに分けて行き来させる。今のページのインジケーターは、選んだページへ滑って移る。
 * 項目は既定でボタンになる。URL で行き来するときは、各リンクの `render` に `<a href>` を渡す。
 * 読み込みながら続きを足す一覧には使わない（「もっと見る」のボタンにする）。
 */
export function Pagination({
	className,
	"aria-label": label = "ページ送り",
	...props
}: React.ComponentProps<"nav">) {
	return (
		<GlideGroup>
			<nav
				data-slot="pagination"
				aria-label={label}
				className={cn("flex w-full justify-center", className)}
				{...props}
			/>
		</GlideGroup>
	);
}

export function PaginationContent({ className, ...props }: React.ComponentProps<"ul">) {
	return (
		<ul data-slot="pagination-content" className={cn("flex items-center gap-1", className)} {...props} />
	);
}

export function PaginationItem(props: React.ComponentProps<"li">) {
	return <li data-slot="pagination-item" {...props} />;
}

const linkClass = [
	"relative isolate inline-flex h-9 min-w-9 items-center justify-center gap-1 rounded-md px-2.5 text-sm font-medium tabular-nums select-none",
	"text-fg-muted motion-press outline-none",
	"hover:not-data-active:not-aria-disabled:not-disabled:bg-surface-hover hover:not-aria-disabled:not-disabled:text-fg",
	"focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus",
	"data-active:text-brand",
	"disabled:cursor-not-allowed disabled:opacity-40 aria-disabled:pointer-events-none aria-disabled:opacity-40",
	"[&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
];

export type PaginationLinkProps = useRender.ComponentProps<"button"> & {
	/** 今のページ。aria-current="page" が付き、インジケーターがこの項目へ滑ってくる */
	isActive?: boolean;
};

export function PaginationLink({ className, isActive, render, children, ...props }: PaginationLinkProps) {
	return useRender({
		defaultTagName: "button",
		render,
		props: mergeProps<"button">(
			{
				type: render ? undefined : "button",
				className: cn(linkClass, className),
				"aria-current": isActive ? "page" : undefined,
				children: (
					<>
						<Glide
							active={Boolean(isActive)}
							layoutId="pagination-active"
							className="bg-brand-soft ring-1 ring-brand/30 ring-inset"
						/>
						{children}
					</>
				),
			},
			{
				...props,
				"data-slot": "pagination-link",
				"data-active": isActive ? "" : undefined,
			} as React.ComponentProps<"button">,
		),
	});
}

export function PaginationPrevious({ children = "前へ", ...props }: Omit<PaginationLinkProps, "isActive">) {
	return (
		<PaginationLink className="pr-3 pl-2" {...props}>
			<ChevronLeft aria-hidden />
			<span>{children}</span>
		</PaginationLink>
	);
}

export function PaginationNext({ children = "次へ", ...props }: Omit<PaginationLinkProps, "isActive">) {
	return (
		<PaginationLink className="pr-2 pl-3" {...props}>
			<span>{children}</span>
			<ChevronRight aria-hidden />
		</PaginationLink>
	);
}

/** 省いたページ。スクリーンリーダーでは「ほかのページ」と伝える */
export function PaginationEllipsis({ className, ...props }: React.ComponentProps<"span">) {
	return (
		<span
			data-slot="pagination-ellipsis"
			className={cn("inline-flex size-9 items-center justify-center text-fg-subtle", className)}
			{...props}
		>
			<MoreHorizontal aria-hidden className="size-4" />
			<span className="sr-only">ほかのページ</span>
		</span>
	);
}

/**
 * 並べるページの番号を返す。両端と今のページの前後 `siblings` 個を残し、間は "ellipsis" で省く。
 * 返す要素の数は、ページ数が多くても `siblings * 2 + 5` 個で一定になる。
 */
export function getPaginationRange(page: number, total: number, siblings = 1): (number | "ellipsis")[] {
	const slots = siblings * 2 + 5;
	if (total <= slots) return Array.from({ length: total }, (_, i) => i + 1);
	const start = Math.max(2, Math.min(page - siblings, total - siblings * 2 - 2));
	const end = Math.min(total - 1, Math.max(page + siblings, siblings * 2 + 3));
	const middle = Array.from({ length: end - start + 1 }, (_, i) => start + i);
	return [
		1,
		...(start > 2 ? (["ellipsis"] as const) : []),
		...middle,
		...(end < total - 1 ? (["ellipsis"] as const) : []),
		total,
	];
}

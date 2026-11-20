import { ArrowUp } from "lucide-react";
import * as React from "react";
import { cn } from "../lib/cn";

type Density = "dense" | "comfortable";

const TableContext = React.createContext<{ density: Density }>({ density: "comfortable" });

export type TableProps = React.ComponentProps<"table"> & {
	/** dense は行を詰めて一覧を多く見せる。comfortable（既定）は 1 行ずつ読ませる */
	density?: Density;
};

/**
 * 行と列で比べて読むデータを並べる。並べ替えたい列には TableHead の `sort` を渡す。
 * 見出しだけを並べた一覧や、カードの格子で足りるときは使わない。
 */
export function Table({ className, density = "comfortable", ...props }: TableProps) {
	const context = React.useMemo(() => ({ density }), [density]);
	return (
		<div data-slot="table-container" className="relative w-full overflow-x-auto">
			<TableContext.Provider value={context}>
				<table
					data-slot="table"
					data-density={density}
					className={cn("w-full caption-bottom border-collapse text-sm text-fg", className)}
					{...props}
				/>
			</TableContext.Provider>
		</div>
	);
}

export function TableHeader({ className, ...props }: React.ComponentProps<"thead">) {
	return (
		<thead
			data-slot="table-header"
			className={cn("[&_tr]:border-b [&_tr]:border-line", className)}
			{...props}
		/>
	);
}

export function TableBody({ className, ...props }: React.ComponentProps<"tbody">) {
	return <tbody data-slot="table-body" className={cn("[&_tr:last-child]:border-0", className)} {...props} />;
}

export function TableFooter({ className, ...props }: React.ComponentProps<"tfoot">) {
	return (
		<tfoot
			data-slot="table-footer"
			className={cn("border-t border-line font-medium text-fg-strong [&>tr]:last:border-b-0", className)}
			{...props}
		/>
	);
}

export type TableRowProps = React.ComponentProps<"tr"> & {
	/** 選んでいる行。背景がブランドカラーの薄い色になる。チェックボックスと組み合わせるときは、その状態と合わせる */
	selected?: boolean;
};

export function TableRow({ className, selected, ...props }: TableRowProps) {
	return (
		<tr
			data-slot="table-row"
			data-selected={selected || undefined}
			className={cn(
				"border-b border-line-subtle transition-colors duration-(--duration-fast) ease-standard",
				"[tbody_&]:hover:bg-surface-hover",
				"data-selected:bg-brand-soft [tbody_&]:data-selected:hover:bg-brand-soft",
				className,
			)}
			{...props}
		/>
	);
}

export type TableSortDirection = "ascending" | "descending" | "none";

export type TableHeadProps = React.ComponentProps<"th"> & {
	/** 並べ替えられる列にする。今の向きを渡すと、見出しがボタンになり矢印が向きを示す */
	sort?: TableSortDirection;
	/** 見出しのボタンを押したとき。次の向きはアプリ側で決める */
	onSort?: () => void;
};

export function TableHead({ className, sort, onSort, children, ...props }: TableHeadProps) {
	const { density } = React.useContext(TableContext);
	const sortable = sort !== undefined;
	return (
		<th
			data-slot="table-head"
			scope="col"
			aria-sort={sortable && sort !== "none" ? sort : undefined}
			className={cn(
				"px-3 text-left align-middle text-sm font-medium whitespace-nowrap text-fg-muted",
				density === "dense" ? "h-9" : "h-11",
				sortable && "px-1.5",
				"[&:has([role=checkbox])]:w-10 [&:has([role=checkbox])]:pr-0",
				className,
			)}
			{...props}
		>
			{sortable ? (
				<button
					type="button"
					data-slot="table-sort"
					data-sort={sort}
					onClick={onSort}
					className={cn(
						"group/sort inline-flex h-8 items-center gap-1.5 rounded-md px-1.5 font-medium motion-press outline-none",
						"hover:bg-surface-hover hover:text-fg data-[sort=ascending]:text-fg-strong data-[sort=descending]:text-fg-strong",
						"focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus",
					)}
				>
					{children}
					<ArrowUp
						aria-hidden
						className={cn(
							"size-3.5 [transition:rotate_var(--duration-sway)_var(--ease-sway),opacity_var(--duration-fast)_var(--ease-standard),color_var(--duration-fast)_var(--ease-standard)]",
							sort === "descending" && "rotate-180",
							sort === "none"
								? "opacity-0 group-hover/sort:opacity-50 group-focus-visible/sort:opacity-50"
								: "text-brand opacity-100",
						)}
					/>
				</button>
			) : (
				children
			)}
		</th>
	);
}

export function TableCell({ className, ...props }: React.ComponentProps<"td">) {
	const { density } = React.useContext(TableContext);
	return (
		<td
			data-slot="table-cell"
			className={cn(
				"px-3 align-middle",
				density === "dense" ? "py-1.5" : "py-3",
				"[&:has([role=checkbox])]:w-10 [&:has([role=checkbox])]:pr-0",
				className,
			)}
			{...props}
		/>
	);
}

export function TableCaption({ className, ...props }: React.ComponentProps<"caption">) {
	return (
		<caption data-slot="table-caption" className={cn("mt-3 text-sm text-fg-muted", className)} {...props} />
	);
}

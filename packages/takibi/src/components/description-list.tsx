import * as React from "react";
import { cn } from "../lib/cn";

type Layout = "horizontal" | "stacked";

const DescriptionListContext = React.createContext<{ layout: Layout }>({ layout: "horizontal" });

export type DescriptionListProps = React.ComponentProps<"dl"> & {
	/** horizontal（既定）は項目名を左、値を右に置く。stacked は項目名を上に置き、狭い幅やカードの中で使う */
	layout?: Layout;
};

/**
 * 項目名と値の組を並べて見せる。アカウントの設定や詳細の画面で、読むための情報に使う。
 * 値を書き換えさせるときは Field を使う。列で比べたいときは Table を使う。
 */
export function DescriptionList({ className, layout = "horizontal", ...props }: DescriptionListProps) {
	const context = React.useMemo(() => ({ layout }), [layout]);
	return (
		<DescriptionListContext.Provider value={context}>
			<dl
				data-slot="description-list"
				data-layout={layout}
				className={cn(
					"flex flex-col text-sm",
					layout === "horizontal" && "divide-y divide-line-subtle",
					layout === "stacked" && "gap-4",
					className,
				)}
				{...props}
			/>
		</DescriptionListContext.Provider>
	);
}

/** 項目名と値の 1 組。`<dl>` の中で `<div>` として囲む */
export function DescriptionItem({ className, ...props }: React.ComponentProps<"div">) {
	const { layout } = React.useContext(DescriptionListContext);
	return (
		<div
			data-slot="description-item"
			className={cn(
				layout === "horizontal"
					? "grid grid-cols-1 gap-1 py-3 sm:grid-cols-[minmax(8rem,12rem)_1fr] sm:items-baseline sm:gap-6"
					: "flex flex-col gap-1",
				className,
			)}
			{...props}
		/>
	);
}

export function DescriptionTerm({ className, ...props }: React.ComponentProps<"dt">) {
	return <dt data-slot="description-term" className={cn("text-fg-muted", className)} {...props} />;
}

export function DescriptionDetails({ className, ...props }: React.ComponentProps<"dd">) {
	return (
		<dd
			data-slot="description-details"
			className={cn("flex min-w-0 items-center gap-2 text-fg-strong [overflow-wrap:anywhere]", className)}
			{...props}
		/>
	);
}

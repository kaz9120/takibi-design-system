import { Menu as BaseMenu } from "@base-ui/react/menu";
import { ChevronRight, Ellipsis } from "lucide-react";
import * as React from "react";
import { cn } from "../lib/cn";
import { Glide } from "../lib/glide";
import { Link, type LinkProps } from "./link";
import { Menu, MenuContent, MenuTrigger } from "./menu";

/**
 * 今いるページが、階層のどこにあるかを示す。2 階層以上あるときに使う。
 * 最後の項目は今のページで、リンクにしない。長いときは中ほどを BreadcrumbsEllipsis にたたむ。
 */
export function Breadcrumbs({
	"aria-label": ariaLabel = "パンくずリスト",
	...props
}: React.ComponentProps<"nav">) {
	return <nav data-slot="breadcrumbs" aria-label={ariaLabel} {...props} />;
}

export function BreadcrumbsList({ className, ...props }: React.ComponentProps<"ol">) {
	return (
		<ol
			data-slot="breadcrumbs-list"
			className={cn("flex flex-wrap items-center gap-1.5 text-sm break-words text-fg-muted", className)}
			{...props}
		/>
	);
}

export function BreadcrumbsItem({ className, ...props }: React.ComponentProps<"li">) {
	return (
		<li
			data-slot="breadcrumbs-item"
			className={cn("inline-flex items-center gap-1.5", className)}
			{...props}
		/>
	);
}

/** 上の階層へのリンク。下線が左から描かれる */
export function BreadcrumbsLink({ variant = "muted", className, ...props }: LinkProps) {
	return (
		<Link
			data-slot="breadcrumbs-link"
			variant={variant}
			className={cn("font-normal", className)}
			{...props}
		/>
	);
}

/** 今のページ。リンクにせず、aria-current="page" を付ける */
export function BreadcrumbsPage({ className, ...props }: React.ComponentProps<"span">) {
	return (
		<span
			data-slot="breadcrumbs-page"
			aria-current="page"
			className={cn("font-medium text-fg-strong", className)}
			{...props}
		/>
	);
}

/** 項目の区切り。読み上げない */
export function BreadcrumbsSeparator({ className, children, ...props }: React.ComponentProps<"li">) {
	return (
		<li
			data-slot="breadcrumbs-separator"
			role="presentation"
			aria-hidden
			className={cn("text-fg-subtle [&>svg]:size-3.5", className)}
			{...props}
		>
			{children ?? <ChevronRight />}
		</li>
	);
}

export type BreadcrumbsCollapsedItem = { label: React.ReactNode; href: string };

export type BreadcrumbsEllipsisProps = {
	/** たたんだ階層。上から順に並べる */
	items: BreadcrumbsCollapsedItem[];
	/** ルーターのリンクにするときに、項目ごとの要素を返す */
	renderLink?: (item: BreadcrumbsCollapsedItem) => React.ReactElement;
	/** ボタンのアクセシブルネーム */
	label?: string;
	className?: string;
};

/**
 * たたんだ中ほどの階層。押すとメニューが開き、たたんだ階層へ移れる。
 * メニューの位置がずれないよう、ボタンは押しても大きさを変えない。
 */
export function BreadcrumbsEllipsis({
	items,
	renderLink,
	label = "ほかの階層を見る",
	className,
}: BreadcrumbsEllipsisProps) {
	return (
		<Menu>
			<MenuTrigger
				data-slot="breadcrumbs-ellipsis"
				aria-label={label}
				className={cn(
					"inline-flex h-6 min-w-6 items-center justify-center rounded-sm px-1 text-fg-muted outline-none",
					"transition-colors duration-(--duration-fast) ease-standard",
					"hover:bg-surface-hover hover:text-fg-strong data-popup-open:bg-surface-hover data-popup-open:text-fg-strong",
					"focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus",
					"[&>svg]:size-4",
					className,
				)}
			>
				<Ellipsis />
			</MenuTrigger>
			<MenuContent>
				{items.map((item) => (
					<BaseMenu.LinkItem
						key={item.href}
						data-slot="breadcrumbs-menu-link"
						closeOnClick
						className={cn(
							"relative isolate flex cursor-default items-center gap-2 rounded-md px-2 py-1.5 text-fg outline-none select-none",
							"transition-colors duration-(--duration-fast) ease-standard data-highlighted:text-fg-strong",
						)}
						render={(props, state) => {
							// biome-ignore lint/a11y/useAnchorContent: 中身は下の cloneElement で入れる
							const element = renderLink?.(item) ?? <a href={item.href} />;
							return React.cloneElement(element, props, <Glide active={state.highlighted} />, item.label);
						}}
					/>
				))}
			</MenuContent>
		</Menu>
	);
}

export type BreadcrumbsTrailItem = { label: React.ReactNode; href?: string };

export type BreadcrumbsTrailProps = Omit<React.ComponentProps<"nav">, "children"> & {
	/** 上の階層から順に。最後の項目が今のページ */
	items: BreadcrumbsTrailItem[];
	/** これより多いと、先頭と末尾の 2 つを残して中ほどをたたむ */
	maxItems?: number;
	/** ルーターのリンクにするときに、項目ごとの要素を返す */
	renderLink?: (item: BreadcrumbsCollapsedItem) => React.ReactElement;
};

/** 配列からパンくずを組み立てる。長いときは中ほどを自動でたたむ */
export function BreadcrumbsTrail({ items, maxItems = 4, renderLink, ...props }: BreadcrumbsTrailProps) {
	const collapses = items.length > maxItems;
	const head = collapses ? items.slice(0, 1) : items.slice(0, -1);
	const middle = collapses ? items.slice(1, -2) : [];
	const tail = collapses ? items.slice(-2, -1) : [];
	const current = items[items.length - 1];
	const linkOf = (item: BreadcrumbsTrailItem) => {
		const href = item.href ?? "#";
		const element = renderLink?.({ label: item.label, href });
		return (
			<BreadcrumbsLink href={href} render={element}>
				{item.label}
			</BreadcrumbsLink>
		);
	};
	return (
		<Breadcrumbs {...props}>
			<BreadcrumbsList>
				{head.map((item, i) => (
					<React.Fragment key={item.href ?? i}>
						<BreadcrumbsItem>{linkOf(item)}</BreadcrumbsItem>
						<BreadcrumbsSeparator />
					</React.Fragment>
				))}
				{collapses && (
					<>
						<BreadcrumbsItem>
							<BreadcrumbsEllipsis
								items={middle.map((m) => ({ label: m.label, href: m.href ?? "#" }))}
								renderLink={renderLink}
							/>
						</BreadcrumbsItem>
						<BreadcrumbsSeparator />
					</>
				)}
				{tail.map((item, i) => (
					<React.Fragment key={item.href ?? `tail-${i}`}>
						<BreadcrumbsItem>{linkOf(item)}</BreadcrumbsItem>
						<BreadcrumbsSeparator />
					</React.Fragment>
				))}
				{current && (
					<BreadcrumbsItem>
						<BreadcrumbsPage>{current.label}</BreadcrumbsPage>
					</BreadcrumbsItem>
				)}
			</BreadcrumbsList>
		</Breadcrumbs>
	);
}

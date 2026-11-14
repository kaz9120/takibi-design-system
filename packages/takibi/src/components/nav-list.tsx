import { useRender } from "@base-ui/react/use-render";
import * as React from "react";
import { cn } from "../lib/cn";
import { Glide, GlideGroup } from "../lib/glide";

/**
 * 設定やアカウントの画面の横に置く、縦のナビゲーション。ページの中の切り替えにはタブを使う。
 * 今のページの項目に `active` を付けると、選択中の背景がその項目へ滑って移る。
 */
export function NavList({
	className,
	children,
	"aria-label": ariaLabel = "サイドメニュー",
	...props
}: React.ComponentProps<"nav">) {
	return (
		<nav
			data-slot="nav-list"
			aria-label={ariaLabel}
			className={cn("flex flex-col gap-4", className)}
			{...props}
		>
			<GlideGroup>{children}</GlideGroup>
		</nav>
	);
}

/** 項目のまとまり。ラベルを付けるときは NavListLabel を最初に置く */
export function NavListGroup({ className, children, ...props }: React.ComponentProps<"div">) {
	const labelId = React.useId();
	let hasLabel = false;
	const content = React.Children.map(children, (child) => {
		if (React.isValidElement(child) && child.type === NavListLabel) {
			hasLabel = true;
			return React.cloneElement(child as React.ReactElement<{ id?: string }>, { id: labelId });
		}
		return child;
	});
	return (
		// biome-ignore lint/a11y/useSemanticElements: fieldset は入力欄のまとまりなので、ナビゲーションには使わない
		<div
			data-slot="nav-list-group"
			role="group"
			aria-labelledby={hasLabel ? labelId : undefined}
			className={cn("flex flex-col", className)}
			{...props}
		>
			{content}
		</div>
	);
}

export function NavListLabel({ className, ...props }: React.ComponentProps<"div">) {
	return (
		<div
			data-slot="nav-list-label"
			className={cn("px-3 pb-1.5 text-xs font-medium tracking-wide text-fg-subtle", className)}
			{...props}
		/>
	);
}

export type NavListItemProps = useRender.ComponentProps<"a"> & {
	/** 今のページの項目。aria-current="page" が付き、選択中の背景が滑ってくる */
	active?: boolean;
	/** 項目の頭に置くアイコン */
	icon?: React.ReactNode;
	/** 右端に添える件数など。Badge を渡す */
	badge?: React.ReactNode;
	disabled?: boolean;
};

export function NavListItem({
	className,
	active = false,
	icon,
	badge,
	disabled,
	render,
	ref,
	children,
	...props
}: NavListItemProps) {
	return useRender({
		defaultTagName: "a",
		render,
		ref,
		props: {
			"data-slot": "nav-list-item",
			"data-active": active ? "" : undefined,
			"aria-current": active ? "page" : undefined,
			"aria-disabled": disabled || undefined,
			tabIndex: disabled ? -1 : undefined,
			...props,
			className: cn(
				"group/nav relative isolate flex h-9 items-center gap-2.5 rounded-md px-3 text-sm text-fg-muted outline-none select-none",
				// 押すと少し沈み、離すとばねで戻る。行は大きな面なので、沈み方は浅くする
				"motion-press-surface",
				"hover:bg-surface-hover hover:text-fg",
				"data-active:font-medium data-active:text-fg-strong data-active:hover:bg-transparent",
				"focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-focus",
				"aria-disabled:pointer-events-none aria-disabled:text-fg-subtle",
				"[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
				className,
			),
			children: (
				<>
					<Glide
						active={Boolean(active)}
						layoutId="nav-list-active"
						data-slot="nav-list-indicator"
						className="bg-brand-soft"
					/>
					{icon && (
						<span
							data-slot="nav-list-icon"
							className={cn(
								"inline-flex text-fg-subtle transition-colors duration-(--duration-fast) ease-standard",
								active ? "text-brand" : "group-hover/nav:text-fg-muted",
							)}
						>
							{icon}
						</span>
					)}
					<span className="min-w-0 flex-1 truncate">{children}</span>
					{badge && <span data-slot="nav-list-badge">{badge}</span>}
				</>
			),
		},
	});
}

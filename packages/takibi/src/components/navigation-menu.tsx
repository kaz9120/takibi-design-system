import { NavigationMenu as BaseNavigationMenu } from "@base-ui/react/navigation-menu";
import { ChevronDown } from "lucide-react";
import type * as React from "react";
import { cn } from "../lib/cn";
import { Glide, GlideGroup } from "../lib/glide";

/**
 * サイトの上に置く、横並びのナビゲーション。項目から下へパネルを開き、関連するページを並べる。
 * アプリの中の操作の一覧にはメニューかメニューバーを使う。
 * 項目を移るたびに、パネルの幅と高さが中身に合わせて変わり、中身は進んだ向きから入ってくる。
 */
export function NavigationMenu({
	className,
	children,
	...props
}: React.ComponentProps<typeof BaseNavigationMenu.Root>) {
	return (
		<BaseNavigationMenu.Root
			data-slot="navigation-menu"
			className={cn("relative min-w-max text-sm text-fg", className)}
			{...props}
		>
			<GlideGroup>{children}</GlideGroup>
			<NavigationMenuViewport />
		</BaseNavigationMenu.Root>
	);
}

export function NavigationMenuList({
	className,
	...props
}: React.ComponentProps<typeof BaseNavigationMenu.List>) {
	return (
		<BaseNavigationMenu.List
			data-slot="navigation-menu-list"
			className={cn("relative flex items-center gap-0.5", className)}
			{...props}
		/>
	);
}

export function NavigationMenuItem(props: React.ComponentProps<typeof BaseNavigationMenu.Item>) {
	return <BaseNavigationMenu.Item data-slot="navigation-menu-item" {...props} />;
}

const topLevel = [
	"relative isolate inline-flex h-9 items-center justify-center gap-1.5 rounded-md px-3 text-sm font-medium text-fg-muted select-none no-underline",
	"outline-none transition-colors duration-(--duration-fast) ease-standard",
	"hover:bg-surface-hover hover:text-fg data-popup-open:text-fg-strong data-popup-open:hover:bg-transparent",
	"focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-focus",
	"[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
];

/** 開いている項目の下に敷く背景。項目を移ると、背景が滑って移る */
function OpenBackdrop({ open }: { open: boolean }) {
	return <Glide active={open} layoutId="navigation-menu-open" />;
}

/** パネルを開く項目。押しても大きさは変えない（パネルの位置がずれるため） */
export function NavigationMenuTrigger({
	className,
	children,
	...props
}: React.ComponentProps<typeof BaseNavigationMenu.Trigger>) {
	return (
		<BaseNavigationMenu.Trigger
			data-slot="navigation-menu-trigger"
			className={cn(topLevel, className)}
			render={(triggerProps, state) => (
				<button type="button" {...triggerProps}>
					<OpenBackdrop open={state.open} />
					{triggerProps.children}
				</button>
			)}
			{...props}
		>
			{children}
			<BaseNavigationMenu.Icon
				data-slot="navigation-menu-icon"
				className={cn(
					"inline-flex text-fg-subtle",
					"transition-[rotate,color] duration-150 ease-out-expo",
					"data-popup-open:rotate-180 data-popup-open:text-fg-muted",
					"data-popup-open:duration-(--duration-spring-snappy) data-popup-open:ease-spring-snappy",
				)}
			>
				<ChevronDown className="size-3.5" />
			</BaseNavigationMenu.Icon>
		</BaseNavigationMenu.Trigger>
	);
}

/** パネルの中身。項目を移ると、進んだ向きから寄りながら現れ、前の中身は反対へ抜ける */
export function NavigationMenuContent({
	className,
	...props
}: React.ComponentProps<typeof BaseNavigationMenu.Content>) {
	return (
		<BaseNavigationMenu.Content
			data-slot="navigation-menu-content"
			className={cn(
				"h-full w-[calc(100vw-2rem)] p-2 sm:w-max",
				"transition-[opacity,translate,filter] duration-(--duration-spring-glide) ease-spring-glide",
				"data-starting-style:opacity-0 data-ending-style:opacity-0",
				"data-ending-style:blur-[2px] data-ending-style:duration-150 data-ending-style:ease-out-expo",
				"data-starting-style:data-[activation-direction=left]:-translate-x-1/4",
				"data-starting-style:data-[activation-direction=right]:translate-x-1/4",
				"data-ending-style:data-[activation-direction=left]:translate-x-1/4",
				"data-ending-style:data-[activation-direction=right]:-translate-x-1/4",
				className,
			)}
			{...props}
		/>
	);
}

export type NavigationMenuLinkProps = React.ComponentProps<typeof BaseNavigationMenu.Link>;

/**
 * 並びの中に直接置くリンク。パネルの中のリンクには NavigationMenuCard を使う。
 * 今のページには `active` を付ける。
 */
export function NavigationMenuLink({ className, ...props }: NavigationMenuLinkProps) {
	return (
		<BaseNavigationMenu.Link
			data-slot="navigation-menu-link"
			className={cn(topLevel, "data-active:text-fg-strong", className)}
			{...props}
		/>
	);
}

export type NavigationMenuCardProps = Omit<NavigationMenuLinkProps, "title"> & {
	title: React.ReactNode;
	description?: React.ReactNode;
	icon?: React.ReactNode;
};

/** パネルの中のリンク。タイトルと 1 行の説明を並べる。hover で背景が明るくなり、アイコンがブランドカラーになる */
export function NavigationMenuCard({
	className,
	title,
	description,
	icon,
	...props
}: NavigationMenuCardProps) {
	return (
		<BaseNavigationMenu.Link
			data-slot="navigation-menu-card"
			closeOnClick
			className={cn(
				"group/card flex gap-3 rounded-md p-3 text-left no-underline outline-none",
				"motion-press-surface hover:bg-surface-hover",
				"focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-focus",
				className,
			)}
			{...props}
		>
			{icon && (
				<span
					className={cn(
						"mt-0.5 inline-flex size-8 shrink-0 items-center justify-center rounded-md border border-line-subtle bg-surface-raised text-fg-muted",
						"transition-colors duration-(--duration-base) ease-ember",
						"group-hover/card:border-line group-hover/card:text-brand [&_svg]:size-4",
					)}
				>
					{icon}
				</span>
			)}
			<span className="flex min-w-0 flex-col gap-0.5">
				<span className="text-sm font-medium text-fg-strong">{title}</span>
				{description && <span className="text-sm text-fg-muted">{description}</span>}
			</span>
		</BaseNavigationMenu.Link>
	);
}

/**
 * パネルの入れ物。NavigationMenu が中に 1 つ置くので、アプリ側で置く必要はない。
 * パネルの幅と高さ、位置は、Base UI が出す大きさの変数をばねで追う。
 */
function NavigationMenuViewport() {
	return (
		<BaseNavigationMenu.Portal>
			<BaseNavigationMenu.Positioner
				data-slot="navigation-menu-positioner"
				sideOffset={8}
				collisionPadding={{ top: 8, bottom: 8, left: 16, right: 16 }}
				collisionAvoidance={{ side: "none" }}
				className={cn(
					"z-50 h-(--positioner-height) w-(--positioner-width) max-w-(--available-width)",
					"transition-[top,left,right,bottom] duration-(--duration-spring-glide) ease-spring-glide data-instant:transition-none",
					// パネルとの隙間でも hover が切れないよう、透明の帯を足す
					"before:absolute before:inset-x-0 before:-top-2 before:h-2 before:content-['']",
				)}
			>
				<BaseNavigationMenu.Popup
					data-slot="navigation-menu-popup"
					className={cn(
						"relative h-(--popup-height) w-(--popup-width) origin-(--transform-origin) overflow-hidden",
						"rounded-lg border border-line bg-surface-overlay text-fg shadow-pop outline-none",
						"transition-[opacity,scale,width,height] duration-(--duration-spring-glide) ease-spring-glide",
						"data-starting-style:scale-[0.96] data-starting-style:opacity-0",
						"data-ending-style:scale-[0.96] data-ending-style:opacity-0 data-ending-style:duration-150 data-ending-style:ease-out-expo",
					)}
				>
					<BaseNavigationMenu.Viewport
						data-slot="navigation-menu-viewport"
						className="relative h-full w-full overflow-hidden"
					/>
				</BaseNavigationMenu.Popup>
			</BaseNavigationMenu.Positioner>
		</BaseNavigationMenu.Portal>
	);
}

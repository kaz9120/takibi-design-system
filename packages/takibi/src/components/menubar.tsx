import { Menu as BaseMenu } from "@base-ui/react/menu";
import { Menubar as BaseMenubar } from "@base-ui/react/menubar";
import type * as React from "react";
import { cn } from "../lib/cn";
import { Glide, GlideGroup } from "../lib/glide";
import { MenuContent, type MenuContentProps } from "./menu";

/**
 * アプリの上に置く、メニューの並び（ファイル、編集、表示など）。1 つ開いたあとは、
 * hover や左右の矢印キーで隣のメニューへすぐ移れる。中の項目には Menu のコンポーネント（MenuItem など）を使う。
 */
export function Menubar({ className, children, ...props }: React.ComponentProps<typeof BaseMenubar>) {
	return (
		<BaseMenubar
			data-slot="menubar"
			className={cn(
				"flex w-fit items-center gap-0.5 rounded-lg border border-line-subtle bg-surface-raised p-0.5 shadow-rim",
				"data-[orientation=vertical]:flex-col data-[orientation=vertical]:items-stretch",
				className,
			)}
			{...props}
		>
			<GlideGroup>{children}</GlideGroup>
		</BaseMenubar>
	);
}

/** メニューバーの中の 1 つのメニュー。MenubarTrigger と MenubarContent を入れる */
export const MenubarMenu = BaseMenu.Root;

/**
 * メニューを開く項目。開いている項目の下には面が敷かれ、隣のメニューへ移ると面が滑って移る。
 * 中身が現れる動きは、メニューの間を続けて移るときだけ 0ms になる（motion-rise が data-instant を見る）。
 */
export function MenubarTrigger({
	className,
	children,
	...props
}: React.ComponentProps<typeof BaseMenu.Trigger>) {
	return (
		<BaseMenu.Trigger
			data-slot="menubar-trigger"
			className={cn(
				"relative isolate inline-flex h-8 items-center gap-1.5 rounded-md px-3 text-sm font-medium text-fg-muted select-none",
				"outline-none transition-colors duration-(--duration-fast) ease-standard",
				"hover:bg-surface-hover hover:text-fg data-popup-open:text-fg-strong data-popup-open:hover:bg-transparent",
				"focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-focus",
				"data-disabled:pointer-events-none data-disabled:text-fg-subtle",
				"[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
				className,
			)}
			render={(triggerProps, state) => (
				<button type="button" {...triggerProps}>
					<Glide active={state.open} layoutId="menubar-open" />
					{triggerProps.children}
				</button>
			)}
			{...props}
		>
			{children}
		</BaseMenu.Trigger>
	);
}

/** メニューの中身。Menu と同じ見た目で、項目の下から開く */
export function MenubarContent({ sideOffset = 6, align = "start", ...props }: MenuContentProps) {
	return <MenuContent data-slot="menubar-content" sideOffset={sideOffset} align={align} {...props} />;
}

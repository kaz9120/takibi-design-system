import { Tabs as BaseTabs } from "@base-ui/react/tabs";
import type * as React from "react";
import { cn } from "../lib/cn";

/**
 * 同じ場所で、並列の内容を切り替える。順に進む手順には使わない。
 * 矢印キーでタブを移り、Enter か Space で開く。
 */
export function Tabs({ className, ...props }: React.ComponentProps<typeof BaseTabs.Root>) {
	return <BaseTabs.Root data-slot="tabs" className={cn("flex flex-col gap-4", className)} {...props} />;
}

/** タブを並べる。選択中の下線を出すため、中に TabsIndicator を 1 つ置く */
export function TabsList({ className, ...props }: React.ComponentProps<typeof BaseTabs.List>) {
	return (
		<BaseTabs.List
			data-slot="tabs-list"
			className={cn("relative flex items-center gap-1 border-b border-line-subtle", className)}
			{...props}
		/>
	);
}

export function TabsTab({ className, ...props }: React.ComponentProps<typeof BaseTabs.Tab>) {
	return (
		<BaseTabs.Tab
			data-slot="tabs-tab"
			className={cn(
				"inline-flex h-9 items-center justify-center gap-2 whitespace-nowrap rounded-md px-3 text-sm font-medium text-fg-muted select-none",
				"outline-none transition-[color,background-color] duration-(--duration-fast) ease-standard",
				"hover:not-data-disabled:bg-surface-hover hover:not-data-disabled:text-fg focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-focus",
				"data-active:text-fg-strong data-disabled:cursor-not-allowed data-disabled:text-fg-subtle",
				"[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
				className,
			)}
			{...props}
		/>
	);
}

/** 選択中のタブの下線。タブを移ると、進む側の端が先に 160ms で伸び、反対の端が 330ms で追いつく（炎の舌） */
export function TabsIndicator({ className, ...props }: React.ComponentProps<typeof BaseTabs.Indicator>) {
	return (
		<BaseTabs.Indicator
			data-slot="tabs-indicator"
			className={cn(
				"motion-tongue absolute -bottom-px left-(--active-tab-left) right-(--active-tab-right) h-0.5 rounded-full bg-brand",
				className,
			)}
			{...props}
		/>
	);
}

export function TabsPanel({ className, ...props }: React.ComponentProps<typeof BaseTabs.Panel>) {
	return (
		<BaseTabs.Panel
			data-slot="tabs-panel"
			className={cn(
				"motion-scene text-sm text-fg outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus",
				className,
			)}
			{...props}
		/>
	);
}

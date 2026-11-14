import { ScrollArea as BaseScrollArea } from "@base-ui/react/scroll-area";
import type * as React from "react";
import { cn } from "../lib/cn";

type Orientation = "vertical" | "horizontal" | "both";

/*
 * 端の透かし。まだ続きがある端だけを、24px かけて透かす。
 * Base UI が端までの距離（--scroll-area-overflow-*）を出すので、端に近づくにつれて透かしが狭まり、着くと消える。
 */
const fadeY =
	"linear-gradient(to bottom, transparent 0, #000 min(24px, var(--scroll-area-overflow-y-start, 0px)), #000 calc(100% - min(24px, var(--scroll-area-overflow-y-end, 0px))), transparent 100%)";
const fadeX =
	"linear-gradient(to right, transparent 0, #000 min(24px, var(--scroll-area-overflow-x-start, 0px)), #000 calc(100% - min(24px, var(--scroll-area-overflow-x-end, 0px))), transparent 100%)";

const masks: Record<Orientation, React.CSSProperties> = {
	vertical: { maskImage: fadeY },
	horizontal: { maskImage: fadeX },
	both: { maskImage: `${fadeY}, ${fadeX}`, maskComposite: "intersect" },
};

export type ScrollAreaProps = React.ComponentProps<typeof BaseScrollArea.Root> & {
	/** スクロールする向き。both は縦横どちらにもスクロールできる表や画像に使う */
	orientation?: Orientation;
	/** 続きのある端を透かすか */
	fade?: boolean;
	/** 中身を包む要素のクラス。余白はここに付ける */
	viewportClassName?: string;
};

/**
 * 決まった高さや幅の中で、中身をスクロールする。細いハンドルは、ポインターが乗っているかスクロールしている間だけ出て、
 * 止まると 360ms で消える。続きのある端は透かして、まだ先があることを示す。
 */
export function ScrollArea({
	className,
	viewportClassName,
	orientation = "vertical",
	fade = true,
	children,
	...props
}: ScrollAreaProps) {
	return (
		<BaseScrollArea.Root
			data-slot="scroll-area"
			className={cn("relative flex min-h-0 overflow-hidden", className)}
			{...props}
		>
			<BaseScrollArea.Viewport
				data-slot="scroll-area-viewport"
				className={cn(
					"min-h-0 flex-1 overscroll-contain rounded-[inherit] outline-none",
					"focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-focus",
					viewportClassName,
				)}
				style={fade ? { ...masks[orientation], maskRepeat: "no-repeat" } : undefined}
			>
				<BaseScrollArea.Content data-slot="scroll-area-content">{children}</BaseScrollArea.Content>
			</BaseScrollArea.Viewport>
			{orientation !== "horizontal" && <ScrollBar orientation="vertical" />}
			{orientation !== "vertical" && <ScrollBar orientation="horizontal" />}
			{orientation === "both" && <BaseScrollArea.Corner />}
		</BaseScrollArea.Root>
	);
}

/**
 * ハンドルの溝。ポインターが乗るかスクロールすると 120ms で現れ、離れると 360ms かけて消える。
 * 消えるのを遅くするのは、スクロールし終えた直後に位置を確かめられるようにするため。
 * 溝にポインターを乗せると、ハンドルが 4px から 6px に太り、つかめることを示す。
 */
export function ScrollBar({
	className,
	orientation = "vertical",
	...props
}: React.ComponentProps<typeof BaseScrollArea.Scrollbar>) {
	return (
		<BaseScrollArea.Scrollbar
			data-slot="scroll-area-scrollbar"
			orientation={orientation}
			className={cn(
				"group/scrollbar pointer-events-none z-10 flex touch-none select-none p-0.5 opacity-0",
				"transition-opacity duration-(--duration-slow) ease-standard",
				"data-hovering:pointer-events-auto data-hovering:opacity-100 data-hovering:duration-(--duration-fast)",
				"data-scrolling:pointer-events-auto data-scrolling:opacity-100 data-scrolling:duration-(--duration-fast)",
				"data-[orientation=vertical]:w-2.5 data-[orientation=vertical]:justify-center",
				"data-[orientation=horizontal]:h-2.5 data-[orientation=horizontal]:flex-col data-[orientation=horizontal]:justify-center",
				className,
			)}
			{...props}
		>
			<BaseScrollArea.Thumb
				data-slot="scroll-area-thumb"
				className={cn(
					"relative rounded-full bg-line-strong",
					"transition-[width,height,background-color] duration-(--duration-spring-press) ease-spring-press",
					"group-hover/scrollbar:bg-fg-subtle active:bg-fg-muted",
					"data-[orientation=vertical]:w-1 group-hover/scrollbar:data-[orientation=vertical]:w-1.5",
					"data-[orientation=horizontal]:h-1 group-hover/scrollbar:data-[orientation=horizontal]:h-1.5",
					// ハンドルが細くても、指やマウスで掴みやすいよう当たり判定を広げる
					"before:absolute before:-inset-1.5 before:content-['']",
				)}
			/>
		</BaseScrollArea.Scrollbar>
	);
}

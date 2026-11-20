import { Drawer as BaseDrawer } from "@base-ui/react/drawer";
import { X } from "lucide-react";
import * as React from "react";
import { cn } from "../lib/cn";

export type DrawerSide = "right" | "left" | "bottom";

const swipeDirections = { right: "right", left: "left", bottom: "down" } as const;

const DrawerSideContext = React.createContext<DrawerSide>("right");

export type DrawerProps = Omit<React.ComponentProps<typeof BaseDrawer.Root>, "swipeDirection"> & {
	/** 出てくる端。bottom は下から出るシートになり、snapPoints で途中の高さに止められる */
	side?: DrawerSide;
};

/**
 * 画面の端から引き出す面。スマートフォンの操作盤や、一覧から開く詳細に使う。
 * 指で引くと付いてきて、勢いよくはじくと閉じる。引く操作が要らないなら Dialog を使う。
 */
export function Drawer({ side = "right", ...props }: DrawerProps) {
	return (
		<DrawerSideContext.Provider value={side}>
			<BaseDrawer.Root swipeDirection={swipeDirections[side]} {...props} />
		</DrawerSideContext.Provider>
	);
}

export function DrawerTrigger(props: React.ComponentProps<typeof BaseDrawer.Trigger>) {
	return <BaseDrawer.Trigger data-slot="drawer-trigger" {...props} />;
}

export function DrawerClose(props: React.ComponentProps<typeof BaseDrawer.Close>) {
	return <BaseDrawer.Close data-slot="drawer-close" {...props} />;
}

/**
 * バックドロップ。引いた分だけ薄くなる。
 * 開くときはゆっくり暗くし、閉じるときははじいた勢いに合わせて速く明るくする。
 */
export function DrawerBackdrop({ className, ...props }: React.ComponentProps<typeof BaseDrawer.Backdrop>) {
	return (
		<BaseDrawer.Backdrop
			data-slot="drawer-backdrop"
			className={cn(
				"fixed inset-0 z-50 min-h-dvh bg-backdrop-solid backdrop-blur-[2px]",
				"opacity-[calc(0.6*(1-var(--drawer-swipe-progress,0)))]",
				"transition-opacity duration-(--duration-slow) ease-standard",
				"data-starting-style:opacity-0 data-ending-style:opacity-0",
				"data-ending-style:duration-[calc(var(--drawer-swipe-strength,1)*280ms)] data-ending-style:ease-out-expo",
				"data-swiping:duration-0",
				className,
			)}
			{...props}
		/>
	);
}

/*
 * 面の動き。開くときは着火の曲線で端から滑り込み、8% 行き過ぎて止まる。
 * 行き過ぎた分で端に隙間が見えないよう、::after で面の外側に同じ色の帯（--bleed）を足す。
 * 閉じるときは、はじいた勢い（--drawer-swipe-strength）で速さを変え、速い減速で引っ込む。
 * 指で引いている間（data-swiping）は transition を切り、指にそのまま付いてくる。
 */
const popupBase = [
	"group/drawer fixed z-50 flex flex-col bg-surface-overlay text-fg shadow-pop outline-none [--bleed:3rem]",
	"after:pointer-events-none after:absolute after:bg-inherit after:content-['']",
	"transition-[transform,box-shadow] duration-(--duration-ignite) ease-ignite",
	"data-ending-style:duration-[calc(var(--drawer-swipe-strength,1)*320ms)] data-ending-style:ease-out-expo",
	"data-swiping:duration-0 data-swiping:select-none",
	"data-starting-style:shadow-none data-ending-style:shadow-none",
];

const popupSide: Record<DrawerSide, string> = {
	right: cn(
		"inset-y-0 right-0 w-[min(22rem,calc(100vw-3rem))] border-l border-line",
		"after:inset-y-0 after:left-full after:w-(--bleed)",
		"[transform:translateX(var(--drawer-swipe-movement-x,0px))]",
		"data-starting-style:[transform:translateX(100%)] data-ending-style:[transform:translateX(100%)]",
	),
	left: cn(
		"inset-y-0 left-0 w-[min(22rem,calc(100vw-3rem))] border-r border-line",
		"after:inset-y-0 after:right-full after:w-(--bleed)",
		"[transform:translateX(var(--drawer-swipe-movement-x,0px))]",
		"data-starting-style:[transform:translateX(-100%)] data-ending-style:[transform:translateX(-100%)]",
	),
	bottom: cn(
		"inset-x-0 bottom-0 mx-auto max-h-[calc(100dvh-2rem)] w-full max-w-xl rounded-t-xl border border-b-0 border-line",
		"after:inset-x-0 after:top-full after:h-(--bleed)",
		"[transform:translateY(calc(var(--drawer-snap-point-offset,0px)+var(--drawer-swipe-movement-y,0px)))]",
		"[padding-bottom:max(0px,calc(var(--drawer-snap-point-offset,0px)+var(--drawer-swipe-movement-y,0px)))]",
		"data-starting-style:[transform:translateY(100%)] data-ending-style:[transform:translateY(100%)]",
		"data-starting-style:[padding-bottom:0] data-ending-style:[padding-bottom:0]",
	),
};

export type DrawerContentProps = React.ComponentProps<typeof BaseDrawer.Popup> & {
	/** 閉じるボタンを出すか。下から出るシートでは、ハンドルを出すので既定で出さない */
	showClose?: boolean;
};

/**
 * 引き出す面の本体。バックドロップと一緒に描く。中身は DrawerHeader、DrawerBody、DrawerFooter で組む。
 * 開くと中にフォーカスが移り、Esc かバックドロップのクリックで閉じ、閉じると開いたボタンにフォーカスが戻る。
 */
export function DrawerContent({ className, children, showClose, ...props }: DrawerContentProps) {
	const side = React.useContext(DrawerSideContext);
	const close = showClose ?? side !== "bottom";
	return (
		<BaseDrawer.Portal>
			<DrawerBackdrop />
			<BaseDrawer.Viewport data-slot="drawer-viewport" className="fixed inset-0 z-50 touch-none">
				<BaseDrawer.Popup
					data-slot="drawer-content"
					data-side={side}
					className={cn(popupBase, popupSide[side], className)}
					{...props}
				>
					{side === "bottom" && <DrawerHandle />}
					{children}
					{close && (
						<BaseDrawer.Close
							aria-label="閉じる"
							className={cn(
								"absolute top-4 right-4 flex size-8 items-center justify-center rounded-md text-fg-subtle",
								"motion-press-icon hover:bg-surface-hover hover:text-fg focus-visible:outline-2 focus-visible:outline-focus",
							)}
						>
							<X className="size-4" />
						</BaseDrawer.Close>
					)}
				</BaseDrawer.Popup>
			</BaseDrawer.Viewport>
		</BaseDrawer.Portal>
	);
}

/** 下から出るシートのハンドル。引いている間は 40px から 48px に伸びて明るくなり、つかんでいることが分かる */
function DrawerHandle() {
	return (
		<div data-slot="drawer-handle" aria-hidden className="flex shrink-0 justify-center pt-3 pb-1">
			<span
				className={cn(
					"h-1 w-10 rounded-full bg-line-strong",
					"transition-[width,background-color] duration-(--duration-land) ease-land",
					"group-data-swiping/drawer:w-12 group-data-swiping/drawer:bg-fg-muted",
				)}
			/>
		</div>
	);
}

export function DrawerHeader({ className, ...props }: React.ComponentProps<"div">) {
	return (
		<div
			data-slot="drawer-header"
			className={cn(
				"flex shrink-0 flex-col gap-1 px-6 pt-6 pb-4 pr-14 group-data-[side=bottom]/drawer:pt-2",
				className,
			)}
			{...props}
		/>
	);
}

/**
 * 中身の本体。長いときはここだけが縦に送られる。
 * マウスでは文字を選べ、指では面を引ける（Base UI の Drawer.Content）。
 */
export function DrawerBody({ className, ...props }: React.ComponentProps<typeof BaseDrawer.Content>) {
	return (
		<BaseDrawer.Content
			data-slot="drawer-body"
			className={cn(
				"min-h-0 flex-1 touch-auto overflow-y-auto overscroll-contain px-6 pb-6 text-sm",
				className,
			)}
			{...props}
		/>
	);
}

export function DrawerFooter({ className, ...props }: React.ComponentProps<"div">) {
	return (
		<div
			data-slot="drawer-footer"
			className={cn(
				"flex shrink-0 flex-col-reverse gap-2 border-t border-line-subtle px-6 py-4 sm:flex-row sm:justify-end",
				"pb-[calc(1rem+env(safe-area-inset-bottom,0px))]",
				className,
			)}
			{...props}
		/>
	);
}

export function DrawerTitle({ className, ...props }: React.ComponentProps<typeof BaseDrawer.Title>) {
	return (
		<BaseDrawer.Title
			data-slot="drawer-title"
			className={cn("text-lg font-semibold tracking-snug text-fg-strong", className)}
			{...props}
		/>
	);
}

export function DrawerDescription({
	className,
	...props
}: React.ComponentProps<typeof BaseDrawer.Description>) {
	return (
		<BaseDrawer.Description
			data-slot="drawer-description"
			className={cn("text-sm text-fg-muted", className)}
			{...props}
		/>
	);
}

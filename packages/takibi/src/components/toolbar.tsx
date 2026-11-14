import { Toolbar as BaseToolbar } from "@base-ui/react/toolbar";
import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";
import { cn } from "../lib/cn";
import {
	ToggleGroup,
	ToggleGroupItem,
	type ToggleGroupItemProps,
	type ToggleGroupProps,
} from "./toggle-group";
import { Tooltip, TooltipContent, TooltipTrigger } from "./tooltip";

export const toolbarVariants = cva(
	"flex w-fit items-center gap-0.5 data-[orientation=vertical]:flex-col data-[orientation=vertical]:items-stretch",
	{
		variants: {
			variant: {
				/** 枠なし。画面上部のバーや、パネルの見出しの横に並べる */
				flat: "",
				/** 枠あり。編集する面のすぐ上に置く */
				outline: "rounded-lg border border-line-subtle bg-surface-raised p-1 shadow-rim",
				/** キャンバスの上に浮かべる。影で面から持ち上げる */
				floating: "rounded-xl border border-line bg-surface-overlay p-1 shadow-pop",
			},
		},
		defaultVariants: { variant: "flat" },
	},
);

type ToolbarContextValue = { orientation: "horizontal" | "vertical" };
const ToolbarContext = React.createContext<ToolbarContextValue>({ orientation: "horizontal" });

export type ToolbarProps = React.ComponentProps<typeof BaseToolbar.Root> &
	VariantProps<typeof toolbarVariants>;

/**
 * ツールやボタンを 1 列にまとめる。Tab でツールバーに入り、矢印キーで項目間を移動する（ツールバーの中は 1 つの Tab 位置になる）。
 * 縦のツールバーには `orientation="vertical"`、キャンバスに浮かべるときは `variant="floating"` を使う。
 * ツールバーには aria-label を付ける。
 */
export function Toolbar({ className, variant, orientation = "horizontal", ...props }: ToolbarProps) {
	const context = React.useMemo(() => ({ orientation }), [orientation]);
	return (
		<ToolbarContext.Provider value={context}>
			<BaseToolbar.Root
				data-slot="toolbar"
				data-variant={variant ?? "flat"}
				orientation={orientation}
				className={cn(toolbarVariants({ variant }), className)}
				{...props}
			/>
		</ToolbarContext.Provider>
	);
}

export const toolbarButtonVariants = cva(
	[
		"relative inline-flex shrink-0 items-center justify-center gap-1.5 rounded-md text-sm font-medium text-fg-muted select-none",
		"outline-none hover:not-data-disabled:bg-surface-hover hover:not-data-disabled:text-fg",
		"data-popup-open:bg-surface-hover data-popup-open:text-fg-strong",
		"focus-visible:z-10 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-focus",
		"data-disabled:cursor-not-allowed data-disabled:opacity-50",
		// メニューやポップオーバーを開くボタンは沈ませない。ポップアップが一緒に揺れてしまう
		"aria-haspopup:scale-100! data-popup-open:scale-100!",
		"[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
	],
	{
		variants: {
			size: {
				/** アイコンだけ。正方形で、押すと深く沈む */
				icon: "size-8 motion-press-icon",
				/** 文字を含む */
				md: "h-8 px-2.5 motion-press",
			},
		},
		defaultVariants: { size: "icon" },
	},
);

export type ToolbarButtonProps = React.ComponentProps<typeof BaseToolbar.Button> &
	VariantProps<typeof toolbarButtonVariants> & {
		/**
		 * hover やフォーカスで出す名前。アイコンだけのボタンでは aria-label と同じ文言を渡す。
		 * ショートカットを添えるときは ReactNode で渡す
		 */
		tooltip?: React.ReactNode;
	};

/** ツールバーの中のボタン。メニューなどを開くときは `render={<MenuTrigger />}` を渡す */
export function ToolbarButton({ className, size, tooltip, ...props }: ToolbarButtonProps) {
	const { orientation } = React.useContext(ToolbarContext);
	const button = (
		<BaseToolbar.Button
			data-slot="toolbar-button"
			className={cn(toolbarButtonVariants({ size }), className)}
			{...props}
		/>
	);
	if (!tooltip) return button;
	return (
		<Tooltip>
			<TooltipTrigger render={button} />
			<TooltipContent side={orientation === "vertical" ? "right" : "top"}>{tooltip}</TooltipContent>
		</Tooltip>
	);
}

export function ToolbarGroup({ className, ...props }: React.ComponentProps<typeof BaseToolbar.Group>) {
	return (
		<BaseToolbar.Group
			data-slot="toolbar-group"
			className={cn("flex items-center gap-0.5 in-data-[orientation=vertical]:flex-col", className)}
			{...props}
		/>
	);
}

/** 項目のまとまりの区切り。ツールバーの向きと直交する線になる */
export function ToolbarSeparator({
	className,
	...props
}: React.ComponentProps<typeof BaseToolbar.Separator>) {
	return (
		<BaseToolbar.Separator
			data-slot="toolbar-separator"
			className={cn(
				"shrink-0 bg-line-subtle",
				"data-[orientation=vertical]:mx-1 data-[orientation=vertical]:h-5 data-[orientation=vertical]:w-px",
				"data-[orientation=horizontal]:my-1 data-[orientation=horizontal]:h-px data-[orientation=horizontal]:w-5 data-[orientation=horizontal]:self-center",
				className,
			)}
			{...props}
		/>
	);
}

/**
 * 1 つだけ選ぶツールグループ（選択、切り抜き、ペンなど）。選んだツールのインジケーターが、進む側の辺から伸びて移る（炎の舌）。
 * グループの項目も、ツールバーのほかの項目と同じく矢印キーで移動できる。
 */
export function ToolbarToggleGroup({ className, ...props }: ToggleGroupProps) {
	const { orientation } = React.useContext(ToolbarContext);
	return (
		<ToggleGroup
			data-slot="toolbar-toggle-group"
			orientation={orientation}
			size="sm"
			className={cn("gap-0.5", className)}
			{...props}
		/>
	);
}

export type ToolbarToggleItemProps = ToggleGroupItemProps & {
	/** hover やフォーカスで出す名前 */
	tooltip?: React.ReactNode;
};

export function ToolbarToggleItem({ tooltip, disabled, ...props }: ToolbarToggleItemProps) {
	const { orientation } = React.useContext(ToolbarContext);
	const button = <BaseToolbar.Button disabled={disabled} render={<ToggleGroupItem {...props} />} />;
	if (!tooltip) return button;
	return (
		<Tooltip>
			<TooltipTrigger render={button} />
			<TooltipContent side={orientation === "vertical" ? "right" : "top"}>{tooltip}</TooltipContent>
		</Tooltip>
	);
}

/** ボタンの横に添える短い表示（倍率、件数など）。数字は桁がそろう字形にする */
export function ToolbarText({ className, ...props }: React.ComponentProps<"span">) {
	return (
		<span
			data-slot="toolbar-text"
			className={cn("px-1.5 text-sm text-fg-muted tabular-nums select-none", className)}
			{...props}
		/>
	);
}

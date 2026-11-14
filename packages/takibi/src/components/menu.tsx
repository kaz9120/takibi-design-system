import { Menu as BaseMenu } from "@base-ui/react/menu";
import { Check, ChevronRight } from "lucide-react";
import * as React from "react";
import { cn } from "../lib/cn";
import { GlideGroup, glideRender } from "../lib/glide";
import { useMenuAim } from "../lib/menu-aim";

export const Menu = BaseMenu.Root;

type MenuAim = ReturnType<typeof useMenuAim>;
const MenuAimContext = React.createContext<MenuAim | null>(null);

/**
 * サブメニューを組む外側のコンポーネント。MenuSubTrigger と MenuSubContent を入れる。
 * 項目からサブメニューへ斜めに向かう途中で減速しても閉じない（src/lib/menu-aim.ts）。
 */
export function MenuSub({
	open: openProp,
	defaultOpen = false,
	onOpenChange,
	...props
}: React.ComponentProps<typeof BaseMenu.SubmenuRoot>) {
	const [openState, setOpenState] = React.useState(defaultOpen);
	const open = openProp ?? openState;
	const aim = useMenuAim(() => {
		if (openProp === undefined) setOpenState(false);
		onOpenChange?.(false, closedByAim());
	});
	const { track } = aim;
	React.useEffect(() => track(open), [open, track]);
	return (
		<MenuAimContext.Provider value={aim}>
			<BaseMenu.SubmenuRoot
				open={open}
				onOpenChange={(next, details) => {
					if (
						!next &&
						(details.reason === "trigger-hover" || details.reason === "sibling-open") &&
						aim.isAiming()
					) {
						details.cancel();
						return;
					}
					if (!next) aim.stop();
					if (openProp === undefined) setOpenState(next);
					onOpenChange?.(next, details);
				}}
				{...props}
			/>
		</MenuAimContext.Provider>
	);
}

/** サブメニューへ近づかないまま待ち時間が過ぎて閉じたときに、onOpenChange へ渡す詳細 */
function closedByAim() {
	return { reason: "none", event: new Event("menu-aim") } as unknown as Parameters<
		NonNullable<React.ComponentProps<typeof BaseMenu.SubmenuRoot>["onOpenChange"]>
	>[1];
}

export function MenuTrigger(props: React.ComponentProps<typeof BaseMenu.Trigger>) {
	return <BaseMenu.Trigger data-slot="menu-trigger" {...props} />;
}

export type MenuContentProps = React.ComponentProps<typeof BaseMenu.Popup> & {
	side?: React.ComponentProps<typeof BaseMenu.Positioner>["side"];
	sideOffset?: number;
	align?: React.ComponentProps<typeof BaseMenu.Positioner>["align"];
	alignOffset?: number;
};

/**
 * ボタンから開く操作の一覧。矢印キーで項目を移り、Enter で選ぶ。
 * 閉じると開いたボタンにフォーカスが戻る。値を選ぶ入力欄にはセレクトを使う。
 */
export function MenuContent({
	className,
	side,
	sideOffset = 6,
	align = "start",
	alignOffset,
	children,
	...props
}: MenuContentProps) {
	return (
		<BaseMenu.Portal>
			<BaseMenu.Positioner
				side={side}
				sideOffset={sideOffset}
				align={align}
				alignOffset={alignOffset}
				className="z-50 outline-none"
			>
				<BaseMenu.Popup
					data-slot="menu-content"
					className={cn(
						"motion-rise min-w-48 max-h-(--available-height) overflow-y-auto rounded-lg border border-line bg-surface-overlay p-1",
						"text-sm text-fg shadow-pop outline-none",
						className,
					)}
					{...props}
				>
					<GlideGroup>{children}</GlideGroup>
				</BaseMenu.Popup>
			</BaseMenu.Positioner>
		</BaseMenu.Portal>
	);
}

const itemBase = [
	"relative isolate flex cursor-default items-center gap-2 rounded-md px-2 py-1.5 outline-none select-none",
	"transition-colors duration-(--duration-fast) ease-standard data-highlighted:text-fg-strong",
	"data-disabled:pointer-events-none data-disabled:text-fg-subtle",
	"[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
];

export type MenuItemProps = React.ComponentProps<typeof BaseMenu.Item> & {
	/** 削除など取り消せない操作。文字を danger の色にする */
	variant?: "default" | "danger";
	/** チェックやラジオの項目と、文字の位置をそろえる */
	inset?: boolean;
};

export function MenuItem({ className, variant = "default", inset, ...props }: MenuItemProps) {
	return (
		<BaseMenu.Item
			data-slot="menu-item"
			data-variant={variant}
			className={cn(
				itemBase,
				"[&_svg:not([class*='text-'])]:text-fg-muted",
				variant === "danger" && "text-danger data-highlighted:text-danger [&_svg]:text-danger!",
				inset && "pl-8",
				className,
			)}
			render={glideRender(variant === "danger" ? "bg-danger-soft" : undefined)}
			{...props}
		/>
	);
}

export function MenuCheckboxItem({
	className,
	children,
	...props
}: React.ComponentProps<typeof BaseMenu.CheckboxItem>) {
	return (
		<BaseMenu.CheckboxItem
			data-slot="menu-checkbox-item"
			className={cn(itemBase, "pl-8", className)}
			render={glideRender()}
			{...props}
		>
			<span className="absolute left-2 flex size-4 items-center justify-center">
				<BaseMenu.CheckboxItemIndicator>
					<Check className="text-brand" />
				</BaseMenu.CheckboxItemIndicator>
			</span>
			{children}
		</BaseMenu.CheckboxItem>
	);
}

export function MenuRadioGroup(props: React.ComponentProps<typeof BaseMenu.RadioGroup>) {
	return <BaseMenu.RadioGroup data-slot="menu-radio-group" {...props} />;
}

export function MenuRadioItem({
	className,
	children,
	...props
}: React.ComponentProps<typeof BaseMenu.RadioItem>) {
	return (
		<BaseMenu.RadioItem
			data-slot="menu-radio-item"
			className={cn(itemBase, "pl-8", className)}
			render={glideRender()}
			{...props}
		>
			<span className="absolute left-2 flex size-4 items-center justify-center">
				<BaseMenu.RadioItemIndicator className="size-1.5 rounded-full bg-brand" />
			</span>
			{children}
		</BaseMenu.RadioItem>
	);
}

export function MenuGroup(props: React.ComponentProps<typeof BaseMenu.Group>) {
	return <BaseMenu.Group data-slot="menu-group" {...props} />;
}

export function MenuGroupLabel({ className, ...props }: React.ComponentProps<typeof BaseMenu.GroupLabel>) {
	return (
		<BaseMenu.GroupLabel
			data-slot="menu-group-label"
			className={cn("px-2 pt-2 pb-1 text-xs font-medium text-fg-muted", className)}
			{...props}
		/>
	);
}

export function MenuSeparator({ className, ...props }: React.ComponentProps<typeof BaseMenu.Separator>) {
	return (
		<BaseMenu.Separator
			data-slot="menu-separator"
			className={cn("-mx-1 my-1 h-px bg-line-subtle", className)}
			{...props}
		/>
	);
}

/** 項目の右端に添えるショートカット。表示だけで、キーの割り当てはしない */
export function MenuShortcut({ className, ...props }: React.ComponentProps<"span">) {
	return (
		<span
			data-slot="menu-shortcut"
			className={cn("ml-auto pl-4 font-mono text-xs tracking-wide text-fg-muted", className)}
			{...props}
		/>
	);
}

export function MenuSubTrigger({
	className,
	children,
	inset,
	...props
}: React.ComponentProps<typeof BaseMenu.SubmenuTrigger> & { inset?: boolean }) {
	const aim = React.useContext(MenuAimContext);
	return (
		<BaseMenu.SubmenuTrigger
			ref={aim?.trigger as React.Ref<HTMLDivElement>}
			data-slot="menu-sub-trigger"
			className={cn(itemBase, "data-popup-open:bg-surface-hover", inset && "pl-8", className)}
			render={glideRender()}
			{...props}
		>
			{children}
			<ChevronRight className="ml-auto text-fg-muted" />
		</BaseMenu.SubmenuTrigger>
	);
}

/** サブメニューの中身。親の項目の横に出る */
export function MenuSubContent({ sideOffset = 4, alignOffset = -5, ...props }: MenuContentProps) {
	const aim = React.useContext(MenuAimContext);
	return (
		<MenuContent
			ref={aim?.popup as React.Ref<HTMLDivElement>}
			data-slot="menu-sub-content"
			sideOffset={sideOffset}
			alignOffset={alignOffset}
			{...props}
		/>
	);
}

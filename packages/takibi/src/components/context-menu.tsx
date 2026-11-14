import { ContextMenu as BaseContextMenu } from "@base-ui/react/context-menu";
import type * as React from "react";
import { cn } from "../lib/cn";
import { GlideGroup } from "../lib/glide";

/**
 * 右クリックや長押しで、押した場所に開く操作の一覧。キャンバスや一覧の行など、
 * 対象に直接触れて操作する場面で使う。同じ操作は、ボタンやメニューからも行えるようにしておく
 * （右クリックは見つけにくく、キーボードでは開けないため）。
 * 中の項目には Menu のコンポーネント（MenuItem、MenuSeparator など）を使う。
 */
export const ContextMenu = BaseContextMenu.Root;

/** 右クリックを受ける範囲。開いている間は、範囲の枠線が border-line-strong の色になる */
export function ContextMenuTrigger({
	className,
	...props
}: React.ComponentProps<typeof BaseContextMenu.Trigger>) {
	return (
		<BaseContextMenu.Trigger
			data-slot="context-menu-trigger"
			className={cn(
				"select-none transition-[border-color,box-shadow] duration-(--duration-base) ease-ember",
				"data-popup-open:border-line-strong",
				className,
			)}
			{...props}
		/>
	);
}

export type ContextMenuContentProps = React.ComponentProps<typeof BaseContextMenu.Popup>;

/** メニューの中身。押した点から大きくなって開き、Menu と同じ見た目になる */
export function ContextMenuContent({ className, children, ...props }: ContextMenuContentProps) {
	return (
		<BaseContextMenu.Portal>
			<BaseContextMenu.Positioner className="z-50 outline-none">
				<BaseContextMenu.Popup
					data-slot="context-menu-content"
					className={cn(
						"motion-rise min-w-48 max-h-(--available-height) overflow-y-auto rounded-lg border border-line bg-surface-overlay p-1",
						"text-sm text-fg shadow-pop outline-none",
						className,
					)}
					{...props}
				>
					<GlideGroup>{children}</GlideGroup>
				</BaseContextMenu.Popup>
			</BaseContextMenu.Positioner>
		</BaseContextMenu.Portal>
	);
}

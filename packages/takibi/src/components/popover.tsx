import { Popover as BasePopover } from "@base-ui/react/popover";
import type * as React from "react";
import { cn } from "../lib/cn";

export const Popover = BasePopover.Root;

export function PopoverTrigger(props: React.ComponentProps<typeof BasePopover.Trigger>) {
	return <BasePopover.Trigger data-slot="popover-trigger" {...props} />;
}

export function PopoverClose(props: React.ComponentProps<typeof BasePopover.Close>) {
	return <BasePopover.Close data-slot="popover-close" {...props} />;
}

export type PopoverContentProps = React.ComponentProps<typeof BasePopover.Popup> & {
	side?: React.ComponentProps<typeof BasePopover.Positioner>["side"];
	sideOffset?: number;
	align?: React.ComponentProps<typeof BasePopover.Positioner>["align"];
};

/**
 * ボタンの近くに、補足の情報や小さな操作を浮かべる。画面の流れは止めない。
 * 開くと中にフォーカスが移り、Esc か外側のクリックで閉じ、閉じると開いたボタンにフォーカスが戻る。
 */
export function PopoverContent({
	className,
	side = "bottom",
	sideOffset = 8,
	align = "center",
	children,
	...props
}: PopoverContentProps) {
	return (
		<BasePopover.Portal>
			<BasePopover.Positioner side={side} sideOffset={sideOffset} align={align} className="z-50">
				<BasePopover.Popup
					data-slot="popover-content"
					className={cn(
						"motion-rise flex w-72 max-w-[calc(100vw-2rem)] flex-col gap-2 rounded-lg border border-line bg-surface-overlay p-4",
						"text-sm text-fg shadow-pop outline-none",
						className,
					)}
					{...props}
				>
					{children}
				</BasePopover.Popup>
			</BasePopover.Positioner>
		</BasePopover.Portal>
	);
}

export function PopoverTitle({ className, ...props }: React.ComponentProps<typeof BasePopover.Title>) {
	return (
		<BasePopover.Title
			data-slot="popover-title"
			className={cn("text-sm font-semibold text-fg-strong", className)}
			{...props}
		/>
	);
}

export function PopoverDescription({
	className,
	...props
}: React.ComponentProps<typeof BasePopover.Description>) {
	return (
		<BasePopover.Description
			data-slot="popover-description"
			className={cn("text-sm text-fg-muted", className)}
			{...props}
		/>
	);
}

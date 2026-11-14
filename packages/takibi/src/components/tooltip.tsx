import { Tooltip as BaseTooltip } from "@base-ui/react/tooltip";
import type * as React from "react";
import { cn } from "../lib/cn";

/** アプリの最上位に 1 つ置く。隣り合うツールチップを続けて見るとき、2 つ目から待たずに出す */
export function TooltipProvider({
	delay = 400,
	...props
}: React.ComponentProps<typeof BaseTooltip.Provider>) {
	return <BaseTooltip.Provider delay={delay} {...props} />;
}

export const Tooltip = BaseTooltip.Root;

export function TooltipTrigger({ className, ...props }: React.ComponentProps<typeof BaseTooltip.Trigger>) {
	return <BaseTooltip.Trigger data-slot="tooltip-trigger" className={className} {...props} />;
}

export type TooltipContentProps = React.ComponentProps<typeof BaseTooltip.Popup> & {
	side?: React.ComponentProps<typeof BaseTooltip.Positioner>["side"];
	sideOffset?: number;
	align?: React.ComponentProps<typeof BaseTooltip.Positioner>["align"];
};

/**
 * 操作の名前やショートカットを補う短い文。hover かフォーカスで出る。
 * タッチ環境では見えないので、欠かせない情報は入れない。
 */
export function TooltipContent({
	className,
	side = "top",
	sideOffset = 6,
	align = "center",
	children,
	...props
}: TooltipContentProps) {
	return (
		<BaseTooltip.Portal>
			<BaseTooltip.Positioner side={side} sideOffset={sideOffset} align={align} className="z-50">
				<BaseTooltip.Popup
					data-slot="tooltip-content"
					className={cn(
						"motion-rise flex items-center gap-2 rounded-md border border-line bg-surface-overlay px-2.5 py-1.5",
						"text-sm text-fg-strong shadow-pop",
						className,
					)}
					{...props}
				>
					{children}
				</BaseTooltip.Popup>
			</BaseTooltip.Positioner>
		</BaseTooltip.Portal>
	);
}

import { PreviewCard as BasePreviewCard } from "@base-ui/react/preview-card";
import type * as React from "react";
import { cn } from "../lib/cn";

export const PreviewCard = BasePreviewCard.Root;

/**
 * プレビューを開くリンク。文中のリンクと同じ見た目で、hover かフォーカスから 500ms 待って開く。
 * 開いている間は下線が濃くなり、どのリンクの中身かが分かる。
 */
export function PreviewCardTrigger({
	className,
	delay = 500,
	closeDelay = 200,
	...props
}: React.ComponentProps<typeof BasePreviewCard.Trigger>) {
	return (
		<BasePreviewCard.Trigger
			data-slot="preview-card-trigger"
			delay={delay}
			closeDelay={closeDelay}
			className={cn(
				"rounded-sm text-brand underline decoration-[color-mix(in_oklab,currentColor_40%,transparent)] decoration-1 underline-offset-4",
				"transition-[color,text-decoration-color] duration-(--duration-fast) ease-ember",
				"hover:text-brand-hover hover:decoration-current data-popup-open:decoration-current",
				"outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus",
				className,
			)}
			{...props}
		/>
	);
}

export type PreviewCardContentProps = React.ComponentProps<typeof BasePreviewCard.Popup> & {
	side?: React.ComponentProps<typeof BasePreviewCard.Positioner>["side"];
	sideOffset?: number;
	align?: React.ComponentProps<typeof BasePreviewCard.Positioner>["align"];
};

/**
 * リンク先の中身を、移動する前に見せる。人の紹介やページの要約に使う。
 * 中身にはスクリーンリーダーでもキーボードでも届かないので、リンク先にない情報や操作は置かない。
 * リンクの側からばねで大きくなって現れ、離れると速く縮んで消える。
 */
export function PreviewCardContent({
	className,
	side = "bottom",
	sideOffset = 8,
	align = "center",
	children,
	...props
}: PreviewCardContentProps) {
	return (
		<BasePreviewCard.Portal>
			<BasePreviewCard.Positioner side={side} sideOffset={sideOffset} align={align} className="z-50">
				<BasePreviewCard.Popup
					data-slot="preview-card-content"
					className={cn(
						"motion-rise flex w-72 max-w-[calc(100vw-2rem)] flex-col gap-3 rounded-lg border border-line bg-surface-overlay p-4",
						"text-sm text-fg shadow-pop outline-none",
						className,
					)}
					{...props}
				>
					{children}
				</BasePreviewCard.Popup>
			</BasePreviewCard.Positioner>
		</BasePreviewCard.Portal>
	);
}

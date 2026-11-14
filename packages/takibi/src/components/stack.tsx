import { useRender } from "@base-ui/react/use-render";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../lib/cn";

export const stackVariants = cva("flex", {
	variants: {
		direction: {
			vertical: "flex-col",
			horizontal: "flex-row",
		},
		gap: {
			0: "gap-0",
			1: "gap-1",
			2: "gap-2",
			3: "gap-3",
			4: "gap-4",
			5: "gap-5",
			6: "gap-6",
			8: "gap-8",
			10: "gap-10",
			12: "gap-12",
			16: "gap-16",
		},
		align: {
			start: "items-start",
			center: "items-center",
			end: "items-end",
			baseline: "items-baseline",
			stretch: "items-stretch",
		},
		justify: {
			start: "justify-start",
			center: "justify-center",
			end: "justify-end",
			between: "justify-between",
		},
		wrap: {
			true: "flex-wrap",
			false: "flex-nowrap",
		},
	},
	defaultVariants: { direction: "vertical", gap: 4 },
});

export type StackProps = useRender.ComponentProps<"div"> & VariantProps<typeof stackVariants>;

/**
 * 子を縦か横に並べ、間を gap だけで空ける。子に margin を付けずに済む。
 * 間の値は 4px の目盛り（gap={4} で 16px）。リストやナビゲーションにするなら render で ul や nav にする。
 */
export function Stack({
	direction,
	gap,
	align,
	justify,
	wrap,
	className,
	render,
	ref,
	...props
}: StackProps) {
	return useRender({
		defaultTagName: "div",
		render,
		ref,
		props: {
			"data-slot": "stack",
			...props,
			className: cn(stackVariants({ direction, gap, align, justify, wrap }), className),
		},
	});
}

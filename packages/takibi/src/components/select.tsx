import { Select as BaseSelect } from "@base-ui/react/select";
import { Check, ChevronDown, ChevronUp } from "lucide-react";
import type * as React from "react";
import { cn } from "../lib/cn";
import { GlideGroup, glideRender } from "../lib/glide";

/**
 * 多くの選択肢から 1 つ（`multiple` で複数）を選ぶ。選択肢が 5 個以下で見比べさせたいときは RadioGroup を使う。
 * 値と表示名が違うときは `items` に `{ value: label }` を渡すと、閉じたときに表示名が出る。
 */
export const Select = BaseSelect.Root;

/** Select の名前。Field の中では FieldLabel を使う */
export function SelectLabel({ className, ...props }: React.ComponentProps<typeof BaseSelect.Label>) {
	return (
		<BaseSelect.Label
			data-slot="select-label"
			className={cn("text-sm font-medium text-fg-strong select-none", className)}
			{...props}
		/>
	);
}

export type SelectTriggerProps = React.ComponentProps<typeof BaseSelect.Trigger> & {
	size?: "sm" | "md" | "lg";
};

const triggerSizes = {
	sm: "h-8 px-2.5 text-sm",
	md: "h-9 px-3 text-sm",
	lg: "h-11 px-3.5 text-base",
};

export function SelectTrigger({ className, size = "md", children, ...props }: SelectTriggerProps) {
	return (
		<BaseSelect.Trigger
			data-slot="select-trigger"
			className={cn(
				"inline-flex w-full min-w-40 items-center justify-between gap-2 rounded-md border border-line-strong bg-surface-sunken text-fg shadow-rim select-none",
				"transition-[border-color,box-shadow] duration-(--duration-fast) ease-standard outline-none",
				"focus-visible:border-brand focus-visible:ring-3 focus-visible:ring-brand-soft data-popup-open:border-brand",
				"data-invalid:border-danger aria-invalid:border-danger",
				"data-disabled:cursor-not-allowed data-disabled:opacity-50",
				triggerSizes[size],
				className,
			)}
			{...props}
		>
			{children}
			<BaseSelect.Icon
				data-slot="select-icon"
				className="flex text-fg-muted transition-[rotate] duration-(--duration-sway) ease-sway [[data-popup-open]>&]:rotate-180"
			>
				<ChevronDown className="size-4" />
			</BaseSelect.Icon>
		</BaseSelect.Trigger>
	);
}

export function SelectValue({ className, ...props }: React.ComponentProps<typeof BaseSelect.Value>) {
	return (
		<BaseSelect.Value
			data-slot="select-value"
			className={cn("truncate data-placeholder:text-fg-subtle", className)}
			{...props}
		/>
	);
}

export type SelectContentProps = React.ComponentProps<typeof BaseSelect.Popup> &
	Pick<
		React.ComponentProps<typeof BaseSelect.Positioner>,
		"side" | "sideOffset" | "align" | "alignItemWithTrigger"
	>;

/**
 * 開いたときの選択肢の一覧。既定ではトリガーの下に出る。
 * `alignItemWithTrigger` を付けると、選んだ項目がトリガーに重なるネイティブ風の出方になる。
 */
export function SelectContent({
	className,
	side = "bottom",
	sideOffset = 6,
	align = "start",
	alignItemWithTrigger = false,
	children,
	...props
}: SelectContentProps) {
	return (
		<BaseSelect.Portal>
			<BaseSelect.Positioner
				side={side}
				sideOffset={sideOffset}
				align={align}
				alignItemWithTrigger={alignItemWithTrigger}
				className="z-50 outline-none select-none"
			>
				<BaseSelect.Popup
					data-slot="select-content"
					className={cn(
						"motion-rise relative min-w-(--anchor-width) rounded-md border border-line bg-surface-overlay text-fg shadow-pop outline-none",
						"data-[side=none]:min-w-[calc(var(--anchor-width)+1.5rem)]",
						className,
					)}
					{...props}
				>
					<BaseSelect.ScrollUpArrow className="absolute top-0 z-10 flex h-5 w-full items-center justify-center rounded-t-md bg-surface-overlay text-fg-muted">
						<ChevronUp className="size-3.5" />
					</BaseSelect.ScrollUpArrow>
					<BaseSelect.List className="max-h-(--available-height) scroll-py-6 overflow-y-auto p-1">
						<GlideGroup>{children}</GlideGroup>
					</BaseSelect.List>
					<BaseSelect.ScrollDownArrow className="absolute bottom-0 z-10 flex h-5 w-full items-center justify-center rounded-b-md bg-surface-overlay text-fg-muted">
						<ChevronDown className="size-3.5" />
					</BaseSelect.ScrollDownArrow>
				</BaseSelect.Popup>
			</BaseSelect.Positioner>
		</BaseSelect.Portal>
	);
}

export function SelectItem({ className, children, ...props }: React.ComponentProps<typeof BaseSelect.Item>) {
	return (
		<BaseSelect.Item
			data-slot="select-item"
			className={cn(
				"relative isolate grid cursor-default grid-cols-[1rem_1fr] items-center gap-2 rounded-sm py-1.5 pr-3 pl-2 text-sm outline-none select-none",
				"transition-colors duration-(--duration-fast) ease-standard data-highlighted:text-fg-strong data-selected:text-fg-strong",
				"data-disabled:cursor-not-allowed data-disabled:opacity-50",
				className,
			)}
			render={glideRender()}
			{...props}
		>
			<BaseSelect.ItemIndicator className="col-start-1 flex text-brand">
				<Check className="size-4" />
			</BaseSelect.ItemIndicator>
			<BaseSelect.ItemText className="col-start-2 truncate">{children}</BaseSelect.ItemText>
		</BaseSelect.Item>
	);
}

export function SelectGroup({ className, ...props }: React.ComponentProps<typeof BaseSelect.Group>) {
	return <BaseSelect.Group data-slot="select-group" className={cn("py-0.5", className)} {...props} />;
}

export function SelectGroupLabel({
	className,
	...props
}: React.ComponentProps<typeof BaseSelect.GroupLabel>) {
	return (
		<BaseSelect.GroupLabel
			data-slot="select-group-label"
			className={cn("px-2 pt-1.5 pb-1 text-xs font-medium tracking-wide text-fg-muted", className)}
			{...props}
		/>
	);
}

export function SelectSeparator({ className, ...props }: React.ComponentProps<typeof BaseSelect.Separator>) {
	return (
		<BaseSelect.Separator
			data-slot="select-separator"
			className={cn("-mx-1 my-1 h-px bg-line-subtle", className)}
			{...props}
		/>
	);
}

import { Combobox as BaseCombobox } from "@base-ui/react/combobox";
import { Check, ChevronDown, X } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import type * as React from "react";
import { cn } from "../lib/cn";
import { GlideGroup, glideRender } from "../lib/glide";
import { springs } from "../lib/motion";
import { inputGroupVariants } from "./input-group";

/**
 * 文字で絞り込みながら、候補から 1 つ（`multiple` で複数）を選ぶ。
 * 候補が 10 個を超えるときに使い、少ないときは Select を使う。自由な文字も受け付けたいときは Autocomplete を使う。
 * `items` に候補を渡すと、ComboboxList の子に関数を渡して 1 件ずつ描ける。
 */
export const Combobox = BaseCombobox.Root;

export const ComboboxCollection = BaseCombobox.Collection;
/** 選んでいる値。複数の選択では、子に関数を渡してタグを並べる */
export const ComboboxValue = BaseCombobox.Value;
export const useComboboxFilter = BaseCombobox.useFilter;

/** 枠の中の文字入力と、開閉・消去のボタンの見た目 */
const inputClass =
	"h-full w-full min-w-0 flex-1 bg-transparent px-(--group-pad) text-fg outline-none placeholder:text-fg-subtle selection:bg-brand-soft disabled:cursor-not-allowed";

/** 入力欄の右端に並ぶボタンの形。色の transition は持たせず、使う側で選ぶ */
const trailingButtonShape = [
	"flex size-7 shrink-0 items-center justify-center rounded-sm text-fg-muted outline-none",
	"hover:not-data-disabled:bg-surface-hover hover:not-data-disabled:text-fg",
	"focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-focus",
	"motion-press-glyph",
];

const trailingButtonClass = [
	...trailingButtonShape,
	"transition-colors duration-(--duration-fast) ease-standard",
];

export type ComboboxInputProps = Omit<React.ComponentProps<typeof BaseCombobox.Input>, "size"> & {
	size?: "sm" | "md" | "lg";
	/** 選んだ値を消すボタンを出す */
	showClear?: boolean;
	/** 枠の className */
	groupClassName?: string;
	/** 枠の先頭に置くアイコン */
	icon?: React.ReactNode;
};

/**
 * 1 つを選ぶ Combobox の入力欄。右端の矢印で候補を開く。
 * 開いている間、矢印は半回転し、枠はブランドカラーになる。枠は候補の一覧の位置の基準なので、大きさを変えない。
 */
export function ComboboxInput({
	className,
	size = "md",
	showClear = false,
	groupClassName,
	icon,
	...props
}: ComboboxInputProps) {
	return (
		<BaseCombobox.InputGroup
			data-slot="combobox-input-group"
			className={cn(
				inputGroupVariants({ size }),
				"group/combobox has-data-popup-open:border-brand",
				groupClassName,
			)}
		>
			{icon && (
				<span className="flex shrink-0 pl-(--group-pad) text-fg-muted [&_svg]:size-4" aria-hidden>
					{icon}
				</span>
			)}
			<BaseCombobox.Input
				data-slot="combobox-input"
				className={cn(inputClass, icon && "pl-2", className)}
				{...props}
			/>
			<span className="flex shrink-0 items-center gap-0.5 pr-1">
				{showClear && <ComboboxClear />}
				<BaseCombobox.Trigger
					data-slot="combobox-trigger"
					aria-label="候補を開く"
					className={cn(trailingButtonClass)}
				>
					<ChevronDown className="size-4 transition-[rotate] duration-(--duration-spring-press) ease-spring-press [[data-popup-open]>&]:rotate-180" />
				</BaseCombobox.Trigger>
			</span>
		</BaseCombobox.InputGroup>
	);
}

/** 選んだ値を消すボタン。値があるときだけ、小さくぼけた状態から弾んで現れ、速く消える */
function ComboboxClear() {
	return (
		<BaseCombobox.Clear
			data-slot="combobox-clear"
			aria-label="選択を消す"
			className={cn(trailingButtonShape, "motion-swap")}
		>
			<X className="size-4" />
		</BaseCombobox.Clear>
	);
}

export type ComboboxChipsProps = Omit<
	React.ComponentProps<typeof BaseCombobox.Input>,
	"size" | "children"
> & {
	size?: "sm" | "md" | "lg";
	/** タグに出す名前。省くと、値の label か文字列そのものを使う */
	getLabel?: (value: unknown) => string;
	/** 枠の className */
	groupClassName?: string;
};

const defaultChipLabel = (value: unknown) =>
	typeof value === "object" && value !== null && "label" in value ? String(value.label) : String(value);

/**
 * 複数を選ぶ Combobox の入力欄。選んだ値はタグになって入力欄の前に並ぶ。
 * 入力欄の先頭で ← を押すとタグにフォーカスが移り、Backspace で外せる。
 */
export function ComboboxChips({
	className,
	size = "md",
	getLabel = defaultChipLabel,
	groupClassName,
	placeholder,
	...props
}: ComboboxChipsProps) {
	return (
		<BaseCombobox.InputGroup
			data-slot="combobox-chips-group"
			className={cn(
				inputGroupVariants({ size }),
				"h-auto min-h-9 cursor-text py-1 pr-1 pl-1 has-data-popup-open:border-brand",
				size === "sm" && "min-h-8",
				size === "lg" && "min-h-11",
				groupClassName,
			)}
		>
			<BaseCombobox.Value>
				{(values: unknown[]) => (
					<BaseCombobox.Chips
						data-slot="combobox-chips"
						aria-label={values.length > 0 ? "選んだ値" : undefined}
						className="flex min-w-0 flex-1 flex-wrap items-center gap-1"
					>
						<AnimatePresence initial={false} mode="popLayout">
							{values.map((value) => {
								const label = getLabel(value);
								return (
									<ComboboxChip key={label} aria-label={label}>
										{label}
									</ComboboxChip>
								);
							})}
						</AnimatePresence>
						<BaseCombobox.Input
							data-slot="combobox-chips-input"
							placeholder={values.length > 0 ? undefined : placeholder}
							className={cn(
								"h-7 min-w-16 flex-1 bg-transparent px-1.5 text-fg outline-none placeholder:text-fg-subtle disabled:cursor-not-allowed",
								className,
							)}
							{...props}
						/>
					</BaseCombobox.Chips>
				)}
			</BaseCombobox.Value>
			<BaseCombobox.Trigger
				data-slot="combobox-trigger"
				aria-label="候補を開く"
				className={cn(trailingButtonClass, "self-start")}
			>
				<ChevronDown className="size-4 transition-[rotate] duration-(--duration-spring-press) ease-spring-press [[data-popup-open]>&]:rotate-180" />
			</BaseCombobox.Trigger>
		</BaseCombobox.InputGroup>
	);
}

export type ComboboxChipProps = React.ComponentProps<typeof BaseCombobox.Chip> & {
	/** 外すボタンのアクセシブルネーム */
	removeLabel?: string;
};

/** 選んだ値のタグ。選ぶと弾んで現れ、外すと縮んで消え、残りのタグが詰める */
export function ComboboxChip({ className, children, removeLabel, ...props }: ComboboxChipProps) {
	const reduce = useReducedMotion();
	return (
		<BaseCombobox.Chip
			data-slot="combobox-chip"
			className={cn(
				"flex h-7 cursor-default items-center gap-1 rounded-sm border border-line bg-surface-raised pr-0.5 pl-2 text-sm text-fg outline-none",
				"transition-colors duration-(--duration-fast) ease-standard",
				"focus-visible:border-brand focus-visible:bg-brand-soft focus-visible:text-fg-strong",
				className,
			)}
			render={
				<motion.div
					layout={!reduce}
					initial={reduce ? false : { opacity: 0, scale: 0.8 }}
					animate={{ opacity: 1, scale: 1 }}
					exit={
						reduce
							? { opacity: 0, transition: { duration: 0 } }
							: { opacity: 0, scale: 0.8, transition: { duration: 0.12, ease: [0.16, 1, 0.3, 1] } }
					}
					transition={springs.snappy}
				/>
			}
			{...props}
		>
			<span className="truncate">{children}</span>
			<BaseCombobox.ChipRemove
				data-slot="combobox-chip-remove"
				aria-label={removeLabel ?? (typeof children === "string" ? `${children}を外す` : "外す")}
				className={cn(trailingButtonClass, "size-5.5 [&_svg]:size-3.5")}
			>
				<X />
			</BaseCombobox.ChipRemove>
		</BaseCombobox.Chip>
	);
}

export type ComboboxContentProps = Omit<React.ComponentProps<typeof BaseCombobox.Popup>, "children"> &
	Pick<React.ComponentProps<typeof BaseCombobox.Positioner>, "side" | "sideOffset" | "align"> & {
		/** 1 件もないときの文言 */
		empty?: React.ReactNode;
		/** 一覧の className */
		listClassName?: string;
		children?: React.ComponentProps<typeof BaseCombobox.List>["children"];
	};

/**
 * 候補の一覧。入力欄の下に、Select と同じ見た目で現れる。選んでいる候補の背景は、候補から候補へ滑って移る。
 * `items` を Combobox に渡したときは、children に `(item) => <ComboboxItem />` の関数を渡す。
 */
export function ComboboxContent({
	className,
	side = "bottom",
	sideOffset = 6,
	align = "start",
	empty = "見つかりません",
	listClassName,
	children,
	...props
}: ComboboxContentProps) {
	return (
		<BaseCombobox.Portal>
			<BaseCombobox.Positioner
				side={side}
				sideOffset={sideOffset}
				align={align}
				className="z-50 outline-none select-none"
			>
				<BaseCombobox.Popup
					data-slot="combobox-content"
					className={cn(
						"motion-rise relative max-h-[min(var(--available-height),20rem)] w-(--anchor-width) max-w-(--available-width) overflow-hidden rounded-md border border-line bg-surface-overlay text-fg shadow-pop outline-none",
						"flex flex-col",
						className,
					)}
					{...props}
				>
					<BaseCombobox.Empty
						data-slot="combobox-empty"
						className="px-3 py-5 text-center text-sm text-fg-muted empty:hidden"
					>
						{empty}
					</BaseCombobox.Empty>
					<GlideGroup>
						<BaseCombobox.List
							data-slot="combobox-list"
							className={cn(
								"min-h-0 flex-1 scroll-py-1 overflow-y-auto overscroll-contain p-1 outline-none data-empty:hidden",
								listClassName,
							)}
						>
							{children}
						</BaseCombobox.List>
					</GlideGroup>
				</BaseCombobox.Popup>
			</BaseCombobox.Positioner>
		</BaseCombobox.Portal>
	);
}

/** 候補。選んだ候補にはチェックマークが付く */
export function ComboboxItem({
	className,
	children,
	...props
}: React.ComponentProps<typeof BaseCombobox.Item>) {
	return (
		<BaseCombobox.Item
			data-slot="combobox-item"
			className={cn(
				"relative isolate grid cursor-default grid-cols-[1rem_1fr] items-center gap-2 rounded-sm py-1.5 pr-3 pl-2 text-sm outline-none select-none",
				"transition-colors duration-(--duration-fast) ease-standard data-highlighted:text-fg-strong data-selected:text-fg-strong",
				"data-disabled:cursor-not-allowed data-disabled:opacity-50",
				className,
			)}
			render={glideRender()}
			{...props}
		>
			<BaseCombobox.ItemIndicator className="col-start-1 flex text-brand">
				<Check className="size-4" />
			</BaseCombobox.ItemIndicator>
			<span className="col-start-2 truncate">{children}</span>
		</BaseCombobox.Item>
	);
}

export function ComboboxGroup({ className, ...props }: React.ComponentProps<typeof BaseCombobox.Group>) {
	return <BaseCombobox.Group data-slot="combobox-group" className={cn("py-0.5", className)} {...props} />;
}

export function ComboboxGroupLabel({
	className,
	...props
}: React.ComponentProps<typeof BaseCombobox.GroupLabel>) {
	return (
		<BaseCombobox.GroupLabel
			data-slot="combobox-group-label"
			className={cn("px-2 pt-1.5 pb-1 text-xs font-medium tracking-wide text-fg-muted", className)}
			{...props}
		/>
	);
}

export function ComboboxSeparator({
	className,
	...props
}: React.ComponentProps<typeof BaseCombobox.Separator>) {
	return (
		<BaseCombobox.Separator
			data-slot="combobox-separator"
			className={cn("-mx-1 my-1 h-px bg-line-subtle", className)}
			{...props}
		/>
	);
}

import { Autocomplete as BaseAutocomplete } from "@base-ui/react/autocomplete";
import { X } from "lucide-react";
import type * as React from "react";
import { cn } from "../lib/cn";
import { GlideGroup, glideRender } from "../lib/glide";
import { inputGroupVariants } from "./input-group";

/**
 * 打った文字に合う候補を出し、選ぶと入力欄に入る。入る値は自由な文字のままでよく、候補は手助けにとどまる。
 * 候補の中から必ず選ばせたいときは Combobox を使う。`items` に候補を渡し、AutocompleteContent の子に関数を渡す。
 */
export const Autocomplete = BaseAutocomplete.Root;

export const AutocompleteCollection = BaseAutocomplete.Collection;
export const useAutocompleteFilter = BaseAutocomplete.useFilter;

export type AutocompleteInputProps = Omit<React.ComponentProps<typeof BaseAutocomplete.Input>, "size"> & {
	size?: "sm" | "md" | "lg";
	/** 枠の先頭に置くアイコン */
	icon?: React.ReactNode;
	/** 文字を消すボタンを出す */
	showClear?: boolean;
	/** 枠の className */
	groupClassName?: string;
};

/**
 * 候補を出す入力欄。打つと下に候補が出て、↑↓ で選んで Enter で入れる。Esc で候補を閉じる。
 * 枠は候補の一覧の位置の基準なので、大きさを変えない。
 */
export function AutocompleteInput({
	className,
	size = "md",
	icon,
	showClear = false,
	groupClassName,
	...props
}: AutocompleteInputProps) {
	return (
		<BaseAutocomplete.InputGroup
			data-slot="autocomplete-input-group"
			className={cn(inputGroupVariants({ size }), "has-data-popup-open:border-brand", groupClassName)}
		>
			{icon && (
				<span
					aria-hidden
					className="flex shrink-0 pl-(--group-pad) text-fg-muted transition-colors duration-(--duration-fast) group-focus-within/input-group:text-fg [&_svg]:size-4"
				>
					{icon}
				</span>
			)}
			<BaseAutocomplete.Input
				data-slot="autocomplete-input"
				className={cn(
					"h-full w-full min-w-0 flex-1 bg-transparent px-(--group-pad) text-fg outline-none placeholder:text-fg-subtle selection:bg-brand-soft disabled:cursor-not-allowed",
					icon && "pl-2",
					showClear && "pr-1",
					className,
				)}
				{...props}
			/>
			{showClear && (
				<span className="flex shrink-0 items-center pr-1">
					<BaseAutocomplete.Clear
						data-slot="autocomplete-clear"
						aria-label="文字を消す"
						className={cn(
							"flex size-7 shrink-0 items-center justify-center rounded-sm text-fg-muted outline-none",
							"hover:bg-surface-hover hover:text-fg focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-focus",
							"motion-swap motion-press-glyph",
						)}
					>
						<X className="size-4" />
					</BaseAutocomplete.Clear>
				</span>
			)}
		</BaseAutocomplete.InputGroup>
	);
}

export type AutocompleteContentProps = Omit<React.ComponentProps<typeof BaseAutocomplete.Popup>, "children"> &
	Pick<React.ComponentProps<typeof BaseAutocomplete.Positioner>, "side" | "sideOffset" | "align"> & {
		/** 1 件もないときの文言。省くと、候補がないときは面ごと閉じる */
		empty?: React.ReactNode;
		listClassName?: string;
		children?: React.ComponentProps<typeof BaseAutocomplete.List>["children"];
	};

/** 候補の一覧。入力欄の下に出て、選んでいる候補の背景は候補から候補へ滑って移る */
export function AutocompleteContent({
	className,
	side = "bottom",
	sideOffset = 6,
	align = "start",
	empty,
	listClassName,
	children,
	...props
}: AutocompleteContentProps) {
	return (
		<BaseAutocomplete.Portal>
			<BaseAutocomplete.Positioner
				side={side}
				sideOffset={sideOffset}
				align={align}
				className="z-50 outline-none select-none"
			>
				<BaseAutocomplete.Popup
					data-slot="autocomplete-content"
					className={cn(
						"motion-rise relative flex max-h-[min(var(--available-height),20rem)] w-(--anchor-width) max-w-(--available-width) flex-col overflow-hidden rounded-md border border-line bg-surface-overlay text-fg shadow-pop outline-none",
						className,
					)}
					{...props}
				>
					{empty !== undefined && (
						<BaseAutocomplete.Empty
							data-slot="autocomplete-empty"
							className="px-3 py-5 text-center text-sm text-fg-muted empty:hidden"
						>
							{empty}
						</BaseAutocomplete.Empty>
					)}
					<GlideGroup>
						<BaseAutocomplete.List
							data-slot="autocomplete-list"
							className={cn(
								"min-h-0 flex-1 scroll-py-1 overflow-y-auto overscroll-contain p-1 outline-none data-empty:hidden",
								listClassName,
							)}
						>
							{children}
						</BaseAutocomplete.List>
					</GlideGroup>
				</BaseAutocomplete.Popup>
			</BaseAutocomplete.Positioner>
		</BaseAutocomplete.Portal>
	);
}

/** 候補。アイコンや補足を並べてもよい */
export function AutocompleteItem({
	className,
	...props
}: React.ComponentProps<typeof BaseAutocomplete.Item>) {
	return (
		<BaseAutocomplete.Item
			data-slot="autocomplete-item"
			className={cn(
				"relative isolate flex cursor-default items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none select-none",
				"transition-colors duration-(--duration-fast) ease-standard data-highlighted:text-fg-strong",
				"data-disabled:cursor-not-allowed data-disabled:opacity-50",
				"[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4 [&_svg:not([class*='text-'])]:text-fg-muted",
				className,
			)}
			render={glideRender()}
			{...props}
		/>
	);
}

export function AutocompleteGroup({
	className,
	...props
}: React.ComponentProps<typeof BaseAutocomplete.Group>) {
	return (
		<BaseAutocomplete.Group data-slot="autocomplete-group" className={cn("py-0.5", className)} {...props} />
	);
}

export function AutocompleteGroupLabel({
	className,
	...props
}: React.ComponentProps<typeof BaseAutocomplete.GroupLabel>) {
	return (
		<BaseAutocomplete.GroupLabel
			data-slot="autocomplete-group-label"
			className={cn("px-2 pt-1.5 pb-1 text-xs font-medium tracking-wide text-fg-muted", className)}
			{...props}
		/>
	);
}

export function AutocompleteSeparator({
	className,
	...props
}: React.ComponentProps<typeof BaseAutocomplete.Separator>) {
	return (
		<BaseAutocomplete.Separator
			data-slot="autocomplete-separator"
			className={cn("-mx-1 my-1 h-px bg-line-subtle", className)}
			{...props}
		/>
	);
}

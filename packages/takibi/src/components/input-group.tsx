import { Input as BaseInput } from "@base-ui/react/input";
import { cva, type VariantProps } from "class-variance-authority";
import { Search, X } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import * as React from "react";
import { cn } from "../lib/cn";
import { swap } from "../lib/motion";
import { Button, type ButtonProps } from "./button";
import { Kbd } from "./kbd";

/**
 * 入力欄の枠。中の入力欄ではなく、枠の側でフォーカスリングとエラーの色を出す。
 * PasswordInput、NumberField、Combobox も同じ見た目を使う。
 */
export const inputGroupVariants = cva(
	[
		"group/input-group relative flex w-full min-w-0 items-center rounded-md border border-line-strong bg-surface-sunken text-fg shadow-rim",
		"transition-[border-color,box-shadow] duration-(--duration-fast) ease-standard",
		"hover:not-focus-within:not-has-[input:disabled]:border-line-hover",
		"focus-within:border-brand focus-within:ring-3 focus-within:ring-brand-soft",
		"has-aria-invalid:border-danger has-aria-invalid:focus-within:ring-danger-soft",
		"has-data-invalid:border-danger has-data-invalid:focus-within:ring-danger-soft",
		"has-[input:disabled]:cursor-not-allowed has-[input:disabled]:opacity-50",
		"has-[input:not([type=hidden]):read-only]:bg-surface has-[input:not([type=hidden]):read-only]:focus-within:ring-0",
	],
	{
		variants: {
			size: {
				sm: "h-8 text-sm [--group-pad:calc(var(--spacing)*2.5)]",
				md: "h-9 text-sm [--group-pad:calc(var(--spacing)*3)]",
				lg: "h-11 text-base [--group-pad:calc(var(--spacing)*3.5)]",
			},
		},
		defaultVariants: { size: "md" },
	},
);

export type InputGroupProps = React.ComponentProps<"div"> & VariantProps<typeof inputGroupVariants>;

/**
 * 入力欄の前後に、アイコン・文字・ボタンを添える。中に InputGroupAddon と InputGroupInput を並べる。
 * 添え物の文字やアイコンを押しても、入力欄にフォーカスが移る。
 */
export function InputGroup({ className, size, onPointerDown, ...props }: InputGroupProps) {
	return (
		<div
			data-slot="input-group"
			data-size={size ?? "md"}
			className={cn(inputGroupVariants({ size }), className)}
			onPointerDown={(event) => {
				onPointerDown?.(event);
				const target = event.target as HTMLElement;
				if (target.closest("input, textarea, button, a, [role='button']")) return;
				const input = event.currentTarget.querySelector<HTMLInputElement>("input:not([type='hidden'])");
				if (!input || input.disabled) return;
				event.preventDefault();
				input.focus();
			}}
			{...props}
		/>
	);
}

export type InputGroupInputProps = Omit<React.ComponentProps<typeof BaseInput>, "size">;

/** 枠の中の入力欄。枠と輪は InputGroup が持つので、ここは素の欄になる */
export function InputGroupInput({ className, ...props }: InputGroupInputProps) {
	return (
		<BaseInput
			data-slot="input-group-input"
			className={cn(
				"h-full w-full min-w-0 flex-1 rounded-[inherit] bg-transparent px-(--group-pad) text-fg outline-none",
				"placeholder:text-fg-subtle selection:bg-brand-soft disabled:cursor-not-allowed",
				"[[data-align=start]+&]:pl-2 [&:has(+[data-align=end])]:pr-1.5",
				"[&::-webkit-search-cancel-button]:appearance-none",
				className,
			)}
			{...props}
		/>
	);
}

export type InputGroupAddonProps = React.ComponentProps<"div"> & {
	/** 入力欄の前に置くか後ろに置くか。DOM の順も合わせること */
	align?: "start" | "end";
};

/** 入力欄の前後に置く添え物。アイコン、単位などの文字、InputGroupButton を入れる */
export function InputGroupAddon({ className, align = "start", ...props }: InputGroupAddonProps) {
	return (
		<div
			data-slot="input-group-addon"
			data-align={align}
			className={cn(
				"flex h-full shrink-0 items-center gap-1.5 text-fg-muted select-none",
				"transition-colors duration-(--duration-fast) ease-standard",
				"[&>svg]:pointer-events-none [&>svg:not([class*='size-'])]:size-4",
				align === "start"
					? "pl-(--group-pad) has-[>button]:pl-1 group-focus-within/input-group:[&>svg]:text-fg"
					: "pr-(--group-pad) has-[>button]:pr-1",
				className,
			)}
			{...props}
		/>
	);
}

/** 添え物の文字。単位や URL の先頭など */
export function InputGroupText({ className, ...props }: React.ComponentProps<"span">) {
	return <span data-slot="input-group-text" className={cn("text-fg-muted", className)} {...props} />;
}

/**
 * 枠の中に収まる小さなボタン。表示の切り替えや消去に使う。アイコンだけなら aria-label を付ける。
 * 押してもフォーカスは入力欄に残る。
 */
export function InputGroupButton({
	className,
	variant = "ghost",
	size = "icon-sm",
	onPointerDown,
	...props
}: ButtonProps) {
	return (
		<Button
			data-slot="input-group-button"
			type="button"
			variant={variant}
			size={size}
			className={cn(
				"rounded-sm",
				size === "icon-sm" && "size-7 group-data-[size=sm]/input-group:size-6",
				size === "sm" && "h-7 px-2.5",
				className,
			)}
			onPointerDown={(event) => {
				onPointerDown?.(event);
				// 入力中の欄からフォーカスを奪わない。キーボードでは Tab で届く
				const group = event.currentTarget.closest("[data-slot='input-group']");
				if (group?.contains(document.activeElement) && document.activeElement !== event.currentTarget) {
					event.preventDefault();
				}
			}}
			{...props}
		/>
	);
}

export type SearchInputProps = Omit<
	InputGroupInputProps,
	"type" | "value" | "defaultValue" | "onValueChange"
> &
	VariantProps<typeof inputGroupVariants> & {
		value?: string;
		defaultValue?: string;
		onValueChange?: (value: string) => void;
		/**
		 * フォーカスを移すショートカットのキー。`/` のような 1 文字か、`mod+k`（Mac は ⌘、他は Ctrl）。
		 * 空で、フォーカスがないときに案内を出す
		 */
		shortcut?: string;
		/** 消去ボタンのアクセシブルネーム */
		clearLabel?: string;
		/** 枠の className */
		groupClassName?: string;
	};

/**
 * 一覧を絞り込む検索欄。文字が入ると消去ボタンが現れ、Esc でも消える。
 * `shortcut` を渡すと、空のときにキーの案内が出て、そのキーでどこからでもフォーカスできる。
 */
export function SearchInput({
	size,
	value: valueProp,
	defaultValue = "",
	onValueChange,
	onKeyDown,
	onFocus,
	onBlur,
	shortcut,
	clearLabel = "検索語を消す",
	groupClassName,
	placeholder = "検索",
	disabled,
	ref: refProp,
	...props
}: SearchInputProps) {
	const [uncontrolled, setUncontrolled] = React.useState(defaultValue);
	const value = valueProp ?? uncontrolled;
	const inputRef = React.useRef<HTMLInputElement>(null);
	const reduce = useReducedMotion();
	const [focused, setFocused] = React.useState(false);

	const setRef = React.useCallback(
		(node: HTMLInputElement | null) => {
			inputRef.current = node;
			if (typeof refProp === "function") refProp(node);
			else if (refProp) refProp.current = node;
		},
		[refProp],
	);

	const change = (next: string) => {
		if (valueProp === undefined) setUncontrolled(next);
		onValueChange?.(next);
	};

	useShortcut(shortcut, inputRef, !disabled);

	const trailing = value ? "clear" : shortcut && !focused ? "hint" : null;
	const transition = reduce ? { duration: 0 } : swap.transition;

	return (
		<InputGroup size={size} className={groupClassName}>
			<InputGroupAddon>
				<Search aria-hidden />
			</InputGroupAddon>
			<InputGroupInput
				ref={setRef}
				type="search"
				value={value}
				placeholder={placeholder}
				disabled={disabled}
				onValueChange={change}
				onKeyDown={(event) => {
					onKeyDown?.(event);
					if (event.key === "Escape" && value) {
						event.preventDefault();
						change("");
					}
				}}
				onFocus={(event) => {
					onFocus?.(event);
					setFocused(true);
				}}
				onBlur={(event) => {
					onBlur?.(event);
					setFocused(false);
				}}
				{...props}
			/>
			<InputGroupAddon align="end" className={cn(trailing === null && "pr-0")}>
				<AnimatePresence mode="popLayout" initial={false}>
					{trailing === "clear" && (
						<motion.span key="clear" className="flex" {...swap} transition={transition}>
							<InputGroupButton
								aria-label={clearLabel}
								disabled={disabled}
								onClick={() => {
									change("");
									inputRef.current?.focus();
								}}
							>
								<X />
							</InputGroupButton>
						</motion.span>
					)}
					{trailing === "hint" && shortcut && (
						<motion.span
							key="hint"
							className="flex pr-1"
							initial={{ opacity: 0 }}
							animate={{ opacity: 1 }}
							exit={{ opacity: 0, transition: { duration: 0.1 } }}
							transition={{ duration: reduce ? 0 : 0.2 }}
						>
							<Kbd aria-hidden>{formatShortcut(shortcut)}</Kbd>
						</motion.span>
					)}
				</AnimatePresence>
			</InputGroupAddon>
		</InputGroup>
	);
}

const isMac = () => typeof navigator !== "undefined" && /Mac|iPhone|iPad/.test(navigator.platform);

function formatShortcut(shortcut: string) {
	const [mod, key] = shortcut.includes("+") ? shortcut.split("+") : [null, shortcut];
	if (mod === "mod") return `${isMac() ? "⌘" : "Ctrl "}${key.toUpperCase()}`;
	return key;
}

/** ショートカットのキーで入力欄にフォーカスする。ほかの入力欄に打っている間は反応しない */
function useShortcut(
	shortcut: string | undefined,
	input: React.RefObject<HTMLInputElement | null>,
	enabled: boolean,
) {
	React.useEffect(() => {
		if (!shortcut || !enabled) return;
		const [mod, key] = shortcut.includes("+") ? shortcut.split("+") : [null, shortcut];
		const onKeyDown = (event: KeyboardEvent) => {
			if (event.key.toLowerCase() !== key.toLowerCase()) return;
			if (mod === "mod" ? !(event.metaKey || event.ctrlKey) : event.metaKey || event.ctrlKey || event.altKey)
				return;
			const active = document.activeElement as HTMLElement | null;
			const typing = active?.closest("input, textarea, select, [contenteditable='true']");
			if (typing && mod !== "mod") return;
			event.preventDefault();
			input.current?.focus();
			input.current?.select();
		};
		document.addEventListener("keydown", onKeyDown);
		return () => document.removeEventListener("keydown", onKeyDown);
	}, [shortcut, input, enabled]);
}

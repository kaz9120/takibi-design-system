import { Toggle as BaseToggle } from "@base-ui/react/toggle";
import { cva, type VariantProps } from "class-variance-authority";
import { Check, X } from "lucide-react";
import { AnimatePresence, type HTMLMotionProps, motion, useIsPresent, useReducedMotion } from "motion/react";
import * as React from "react";
import { cn } from "../lib/cn";
import { smoke, springs } from "../lib/motion";

const TagGroupContext = React.createContext(false);

export type TagGroupProps = React.ComponentProps<"fieldset">;

/**
 * Tag を並べる入れ物。外した Tag は上へ薄れて消え（煙）、残りの Tag が隙間を詰める。足した Tag は小さい状態から拡大して現れる。
 * 外せる Tag を並べるときは、必ずこれで囲む。`aria-label` で何の一覧かを伝える。
 */
export function TagGroup({ className, children, ...props }: TagGroupProps) {
	return (
		<fieldset
			data-slot="tag-group"
			className={cn("m-0 flex min-w-0 flex-wrap items-center gap-1.5 border-0 p-0", className)}
			{...props}
		>
			<TagGroupContext.Provider value={true}>
				<AnimatePresence initial={false} mode="popLayout">
					{children}
				</AnimatePresence>
			</TagGroupContext.Provider>
		</fieldset>
	);
}

export const tagVariants = cva(
	[
		"inline-flex shrink-0 items-center gap-1 rounded-md border whitespace-nowrap font-medium select-none",
		"[&_svg]:pointer-events-none [&_svg]:shrink-0",
	],
	{
		variants: {
			size: {
				sm: "h-7 px-2 text-sm [&_svg]:size-3.5",
				md: "h-8 px-2.5 text-sm [&_svg]:size-4",
			},
		},
		defaultVariants: { size: "md" },
	},
);

export type TagProps = Omit<HTMLMotionProps<"span">, "children"> &
	VariantProps<typeof tagVariants> & {
		children: React.ReactNode;
		/** 渡すと、右端に外すボタンが付く。Backspace か Delete でも外せる */
		onRemove?: () => void;
		/** 外すボタンのスクリーンリーダー用の文言。省くと「<中身>を外す」になる */
		removeLabel?: string;
	};

/**
 * 利用者が付けた分類や絞り込みの条件を、外せる小さなタグで示す。外すと上へ薄れて消える（煙）。
 * 状態を示すだけで操作しないものは Badge を、選んで切り替えるものは SelectableTag を使う。
 */
export function Tag({ className, size, children, onRemove, removeLabel, ...props }: TagProps) {
	const grouped = React.useContext(TagGroupContext);
	const reduce = useReducedMotion();
	const present = useIsPresent();
	const label = removeLabel ?? (typeof children === "string" ? `${children}を外す` : "外す");

	const remove = (event: React.SyntheticEvent<HTMLButtonElement>) => {
		// 外したあともフォーカスを失わないように、隣のタグの外すボタンへ移す
		const self = event.currentTarget;
		const buttons = Array.from(
			self
				.closest('[data-slot="tag-group"]')
				?.querySelectorAll<HTMLButtonElement>('[data-slot="tag-remove"]') ?? [],
		).filter((b) => !b.closest("[data-exiting]"));
		const i = buttons.indexOf(self);
		const next = buttons[i + 1] ?? buttons[i - 1];
		onRemove?.();
		if (next) requestAnimationFrame(() => next.focus());
	};

	return (
		<motion.span
			layout={reduce ? false : "position"}
			data-slot="tag"
			initial={grouped && !reduce ? { opacity: 0, scale: 0.85, filter: "blur(2px)" } : false}
			animate={{ opacity: 1, scale: 1, y: 0, filter: "blur(0px)" }}
			exit={reduce ? { opacity: 0, transition: { duration: 0.12 } } : smoke}
			transition={springs.pop}
			// 消えている最中のタグは操作させず、隣のタグを探すときにも数えない
			data-exiting={present ? undefined : ""}
			inert={!present}
			className={cn(
				tagVariants({ size }),
				"border-line bg-surface-raised text-fg shadow-rim",
				onRemove && "pr-1",
				className,
			)}
			{...props}
		>
			{children}
			{onRemove && (
				<button
					type="button"
					data-slot="tag-remove"
					aria-label={label}
					onClick={remove}
					onKeyDown={(e) => {
						if (e.key === "Backspace" || e.key === "Delete") {
							e.preventDefault();
							remove(e);
						}
					}}
					className={cn(
						"inline-flex size-5 items-center justify-center rounded-sm text-fg-muted motion-press-icon outline-none",
						"hover:bg-surface-hover hover:text-fg",
						"focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-focus",
					)}
				>
					<X aria-hidden className="size-3.5!" />
				</button>
			)}
		</motion.span>
	);
}

export type SelectableTagProps = React.ComponentProps<typeof BaseToggle> & VariantProps<typeof tagVariants>;

/**
 * 押すたびに選択と解除が切り替わるタグ。絞り込みの条件や、興味のある分類を複数選ばせるときに使う。
 * 選ぶと、左にチェックマークが伸びて現れる。1 つだけ選ばせるときは ToggleGroup を使う。
 */
export function SelectableTag({ className, size, children, ...props }: SelectableTagProps) {
	return (
		<BaseToggle
			data-slot="selectable-tag"
			className={cn(
				tagVariants({ size }),
				"group/tag motion-press outline-none",
				"border-line text-fg-muted hover:not-data-disabled:bg-surface-hover hover:not-data-disabled:text-fg",
				"data-pressed:border-brand/40 data-pressed:bg-brand-soft data-pressed:text-brand",
				"hover:not-data-disabled:data-pressed:bg-brand-soft hover:not-data-disabled:data-pressed:text-brand",
				"focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus",
				"data-disabled:cursor-not-allowed data-disabled:opacity-50",
				className,
			)}
			{...props}
		>
			{/* チェックマークの幅を 0 から伸ばす。選ぶ前は場所を取らない */}
			<span
				aria-hidden
				className={cn(
					"-mr-1 grid grid-cols-[0fr] transition-[grid-template-columns,margin] duration-(--duration-sway) ease-sway",
					"group-data-pressed/tag:mr-0 group-data-pressed/tag:grid-cols-[1fr]",
				)}
			>
				<span className="overflow-hidden">
					<Check
						className={cn(
							"scale-50 opacity-0 transition-[opacity,scale] duration-(--duration-fast) ease-out-expo",
							"group-data-pressed/tag:scale-100 group-data-pressed/tag:opacity-100 group-data-pressed/tag:duration-(--duration-pop) group-data-pressed/tag:ease-pop",
						)}
					/>
				</span>
			</span>
			{children}
		</BaseToggle>
	);
}

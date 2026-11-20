import { cva, type VariantProps } from "class-variance-authority";
import { motion, useReducedMotion } from "motion/react";
import * as React from "react";
import { cn } from "../lib/cn";
import { springs } from "../lib/motion";

const emptyStateVariants = cva("flex flex-col items-center text-center", {
	variants: {
		variant: {
			/** ページや大きな面が空のとき。中央に大きく置く */
			full: "gap-4 px-6 py-16",
			/** カードや一覧の中など、狭い場所が空のとき */
			compact: "gap-3 px-4 py-8",
		},
	},
	defaultVariants: { variant: "full" },
});

type Variant = NonNullable<VariantProps<typeof emptyStateVariants>["variant"]>;

const EmptyStateContext = React.createContext<Variant>("full");

export type EmptyStateProps = React.ComponentProps<"div"> & VariantProps<typeof emptyStateVariants>;

/**
 * 表示するものがまだないことを伝え、次にすることを 1 つだけ示す。
 * 中に EmptyStateIcon、EmptyStateTitle、EmptyStateDescription、EmptyStateActions を順に置く。
 * 読み込み中には使わない（Skeleton を使う）。
 */
export function EmptyState({ className, variant, ...props }: EmptyStateProps) {
	return (
		<EmptyStateContext.Provider value={variant ?? "full"}>
			<div
				data-slot="empty-state"
				data-variant={variant ?? "full"}
				className={cn("group/empty", emptyStateVariants({ variant }), className)}
				{...props}
			/>
		</EmptyStateContext.Provider>
	);
}

export type EmptyStateIconProps = React.ComponentProps<typeof motion.div>;

/** 空の理由を示すアイコン。表示したときに 1 回だけ、8px 下からぼけた状態で上がって現れる。繰り返し動かさない */
export function EmptyStateIcon({ className, ...props }: EmptyStateIconProps) {
	const variant = React.useContext(EmptyStateContext);
	const reduce = useReducedMotion();
	return (
		<motion.div
			aria-hidden
			data-slot="empty-state-icon"
			initial={reduce ? false : { opacity: 0, y: 8, scale: 0.92, filter: "blur(4px)" }}
			animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
			transition={springs.ignite}
			className={cn(
				"relative flex items-center justify-center rounded-full border border-line-subtle bg-surface-raised text-fg-muted",
				"shadow-[var(--shadow-rim),var(--shadow-glow-soft)]",
				variant === "full" ? "size-16 [&_svg]:size-7" : "size-11 [&_svg]:size-5",
				className,
			)}
			{...props}
		/>
	);
}

export function EmptyStateTitle({ className, ...props }: React.ComponentProps<"h3">) {
	return (
		<h3
			data-slot="empty-state-title"
			className={cn(
				"font-semibold tracking-snug text-fg-strong",
				"text-lg group-data-[variant=compact]/empty:text-base",
				className,
			)}
			{...props}
		/>
	);
}

export function EmptyStateDescription({ className, ...props }: React.ComponentProps<"p">) {
	return (
		<p
			data-slot="empty-state-description"
			className={cn(
				"-mt-2 max-w-sm text-sm text-balance text-fg-muted group-data-[variant=compact]/empty:-mt-1.5",
				className,
			)}
			{...props}
		/>
	);
}

/** 次にする行動。主要なボタンを 1 つにし、必要なら補助のリンクを添える */
export function EmptyStateActions({ className, ...props }: React.ComponentProps<"div">) {
	return (
		<div
			data-slot="empty-state-actions"
			className={cn("mt-2 flex flex-wrap items-center justify-center gap-2", className)}
			{...props}
		/>
	);
}

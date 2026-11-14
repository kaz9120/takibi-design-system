import { motion, useReducedMotion } from "motion/react";
import * as React from "react";
import { cn } from "../lib/cn";

type Orientation = "horizontal" | "vertical";
type StepState = "complete" | "current" | "upcoming";

const StepsContext = React.createContext<{ current: number; orientation: Orientation }>({
	current: 0,
	orientation: "horizontal",
});
const StepIndexContext = React.createContext<{ index: number; last: boolean }>({ index: 0, last: true });

export type StepsProps = React.ComponentProps<"ol"> & {
	/** 今いる段階。0 から数える。段階の数と同じにすると、すべて完了になる */
	current: number;
	/** horizontal（既定）は横に並べる。段階が多いときや説明が長いときは vertical */
	orientation?: Orientation;
};

/**
 * 複数の段階に分かれた手続きで、今どこにいて、あといくつあるかを示す。
 * 終えた段階の丸にはチェックマークが描かれる。段階をつなぐ線は、明るい点を先端に付けて今の段階へ伸びる（導火線）。
 * 段階は Step で並べる。4〜5 段階までにする。
 */
export function Steps({ className, current, orientation = "horizontal", children, ...props }: StepsProps) {
	const items = React.Children.toArray(children).filter(React.isValidElement);
	const context = React.useMemo(() => ({ current, orientation }), [current, orientation]);
	return (
		<StepsContext.Provider value={context}>
			<ol
				data-slot="steps"
				data-orientation={orientation}
				className={cn(
					"flex",
					orientation === "horizontal" ? "w-full flex-row items-start" : "flex-col",
					className,
				)}
				{...props}
			>
				{items.map((child, index) => (
					<StepIndexContext.Provider
						key={child.key ?? index}
						value={{ index, last: index === items.length - 1 }}
					>
						{child}
					</StepIndexContext.Provider>
				))}
			</ol>
		</StepsContext.Provider>
	);
}

const stateLabel: Record<StepState, string> = {
	complete: "完了",
	current: "進行中",
	upcoming: "未着手",
};

export type StepProps = Omit<React.ComponentProps<"li">, "title"> & {
	title: React.ReactNode;
	description?: React.ReactNode;
};

export function Step({ className, title, description, ...props }: StepProps) {
	const { current, orientation } = React.useContext(StepsContext);
	const { index, last } = React.useContext(StepIndexContext);
	const state: StepState = index < current ? "complete" : index === current ? "current" : "upcoming";
	const horizontal = orientation === "horizontal";

	return (
		<li
			data-slot="step"
			data-state={state}
			aria-current={state === "current" ? "step" : undefined}
			className={cn(
				"group/step relative flex",
				horizontal ? "flex-col gap-2" : "flex-row gap-3",
				horizontal && (last ? "flex-none" : "flex-1"),
				className,
			)}
			{...props}
		>
			<div
				className={cn("flex items-center", horizontal ? "flex-row gap-2" : "flex-col gap-1.5 self-stretch")}
			>
				<StepIndicator state={state} index={index} />
				{!last && <StepConnector filled={index < current} orientation={orientation} />}
			</div>
			<div className={cn("flex min-w-0 flex-col gap-0.5", horizontal ? "pr-4" : "pt-1 pb-6")}>
				<span
					className={cn(
						"text-sm font-medium transition-colors duration-(--duration-base) ease-standard",
						state === "upcoming" ? "text-fg-muted" : "text-fg-strong",
					)}
				>
					{title}
					<span className="sr-only">（{stateLabel[state]}）</span>
				</span>
				{description && <span className="text-sm text-fg-muted">{description}</span>}
			</div>
		</li>
	);
}

/** 段階の丸。終えると番号が縮みながら消え、代わりにチェックマークが描かれる */
function StepIndicator({ state, index }: { state: StepState; index: number }) {
	return (
		<span
			aria-hidden
			data-slot="step-indicator"
			data-checked={state === "complete" || undefined}
			className={cn(
				"relative inline-flex size-7 shrink-0 items-center justify-center rounded-full border text-sm font-semibold tabular-nums",
				"transition-[background-color,border-color,color,box-shadow] duration-(--duration-base) ease-standard",
				state === "complete" && "border-brand bg-brand text-fg-on-brand",
				// 線が伸びきってから（300ms 遅らせて）色を変える。動く主役は線で、丸はそのあとに従う
				state === "current" && "border-brand bg-brand-soft text-brand shadow-glow-soft delay-300",
				state === "upcoming" && "border-line-strong bg-surface text-fg-muted",
			)}
		>
			<span
				className={cn(
					"transition-[opacity,scale,filter] duration-(--duration-fast) ease-out-expo",
					state === "complete" && "scale-50 opacity-0 blur-[2px]",
				)}
			>
				{index + 1}
			</span>
			<svg
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				strokeWidth={2.75}
				className="absolute size-3.5"
				aria-hidden
			>
				<path
					d="M20 6 9 17l-5-5"
					pathLength={1}
					strokeLinecap="round"
					strokeLinejoin="round"
					className="motion-draw"
				/>
			</svg>
		</span>
	);
}

/** 段階をつなぐ線。前の段階を終えると、明るい点を先端に付けて 420ms で次へ伸びる。戻すと 220ms で縮む */
function StepConnector({ filled, orientation }: { filled: boolean; orientation: Orientation }) {
	const reduce = useReducedMotion();
	const horizontal = orientation === "horizontal";
	const size = horizontal ? "width" : "height";
	const transition = reduce
		? { duration: 0 }
		: filled
			? { duration: 0.42, ease: [0.4, 0, 0.2, 1] as const }
			: { duration: 0.22, ease: [0.16, 1, 0.3, 1] as const };
	return (
		<span
			aria-hidden
			data-slot="step-connector"
			className={cn(
				"relative rounded-full bg-line",
				horizontal ? "h-0.5 min-w-6 flex-1" : "min-h-6 w-0.5 flex-1",
			)}
		>
			<motion.span
				className={cn(
					"absolute top-0 left-0 rounded-full bg-linear-to-r from-brand-active to-brand",
					horizontal ? "h-full" : "w-full bg-linear-to-b",
				)}
				initial={false}
				animate={{ [size]: filled ? "100%" : "0%" }}
				transition={transition}
			>
				{/* 導火線の先端。伸びている間の 0.7 秒だけ明るい点が出る */}
				<motion.span
					className={cn(
						"absolute size-1.5 rounded-full bg-(--ember-100) shadow-[0_0_8px_2px_rgb(251_193_137/0.7)]",
						horizontal
							? "top-1/2 right-0 translate-x-1/2 -translate-y-1/2"
							: "bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2",
					)}
					initial={false}
					animate={{ opacity: filled && !reduce ? [0, 1, 1, 0] : 0 }}
					transition={filled ? { duration: 0.7, times: [0, 0.1, 0.6, 1] } : { duration: 0.1 }}
				/>
			</motion.span>
		</span>
	);
}

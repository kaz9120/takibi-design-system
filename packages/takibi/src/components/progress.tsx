import { Progress as BaseProgress } from "@base-ui/react/progress";
import { motion, useReducedMotion } from "motion/react";
import * as React from "react";
import { cn } from "../lib/cn";

export type ProgressProps = Omit<React.ComponentProps<typeof BaseProgress.Root>, "children"> & {
	/** 何の進み具合かを示す文言。省くときは `aria-label` を付ける */
	label?: React.ReactNode;
	/** 右上に割合を出す。既定は label があるとき */
	showValue?: boolean;
	size?: "sm" | "md";
};

/**
 * 終わりが分かる処理の進み具合を、線の長さで示す。導火線: 線が伸びている間だけ先端が光り、止まると消える。
 * 終わりが分からないときは `value={null}` にする。中央の線が伸び縮みしながら、明るさを変える。
 * 値を評価して見せる（パスワードの強さなど）ときは Meter を使う。
 */
export function Progress({ className, value, label, showValue, size = "md", ...props }: ProgressProps) {
	const advancing = useAdvancing(value);
	const reduce = useReducedMotion();
	const indeterminate = value === null;
	const valueShown = showValue ?? Boolean(label);
	return (
		<BaseProgress.Root
			data-slot="progress"
			data-advancing={advancing || undefined}
			value={value}
			className={cn("group/progress flex w-full flex-col gap-2", className)}
			{...props}
		>
			{(label || valueShown) && (
				<div className="flex items-baseline justify-between gap-3 text-sm">
					{label && (
						<BaseProgress.Label data-slot="progress-label" className="font-medium text-fg-strong">
							{label}
						</BaseProgress.Label>
					)}
					{valueShown && !indeterminate && (
						<BaseProgress.Value data-slot="progress-value" className="ml-auto tabular-nums text-fg-muted" />
					)}
				</div>
			)}
			<BaseProgress.Track
				data-slot="progress-track"
				className={cn(
					"relative w-full rounded-full bg-surface-sunken shadow-[inset_0_0_0_1px_var(--color-line-subtle)]",
					size === "sm" ? "h-1" : "h-1.5",
				)}
			>
				{indeterminate ? (
					<motion.span
						aria-hidden
						data-slot="progress-breath"
						className="absolute inset-0 origin-center rounded-full bg-linear-to-r from-transparent via-brand to-transparent"
						initial={{ opacity: 0.25, scaleX: 0.4 }}
						animate={
							reduce ? { opacity: 0.6, scaleX: 0.7 } : { opacity: [0.25, 0.9, 0.25], scaleX: [0.4, 1, 0.4] }
						}
						transition={
							reduce ? { duration: 0 } : { duration: 2.4, ease: [0.45, 0.05, 0.55, 0.95], repeat: Infinity }
						}
					/>
				) : (
					<BaseProgress.Indicator
						data-slot="progress-indicator"
						className={cn(
							"relative block rounded-full bg-linear-to-r from-brand-active to-brand",
							"transition-[width,box-shadow] duration-[600ms,900ms] ease-out-expo",
							"group-data-advancing/progress:shadow-ember group-data-advancing/progress:duration-[600ms,120ms]",
							"data-complete:motion-flare",
						)}
					>
						{/* 導火線の先端。伸びている間だけ光り、止まると 900ms かけて消える */}
						<span
							aria-hidden
							className={cn(
								"absolute top-1/2 right-0 h-[calc(100%+4px)] w-4 -translate-y-1/2 rounded-full",
								"bg-linear-to-r from-transparent to-heat-core blur-[2px] motion-fuse",
							)}
						/>
					</BaseProgress.Indicator>
				)}
			</BaseProgress.Track>
		</BaseProgress.Root>
	);
}

/** 値が増えた直後の 700ms だけ true を返す。先端を光らせる間 */
function useAdvancing(value: number | null | undefined) {
	const [advancing, setAdvancing] = React.useState(false);
	const prev = React.useRef(value);
	React.useEffect(() => {
		const before = prev.current;
		prev.current = value;
		if (value == null || before == null || value <= before) {
			setAdvancing(false);
			return;
		}
		setAdvancing(true);
		const t = setTimeout(() => setAdvancing(false), 700);
		return () => clearTimeout(t);
	}, [value]);
	return advancing;
}

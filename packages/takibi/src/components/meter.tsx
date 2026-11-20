import { Meter as BaseMeter } from "@base-ui/react/meter";
import type * as React from "react";
import { cn } from "../lib/cn";

export type MeterProps = Omit<React.ComponentProps<typeof BaseMeter.Root>, "children"> & {
	/** 何を測っているかを示す文言。省くときは `aria-label` を付ける */
	label?: React.ReactNode;
	/** 区切りの数。既定は 4 */
	segments?: number;
	/**
	 * 右上に出す、値の意味を表す文言（「強い」など）。スクリーンリーダーにも使う。
	 * 関数を渡すと、何段目まで埋まっているか（0〜segments）から文言を作れる
	 */
	valueText?: string | ((level: number, value: number) => string);
};

/**
 * 決まった範囲の中で、値がどの段にあるかを示す。パスワードの強さや使用量の表示に使う。
 * 段が上がるほど、埋まった区切りの色がブランドカラーに近づく。処理の進み具合には Progress を使う。
 */
export function Meter({
	className,
	value,
	min = 0,
	max = 100,
	label,
	segments = 4,
	valueText,
	...props
}: MeterProps) {
	const ratio = max === min ? 0 : (value - min) / (max - min);
	const level = Math.max(0, Math.min(segments, Math.ceil(ratio * segments - 1e-9)));
	const text = typeof valueText === "function" ? valueText(level, value) : valueText;
	const warmth = level / segments;
	// fg-subtle に混ぜるブランドカラーを、段に応じて 25% から 100% まで増やす。下限の 25% は、昼と夜のどちらでも面と見分けられる濃さ
	const color = `color-mix(in oklab, var(--color-brand) ${Math.round(25 + warmth * 75)}%, var(--color-fg-subtle))`;

	return (
		<BaseMeter.Root
			data-slot="meter"
			data-level={level}
			value={value}
			min={min}
			max={max}
			aria-valuetext={text}
			className={cn("flex w-full flex-col gap-2", className)}
			{...props}
		>
			{(label || text) && (
				<div className="flex items-baseline justify-between gap-3 text-sm">
					{label && (
						<BaseMeter.Label data-slot="meter-label" className="font-medium text-fg-strong">
							{label}
						</BaseMeter.Label>
					)}
					{text && (
						<BaseMeter.Value
							data-slot="meter-value"
							className="ml-auto text-fg-muted transition-colors duration-(--duration-base)"
						>
							{() => text}
						</BaseMeter.Value>
					)}
				</div>
			)}
			<BaseMeter.Track data-slot="meter-track" className="flex w-full gap-1">
				{Array.from({ length: segments }, (_, i) => {
					const lit = i < level;
					return (
						<span
							// biome-ignore lint/suspicious/noArrayIndexKey: 区切りは位置そのものが識別子
							key={i}
							aria-hidden
							data-slot="meter-segment"
							data-lit={lit || undefined}
							className={cn(
								"h-1.5 flex-1 rounded-full bg-surface-sunken shadow-[inset_0_0_0_1px_var(--color-line-subtle)]",
								"transition-[background-color,box-shadow] duration-(--duration-slow) ease-standard",
								"data-lit:shadow-none",
								lit &&
									level === segments &&
									"shadow-[0_0_10px_color-mix(in_oklab,var(--color-heat-ember)_35%,transparent)]!",
							)}
							style={{
								backgroundColor: lit ? color : undefined,
								// 火の粉の伝播: 埋まるときは左から、空くときは右から、40ms ずつずらして色を変える
								transitionDelay: `${(lit ? i : segments - 1 - i) * 40}ms`,
							}}
						/>
					);
				})}
			</BaseMeter.Track>
		</BaseMeter.Root>
	);
}

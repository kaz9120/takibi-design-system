import { Slider as BaseSlider } from "@base-ui/react/slider";
import * as React from "react";
import { cn } from "../lib/cn";

export type SliderProps = React.ComponentProps<typeof BaseSlider.Root> & {
	/**
	 * ハンドルの上に値を出すか。drag は動かしている間とキーで動かしている間だけ、always は常に出す
	 */
	showValue?: "drag" | "always" | false;
	/** ハンドルごとのアクセシブルネーム。範囲を選ぶときは「下限」「上限」のように付ける */
	thumbLabels?: string[];
	/** ハンドルが 1 つのときのアクセシブルネーム。Field の中では FieldLabel を使う */
	"aria-label"?: string;
};

/**
 * 範囲の中から値を選ぶ。おおよその値でよいときに使い、正確な数を入れさせるときは NumberField を使う。
 * `defaultValue` に配列を渡すと、ハンドルが 2 つの範囲の選択になる。
 * ハンドルは押すと少し膨らみ、離すとばねで戻る。値の帯はブランドカラーで塗る。
 */
export function Slider({
	className,
	showValue = "drag",
	thumbLabels,
	"aria-label": ariaLabel,
	children,
	...props
}: SliderProps) {
	const initial = props.value ?? props.defaultValue ?? props.min ?? 0;
	const count = Array.isArray(initial) ? initial.length : 1;
	const formatter = React.useMemo(
		() => new Intl.NumberFormat(props.locale, props.format),
		[props.locale, props.format],
	);

	return (
		<BaseSlider.Root
			data-slot="slider"
			className={cn(
				"group/slider flex w-full flex-col gap-2 data-[orientation=vertical]:w-auto",
				"data-disabled:cursor-not-allowed data-disabled:opacity-50",
				className,
			)}
			{...props}
		>
			{children}
			<BaseSlider.Control
				data-slot="slider-control"
				className={cn(
					"flex touch-none items-center py-2 select-none",
					"data-[orientation=vertical]:h-40 data-[orientation=vertical]:justify-center data-[orientation=vertical]:px-2 data-[orientation=vertical]:py-0",
				)}
			>
				<BaseSlider.Track
					data-slot="slider-track"
					className={cn(
						"relative h-1.5 w-full rounded-full bg-surface-sunken shadow-[inset_0_0_0_1px_var(--color-line)] select-none",
						"data-[orientation=vertical]:h-full data-[orientation=vertical]:w-1.5",
					)}
				>
					<BaseSlider.Indicator
						data-slot="slider-indicator"
						className={cn(
							"rounded-full bg-brand select-none",
							"group-hover/slider:not-group-data-disabled/slider:bg-brand-hover",
							// キーで動かすと帯の端が滑って追う。指で動かしている間は遅れずに付いてくる
							"transition-[inset-inline-start,width,height,background-color] duration-(--duration-spring-glide) ease-spring-glide group-data-dragging/slider:transition-[background-color]",
							"group-data-invalid/slider:bg-danger",
						)}
					/>
					{Array.from({ length: count }, (_, index) => (
						<SliderThumb
							// ハンドルの並びは値の配列の順で変わらない
							// biome-ignore lint/suspicious/noArrayIndexKey: 値の位置そのものがキーになる
							key={index}
							index={index}
							aria-label={thumbLabels?.[index] ?? (count === 1 ? ariaLabel : undefined)}
							showValue={showValue}
							format={(v) => formatter.format(v)}
						/>
					))}
				</BaseSlider.Track>
			</BaseSlider.Control>
		</BaseSlider.Root>
	);
}

function SliderThumb({
	index,
	showValue,
	format,
	...props
}: React.ComponentProps<typeof BaseSlider.Thumb> & {
	index: number;
	showValue: SliderProps["showValue"];
	format: (value: number) => string;
}) {
	return (
		<BaseSlider.Thumb
			data-slot="slider-thumb"
			index={index}
			className={cn(
				"group/thumb relative flex size-5 items-center justify-center rounded-full outline-none select-none data-disabled:cursor-not-allowed",
				"transition-[inset-inline-start,bottom] duration-(--duration-spring-glide) ease-spring-glide group-data-dragging/slider:transition-none",
			)}
			render={(thumbProps, state) => {
				const active = state.dragging && state.activeThumbIndex === index;
				return (
					<div {...thumbProps} data-active={active || undefined}>
						{thumbProps.children}
						{/* ハンドルの周りの輪。hover、フォーカス、操作中の順に大きく広がる。本体の伸縮に引きずられないよう、本体とは別に置く */}
						<span
							aria-hidden
							className={cn(
								"pointer-events-none absolute inset-0 rounded-full bg-brand-soft opacity-0 scale-50",
								"transition-[opacity,scale] duration-(--duration-spring-soft) ease-spring-soft",
								"group-hover/thumb:not-group-data-disabled/slider:scale-150 group-hover/thumb:not-group-data-disabled/slider:opacity-100",
								"group-has-focus-visible/thumb:scale-175 group-has-focus-visible/thumb:opacity-100",
								"group-data-active/thumb:scale-200 group-data-active/thumb:opacity-100",
							)}
						/>
						{/* ハンドル本体。押すと膨らみ、離すとばねで戻る */}
						<span
							aria-hidden
							className={cn(
								"pointer-events-none relative size-4 rounded-full border-2 border-brand bg-thumb shadow-[0_1px_3px_rgb(0_0_0/0.35)]",
								"transition-[scale,border-color] duration-(--duration-spring-press) ease-spring-press",
								"group-active/thumb:not-group-data-disabled/slider:scale-125 group-data-active/thumb:scale-125",
								"group-has-focus-visible/thumb:outline-2 group-has-focus-visible/thumb:outline-offset-2 group-has-focus-visible/thumb:outline-focus",
								"group-data-invalid/slider:border-danger",
							)}
						/>
						{showValue && (
							<span
								aria-hidden
								data-slot="slider-value-tip"
								className={cn(
									"pointer-events-none absolute bottom-full left-1/2 mb-2 -translate-x-1/2 origin-bottom",
									"rounded-sm border border-line bg-surface-overlay px-1.5 py-0.5 text-xs font-medium whitespace-nowrap text-fg-strong tabular-nums shadow-card",
									"transition-[opacity,scale,translate] duration-(--duration-spring-soft) ease-spring-soft",
									showValue === "drag" && [
										"translate-y-1 scale-90 opacity-0",
										"group-data-active/thumb:translate-y-0 group-data-active/thumb:scale-100 group-data-active/thumb:opacity-100",
										"group-has-focus-visible/thumb:translate-y-0 group-has-focus-visible/thumb:scale-100 group-has-focus-visible/thumb:opacity-100",
										"not-group-data-active/thumb:not-group-has-focus-visible/thumb:duration-150 not-group-data-active/thumb:not-group-has-focus-visible/thumb:ease-out-expo",
									],
								)}
							>
								{format(state.values[index] ?? 0)}
							</span>
						)}
					</div>
				);
			}}
			{...props}
		/>
	);
}

/** 名前。Slider の children に置く。値を並べるときは SliderValue と横に並べる */
export function SliderLabel({ className, ...props }: React.ComponentProps<typeof BaseSlider.Label>) {
	return (
		<BaseSlider.Label
			data-slot="slider-label"
			className={cn("text-sm font-medium text-fg-strong select-none", className)}
			{...props}
		/>
	);
}

/** 今の値の文字。Slider の children に置く */
export function SliderValue({ className, ...props }: React.ComponentProps<typeof BaseSlider.Value>) {
	return (
		<BaseSlider.Value
			data-slot="slider-value"
			className={cn("text-sm text-fg-muted tabular-nums", className)}
			{...props}
		/>
	);
}

/** 名前と値を 1 行に並べる。Slider の children に置く */
export function SliderHeader({ className, ...props }: React.ComponentProps<"div">) {
	return (
		<div
			data-slot="slider-header"
			className={cn("flex items-center justify-between gap-4", className)}
			{...props}
		/>
	);
}

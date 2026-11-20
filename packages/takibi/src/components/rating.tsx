import { Radio as BaseRadio } from "@base-ui/react/radio";
import { RadioGroup as BaseRadioGroup } from "@base-ui/react/radio-group";
import { Star } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import * as React from "react";
import { cn } from "../lib/cn";
import { springs } from "../lib/motion";

const starSizes = {
	sm: "size-4",
	md: "size-5",
	lg: "size-7",
};

export type RatingProps = Omit<
	React.ComponentProps<typeof BaseRadioGroup>,
	"value" | "defaultValue" | "onValueChange" | "children" | "className"
> & {
	className?: string;
	value?: number | null;
	defaultValue?: number | null;
	onValueChange?: (value: number) => void;
	/** 星の数 */
	max?: number;
	size?: keyof typeof starSizes;
	/**
	 * 表示だけにする。押せず、フォーカスも受けない。0.5 刻みなど端数の値も、星の一部を塗って示す
	 */
	readOnly?: boolean;
	/** 星ごとのアクセシブルネーム */
	getLabel?: (value: number, max: number) => string;
};

const defaultLabel = (value: number, max: number) => `${max} 段階中 ${value}`;

/**
 * 星の数で評価を選ぶ。中身はラジオグループなので、Tab でグループに入り、矢印キーで星が移る。
 * ポインターを乗せると、そこまでの星が薄く塗られ、選択後の状態をプレビューする。押した星は弾んで元の大きさに戻る。
 * `readOnly` では表示だけになり、平均点のような端数も示せる。
 */
export function Rating({
	value: valueProp,
	defaultValue = null,
	onValueChange,
	max = 5,
	size = "md",
	readOnly,
	disabled,
	getLabel = defaultLabel,
	className,
	...props
}: RatingProps) {
	const [uncontrolled, setUncontrolled] = React.useState<number | null>(defaultValue);
	const current = valueProp !== undefined ? valueProp : uncontrolled;
	const [hover, setHover] = React.useState<number | null>(null);
	const [pop, setPop] = React.useState({ star: 0, count: 0 });
	const reduce = useReducedMotion();

	if (readOnly) {
		return <RatingDisplay value={current ?? 0} max={max} size={size} className={className} />;
	}

	const shown = hover ?? current ?? 0;
	const stars = Array.from({ length: max }, (_, i) => i + 1);

	return (
		<BaseRadioGroup
			data-slot="rating"
			value={current}
			disabled={disabled}
			onValueChange={(next) => {
				const n = Number(next);
				if (valueProp === undefined) setUncontrolled(n);
				setPop((p) => ({ star: n, count: p.count + 1 }));
				onValueChange?.(n);
			}}
			onPointerLeave={() => setHover(null)}
			className={cn(
				"inline-flex w-fit items-center data-disabled:cursor-not-allowed data-disabled:opacity-50",
				className,
			)}
			{...props}
		>
			{stars.map((n) => {
				const filled = n <= shown;
				const previewing = hover !== null && filled && n > (current ?? 0);
				const popping = pop.star === n && pop.count > 0;
				return (
					<BaseRadio.Root
						key={n}
						value={n}
						data-slot="rating-star"
						aria-label={getLabel(n, max)}
						onPointerEnter={() => !disabled && setHover(n)}
						className={cn(
							"group/star relative flex rounded-sm p-0.5 outline-none",
							"focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-focus",
							"data-disabled:cursor-not-allowed",
						)}
					>
						<motion.span
							// 選んだ瞬間に作り直し、大きめの状態からはぜる曲線で元に戻す
							key={popping ? `pop-${pop.count}` : "idle"}
							className="flex"
							initial={popping && !reduce ? { scale: 1.4, rotate: -8 } : false}
							animate={{ scale: 1, rotate: 0 }}
							transition={springs.pop}
						>
							<Star
								aria-hidden
								strokeWidth={1.75}
								className={cn(
									starSizes[size],
									"[transition:color_var(--duration-fast)_var(--ease-standard),fill_var(--duration-fast)_var(--ease-standard),scale_var(--duration-land)_var(--ease-land)]",
									"group-hover/star:not-group-data-disabled/star:scale-115",
									"group-active/star:not-group-data-disabled/star:scale-85",
									filled
										? previewing
											? "fill-brand/35 text-brand"
											: "fill-brand text-brand"
										: "fill-transparent text-line-strong group-hover/star:text-line-hover",
								)}
							/>
						</motion.span>
					</BaseRadio.Root>
				);
			})}
		</BaseRadioGroup>
	);
}

/** 表示だけの星。端数は星の一部を塗って示す */
function RatingDisplay({
	value,
	max,
	size,
	className,
}: {
	value: number;
	max: number;
	size: keyof typeof starSizes;
	className?: string;
}) {
	const label = `${max} 段階中 ${Math.round(value * 10) / 10}`;
	return (
		<span
			role="img"
			aria-label={label}
			data-slot="rating"
			data-readonly
			className={cn("inline-flex w-fit items-center", className)}
		>
			{Array.from({ length: max }, (_, i) => {
				const fill = Math.max(0, Math.min(1, value - i));
				return (
					// biome-ignore lint/suspicious/noArrayIndexKey: 星の位置そのものがキーになる
					<span key={i} className="relative flex p-0.5">
						<Star
							aria-hidden
							strokeWidth={1.75}
							className={cn(starSizes[size], "fill-transparent text-line-strong")}
						/>
						{fill > 0 && (
							<span
								className="absolute inset-0.5 overflow-hidden"
								style={{ clipPath: `inset(0 ${100 - fill * 100}% 0 0)` }}
							>
								<Star
									aria-hidden
									strokeWidth={1.75}
									className={cn(starSizes[size], "fill-brand text-brand")}
								/>
							</span>
						)}
					</span>
				);
			})}
		</span>
	);
}

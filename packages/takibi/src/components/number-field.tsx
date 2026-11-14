import { NumberField as BaseNumberField } from "@base-ui/react/number-field";
import { cva, type VariantProps } from "class-variance-authority";
import { Minus, Plus } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import * as React from "react";
import { cn } from "../lib/cn";
import { springs } from "../lib/motion";
import { inputGroupVariants } from "./input-group";

const stepperVariants = cva(
	[
		"flex h-full shrink-0 items-center justify-center text-fg-muted outline-none select-none",
		"transition-colors duration-(--duration-fast) ease-standard",
		"hover:not-data-disabled:bg-surface-hover hover:not-data-disabled:text-fg-strong",
		"focus-visible:bg-surface-hover focus-visible:text-fg-strong",
		"data-disabled:cursor-not-allowed data-disabled:text-fg-subtle data-disabled:opacity-60",
		// 押すとアイコンだけが沈む。枠の中の面ごと縮めると、枠の線とずれて見える
		"motion-press-glyph",
	],
	{
		variants: {
			size: {
				sm: "w-7 [&_svg]:size-3.5",
				md: "w-9 [&_svg]:size-4",
				lg: "w-11 [&_svg]:size-4.5",
			},
		},
		defaultVariants: { size: "md" },
	},
);

export type NumberFieldProps = React.ComponentProps<typeof BaseNumberField.Root> &
	VariantProps<typeof inputGroupVariants> & {
		/** 入力欄のアクセシブルネーム。Field の中では FieldLabel を使う */
		"aria-label"?: string;
		/** 入力欄の幅。桁数に合わせて変える */
		inputClassName?: string;
		/** 減らすボタン、増やすボタンのアクセシブルネーム */
		decrementLabel?: string;
		incrementLabel?: string;
		placeholder?: string;
	};

/**
 * 数を入れる欄。左右のボタンか矢印キーで 1 段ずつ増減し、押し続けると連続で変わる。
 * ボタンやキーで変えると、変わった桁が縦に転がって入れ替わり、一瞬ブランドカラーになる（熾火の目盛り）。
 * 単位や桁区切りは `format` に Intl.NumberFormat の設定を渡す。
 */
export function NumberField({
	className,
	size,
	"aria-label": ariaLabel,
	inputClassName,
	decrementLabel = "減らす",
	incrementLabel = "増やす",
	placeholder,
	onValueChange,
	...props
}: NumberFieldProps) {
	const reduce = useReducedMotion();
	const [roll, setRoll] = React.useState<1 | -1 | null>(null);
	const last = React.useRef<number | null>(props.value ?? props.defaultValue ?? null);
	const timer = React.useRef<number>(undefined);

	React.useEffect(() => () => window.clearTimeout(timer.current), []);

	return (
		<BaseNumberField.Root
			data-slot="number-field"
			className={cn("w-fit", className)}
			onValueChange={(value, details) => {
				onValueChange?.(value, details);
				const previous = last.current;
				last.current = value;
				const stepped =
					details.reason === "increment-press" ||
					details.reason === "decrement-press" ||
					details.reason === "keyboard" ||
					details.reason === "wheel";
				if (!stepped || reduce || value === null) {
					setRoll(null);
					return;
				}
				setRoll(previous !== null && value < previous ? -1 : 1);
				window.clearTimeout(timer.current);
				timer.current = window.setTimeout(() => setRoll(null), 520);
			}}
			{...props}
		>
			<BaseNumberField.Group
				data-slot="number-field-group"
				className={cn(inputGroupVariants({ size }), "w-auto overflow-hidden")}
			>
				<BaseNumberField.Decrement
					data-slot="number-field-decrement"
					aria-label={decrementLabel}
					className={cn(stepperVariants({ size }), "border-r border-line-subtle")}
				>
					<Minus aria-hidden />
				</BaseNumberField.Decrement>
				<BaseNumberField.Input
					data-slot="number-field-input"
					aria-label={ariaLabel}
					placeholder={placeholder}
					render={(inputProps, state) => (
						<span className="relative flex h-full">
							<input
								{...inputProps}
								className={cn(
									"h-full w-[8ch] min-w-0 bg-transparent px-2 text-center text-fg tabular-nums outline-none",
									"placeholder:text-fg-subtle selection:bg-brand-soft",
									roll && "text-transparent caret-transparent selection:bg-transparent",
									inputClassName,
								)}
							/>
							{!reduce && (
								<RollingNumber text={state.inputValue} direction={roll ?? 1} active={roll !== null} />
							)}
						</span>
					)}
				/>
				<BaseNumberField.Increment
					data-slot="number-field-increment"
					aria-label={incrementLabel}
					className={cn(stepperVariants({ size }), "border-l border-line-subtle")}
				>
					<Plus aria-hidden />
				</BaseNumberField.Increment>
			</BaseNumberField.Group>
		</BaseNumberField.Root>
	);
}

/**
 * 熾火の目盛り: 数字を 1 桁ずつ縦に転がして入れ替え、変わった桁を一瞬だけブランドカラーにする。
 * 本物の入力欄の上に重ねて見せるだけなので、スクリーンリーダーには出さない。
 */
function RollingNumber({ text, direction, active }: { text: string; direction: 1 | -1; active: boolean }) {
	const ref = React.useRef<HTMLSpanElement>(null);
	const colors = useEmberColors(ref, active);
	// 1 の位をそろえるため、右から数えた位置をキーにする
	const chars = Array.from(text);
	return (
		<span
			ref={ref}
			aria-hidden
			className={cn(
				"pointer-events-none absolute inset-0 flex items-center justify-center overflow-hidden px-2 text-fg tabular-nums",
				!active && "invisible",
			)}
		>
			{chars.map((char, i) => {
				const place = chars.length - i;
				return (
					<span key={place} className="relative inline-flex justify-center overflow-hidden">
						<AnimatePresence mode="popLayout" initial={false} custom={direction}>
							<motion.span
								key={char}
								custom={direction}
								className="inline-block"
								variants={{
									enter: (d: number) => ({
										y: `${d * 70}%`,
										opacity: 0,
										color: colors.brand,
										textShadow: `0 0 10px ${colors.glow}`,
									}),
									center: {
										y: "0%",
										opacity: 1,
										color: colors.fg,
										textShadow: `0 0 0px ${colors.clear}`,
									},
									exit: (d: number) => ({ y: `${d * -70}%`, opacity: 0 }),
								}}
								initial="enter"
								animate="center"
								exit="exit"
								transition={{
									y: springs.soft,
									opacity: { duration: 0.12 },
									color: { duration: 0.5, delay: 0.12, ease: [0.2, 0.8, 0.2, 1] },
									textShadow: { duration: 0.5, delay: 0.12, ease: [0.2, 0.8, 0.2, 1] },
								}}
							>
								{char === " " ? " " : char}
							</motion.span>
						</AnimatePresence>
					</span>
				);
			})}
		</span>
	);
}

/** 桁に付ける色を、今のテーマのトークンから読む。Motion は var() のままでは色を補間できない */
function useEmberColors(ref: React.RefObject<HTMLElement | null>, active: boolean) {
	const [colors, setColors] = React.useState({
		brand: "rgb(244, 125, 58)",
		fg: "rgb(235, 229, 216)",
		glow: "rgba(244, 125, 58, 0.6)",
		clear: "rgba(244, 125, 58, 0)",
	});
	// 転がり始めるたびに読み直す。途中でテーマが変わっても、次の転がりから合う
	// biome-ignore lint/correctness/useExhaustiveDependencies: active は読み直しの合図として使う
	React.useLayoutEffect(() => {
		const el = ref.current;
		if (!el) return;
		const style = getComputedStyle(el);
		const brand = style.getPropertyValue("--color-brand").trim();
		const fg = style.color;
		if (brand) setColors((c) => (c.brand === brand && c.fg === fg ? c : { ...c, brand, fg }));
	}, [ref, active]);
	return colors;
}

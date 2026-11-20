import { AnimatePresence, motion, type TargetAndTransition, useReducedMotion } from "motion/react";
import * as React from "react";
import { cn } from "../lib/cn";
import { springs } from "../lib/motion";

export type AnimatedNumberProps = Omit<React.ComponentProps<"span">, "children"> & {
	value: number;
	/** 桁区切りや通貨の書き方を決める地域。既定は ja-JP */
	locale?: string;
	/** Intl.NumberFormat の書式。通貨、割合、小数の桁など */
	format?: Intl.NumberFormatOptions;
};

/**
 * 数字が変わると、桁ごとに縦へ転がして新しい値にする。変わった桁は 320ms だけブランドカラーになる（熾火の目盛り）。
 * 件数や統計など、値が変わったことに気付いてほしい数字に使う。スクリーンリーダーでは、書式を整えた数字をそのまま読む。
 */
export function AnimatedNumber({
	value,
	locale = "ja-JP",
	format,
	className,
	...props
}: AnimatedNumberProps) {
	const reduce = useReducedMotion() ?? false;
	const text = new Intl.NumberFormat(locale, format).format(value);
	const chars = Array.from(text);
	return (
		<span
			data-slot="animated-number"
			className={cn("relative inline-flex whitespace-nowrap tabular-nums", className)}
			{...props}
		>
			<span className="sr-only">{text}</span>
			<span aria-hidden className="inline-flex">
				<AnimatePresence initial={false} mode="popLayout">
					{chars.map((char, i) => {
						// 右から数えた位置で見分ける。桁が増えても、1 の位は 1 の位のまま転がる
						const place = chars.length - i;
						return /\d/.test(char) ? (
							<Digit key={`d${place}`} digit={Number(char)} reduce={reduce} />
						) : (
							<Glyph key={`s${place}${char}`} char={char} reduce={reduce} />
						);
					})}
				</AnimatePresence>
			</span>
		</span>
	);
}

const enter = { opacity: 0, y: "-35%", filter: "blur(2px)" };
const exit: TargetAndTransition = {
	opacity: 0,
	y: "35%",
	filter: "blur(2px)",
	transition: { duration: 0.14, ease: [0.16, 1, 0.3, 1] },
};
const rest = { opacity: 1, y: 0, filter: "blur(0px)" };

const Digit = React.forwardRef<HTMLSpanElement, { digit: number; reduce: boolean }>(function Digit(
	{ digit, reduce },
	ref,
) {
	const glowing = useGlow(digit);
	return (
		<motion.span
			ref={ref}
			layout={reduce ? false : "position"}
			initial={reduce ? false : enter}
			animate={rest}
			exit={reduce ? undefined : exit}
			transition={springs.ignite}
			data-glow={glowing || undefined}
			className={cn(
				"relative inline-block h-[1lh] overflow-x-visible overflow-y-clip",
				"transition-[color,text-shadow] duration-[900ms] ease-standard",
				"data-glow:text-brand data-glow:duration-(--duration-fast) data-glow:[text-shadow:0_0_12px_color-mix(in_oklab,var(--color-heat-ember)_65%,transparent)]",
			)}
		>
			{/* 幅を決めるための見えない数字 */}
			<span className="invisible">0</span>
			<motion.span
				className="absolute inset-x-0 top-0 flex flex-col items-center"
				initial={false}
				animate={{ y: `${digit * -10}%` }}
				transition={reduce ? { duration: 0 } : springs.ignite}
			>
				{digits.map((n) => (
					<span key={n} className="h-[1lh]">
						{n}
					</span>
				))}
			</motion.span>
		</motion.span>
	);
});

const Glyph = React.forwardRef<HTMLSpanElement, { char: string; reduce: boolean }>(function Glyph(
	{ char, reduce },
	ref,
) {
	return (
		<motion.span
			ref={ref}
			layout={reduce ? false : "position"}
			initial={reduce ? false : enter}
			animate={rest}
			exit={reduce ? undefined : exit}
			transition={springs.ignite}
			className="inline-block whitespace-pre"
		>
			{char}
		</motion.span>
	);
});

const digits = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];

/** 値が変わった直後の 320ms だけ true を返す。この間、桁をブランドカラーにする */
function useGlow(digit: number) {
	const [glowing, setGlowing] = React.useState(false);
	const prev = React.useRef(digit);
	React.useEffect(() => {
		if (prev.current === digit) return;
		prev.current = digit;
		setGlowing(true);
		const t = setTimeout(() => setGlowing(false), 320);
		return () => clearTimeout(t);
	}, [digit]);
	return glowing;
}

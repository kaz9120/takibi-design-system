import { Button as BaseButton } from "@base-ui/react/button";
import { cva, type VariantProps } from "class-variance-authority";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import * as React from "react";
import { cn } from "../lib/cn";
import { amplitude, springs, swap } from "../lib/motion";
import { Spinner } from "./spinner";

export const buttonVariants = cva(
	[
		"relative inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-md font-medium select-none",
		"transition-[color,background-color,border-color,box-shadow] duration-(--duration-fast) ease-standard",
		"outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus",
		"disabled:cursor-not-allowed disabled:opacity-50 data-disabled:cursor-not-allowed data-disabled:opacity-50",
		"[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
	],
	{
		variants: {
			variant: {
				/** 主要な行動。1 画面に 1 つまで */
				primary:
					"bg-brand text-fg-on-brand hover:not-disabled:bg-brand-hover hover:not-disabled:shadow-glow active:not-disabled:bg-brand-active",
				/** 副次の行動 */
				secondary:
					"border border-line bg-surface-raised text-fg shadow-rim hover:not-disabled:border-line-strong hover:not-disabled:bg-surface-hover",
				/** 目立たせない行動。ツールバー、アイコンだけのボタン */
				ghost: "text-fg-muted hover:not-disabled:bg-surface-hover hover:not-disabled:text-fg",
				/** 取り消せない操作 */
				danger: "bg-danger-solid text-fg-on-danger hover:not-disabled:brightness-110",
				/** 文中のリンクのように見せる */
				link: "h-auto px-0 text-brand underline-offset-4 hover:not-disabled:text-brand-hover hover:not-disabled:underline",
			},
			size: {
				sm: "h-8 px-3 text-sm",
				md: "h-9 px-4 text-sm",
				lg: "h-11 px-6 text-base",
				icon: "size-9",
				"icon-sm": "size-8",
			},
		},
		compoundVariants: [{ variant: "link", className: "h-auto px-0" }],
		defaultVariants: { variant: "primary", size: "md" },
	},
);

export type ButtonStatus = "idle" | "loading" | "success";

export type ButtonProps = Omit<React.ComponentProps<typeof BaseButton>, "render"> &
	VariantProps<typeof buttonVariants> & {
		/**
		 * 送信の段階。送信中から完了まで、1 つのボタンのまま幅と中身が変わる（残り火）。
		 * loading の間は押せない。success になったら、少し待って idle に戻すのはアプリ側で行う。
		 */
		status?: ButtonStatus;
		/** status="loading" の間に出す文言。省くとスピナーだけになり、ボタンは正方形に縮む */
		loadingLabel?: React.ReactNode;
		/** status="success" の間に出す文言 */
		successLabel?: React.ReactNode;
	};

/**
 * 行動を起こすボタン。主要な行動は primary、それ以外は secondary か ghost を使う。
 * アイコンだけのボタンには aria-label を付ける。送信するボタンには status を渡す。
 */
export function Button({
	className,
	variant,
	size,
	status: statusProp,
	loadingLabel,
	successLabel = "完了",
	disabled,
	children,
	ref: refProp,
	...props
}: ButtonProps) {
	const status: ButtonStatus = statusProp ?? "idle";
	const morphs = statusProp !== undefined;
	const busy = status === "loading";
	const inert = disabled || busy;
	const isIcon = size === "icon" || size === "icon-sm";
	const pressScale = isIcon ? amplitude.pressIcon : amplitude.press;
	const reduce = useReducedMotion();
	// メニューやポップオーバーを開くボタンは大きさを変えない。ポップアップがボタンの位置に付いて出るので、一緒に揺れてしまう
	const opensPopup = props["aria-haspopup"] !== undefined || props["aria-expanded"] !== undefined;
	const moves = variant !== "link" && !inert && !reduce && !opensPopup;

	const ref = React.useRef<HTMLButtonElement>(null);
	const setRef = React.useCallback(
		(node: HTMLButtonElement | null) => {
			ref.current = node;
			if (typeof refProp === "function") refProp(node);
			else if (refProp) refProp.current = node;
		},
		[refProp],
	);
	const contentRef = React.useRef<HTMLSpanElement>(null);
	const width = useMorphWidth(ref, contentRef, morphs);

	return (
		<BaseButton
			ref={setRef}
			data-slot="button"
			data-status={morphs ? status : undefined}
			className={cn(buttonVariants({ variant, size }), className)}
			disabled={inert}
			focusableWhenDisabled={busy}
			aria-busy={busy || undefined}
			render={
				<motion.button
					animate={width === undefined ? undefined : { width }}
					transition={reduce ? { duration: 0 } : { scale: springs.press, width: springs.glide }}
					whileHover={moves ? { scale: amplitude.hover } : undefined}
					whileTap={moves ? { scale: pressScale, transition: pressIn } : undefined}
				/>
			}
			{...props}
		>
			{morphs ? (
				<>
					<span ref={contentRef} className="inline-flex items-center justify-center gap-2">
						<AnimatePresence mode="popLayout" initial={false}>
							<motion.span key={status} className="inline-flex items-center gap-2" {...swap}>
								{status === "loading" && (
									<>
										<Spinner size="sm" aria-hidden />
										{loadingLabel}
									</>
								)}
								{status === "success" && (
									<>
										<DrawnCheck />
										{successLabel}
									</>
								)}
								{status === "idle" && children}
							</motion.span>
						</AnimatePresence>
					</span>
					{status === "success" && <Embers key="embers" />}
					<span className="sr-only" aria-live="polite">
						{status === "success" ? successLabel : ""}
					</span>
				</>
			) : (
				children
			)}
		</BaseButton>
	);
}

/**
 * 中身の幅を測り、ボタンの幅をばねで追わせる。中身が入れ替わっても形が切れずに伸び縮みする。
 * ボタンの左右の余白と枠線は、測った値に足して返す。
 */
function useMorphWidth(
	button: React.RefObject<HTMLButtonElement | null>,
	content: React.RefObject<HTMLSpanElement | null>,
	enabled: boolean,
) {
	const [width, setWidth] = React.useState<number>();
	React.useLayoutEffect(() => {
		const b = button.current;
		const c = content.current;
		if (!enabled || !b || !c) {
			setWidth(undefined);
			return;
		}
		const measure = () => {
			const s = getComputedStyle(b);
			const chrome =
				Number.parseFloat(s.paddingLeft) +
				Number.parseFloat(s.paddingRight) +
				Number.parseFloat(s.borderLeftWidth) +
				Number.parseFloat(s.borderRightWidth);
			const next = Math.ceil(c.getBoundingClientRect().width / getScale(b) + chrome);
			const min = Number.parseFloat(s.height);
			setWidth(Math.max(next, min));
		};
		measure();
		const ro = new ResizeObserver(measure);
		ro.observe(c);
		return () => ro.disconnect();
	}, [button, content, enabled]);
	return width;
}

/** hover や押下で拡大縮小している最中も、本来の幅を測るための補正 */
function getScale(el: HTMLElement) {
	const t = getComputedStyle(el).transform;
	if (!t || t === "none") return 1;
	const m = new DOMMatrixReadOnly(t);
	return m.a || 1;
}

/** 完了のチェックマーク。線が描かれていく */
function DrawnCheck() {
	return (
		<svg
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			strokeWidth={2.25}
			aria-hidden
			className="size-4"
		>
			<motion.path
				d="M20 6 9 17l-5-5"
				strokeLinecap="round"
				strokeLinejoin="round"
				initial={{ pathLength: 0 }}
				animate={{ pathLength: 1 }}
				transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1], delay: 0.06 }}
			/>
		</svg>
	);
}

/** 押し込むときは速く沈める。離したときは transition の press のばねで弾んで戻る */
const pressIn = { duration: 0.15, ease: [0.16, 1, 0.3, 1] } as const;

/** はぜる: 完了の瞬間に、ボタンの上の縁から火の粉が 6 つだけ舞い上がる */
const sparks = [
	{ left: "18%", x: "-6px", y: "-18px", d: "0ms" },
	{ left: "32%", x: "3px", y: "-26px", d: "60ms" },
	{ left: "46%", x: "-3px", y: "-20px", d: "20ms" },
	{ left: "58%", x: "5px", y: "-30px", d: "90ms" },
	{ left: "71%", x: "-4px", y: "-22px", d: "40ms" },
	{ left: "84%", x: "6px", y: "-16px", d: "110ms" },
];

function Embers() {
	return (
		<span aria-hidden className="motion-flare pointer-events-none absolute inset-0 rounded-[inherit]">
			{sparks.map((s) => (
				<span
					key={s.left}
					className="motion-spark absolute top-0 size-[3px] rounded-full bg-(--ember-300)"
					style={
						{ left: s.left, "--spark-x": s.x, "--spark-y": s.y, "--spark-delay": s.d } as React.CSSProperties
					}
				/>
			))}
		</span>
	);
}

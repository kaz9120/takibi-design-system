import { ChevronLeft, ChevronRight } from "lucide-react";
import { useReducedMotion } from "motion/react";
import * as React from "react";
import { cn } from "../lib/cn";
import { Button, type ButtonProps } from "./button";

type CarouselContextValue = {
	viewportRef: React.RefObject<HTMLDivElement | null>;
	index: number;
	count: number;
	canPrev: boolean;
	canNext: boolean;
	direction: "left" | "right" | "none";
	scrollTo: (index: number) => void;
	prev: () => void;
	next: () => void;
	register: (count: number) => void;
};

/** 面を窓の左端にそろえたときの scrollLeft */
function slideOffset(viewport: HTMLElement, slide: HTMLElement) {
	const pad = Number.parseFloat(getComputedStyle(viewport).scrollPaddingLeft) || 0;
	return (
		slide.getBoundingClientRect().left - viewport.getBoundingClientRect().left + viewport.scrollLeft - pad
	);
}

const CarouselContext = React.createContext<CarouselContextValue | null>(null);

function useCarousel() {
	const ctx = React.useContext(CarouselContext);
	if (!ctx) throw new Error("Carousel のコンポーネントは Carousel の中で使う");
	return ctx;
}

export type CarouselProps = React.ComponentProps<"section"> & {
	/** 今の位置が変わったときに呼ぶ。0 から数える */
	onIndexChange?: (index: number) => void;
};

/**
 * 同じ重みの内容を、横に送りながら 1 つずつ見せる。指で払う、矢印キー、前後のボタン、点のどれでも送れる。
 * 自動では送らない。すべてを一度に見比べたい内容には使わず、一覧や格子で並べる。
 * aria-label で何の並びかを伝える。
 */
export function Carousel({ className, onIndexChange, children, ...props }: CarouselProps) {
	const viewportRef = React.useRef<HTMLDivElement>(null);
	const [state, setState] = React.useState({
		index: 0,
		count: 0,
		canPrev: false,
		canNext: false,
		direction: "none" as CarouselContextValue["direction"],
	});
	const reduce = useReducedMotion();
	const onIndexChangeRef = React.useRef(onIndexChange);
	onIndexChangeRef.current = onIndexChange;

	const slides = React.useCallback(
		() =>
			Array.from(viewportRef.current?.querySelectorAll<HTMLElement>('[data-slot="carousel-slide"]') ?? []),
		[],
	);

	// 横の位置から、いちばん近い面を今の位置とする
	const measure = React.useCallback(() => {
		const vp = viewportRef.current;
		if (!vp) return;
		const list = slides();
		const left = vp.scrollLeft;
		let index = 0;
		let best = Number.POSITIVE_INFINITY;
		list.forEach((s, i) => {
			const d = Math.abs(slideOffset(vp, s) - left);
			if (d < best) {
				best = d;
				index = i;
			}
		});
		const max = vp.scrollWidth - vp.clientWidth;
		// 最後まで送り切ったら、最後の面を今の位置とする（1 画面に複数の面を見せるとき）
		if (left >= max - 1 && list.length > 0) index = list.length - 1;
		setState((prev) => {
			const next = {
				index,
				count: list.length,
				canPrev: left > 1,
				canNext: left < max - 1,
				direction:
					index > prev.index ? ("right" as const) : index < prev.index ? ("left" as const) : prev.direction,
			};
			if (
				next.index === prev.index &&
				next.count === prev.count &&
				next.canPrev === prev.canPrev &&
				next.canNext === prev.canNext
			)
				return prev;
			return next;
		});
	}, [slides]);

	React.useEffect(() => {
		onIndexChangeRef.current?.(state.index);
	}, [state.index]);

	React.useLayoutEffect(() => {
		const vp = viewportRef.current;
		if (!vp) return;
		measure();
		let frame = 0;
		const onScroll = () => {
			cancelAnimationFrame(frame);
			frame = requestAnimationFrame(measure);
		};
		vp.addEventListener("scroll", onScroll, { passive: true });
		const ro = new ResizeObserver(measure);
		ro.observe(vp);
		return () => {
			vp.removeEventListener("scroll", onScroll);
			ro.disconnect();
			cancelAnimationFrame(frame);
		};
	}, [measure]);

	const scrollTo = React.useCallback(
		(i: number) => {
			const vp = viewportRef.current;
			const list = slides();
			const target = list[Math.max(0, Math.min(i, list.length - 1))];
			if (!vp || !target) return;
			vp.scrollTo({ left: slideOffset(vp, target), behavior: reduce ? "auto" : "smooth" });
		},
		[slides, reduce],
	);

	const context = React.useMemo<CarouselContextValue>(
		() => ({
			viewportRef,
			...state,
			scrollTo,
			prev: () => scrollTo(state.index - 1),
			next: () => scrollTo(state.index + 1),
			register: () => measure(),
		}),
		[state, scrollTo, measure],
	);

	return (
		<CarouselContext.Provider value={context}>
			<section
				data-slot="carousel"
				role="region"
				aria-roledescription="carousel"
				className={cn("relative flex flex-col gap-3", className)}
				{...props}
			>
				{children}
			</section>
		</CarouselContext.Provider>
	);
}

/**
 * 面を横に並べて送る窓。CSS のスクロールスナップで止まるので、指で払っても面の途中で止まらない。
 * フォーカスを当てると、左右の矢印キーと Home、End で送れる。
 */
export function CarouselViewport({ className, onKeyDown, ...props }: React.ComponentProps<"div">) {
	const { viewportRef, index, count, scrollTo } = useCarousel();
	return (
		// biome-ignore lint/a11y/noStaticElementInteractions: 送る窓をキーボードで操作できるようにする
		<div
			ref={viewportRef}
			data-slot="carousel-viewport"
			// biome-ignore lint/a11y/noNoninteractiveTabindex: 送る窓をキーボードで操作できるようにする
			tabIndex={0}
			aria-live="polite"
			className={cn(
				"flex snap-x snap-mandatory gap-4 overflow-x-auto overscroll-x-contain rounded-lg outline-none",
				"[scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
				"focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus",
				className,
			)}
			onKeyDown={(event) => {
				onKeyDown?.(event);
				if (event.defaultPrevented) return;
				const keys: Record<string, number> = {
					ArrowLeft: index - 1,
					ArrowRight: index + 1,
					Home: 0,
					End: count - 1,
				};
				const target = keys[event.key];
				if (target === undefined) return;
				event.preventDefault();
				scrollTo(target);
			}}
			{...props}
		/>
	);
}

export type CarouselSlideProps = React.ComponentProps<"div">;

/** 1 枚の面。幅は className で決める（既定は窓いっぱい。`basis-1/2` で 2 枚ずつ見せる） */
export function CarouselSlide({ className, ...props }: CarouselSlideProps) {
	const { register } = useCarousel();
	const ref = React.useRef<HTMLDivElement>(null);
	const [label, setLabel] = React.useState<string>();
	// 何枚目かを読み上げられるよう、並びの中の位置を数える
	React.useLayoutEffect(() => {
		const el = ref.current;
		const parent = el?.parentElement;
		if (!el || !parent) return;
		const list = Array.from(parent.querySelectorAll(':scope > [data-slot="carousel-slide"]'));
		setLabel(`${list.indexOf(el) + 1} / ${list.length}`);
		register(list.length);
	});
	return (
		// biome-ignore lint/a11y/useSemanticElements: APG のカルーセルの型。fieldset は入力欄のまとまりなので使わない
		<div
			ref={ref}
			data-slot="carousel-slide"
			role="group"
			aria-roledescription="slide"
			aria-label={label}
			className={cn("min-w-0 shrink-0 grow-0 basis-full snap-start", className)}
			{...props}
		/>
	);
}

/** 前の面へ送るボタン。最初の面では押せない */
export function CarouselPrevious({
	variant = "secondary",
	size = "icon-sm",
	className,
	...props
}: ButtonProps) {
	const { canPrev, prev } = useCarousel();
	return (
		<Button
			data-slot="carousel-previous"
			variant={variant}
			size={size}
			aria-label="前へ"
			disabled={!canPrev}
			onClick={prev}
			className={className}
			{...props}
		>
			<ChevronLeft />
		</Button>
	);
}

/** 次の面へ送るボタン。最後の面では押せない */
export function CarouselNext({ variant = "secondary", size = "icon-sm", className, ...props }: ButtonProps) {
	const { canNext, next } = useCarousel();
	return (
		<Button
			data-slot="carousel-next"
			variant={variant}
			size={size}
			aria-label="次へ"
			disabled={!canNext}
			onClick={next}
			className={className}
			{...props}
		>
			<ChevronRight />
		</Button>
	);
}

const DOT = 16; // 点 1 つ分の幅（押せる範囲）

/**
 * 今の位置を示す点。押すとその面へ送る。
 * 今の位置のインジケーターは、進む側の端が先に 160ms で伸び、反対の端が 330ms で追いつく（炎の舌）。
 */
export function CarouselDots({ className, ...props }: React.ComponentProps<"div">) {
	const { index, count, direction, scrollTo } = useCarousel();
	if (count < 2) return null;
	return (
		<div
			data-slot="carousel-dots"
			className={cn("relative isolate flex items-center", className)}
			style={{ width: count * DOT }}
			{...props}
		>
			{Array.from({ length: count }, (_, i) => (
				<button
					// biome-ignore lint/suspicious/noArrayIndexKey: 点は位置そのもの
					key={i}
					type="button"
					data-slot="carousel-dot"
					aria-label={`${i + 1} 枚目へ`}
					aria-current={i === index ? "true" : undefined}
					onClick={() => scrollTo(i)}
					className={cn(
						"group/dot flex h-6 shrink-0 items-center justify-center rounded-sm outline-none",
						"focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-focus",
					)}
					style={{ width: DOT }}
				>
					<span
						className={cn(
							"size-1.5 rounded-full bg-line-strong",
							"transition-[background-color,scale] duration-(--duration-fast) ease-standard",
							"group-hover/dot:scale-125 group-hover/dot:bg-fg-muted group-active/dot:scale-100",
						)}
					/>
				</button>
			))}
			<span
				aria-hidden
				data-slot="carousel-dots-indicator"
				data-activation-direction={direction}
				className="motion-tongue pointer-events-none absolute top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-brand"
				style={{ left: index * DOT + 1, right: (count - 1 - index) * DOT + 1 }}
			/>
		</div>
	);
}

import { ChevronLeft, ChevronRight } from "lucide-react";
import { AnimatePresence, LayoutGroup, motion, useReducedMotion, type Variants } from "motion/react";
import * as React from "react";
import {
	type ChevronProps,
	type DateRange,
	type DayButtonProps,
	DayPicker,
	type DayPickerProps,
	type DayProps,
	type WeeksProps,
} from "react-day-picker";
import { ja } from "react-day-picker/locale/ja";
import { cn } from "../lib/cn";
import { springs } from "../lib/motion";

type CalendarContextValue = {
	/** 表示している月。月が変わると週の並びを入れ替え、進む向きから滑り込ませる */
	monthKey: number;
	direction: -1 | 0 | 1;
	reduce: boolean;
	mode: DayPickerProps["mode"];
};

const CalendarContext = React.createContext<CalendarContextValue>({
	monthKey: 0,
	direction: 0,
	reduce: false,
	mode: undefined,
});

export type CalendarProps = DayPickerProps;

/**
 * 日付を 1 つ、複数、または期間で選ぶ月の表。入力欄から選ばせるときは DatePicker を使う。
 * 選んだ日のインジケーターは日から日へ滑って移り、月を送ると進む向きから次の月が滑り込む。
 * 矢印キーで日を、PageUp / PageDown で月を移る。
 */
export function Calendar({
	className,
	classNames,
	components,
	locale = ja,
	showOutsideDays,
	month: monthProp,
	defaultMonth,
	onMonthChange,
	...props
}: CalendarProps) {
	// 2 か月以上並べるときは、隣の月の日を出さない。同じ日が 2 度現れて紛らわしい
	const outside = showOutsideDays ?? (props.numberOfMonths ?? 1) === 1;
	const reduce = useReducedMotion() ?? false;
	const id = React.useId();
	const [innerMonth, setInnerMonth] = React.useState<Date>(
		() => defaultMonth ?? firstSelected(props) ?? new Date(),
	);
	const month = monthProp ?? innerMonth;
	const monthKey = month.getFullYear() * 12 + month.getMonth();

	// 前に表示していた月と比べて、進む向きを決める
	const [view, setView] = React.useState({ key: monthKey, direction: 0 as -1 | 0 | 1 });
	if (view.key !== monthKey) {
		setView({ key: monthKey, direction: monthKey > view.key ? 1 : -1 });
	}

	const handleMonthChange = React.useCallback(
		(next: Date) => {
			setInnerMonth(next);
			onMonthChange?.(next);
		},
		[onMonthChange],
	);

	const context = React.useMemo(
		() => ({ monthKey, direction: view.direction, reduce, mode: props.mode }),
		[monthKey, view.direction, reduce, props.mode],
	);

	return (
		<CalendarContext.Provider value={context}>
			{/* 月ごとにインジケーターの名前を分け、月をまたいでインジケーターが飛ばないようにする */}
			<LayoutGroup id={`${id}-${monthKey}`}>
				<DayPicker
					data-slot="calendar"
					locale={locale}
					showOutsideDays={outside}
					month={month}
					onMonthChange={handleMonthChange}
					className={cn("relative w-fit p-3 text-sm text-fg select-none", className)}
					classNames={{
						months: "relative flex flex-col gap-6 sm:flex-row",
						month: "flex flex-col gap-3",
						nav: "pointer-events-none absolute inset-x-0 top-0 z-10 flex h-8 items-center justify-between",
						button_previous: navButtonClass,
						button_next: navButtonClass,
						month_caption: "flex h-8 items-center justify-center",
						caption_label: "text-sm font-semibold text-fg-strong",
						month_grid: "border-separate border-spacing-y-0.5",
						weekdays: "",
						weekday: "h-8 w-9 p-0 text-xs font-medium text-fg-muted",
						week: "",
						day: "",
						day_button: "",
						...classNames,
					}}
					components={{
						Chevron,
						Day,
						DayButton,
						Weeks,
						CaptionLabel,
						...components,
					}}
					{...(props as DayPickerProps)}
				/>
			</LayoutGroup>
		</CalendarContext.Provider>
	);
}

const navButtonClass = cn(
	"pointer-events-auto inline-flex size-8 items-center justify-center rounded-md text-fg-muted motion-press-icon outline-none",
	"hover:not-aria-disabled:bg-surface-hover hover:not-aria-disabled:text-fg",
	"focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus",
	"aria-disabled:cursor-not-allowed aria-disabled:opacity-40",
);

/** 選んでいる最初の日。初めに表示する月に使う */
function firstSelected(props: DayPickerProps): Date | undefined {
	const selected = (props as { selected?: Date | Date[] | DateRange }).selected;
	if (!selected) return undefined;
	if (selected instanceof Date) return selected;
	if (Array.isArray(selected)) return selected[0];
	return selected.from;
}

function Chevron({ orientation, className }: ChevronProps) {
	const Icon = orientation === "left" ? ChevronLeft : ChevronRight;
	return <Icon className={cn("size-4", className)} aria-hidden />;
}

/** 月の名前。月を送ると、古い名前は戻る側へ、新しい名前は進む側から入れ替わる */
function CaptionLabel({ children, className, ...props }: React.HTMLAttributes<HTMLSpanElement>) {
	const { monthKey, direction, reduce } = React.useContext(CalendarContext);
	return (
		<span data-slot="calendar-caption" className={cn("relative inline-flex", className)} {...props}>
			<AnimatePresence initial={false} mode="popLayout" custom={reduce ? 0 : direction}>
				<motion.span
					key={monthKey}
					custom={reduce ? 0 : direction}
					variants={captionVariants}
					initial="enter"
					animate="center"
					exit="exit"
					className="inline-block whitespace-nowrap"
				>
					{children}
				</motion.span>
			</AnimatePresence>
		</span>
	);
}

const captionVariants: Variants = {
	enter: (d: number) => ({ opacity: 0, x: d * 12, filter: "blur(2px)" }),
	center: { opacity: 1, x: 0, filter: "blur(0px)", transition: springs.soft },
	exit: (d: number) => ({
		opacity: 0,
		x: d * -12,
		filter: "blur(2px)",
		transition: { duration: 0.14, ease: [0.16, 1, 0.3, 1] },
	}),
};

/** 週の並び。月が変わるたびに作り直し、進む向きから滑り込ませる */
function Weeks(props: WeeksProps) {
	const { monthKey, direction, reduce } = React.useContext(CalendarContext);
	const still = reduce || direction === 0;
	return (
		<motion.tbody
			key={monthKey}
			initial={still ? false : { opacity: 0, x: direction * 16 }}
			animate={{ opacity: 1, x: 0 }}
			transition={{ x: springs.soft, opacity: { duration: 0.2, ease: [0.2, 0.8, 0.2, 1] } }}
			{...(props as React.ComponentProps<typeof motion.tbody>)}
		/>
	);
}

/** 日のセル。期間の途中の日は、セルごと薄い帯でつなぐ */
function Day({ day, modifiers, className, ...props }: DayProps) {
	const start = modifiers.range_start && !modifiers.range_end;
	const end = modifiers.range_end && !modifiers.range_start;
	return (
		<td
			data-range={modifiers.range_middle ? "middle" : start ? "start" : end ? "end" : undefined}
			className={cn(
				"relative size-9 p-0 text-center",
				"transition-[background-color] duration-(--duration-fast) ease-standard",
				"data-[range=middle]:bg-brand-soft first:data-[range=middle]:rounded-l-md last:data-[range=middle]:rounded-r-md",
				"data-[range=start]:bg-linear-to-r data-[range=start]:from-transparent data-[range=start]:from-50% data-[range=start]:to-brand-soft data-[range=start]:to-50%",
				"data-[range=end]:bg-linear-to-l data-[range=end]:from-transparent data-[range=end]:from-50% data-[range=end]:to-brand-soft data-[range=end]:to-50%",
				"last:data-[range=start]:bg-none first:data-[range=end]:bg-none",
				"data-hidden:invisible",
				className,
			)}
			{...props}
		/>
	);
}

/** 日のボタン。選んだ日のインジケーターは、1 つしか選べないときと期間の両端では、日から日へ滑って移る */
function DayButton({ day, modifiers, className, children, ...props }: DayButtonProps) {
	const { mode, reduce } = React.useContext(CalendarContext);
	const ref = React.useRef<HTMLButtonElement>(null);
	React.useEffect(() => {
		if (modifiers.focused) ref.current?.focus();
	}, [modifiers.focused]);

	const solid = modifiers.selected && !modifiers.range_middle;
	let layoutId: string | undefined;
	if (solid && !day.outside) {
		if (mode === "single") layoutId = "calendar-selected";
		else if (mode === "range")
			layoutId = modifiers.range_end && !modifiers.range_start ? "range-end" : "range-start";
	}

	return (
		<button
			ref={ref}
			data-slot="calendar-day"
			data-selected={solid || undefined}
			data-range-middle={modifiers.range_middle || undefined}
			data-today={modifiers.today || undefined}
			data-outside={day.outside || undefined}
			className={cn(
				"relative isolate inline-flex size-9 items-center justify-center rounded-md text-sm tabular-nums text-fg motion-press-icon outline-none",
				"hover:not-disabled:not-data-selected:bg-surface-hover",
				"focus-visible:z-10 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-focus",
				"data-outside:text-fg-subtle",
				"data-range-middle:text-fg-strong data-range-middle:hover:bg-transparent",
				"data-selected:font-semibold data-selected:text-fg-on-brand",
				"disabled:cursor-not-allowed disabled:text-fg-subtle disabled:line-through disabled:opacity-60",
				className,
			)}
			{...props}
		>
			{solid && (
				<motion.span
					aria-hidden
					layoutId={reduce ? undefined : layoutId}
					initial={layoutId || reduce ? false : { opacity: 0, scale: 0.6 }}
					animate={{ opacity: 1, scale: 1 }}
					transition={layoutId ? springs.glide : springs.snappy}
					className={cn(
						"absolute inset-0 -z-10 rounded-md bg-brand shadow-[0_2px_10px_rgb(244_125_58/0.25)]",
						day.outside && "opacity-60",
					)}
				/>
			)}
			{children}
			{modifiers.today && (
				<span
					aria-hidden
					className={cn(
						"absolute bottom-1 left-1/2 size-1 -translate-x-1/2 rounded-full bg-brand",
						"transition-colors duration-(--duration-fast)",
						solid && "bg-fg-on-brand",
					)}
				/>
			)}
		</button>
	);
}

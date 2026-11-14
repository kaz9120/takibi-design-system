import { Popover as BasePopover } from "@base-ui/react/popover";
import { cva, type VariantProps } from "class-variance-authority";
import { CalendarDays } from "lucide-react";
import * as React from "react";
import type { DateRange, Matcher } from "react-day-picker";
import { cn } from "../lib/cn";
import { Calendar } from "./calendar";

const dateFormat = new Intl.DateTimeFormat("ja-JP", { year: "numeric", month: "long", day: "numeric" });
const monthDayFormat = new Intl.DateTimeFormat("ja-JP", { month: "long", day: "numeric" });

/** 日付を「2026年11月10日」の形にする */
export function formatDate(date: Date) {
	return dateFormat.format(date);
}

/** 期間を「2026年11月10日〜11月14日」の形にする。年が同じなら、終わりの年は省く */
export function formatDateRange(range: DateRange) {
	if (!range.from) return "";
	if (!range.to || range.to.getTime() === range.from.getTime()) return formatDate(range.from);
	const end = range.to.getFullYear() === range.from.getFullYear() ? monthDayFormat : dateFormat;
	return `${formatDate(range.from)}〜${end.format(range.to)}`;
}

/** フォームで送る値。年月日だけを YYYY-MM-DD で持つ */
function toISODate(date: Date) {
	const m = String(date.getMonth() + 1).padStart(2, "0");
	const d = String(date.getDate()).padStart(2, "0");
	return `${date.getFullYear()}-${m}-${d}`;
}

export const datePickerTriggerVariants = cva(
	[
		"inline-flex w-full min-w-48 items-center gap-2 rounded-md border border-line-strong bg-surface-sunken text-left text-fg shadow-rim select-none",
		"transition-[border-color,box-shadow] duration-(--duration-fast) ease-standard outline-none",
		"hover:not-data-disabled:not-data-popup-open:border-line-hover",
		"focus-visible:border-brand focus-visible:ring-3 focus-visible:ring-brand-soft data-popup-open:border-brand",
		"aria-invalid:border-danger aria-invalid:focus-visible:ring-danger-soft",
		"data-disabled:cursor-not-allowed data-disabled:opacity-50",
		"[&_svg]:pointer-events-none [&_svg]:shrink-0",
	],
	{
		variants: {
			size: {
				sm: "h-8 px-2.5 text-sm [&_svg]:size-4",
				md: "h-9 px-3 text-sm [&_svg]:size-4",
				lg: "h-11 px-3.5 text-base [&_svg]:size-5",
			},
		},
		defaultVariants: { size: "md" },
	},
);

type TriggerProps = Omit<
	React.ComponentProps<typeof BasePopover.Trigger>,
	"children" | "value" | "defaultValue"
> &
	VariantProps<typeof datePickerTriggerVariants> & {
		/** 未選択のときに出す文言 */
		placeholder?: string;
		/** フォームで送るときの名前。値は YYYY-MM-DD で送る */
		name?: string;
		/** 選べない日。Calendar の `disabled` と同じ書き方 */
		disabledDays?: Matcher | Matcher[];
		/** 最初に表示する月。省くと選んだ日の月、未選択なら今月 */
		defaultMonth?: Date;
	};

function DateTrigger({
	className,
	size,
	label,
	placeholder,
	...props
}: Omit<TriggerProps, "name" | "disabledDays" | "defaultMonth"> & { label: string }) {
	return (
		<BasePopover.Trigger
			data-slot="date-picker-trigger"
			className={cn(datePickerTriggerVariants({ size }), className)}
			{...props}
		>
			<CalendarDays
				aria-hidden
				className="text-fg-muted transition-colors duration-(--duration-fast) [[data-popup-open]>&]:text-brand"
			/>
			<span className={cn("min-w-0 flex-1 truncate tabular-nums", !label && "text-fg-subtle")}>
				{label || placeholder}
			</span>
		</BasePopover.Trigger>
	);
}

function DatePopup({ children }: { children: React.ReactNode }) {
	return (
		<BasePopover.Portal>
			<BasePopover.Positioner side="bottom" align="start" sideOffset={6} className="z-50">
				<BasePopover.Popup
					data-slot="date-picker-content"
					initialFocus={focusDay}
					className="motion-rise rounded-lg border border-line bg-surface-overlay shadow-pop outline-none"
				>
					{children}
				</BasePopover.Popup>
			</BasePopover.Positioner>
		</BasePopover.Portal>
	);
}

/** 開いたら、選んでいる日（なければ今日）にフォーカスを置く。矢印キーですぐ日を移れる */
function focusDay() {
	const popup = document.querySelector<HTMLElement>('[data-slot="date-picker-content"]');
	return popup?.querySelector<HTMLElement>('[data-slot="calendar-day"][tabindex="0"]') ?? true;
}

export type DatePickerProps = TriggerProps & {
	value?: Date;
	defaultValue?: Date;
	onValueChange?: (value: Date | undefined) => void;
};

/**
 * 日付を 1 つ選ぶ入力欄。押すと月の表が開き、日を選ぶと閉じる。選んだ日は「2026年11月10日」の形で出る。
 * ラベルは FieldLabel か `aria-label` で付ける。期間を選ぶときは DateRangePicker を使う。
 */
export function DatePicker({
	value: valueProp,
	defaultValue,
	onValueChange,
	placeholder = "日付を選ぶ",
	name,
	disabledDays,
	defaultMonth,
	disabled,
	...props
}: DatePickerProps) {
	const [inner, setInner] = React.useState(defaultValue);
	const value = valueProp !== undefined ? valueProp : inner;
	const [open, setOpen] = React.useState(false);

	const handleSelect = (next: Date | undefined) => {
		setInner(next);
		onValueChange?.(next);
		if (next) setOpen(false);
	};

	return (
		<BasePopover.Root open={open} onOpenChange={setOpen}>
			<DateTrigger
				label={value ? formatDate(value) : ""}
				placeholder={placeholder}
				disabled={disabled}
				{...props}
			/>
			{name && <input type="hidden" name={name} value={value ? toISODate(value) : ""} />}
			<DatePopup>
				<Calendar
					mode="single"
					selected={value}
					onSelect={handleSelect}
					defaultMonth={defaultMonth ?? value}
					disabled={disabledDays}
				/>
			</DatePopup>
		</BasePopover.Root>
	);
}

export type DateRangePickerProps = TriggerProps & {
	value?: DateRange;
	defaultValue?: DateRange;
	onValueChange?: (value: DateRange | undefined) => void;
	/** 並べる月の数。既定は 2 */
	numberOfMonths?: number;
};

/**
 * 期間を選ぶ入力欄。始まりと終わりの 2 日を選ぶと閉じる。期間は「2026年11月10日〜11月14日」の形で出る。
 * フォームで送るときは `name` に `-from` と `-to` を付けた 2 つの値になる。
 */
export function DateRangePicker({
	value: valueProp,
	defaultValue,
	onValueChange,
	placeholder = "期間を選ぶ",
	name,
	disabledDays,
	defaultMonth,
	numberOfMonths = 2,
	disabled,
	...props
}: DateRangePickerProps) {
	const [inner, setInner] = React.useState(defaultValue);
	const value = valueProp !== undefined ? valueProp : inner;
	const [open, setOpen] = React.useState(false);

	const handleSelect = (next: DateRange | undefined) => {
		setInner(next);
		onValueChange?.(next);
		if (next?.from && next.to && next.from.getTime() !== next.to.getTime()) setOpen(false);
	};

	return (
		<BasePopover.Root open={open} onOpenChange={setOpen}>
			<DateTrigger
				label={value ? formatDateRange(value) : ""}
				placeholder={placeholder}
				disabled={disabled}
				{...props}
			/>
			{name && (
				<>
					<input type="hidden" name={`${name}-from`} value={value?.from ? toISODate(value.from) : ""} />
					<input type="hidden" name={`${name}-to`} value={value?.to ? toISODate(value.to) : ""} />
				</>
			)}
			<DatePopup>
				<Calendar
					mode="range"
					selected={value}
					onSelect={handleSelect}
					numberOfMonths={numberOfMonths}
					defaultMonth={defaultMonth ?? value?.from}
					disabled={disabledDays}
				/>
			</DatePopup>
		</BasePopover.Root>
	);
}

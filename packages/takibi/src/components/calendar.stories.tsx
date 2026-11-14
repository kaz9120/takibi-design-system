import type { Meta, StoryObj } from "@storybook/react-vite";
import * as React from "react";
import type { DateRange } from "react-day-picker";
import { expect, userEvent, within } from "storybook/test";
import type { ComponentDocs } from "../spec";
import { Calendar } from "./calendar";

const meta = {
	title: "コンポーネント/フォーム/Calendar",
	component: Calendar,
	parameters: {
		layout: "centered",
		takibi: {
			use: [
				"画面に月の表を置いたまま、日付を 1 つ、複数、または期間で選ぶ",
				"予約のように、選べる日と選べない日を見比べながら選ぶ",
			],
			avoid: [
				{ case: "フォームの中で日付を 1 つ入れる", instead: "フォーム/DatePicker" },
				{ case: "誕生日のように遠い日付を入れる", instead: "フォーム/Input" },
			],
			dos: [
				"選べない日は disabled で示す。押せず、数字に取り消し線が付く",
				"月をまたぎやすい期間を選ぶときは、2 か月を並べる（numberOfMonths）",
			],
			donts: ["選べない日を表から消さない。曜日の並びがずれて読みにくくなる"],
			keyboard: [
				["← / →", "前の日、次の日へ移る"],
				["↑ / ↓", "前の週、次の週の同じ曜日へ移る"],
				["PageUp / PageDown", "前の月、次の月へ移る"],
				["Shift + PageUp / PageDown", "前の年、次の年へ移る"],
				["Home / End", "週の初め、週の終わりへ移る"],
				["Enter / Space", "フォーカスのある日を選ぶ"],
			],
			a11y: [
				"日のボタンは「2026年11月10日」のように、年月日で読み上げられる",
				"選んだ日は、スクリーンリーダーでも選択中と伝わる（aria-selected）",
			],
			motion: [
				"選んだ日のインジケーターは、次に選んだ日へばね（spring-glide）で滑って移る。期間では両端のインジケーターがそれぞれ移る",
				"複数の選択では、押した日にインジケーターが 0.6 倍からばね（spring-snappy）で現れる",
				"月を送ると、週の並びが進む側から 16px、月の名前が 12px 滑って入れ替わる（spring-soft）",
				"動きを減らす設定では、インジケーターも月も滑らせずに切り替える",
			],
			related: ["フォーム/DatePicker", "フォーム/Input"],
		} satisfies ComponentDocs,
	},
} satisfies Meta<typeof Calendar>;

export default meta;
type Story = StoryObj<typeof meta>;

const today = new Date(2026, 10, 10);

function SingleDemo() {
	const [selected, setSelected] = React.useState<Date | undefined>(today);
	return (
		<Calendar
			mode="single"
			selected={selected}
			onSelect={setSelected}
			defaultMonth={today}
			today={today}
			className="rounded-lg border border-line-subtle bg-surface-raised shadow-card"
		/>
	);
}

/** 1 日だけ選ぶ。選んだ日のインジケーターは、次に押した日へ滑って移る。今日は数字の下の小さな点で示す */
export const Basic: Story = { name: "1 日を選ぶ", render: () => <SingleDemo /> };

function MultipleDemo() {
	const [selected, setSelected] = React.useState<Date[] | undefined>([
		new Date(2026, 10, 6),
		new Date(2026, 10, 13),
		new Date(2026, 10, 20),
	]);
	return (
		<Calendar
			mode="multiple"
			selected={selected}
			onSelect={setSelected}
			defaultMonth={today}
			today={today}
			className="rounded-lg border border-line-subtle bg-surface-raised shadow-card"
		/>
	);
}

/** 複数の日を選ぶ。押した日にインジケーターが付き、もう一度押すと消える */
export const Multiple: Story = { name: "複数の日を選ぶ", render: () => <MultipleDemo /> };

function RangeDemo({ months = 1 }: { months?: number }) {
	const [range, setRange] = React.useState<DateRange | undefined>({
		from: new Date(2026, 10, 10),
		to: new Date(2026, 10, 14),
	});
	return (
		<Calendar
			mode="range"
			selected={range}
			onSelect={setRange}
			numberOfMonths={months}
			defaultMonth={today}
			today={today}
			className="rounded-lg border border-line-subtle bg-surface-raised shadow-card"
		/>
	);
}

/** 期間を選ぶ。両端のインジケーターがそれぞれ滑って移り、間の日は薄い帯でつながる */
export const Range: Story = { name: "期間を選ぶ", render: () => <RangeDemo /> };

/** 2 か月を並べて期間を選ぶ。宿泊や集計の期間など、月をまたぎやすいときに使う */
export const TwoMonths: Story = { name: "2 か月を並べる", render: () => <RangeDemo months={2} /> };

/** 選べない日。過去の日と週末を選べなくした例 */
export const DisabledDays: Story = {
	name: "選べない日",
	render: () => (
		<Calendar
			mode="single"
			defaultMonth={today}
			today={today}
			disabled={[{ before: today }, { dayOfWeek: [0, 6] }]}
			className="rounded-lg border border-line-subtle bg-surface-raised shadow-card"
		/>
	),
};

/** 矢印キーで日を移り、Enter で選ぶ。PageDown で次の月へ送ると、月の名前と週が進む側から入れ替わる */
export const KeyboardInteraction: Story = {
	name: "キーボード操作",
	render: () => <SingleDemo />,
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);
		const selected = canvas.getByRole("button", { name: /2026年11月10日/ });
		selected.focus();
		await expect(selected).toHaveFocus();
		await userEvent.keyboard("{ArrowRight}");
		const next = canvas.getByRole("button", { name: /2026年11月11日/ });
		await expect(next).toHaveFocus();
		await userEvent.keyboard("{Enter}");
		await expect(next.closest("td")).toHaveAttribute("aria-selected", "true");
		await userEvent.keyboard("{PageDown}");
		await expect(await canvas.findByText("2026年12月")).toBeInTheDocument();
		await expect(canvas.getByRole("button", { name: /2026年12月11日/ })).toHaveFocus();
	},
};

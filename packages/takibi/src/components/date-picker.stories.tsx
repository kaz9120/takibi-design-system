import type { Meta, StoryObj } from "@storybook/react-vite";
import * as React from "react";
import type { DateRange } from "react-day-picker";
import { expect, fn, screen, userEvent, waitFor } from "storybook/test";
import type { ComponentDocs } from "../spec";
import { DatePicker, DateRangePicker } from "./date-picker";
import { Field, FieldDescription, FieldLabel } from "./field";

const meta = {
	title: "コンポーネント/フォーム/DatePicker",
	component: DatePicker,
	args: { onValueChange: fn(), "aria-label": "公開日", className: "w-64" },
	argTypes: {
		size: { control: "inline-radio", options: ["sm", "md", "lg"] },
	},
	parameters: {
		takibi: {
			use: [
				"フォームの中で、公開日や予約日などの日付を 1 つ選ぶ",
				"集計の期間など、始まりと終わりの日を選ぶ（DateRangePicker）",
			],
			avoid: [
				{ case: "月の表を画面に置いたまま選ぶ", instead: "フォーム/Calendar" },
				{ case: "誕生日のように遠い日付を入れる", instead: "フォーム/Input" },
			],
			dos: [
				"選べない日は disabledDays で示す",
				"未選択のときの文言は「日付を選ぶ」のように、押すと何ができるかを書く",
			],
			donts: ["日付の形を画面ごとに変えない。「2026年11月10日」にそろえる"],
			copy: {
				rules: ["日付は「2026年11月10日」、期間は「2026年11月10日〜11月14日」の形で書く"],
				examples: [{ good: "日付を選ぶ", bad: "YYYY/MM/DD", note: "押すと何ができるかが分かる" }],
			},
			keyboard: [
				["Enter / Space", "月の表を開く。選んでいる日（なければ今日）にフォーカスが移る"],
				["矢印キー", "日を移る"],
				["PageUp / PageDown", "前の月、次の月へ移る"],
				["Enter", "日を選んで閉じる。フォーカスはトリガーに戻る"],
				["Esc", "選ばずに閉じる"],
			],
			a11y: [
				"トリガーには FieldLabel（aria-labelledby）か aria-label で名前を付ける",
				"フォームで送る値は YYYY-MM-DD になる。期間では name に -from と -to を付けた 2 つの値になる",
			],
			motion: [
				"月の表は、トリガーから 4px 離れた 0.94 倍の大きさから、ばね（spring-soft）で現れる（motion-rise）",
				"開いている間、トリガーのカレンダーのアイコンがブランドカラーになる",
			],
			related: ["フォーム/Calendar", "フォーム/Field", "オーバーレイ/Popover"],
		} satisfies ComponentDocs,
	},
} satisfies Meta<typeof DatePicker>;

export default meta;
type Story = StoryObj<typeof meta>;

/** 押すと月の表が開き、日を選ぶと閉じる。選んだ日は「2026年11月10日」の形で出る */
export const Basic: Story = { name: "基本" };

/** 選んだ日がある状態。開くと、その日にフォーカスが置かれる */
export const WithValue: Story = { name: "選んだ状態", args: { defaultValue: new Date(2026, 10, 10) } };

/** ラベルと補足を Field で添える。例は、OGP ノートの公開日の欄 */
export const InField: Story = {
	name: "Field の中",
	render: (args) => (
		<Field className="w-72">
			<FieldLabel id="publish-label">公開日</FieldLabel>
			<DatePicker {...args} aria-label={undefined} aria-labelledby="publish-label" className="w-full" />
			<FieldDescription>OGP 画像の右下に入ります</FieldDescription>
		</Field>
	),
};

export const Sizes: Story = {
	name: "サイズ",
	render: (args) => (
		<div className="flex flex-col items-start gap-3">
			{(["sm", "md", "lg"] as const).map((size) => (
				<DatePicker key={size} {...args} size={size} defaultValue={new Date(2026, 10, 10)} />
			))}
		</div>
	),
};

/** 状態ごとの見た目。上から通常、エラー、無効 */
export const States: Story = {
	name: "状態",
	render: (args) => (
		<div className="flex flex-col items-start gap-3">
			<DatePicker {...args} />
			<DatePicker {...args} aria-invalid defaultValue={new Date(2026, 10, 10)} />
			<DatePicker {...args} disabled defaultValue={new Date(2026, 10, 10)} />
		</div>
	),
};

function RangeDemo() {
	const [range, setRange] = React.useState<DateRange | undefined>({
		from: new Date(2026, 10, 10),
		to: new Date(2026, 10, 14),
	});
	return <DateRangePicker aria-label="集計の期間" value={range} onValueChange={setRange} className="w-72" />;
}

/** 期間を選ぶ。2 か月を並べ、始まりと終わりを選ぶと閉じる */
export const Range: Story = { name: "期間を選ぶ", render: () => <RangeDemo /> };

/** Enter で開くと選んだ日にフォーカスが移り、矢印キーで日を移って Enter で選ぶと閉じる */
export const KeyboardInteraction: Story = {
	name: "キーボード操作",
	args: { defaultValue: new Date(2026, 10, 10) },
	play: async ({ args, canvas }) => {
		const trigger = canvas.getByRole("button", { name: "公開日" });
		await userEvent.tab();
		await expect(trigger).toHaveFocus();
		await userEvent.keyboard("{Enter}");
		const day = await screen.findByRole("button", { name: /2026年11月10日/ });
		await waitFor(() => expect(day).toHaveFocus());
		await userEvent.keyboard("{ArrowRight}");
		await userEvent.keyboard("{Enter}");
		await waitFor(() => expect(trigger).toHaveTextContent("2026年11月11日"));
		await expect(args.onValueChange).toHaveBeenCalledTimes(1);
		await waitFor(() => expect(trigger).toHaveFocus());
	},
};

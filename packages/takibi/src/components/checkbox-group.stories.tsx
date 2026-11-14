import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fn, userEvent } from "storybook/test";
import type { ComponentDocs } from "../spec";
import { CheckboxGroup, CheckboxGroupItem, CheckboxGroupList } from "./checkbox-group";
import { Field, FieldError } from "./field";
import { Fieldset, FieldsetLegend } from "./fieldset";

const gear = [
	{ value: "tent", label: "テント" },
	{ value: "tarp", label: "タープ" },
	{ value: "chair", label: "チェア" },
	{ value: "lantern", label: "ランタン" },
];
const allGear = gear.map((g) => g.value);

const meta = {
	title: "コンポーネント/フォーム/CheckboxGroup",
	component: CheckboxGroup,
	args: { onValueChange: fn() },
	parameters: {
		takibi: {
			use: [
				"関係する複数の項目から、いくつでも選ぶ（持っていく道具、受け取る通知）",
				"「すべて選ぶ」で、子の項目をまとめて入れたり外したりする",
			],
			avoid: [
				{ case: "1 つだけ選ぶ", instead: "フォーム/RadioGroup" },
				{ case: "項目が多く、一覧から探して選ぶ", instead: "フォーム/Combobox" },
				{ case: "1 つの項目を入れるか外すかだけ", instead: "フォーム/Checkbox" },
			],
			dos: [
				"グループに名前を付ける（aria-label か、Fieldset の見出し）",
				"「すべて選ぶ」の親の下に、子の項目を字下げして並べる（CheckboxGroupList）",
			],
			donts: ["項目を 10 個以上並べない。探しにくくなる"],
			keyboard: [
				["Tab", "次の項目へフォーカスを移す"],
				["Space", "入れる、外すを切り替える。親の項目では子がまとめて切り替わる"],
			],
			a11y: [
				"子の一部だけが入っているとき、親は aria-checked が mixed になり、スクリーンリーダーで区別できる",
				"Fieldset で囲むと、見出しがグループの名前として読み上げられる",
			],
			motion: [
				"火の粉の伝播: 親でまとめて切り替えると、子のチェックマークが上から 40ms ずつ遅れて切り替わる",
				"動きを減らす設定では、遅らせずに一度に切り替える",
			],
			related: ["フォーム/Checkbox", "フォーム/Fieldset", "フォーム/RadioGroup", "アクション/BulkSelect"],
		} satisfies ComponentDocs,
	},
} satisfies Meta<typeof CheckboxGroup>;

export default meta;
type Story = StoryObj<typeof meta>;

/** 複数の項目を選ぶ。値は選んだ項目の value の配列になる */
export const Basic: Story = {
	name: "基本",
	render: (args) => (
		<CheckboxGroup {...args} aria-label="持っていく道具" defaultValue={["tent"]}>
			{gear.map((g) => (
				<CheckboxGroupItem key={g.value} value={g.value}>
					{g.label}
				</CheckboxGroupItem>
			))}
		</CheckboxGroup>
	),
};

/**
 * 「すべて選ぶ」の親の項目。子の一部だけが入っていると、親のチェックマークは横線になる。
 * 親を押すと、子のチェックマークが上から 40ms ずつ遅れて切り替わる（火の粉の伝播）
 */
export const SelectAll: Story = {
	name: "すべて選ぶ",
	render: (args) => (
		<CheckboxGroup {...args} aria-label="持っていく道具" allValues={allGear} defaultValue={["tent", "chair"]}>
			<CheckboxGroupItem parent>すべての道具</CheckboxGroupItem>
			<CheckboxGroupList>
				{gear.map((g) => (
					<CheckboxGroupItem key={g.value} value={g.value}>
						{g.label}
					</CheckboxGroupItem>
				))}
			</CheckboxGroupList>
		</CheckboxGroup>
	),
};

/** 補足を添えた項目 */
export const WithDescription: Story = {
	name: "補足付き",
	render: (args) => (
		<CheckboxGroup {...args} aria-label="通知" defaultValue={["confirm"]} className="w-80">
			<CheckboxGroupItem value="confirm" description="予約が決まったらすぐに送ります">
				予約の確定
			</CheckboxGroupItem>
			<CheckboxGroupItem value="weather" description="前日の 18 時に送ります">
				天気のお知らせ
			</CheckboxGroupItem>
		</CheckboxGroup>
	),
};

/** 状態ごとの見た目。無効の項目は文字が薄くなり、押せない */
export const States: Story = {
	name: "状態",
	render: (args) => (
		<CheckboxGroup {...args} aria-label="状態" defaultValue={["on", "on-disabled"]}>
			<CheckboxGroupItem value="off">外した状態</CheckboxGroupItem>
			<CheckboxGroupItem value="on">入れた状態</CheckboxGroupItem>
			<CheckboxGroupItem value="off-disabled" disabled>
				無効（外した状態）
			</CheckboxGroupItem>
			<CheckboxGroupItem value="on-disabled" disabled>
				無効（入れた状態）
			</CheckboxGroupItem>
		</CheckboxGroup>
	),
};

/** Fieldset と Field で囲むと、グループに名前が付き、検証のエラーが出る */
export const WithFieldset: Story = {
	name: "見出しとエラー",
	render: (args) => (
		<Field name="gear" invalid>
			<Fieldset render={<CheckboxGroup {...args} allValues={allGear} />}>
				<FieldsetLegend className="text-sm">持っていく道具</FieldsetLegend>
				{gear.map((g) => (
					<CheckboxGroupItem key={g.value} value={g.value}>
						{g.label}
					</CheckboxGroupItem>
				))}
			</Fieldset>
			<FieldError match>1 つ以上選んでください</FieldError>
		</Field>
	),
};

/** Tab で項目を順に移り、Space で入れたり外したりする。親を Space で押すと、子がまとめて切り替わる */
export const KeyboardInteraction: Story = {
	name: "キーボード操作",
	render: SelectAll.render,
	play: async ({ args, canvas }) => {
		const parent = canvas.getByRole("checkbox", { name: "すべての道具" });
		const tarp = canvas.getByRole("checkbox", { name: "タープ" });
		await expect(parent).toHaveAttribute("aria-checked", "mixed");
		await userEvent.tab();
		await expect(parent).toHaveFocus();
		await userEvent.keyboard(" ");
		await expect(parent).toHaveAttribute("aria-checked", "true");
		await expect(tarp).toHaveAttribute("aria-checked", "true");
		await userEvent.keyboard(" ");
		await expect(parent).toHaveAttribute("aria-checked", "false");
		await expect(tarp).toHaveAttribute("aria-checked", "false");
		await userEvent.tab();
		await userEvent.tab();
		await expect(tarp).toHaveFocus();
		await userEvent.keyboard(" ");
		await expect(parent).toHaveAttribute("aria-checked", "mixed");
		await expect(args.onValueChange).toHaveBeenCalledTimes(3);
	},
};

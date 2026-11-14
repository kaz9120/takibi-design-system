import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, userEvent } from "storybook/test";
import type { ComponentDocs } from "../spec";
import { Field, FieldDescription, FieldLabel } from "./field";
import { Fieldset, FieldsetDescription, FieldsetLegend } from "./fieldset";
import { Input } from "./input";
import { Switch } from "./switch";

const meta = {
	title: "コンポーネント/フォーム/Fieldset",
	component: Fieldset,
	argTypes: {
		variant: { control: "inline-radio", options: ["plain", "card"] },
	},
	parameters: {
		takibi: {
			use: [
				"住所や連絡先のように、一緒に読むと意味が通る入力欄をまとめる",
				"長いフォームを、見出し付きのグループに分ける",
			],
			avoid: [
				{ case: "入力欄 1 つにラベルと補足を付ける", instead: "フォーム/Field" },
				{ case: "入力のない内容を枠で囲む", instead: "データ表示/Card" },
			],
			dos: [
				"見出し（FieldsetLegend）はグループの最初に置き、名詞で短く書く",
				"ほかのグループと並べて分けたいときは card を使う",
			],
			donts: ["Fieldset の中に Fieldset を重ねない。見出しの階層が読み取りにくくなる"],
			copy: {
				rules: ["見出しは名詞で短く書く（連絡先）", "補足は、グループの欄に共通することだけを書く"],
				examples: [{ good: "連絡先", bad: "連絡先を入力してください", note: "見出しは名詞にする" }],
			},
			keyboard: [["Tab", "グループの中の欄へ順に移る。無効のグループの欄には止まらない"]],
			a11y: [
				"見出しがグループの名前になり、欄に入るとグループの名前も読み上げられる",
				"disabled を付けると、中の欄がまとめて無効になる",
			],
			related: ["フォーム/Field", "フォーム/Form", "フォーム/CheckboxGroup", "フォーム/RadioGroup"],
		} satisfies ComponentDocs,
	},
	decorators: [
		(Story) => (
			<div className="w-96">
				<Story />
			</div>
		),
	],
	render: (args) => (
		<Fieldset {...args}>
			<FieldsetLegend>連絡先</FieldsetLegend>
			<FieldsetDescription>予約の確認だけに使います</FieldsetDescription>
			<Field>
				<FieldLabel>名前</FieldLabel>
				<Input placeholder="山本 和正" />
			</Field>
			<Field>
				<FieldLabel>メールアドレス</FieldLabel>
				<Input type="email" placeholder="you@example.com" />
			</Field>
		</Fieldset>
	),
} satisfies Meta<typeof Fieldset>;

export default meta;
type Story = StoryObj<typeof meta>;

/** グループの名前を上に置き、関係する欄をまとめる。欄に入ると、グループの名前も読み上げられる */
export const Basic: Story = { name: "基本" };

/** カードの面に載せて、ほかのグループと分ける */
export const Card: Story = {
	name: "カード",
	args: { variant: "card" },
};

/** 設定の一覧のように、Switch を並べたグループ */
export const WithSwitches: Story = {
	name: "スイッチのグループ",
	args: { variant: "card" },
	render: (args) => (
		<Fieldset {...args}>
			<FieldsetLegend>通知</FieldsetLegend>
			{[
				["予約が確定したとき", "確定のメールを送ります"],
				["前日のお知らせ", "天気と持ち物を送ります"],
			].map(([label, description]) => (
				<Field key={label}>
					<div className="flex items-center justify-between gap-4">
						<div className="flex flex-col gap-1">
							<FieldLabel>{label}</FieldLabel>
							<FieldDescription>{description}</FieldDescription>
						</div>
						<Switch defaultChecked />
					</div>
				</Field>
			))}
		</Fieldset>
	),
};

/** `disabled` を付けると、中の欄がまとめて無効になり、名前も薄くなる */
export const Disabled: Story = {
	name: "無効",
	args: { disabled: true },
};

/** 無効のグループの欄には Tab で止まらない */
export const KeyboardInteraction: Story = {
	name: "キーボード操作",
	render: (args) => (
		<div className="flex flex-col gap-6">
			<Fieldset {...args} disabled>
				<FieldsetLegend>請求先（予約者と同じ）</FieldsetLegend>
				<Field>
					<FieldLabel>請求先の名前</FieldLabel>
					<Input />
				</Field>
			</Fieldset>
			<Fieldset {...args}>
				<FieldsetLegend>連絡先</FieldsetLegend>
				<Field>
					<FieldLabel>名前</FieldLabel>
					<Input />
				</Field>
			</Fieldset>
		</div>
	),
	play: async ({ canvas }) => {
		await userEvent.tab();
		await expect(canvas.getByRole("textbox", { name: "名前" })).toHaveFocus();
		await expect(canvas.getByRole("group", { name: "請求先（予約者と同じ）" })).toBeInTheDocument();
	},
};

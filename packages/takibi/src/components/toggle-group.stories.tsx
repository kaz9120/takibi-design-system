import type { Meta, StoryObj } from "@storybook/react-vite";
import { AlignCenter, AlignLeft, AlignRight, Bold, Italic, Underline } from "lucide-react";
import { expect, userEvent } from "storybook/test";
import type { ComponentDocs } from "../spec";
import { ToggleGroup, ToggleGroupItem } from "./toggle-group";

const meta = {
	title: "コンポーネント/アクション/ToggleGroup",
	component: ToggleGroup,
	args: { defaultValue: ["left"], "aria-label": "文字揃え" },
	argTypes: {
		variant: { control: "inline-radio", options: ["ghost", "outline", "segmented"] },
		size: { control: "inline-radio", options: ["sm", "md", "lg"] },
	},
	parameters: {
		takibi: {
			use: [
				"文字揃えや表示期間など、並んだ選択肢から 1 つを選ぶ",
				"太字・斜体・下線のように、関連するオン・オフをまとめる（multiple）",
				"リストとグリッドなど、表示の切り替え（segmented）",
			],
			avoid: [
				{ case: "オン・オフが 1 つだけ", instead: "アクション/Toggle" },
				{ case: "フォームで送る選択", instead: "フォーム/RadioGroup" },
				{ case: "選ぶと中身の領域が入れ替わる", instead: "データ表示/Tabs" },
			],
			dos: [
				"グループには aria-label を付け、何を選ぶグループかを示す",
				"選択肢が多く 1 行に収まらないときは、Select にする",
				"アイコンだけの項目には aria-label を付ける",
			],
			donts: [
				"関係のない操作を 1 つのグループに混ぜない",
				"1 つだけ選ぶグループで、何も選ばれていない状態から始めない",
			],
			keyboard: [
				["Tab", "グループに入る。グループの中は 1 つの Tab 位置になる"],
				["← →", "項目間を移動する。端まで行くと反対の端へ戻る"],
				["Home / End", "最初の / 最後の項目へ移る"],
				["Space", "フォーカスのある項目をオンにする"],
				["Enter", "フォーカスのある項目をオンにする"],
			],
			a11y: [
				"各項目は、オンかオフかを aria-pressed で読み上げる",
				"無効な項目は不透明度 50% になり、押せない",
			],
			motion: [
				"炎の舌: 1 つだけ選ぶグループでは、選択インジケーターの進む側の辺が 160ms（ease-out-expo）で先に伸び、残りの辺が 20ms 遅れて揺れる曲線（ease-sway）で追いつく",
				"segmented では、溝の中のインジケーターが同じ動きで移る",
				"multiple のグループではインジケーターは動かず、各項目の背景がその場で変わる",
			],
			related: [
				"アクション/Toggle",
				"アクション/Toolbar",
				"フォーム/RadioGroup",
				"データ表示/Tabs",
				"アクション/ThemeToggle",
			],
		} satisfies ComponentDocs,
	},
	render: (args) => (
		<ToggleGroup {...args}>
			<ToggleGroupItem value="left" aria-label="左揃え">
				<AlignLeft />
			</ToggleGroupItem>
			<ToggleGroupItem value="center" aria-label="中央揃え">
				<AlignCenter />
			</ToggleGroupItem>
			<ToggleGroupItem value="right" aria-label="右揃え">
				<AlignRight />
			</ToggleGroupItem>
		</ToggleGroup>
	),
} satisfies Meta<typeof ToggleGroup>;

export default meta;
type Story = StoryObj<typeof meta>;

/** 1 つだけ選べるグループ。別の項目を押すと、選択インジケーターが進む側の端から伸びて移動する */
export const Basic: Story = { name: "基本" };

/** 枠で囲んだグループ。単独で置くときに使う */
export const Outline: Story = { name: "枠あり", args: { variant: "outline" } };

/** `multiple` で、複数の項目を同時にオンにできる */
export const Multiple: Story = {
	name: "複数選択",
	args: { multiple: true, defaultValue: ["bold"], "aria-label": "文字装飾", variant: "outline" },
	render: (args) => (
		<ToggleGroup {...args}>
			<ToggleGroupItem value="bold" aria-label="太字">
				<Bold />
			</ToggleGroupItem>
			<ToggleGroupItem value="italic" aria-label="斜体">
				<Italic />
			</ToggleGroupItem>
			<ToggleGroupItem value="underline" aria-label="下線">
				<Underline />
			</ToggleGroupItem>
		</ToggleGroup>
	),
};

/** 溝の中のインジケーターが、選んだ項目へ滑って移る。表示や期間の切り替えに使う */
export const Segmented: Story = {
	name: "セグメント",
	args: { defaultValue: ["week"], "aria-label": "表示する期間", variant: "segmented" },
	render: (args) => (
		<ToggleGroup {...args}>
			<ToggleGroupItem value="day">日</ToggleGroupItem>
			<ToggleGroupItem value="week">週</ToggleGroupItem>
			<ToggleGroupItem value="month">月</ToggleGroupItem>
			<ToggleGroupItem value="year">1 年</ToggleGroupItem>
		</ToggleGroup>
	),
};

/** 文字だけの項目。アイコンでは伝わりにくい選択肢に使う */
export const WithText: Story = {
	name: "文字の項目",
	args: { defaultValue: ["week"], "aria-label": "表示する期間", variant: "outline" },
	render: (args) => (
		<ToggleGroup {...args}>
			<ToggleGroupItem value="day">日</ToggleGroupItem>
			<ToggleGroupItem value="week">週</ToggleGroupItem>
			<ToggleGroupItem value="month">月</ToggleGroupItem>
		</ToggleGroup>
	),
};

export const Sizes: Story = {
	name: "サイズ",
	render: (args) => (
		<div className="flex flex-col items-start gap-3">
			{(["sm", "md", "lg"] as const).map((size) => (
				<ToggleGroup key={size} {...args} size={size} variant="outline">
					<ToggleGroupItem value="left" aria-label="左揃え">
						<AlignLeft />
					</ToggleGroupItem>
					<ToggleGroupItem value="center" aria-label="中央揃え">
						<AlignCenter />
					</ToggleGroupItem>
					<ToggleGroupItem value="right" aria-label="右揃え">
						<AlignRight />
					</ToggleGroupItem>
				</ToggleGroup>
			))}
		</div>
	),
};

/** グループごと無効にした状態と、1 項目だけ無効にした状態 */
export const Disabled: Story = {
	name: "無効",
	render: (args) => (
		<div className="flex flex-col items-start gap-3">
			<ToggleGroup {...args} variant="outline" disabled>
				<ToggleGroupItem value="left" aria-label="左揃え">
					<AlignLeft />
				</ToggleGroupItem>
				<ToggleGroupItem value="center" aria-label="中央揃え">
					<AlignCenter />
				</ToggleGroupItem>
				<ToggleGroupItem value="right" aria-label="右揃え">
					<AlignRight />
				</ToggleGroupItem>
			</ToggleGroup>
			<ToggleGroup {...args} variant="outline">
				<ToggleGroupItem value="left" aria-label="左揃え">
					<AlignLeft />
				</ToggleGroupItem>
				<ToggleGroupItem value="center" aria-label="中央揃え" disabled>
					<AlignCenter />
				</ToggleGroupItem>
				<ToggleGroupItem value="right" aria-label="右揃え">
					<AlignRight />
				</ToggleGroupItem>
			</ToggleGroup>
		</div>
	),
};

/** Tab でグループに入り、矢印キーで項目を移動し、Space でオンにすると前の項目がオフになる */
export const KeyboardInteraction: Story = {
	name: "キーボード操作",
	play: async ({ canvas }) => {
		const left = canvas.getByRole("button", { name: "左揃え" });
		const center = canvas.getByRole("button", { name: "中央揃え" });
		await userEvent.tab();
		await expect(left).toHaveFocus();
		await userEvent.keyboard("{ArrowRight}");
		await expect(center).toHaveFocus();
		await userEvent.keyboard(" ");
		await expect(center).toHaveAttribute("aria-pressed", "true");
		await expect(left).toHaveAttribute("aria-pressed", "false");
	},
};

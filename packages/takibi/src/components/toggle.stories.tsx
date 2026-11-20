import type { Meta, StoryObj } from "@storybook/react-vite";
import { Bold, Flame, Pin } from "lucide-react";
import { expect, fn, userEvent } from "storybook/test";
import type { ComponentDocs } from "../spec";
import { Toggle } from "./toggle";

const meta = {
	title: "コンポーネント/アクション/Toggle",
	component: Toggle,
	args: { children: <Bold />, "aria-label": "太字", onPressedChange: fn() },
	argTypes: {
		variant: { control: "inline-radio", options: ["ghost", "outline"] },
		size: { control: "inline-radio", options: ["sm", "md", "lg"] },
	},
	parameters: {
		takibi: {
			use: [
				"太字やピン留めなど、押すたびにオンとオフが切り替わる操作",
				"ツールバーの中で、その場で効く表示の切り替え",
			],
			avoid: [
				{ case: "押すと 1 回だけ何かが起きる", instead: "アクション/Button" },
				{ case: "並んだ選択肢から 1 つを選ぶ", instead: "アクション/ToggleGroup" },
				{ case: "設定の一覧で、ラベルの付いたオン・オフ", instead: "フォーム/Switch" },
				{ case: "フォームで送る値", instead: "フォーム/Checkbox" },
			],
			dos: [
				"アイコンだけのときは aria-label を付ける",
				"ツールバーの中では ghost、単独で置くときは outline にする",
			],
			donts: [
				"オンとオフで文言やアイコンを入れ替えない。どちらが今の状態か分からなくなる",
				"押すと別の画面へ移る操作に使わない",
			],
			keyboard: [
				["Tab", "トグルにフォーカスを移す"],
				["Space", "オンとオフを切り替える"],
				["Enter", "オンとオフを切り替える"],
			],
			a11y: ["オンかオフかは aria-pressed で読み上げられる", "オンの状態は、色に加えて背景の面でも示す"],
			motion: [
				"オンにすると、背景がブランドカラーの薄い色に、文字がブランドカラーに変わる",
				"押すと 0.97 倍に沈み、離すと載る曲線（ease-land）で戻る（motion-press）",
			],
			related: ["アクション/ToggleGroup", "アクション/Toolbar", "アクション/Button", "フォーム/Switch"],
		} satisfies ComponentDocs,
	},
} satisfies Meta<typeof Toggle>;

export default meta;
type Story = StoryObj<typeof meta>;

/** 押すとオンになり、背景がブランドカラーの薄い色に、文字がブランドカラーに変わる */
export const Basic: Story = { name: "基本" };

export const Variants: Story = {
	name: "種類",
	render: (args) => (
		<div className="flex items-center gap-3">
			<Toggle {...args} variant="ghost" aria-label="ピン留め">
				<Pin />
			</Toggle>
			<Toggle {...args} variant="outline" aria-label="ピン留め">
				<Pin />
			</Toggle>
			<Toggle {...args} variant="outline" aria-label={undefined}>
				<Flame />
				火を見る
			</Toggle>
		</div>
	),
};

export const Sizes: Story = {
	name: "サイズ",
	render: (args) => (
		<div className="flex items-center gap-3">
			<Toggle {...args} size="sm" variant="outline" />
			<Toggle {...args} size="md" variant="outline" />
			<Toggle {...args} size="lg" variant="outline" />
		</div>
	),
};

/** 状態ごとの見た目。無効時は不透明度 50% で、押せない */
export const States: Story = {
	name: "状態",
	render: (args) => (
		<div className="grid grid-cols-[auto_repeat(4,max-content)] items-center gap-x-6 gap-y-3 text-sm text-fg-muted">
			<span />
			<span>オフ</span>
			<span>オン</span>
			<span>無効（オフ）</span>
			<span>無効（オン）</span>
			{(["ghost", "outline"] as const).map((variant) => (
				<div key={variant} className="contents">
					<span className="font-mono text-xs">{variant}</span>
					<Toggle {...args} variant={variant} />
					<Toggle {...args} variant={variant} defaultPressed />
					<Toggle {...args} variant={variant} disabled />
					<Toggle {...args} variant={variant} defaultPressed disabled />
				</div>
			))}
		</div>
	),
};

/** Tab でフォーカスし、Space と Enter でオンとオフが切り替わる */
export const KeyboardInteraction: Story = {
	name: "キーボード操作",
	play: async ({ args, canvas }) => {
		const toggle = canvas.getByRole("button", { name: "太字" });
		await userEvent.tab();
		await expect(toggle).toHaveFocus();
		await userEvent.keyboard(" ");
		await expect(toggle).toHaveAttribute("aria-pressed", "true");
		await userEvent.keyboard("{Enter}");
		await expect(toggle).toHaveAttribute("aria-pressed", "false");
		await expect(args.onPressedChange).toHaveBeenCalledTimes(2);
	},
};

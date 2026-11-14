import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, userEvent } from "storybook/test";
import type { ComponentDocs } from "../spec";
import { Textarea } from "./textarea";

const meta = {
	title: "コンポーネント/フォーム/Textarea",
	component: Textarea,
	args: { placeholder: "今日の焚き火のこと", "aria-label": "メモ" },
	parameters: {
		takibi: {
			use: ["説明文やメモなど、改行を含む長めの文を入れる"],
			avoid: [{ case: "1 行で収まる名前や URL を入れる", instead: "フォーム/Input" }],
			dos: ["Field で囲み、見えるラベルを付ける", "字数に上限があるときは、補足に上限を書く（200 字まで）"],
			donts: ["Enter で送信させない。Enter は改行に使う"],
			keyboard: [
				["Tab", "入力欄にフォーカスを移す"],
				["Enter", "改行を入れる"],
			],
			a11y: ["Field の外で使うときは aria-label か aria-labelledby で名前を付ける"],
			motion: [
				"打った行の分だけ高さが伸びる。最小の高さは 80px",
				"hover で枠が明るくなり、フォーカスで枠がブランドカラーになって薄い輪が付く（120ms、ease-standard）",
			],
			related: ["フォーム/Input", "フォーム/Field", "フォーム/Form"],
		} satisfies ComponentDocs,
	},
	decorators: [
		(Story) => (
			<div className="w-80">
				<Story />
			</div>
		),
	],
} satisfies Meta<typeof Textarea>;

export default meta;
type Story = StoryObj<typeof meta>;

/** 複数行の欄。打った分だけ高さが伸び、右下の角を引いても伸ばせる */
export const Basic: Story = { name: "基本" };

/** 状態ごとの見た目。エラーは枠が danger の色になり、無効は不透明度 50%、読み取り専用はページと同じ面になる */
export const States: Story = {
	name: "状態",
	render: (args) => (
		<div className="grid grid-cols-[6rem_1fr] items-start gap-x-4 gap-y-3 text-sm text-fg-muted">
			<span className="pt-2">通常</span>
			<Textarea {...args} />
			<span className="pt-2">エラー</span>
			<Textarea {...args} defaultValue="薪が湿っていた" aria-invalid />
			<span className="pt-2">無効</span>
			<Textarea {...args} defaultValue="薪が湿っていた" disabled />
			<span className="pt-2">読み取り専用</span>
			<Textarea {...args} defaultValue="薪が湿っていた" readOnly />
		</div>
	),
};

/** Tab でフォーカスし、Enter で改行が入る（送信はしない） */
export const KeyboardInteraction: Story = {
	name: "キーボード操作",
	play: async ({ canvas }) => {
		const textarea = canvas.getByRole("textbox", { name: "メモ" });
		await userEvent.tab();
		await expect(textarea).toHaveFocus();
		await userEvent.keyboard("薪を足した{Enter}火が戻った");
		await expect(textarea).toHaveValue("薪を足した\n火が戻った");
	},
};

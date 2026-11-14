import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fn, userEvent } from "storybook/test";
import type { ComponentDocs } from "../spec";
import { Input } from "./input";

const meta = {
	title: "コンポーネント/フォーム/Input",
	component: Input,
	args: { placeholder: "takibi", "aria-label": "プロジェクト名", onValueChange: fn() },
	parameters: {
		takibi: {
			use: ["名前、メールアドレス、URL など、1 行で収まる文字を入れる"],
			avoid: [
				{ case: "改行を含む長めの文を入れる", instead: "フォーム/Textarea" },
				{ case: "数を入れて、増減のボタンでも変えたい", instead: "フォーム/NumberField" },
				{ case: "パスワードを入れる", instead: "フォーム/PasswordInput" },
				{ case: "決まった選択肢から選ぶ", instead: "フォーム/Select" },
			],
			dos: [
				"Field で囲み、見えるラベルを付ける",
				"type を内容に合わせる（email、url など）。スマートフォンで合ったキーボードが出る",
			],
			donts: [
				"プレースホルダーをラベルの代わりにしない。入れ始めると消える",
				"欄の幅を、入れる文字の長さとかけ離れた幅にしない",
			],
			keyboard: [["Tab", "入力欄にフォーカスを移す"]],
			a11y: [
				"Field の外で使うときは aria-label か aria-labelledby で名前を付ける",
				"エラーは aria-invalid で伝わる。直し方は FieldError の文で添える",
			],
			motion: [
				"hover で枠が明るくなり、フォーカスで枠がブランドカラーになって薄い輪が付く（120ms、ease-standard）",
			],
			related: ["フォーム/Field", "フォーム/InputGroup", "フォーム/Textarea", "フォーム/PasswordInput"],
		} satisfies ComponentDocs,
	},
	argTypes: {
		size: { control: "inline-radio", options: ["sm", "md", "lg"] },
	},
	decorators: [
		(Story) => (
			<div className="w-72">
				<Story />
			</div>
		),
	],
} satisfies Meta<typeof Input>;

export default meta;
type Story = StoryObj<typeof meta>;

/** 1 段沈んだ面の入力欄。フォーカスすると枠がブランドカラーになり、薄い輪が付く */
export const Basic: Story = { name: "基本" };

export const Sizes: Story = {
	name: "サイズ",
	render: (args) => (
		<div className="flex flex-col gap-3">
			<Input {...args} size="sm" placeholder="小" />
			<Input {...args} size="md" placeholder="中（標準）" />
			<Input {...args} size="lg" placeholder="大" />
		</div>
	),
};

/** 状態ごとの見た目。エラーは枠が danger の色になり、無効は不透明度 50%、読み取り専用はページと同じ面になる */
export const States: Story = {
	name: "状態",
	render: (args) => (
		<div className="grid grid-cols-[6rem_1fr] items-center gap-x-4 gap-y-3 text-sm text-fg-muted">
			<span>通常</span>
			<Input {...args} />
			<span>入力済み</span>
			<Input {...args} defaultValue="ember-camp" />
			<span>エラー</span>
			<Input {...args} defaultValue="Ember Camp!" aria-invalid />
			<span>無効</span>
			<Input {...args} defaultValue="ember-camp" disabled />
			<span>読み取り専用</span>
			<Input {...args} defaultValue="ember-camp" readOnly />
		</div>
	),
};

/** type ごとの例。メールアドレス、パスワード、数、ファイル */
export const Types: Story = {
	name: "入力の種類",
	render: (args) => (
		<div className="flex flex-col gap-3">
			<Input {...args} type="email" placeholder="you@example.com" aria-label="メールアドレス" />
			<Input {...args} type="password" placeholder="パスワード" aria-label="パスワード" />
			<Input {...args} type="number" placeholder="人数" aria-label="人数" />
			<Input {...args} type="file" aria-label="写真" />
		</div>
	),
};

/** Tab でフォーカスし、打った文字がそのまま値になる */
export const KeyboardInteraction: Story = {
	name: "キーボード操作",
	play: async ({ args, canvas }) => {
		const input = canvas.getByRole("textbox", { name: "プロジェクト名" });
		await userEvent.tab();
		await expect(input).toHaveFocus();
		await userEvent.keyboard("hidoko");
		await expect(input).toHaveValue("hidoko");
		await expect(args.onValueChange).toHaveBeenLastCalledWith("hidoko", expect.anything());
	},
};

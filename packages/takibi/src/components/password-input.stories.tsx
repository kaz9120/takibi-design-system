import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fn, userEvent } from "storybook/test";
import type { ComponentDocs } from "../spec";
import { Field, FieldDescription, FieldError, FieldLabel } from "./field";
import { PasswordInput } from "./password-input";

const meta = {
	title: "コンポーネント/フォーム/PasswordInput",
	component: PasswordInput,
	args: { "aria-label": "パスワード", placeholder: "8 文字以上", onVisibleChange: fn() },
	argTypes: {
		size: { control: "inline-radio", options: ["sm", "md", "lg"] },
	},
	parameters: {
		takibi: {
			use: ["ログインや登録で、パスワードを入れる"],
			avoid: [{ case: "メールや SMS で届いた短いコードを入れる", instead: "フォーム/OTPField" }],
			dos: [
				"新しいパスワードを決める欄では、autoComplete に new-password を渡す",
				"文字数などの条件は、入れる前に補足で見せる",
			],
			donts: ["貼り付けを止めない。パスワード管理のアプリから入れられなくなる"],
			copy: {
				rules: ["条件は補足に書き、エラーでは満たしていない条件だけを書く"],
				examples: [
					{ good: "8 文字以上にしてください", bad: "パスワードが弱すぎます", note: "直し方が分かる" },
				],
			},
			keyboard: [
				["Tab", "入力欄から、表示を切り替えるボタンへ移る"],
				["Space / Enter", "伏せ字と文字の表示を切り替える"],
			],
			a11y: [
				"切り替えのボタンは「パスワードを表示」と読み上げられ、押されているかは aria-pressed で伝わる",
				"マウスで切り替えても、入力欄のフォーカスとカーソルの位置は動かない",
			],
			motion: [
				"切り替えると、目のアイコンが 0.5 倍に縮みながらぼけて消え、次のアイコンがはぜる曲線（ease-pop）で現れる",
			],
			related: ["フォーム/Input", "フォーム/InputGroup", "フォーム/Field", "フォーム/Form"],
		} satisfies ComponentDocs,
	},
	decorators: [
		(Story) => (
			<div className="w-72">
				<Story />
			</div>
		),
	],
} satisfies Meta<typeof PasswordInput>;

export default meta;
type Story = StoryObj<typeof meta>;

/** 右端の目のボタンで、伏せ字と文字の表示を切り替える。目のアイコンは縮んで消え、次のアイコンに入れ替わる */
export const Basic: Story = { name: "基本" };

export const Sizes: Story = {
	name: "サイズ",
	render: (args) => (
		<div className="flex flex-col gap-3">
			<PasswordInput {...args} size="sm" placeholder="小" />
			<PasswordInput {...args} size="md" placeholder="中（標準）" />
			<PasswordInput {...args} size="lg" placeholder="大" />
		</div>
	),
};

/** 状態ごとの見た目。エラーは枠が danger の色になり、無効は切り替えのボタンも押せない */
export const States: Story = {
	name: "状態",
	render: (args) => (
		<div className="grid grid-cols-[6rem_1fr] items-center gap-x-4 gap-y-3 text-sm text-fg-muted">
			<span>通常</span>
			<PasswordInput {...args} />
			<span>入力済み</span>
			<PasswordInput {...args} defaultValue="ember-camp" />
			<span>表示中</span>
			<PasswordInput {...args} defaultValue="ember-camp" defaultVisible />
			<span>エラー</span>
			<PasswordInput {...args} defaultValue="ember" aria-invalid />
			<span>無効</span>
			<PasswordInput {...args} defaultValue="ember-camp" disabled />
		</div>
	),
};

/** 新しいパスワードを決める欄。`autoComplete="new-password"` を渡す。8 文字未満でフォーカスを外すとエラーが出る */
export const NewPassword: Story = {
	name: "新しいパスワード",
	render: (args) => (
		<Field validationMode="onBlur">
			<FieldLabel required>新しいパスワード</FieldLabel>
			<PasswordInput {...args} aria-label={undefined} autoComplete="new-password" required minLength={8} />
			<FieldDescription>8 文字以上。記号を混ぜると強くなります。</FieldDescription>
			<FieldError match="valueMissing">パスワードを入れてください</FieldError>
			<FieldError match="tooShort">8 文字以上にしてください</FieldError>
		</Field>
	),
};

/** 打ったあと Tab で切り替えのボタンへ移り、Space で表示が切り替わる。押されているかは aria-pressed で伝わる */
export const KeyboardInteraction: Story = {
	name: "キーボード操作",
	play: async ({ args, canvas }) => {
		const input = canvas.getByLabelText("パスワード");
		await userEvent.click(input);
		await userEvent.keyboard("ember-camp");
		await expect(input).toHaveAttribute("type", "password");
		await userEvent.tab();
		const toggle = canvas.getByRole("button", { name: "パスワードを表示" });
		await expect(toggle).toHaveFocus();
		await userEvent.keyboard(" ");
		await expect(input).toHaveAttribute("type", "text");
		await expect(toggle).toHaveAttribute("aria-pressed", "true");
		await userEvent.keyboard(" ");
		await expect(input).toHaveAttribute("type", "password");
		await expect(args.onVisibleChange).toHaveBeenCalledTimes(2);
	},
};

/** マウスで切り替えても、入力欄のフォーカスは外れない。続けて打てる */
export const KeepsFocus: Story = {
	name: "フォーカスを保つ",
	play: async ({ canvas }) => {
		const input = canvas.getByLabelText("パスワード");
		await userEvent.click(input);
		await userEvent.keyboard("ember");
		await userEvent.click(canvas.getByRole("button", { name: "パスワードを表示" }));
		await expect(input).toHaveFocus();
		await userEvent.keyboard("-camp");
		await expect(input).toHaveValue("ember-camp");
	},
};

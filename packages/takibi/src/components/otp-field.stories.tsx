import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fn, userEvent, waitFor } from "storybook/test";
import type { ComponentDocs } from "../spec";
import { Field, FieldDescription, FieldLabel } from "./field";
import { OTPField } from "./otp-field";

const meta = {
	title: "コンポーネント/フォーム/OTPField",
	component: OTPField,
	args: { length: 6, "aria-label": "確認コード", onValueComplete: fn() },
	argTypes: {
		size: { control: "inline-radio", options: ["sm", "md", "lg"] },
	},
	parameters: {
		takibi: {
			use: ["メールや SMS で届いた、桁数の決まったコードを入れる"],
			avoid: [
				{ case: "パスワードを入れる", instead: "フォーム/PasswordInput" },
				{ case: "桁数の決まっていない数を入れる", instead: "フォーム/NumberField" },
			],
			dos: [
				"autoComplete に one-time-code を渡す。SMS で届いたコードを端末が自動で入れられる",
				"6 桁なら 3 桁ずつ区切る（groups）",
				"どこに届いたコードかを補足に書く",
			],
			donts: ["全部の枠に 1 つずつラベルを見せない。グループに 1 つのラベルを付ける"],
			copy: {
				rules: ["補足には、どこに届いた何桁のコードかを書く"],
				examples: [
					{ good: "メールで届いた 6 桁の数字", bad: "コードを入力", note: "どこを見ればよいかが分かる" },
					{
						good: "コードが違います。メールをもう一度確かめてください。",
						bad: "認証エラー",
						note: "直し方が分かる",
					},
				],
			},
			keyboard: [
				["0〜9", "今の枠に入れて、次の枠へ進む"],
				["Backspace", "文字を消して、前の枠へ戻る"],
				["← / →", "前後の枠へ移る"],
				["Home / End", "最初の枠、最後の枠へ移る"],
			],
			a11y: [
				"最初の枠にグループの名前が付き、2 文字目からは「2 文字目（全 6 文字）」のように読み上げられる",
				"伏せ字（mask）でも、スクリーンリーダーでは何文字目かが分かる",
			],
			motion: [
				"打った文字は、0.4 倍の大きさと 6px 下から、ばね（spring-snappy）で現れる",
				"全部埋まると、枠の外側の光が左から 40ms ずつ遅れて一度だけ点いて消える（0.8 秒）",
				"動きを減らす設定では、文字はすぐ現れ、光は出さない",
			],
			related: ["フォーム/PasswordInput", "フォーム/Field", "フォーム/Form"],
		} satisfies ComponentDocs,
	},
} satisfies Meta<typeof OTPField>;

export default meta;
type Story = StoryObj<typeof meta>;

/** 打つと文字が弾んで現れ、次の枠へ進む。6 文字すべて埋まると、枠の外側が左から順に一度だけ光る */
export const Basic: Story = { name: "基本" };

/** 3 文字ずつ区切ると、目で追いやすく、読み上げやすい */
export const Grouped: Story = {
	name: "区切り付き",
	args: { groups: [3] },
};

/** 伏せ字。人に見られる場所で入れるコードに使う */
export const Masked: Story = {
	name: "伏せ字",
	args: { mask: true, defaultValue: "4812" },
};

/** 英字も混ざるコード。予備のコードや招待のコードに使う */
export const Alphanumeric: Story = {
	name: "英数字",
	args: { length: 8, groups: [4], validationType: "alphanumeric", "aria-label": "予備のコード" },
};

export const Sizes: Story = {
	name: "サイズ",
	render: (args) => (
		<div className="flex flex-col gap-4">
			<OTPField {...args} size="sm" aria-label="小" />
			<OTPField {...args} size="md" aria-label="中" />
			<OTPField {...args} size="lg" aria-label="大" />
		</div>
	),
};

/** 状態ごとの見た目。エラーは枠が danger の色になり、無効は不透明度 50%、読み取り専用はページと同じ面になる */
export const States: Story = {
	name: "状態",
	render: (args) => (
		<div className="grid grid-cols-[6rem_auto] items-center justify-start gap-x-4 gap-y-4 text-sm text-fg-muted">
			<span>空</span>
			<OTPField {...args} aria-label="空" />
			<span>途中</span>
			<OTPField {...args} aria-label="途中" defaultValue="481" />
			<span>エラー</span>
			<Field invalid className="w-fit">
				<OTPField {...args} aria-label="エラー" defaultValue="481266" />
			</Field>
			<span>無効</span>
			<OTPField {...args} aria-label="無効" defaultValue="481266" disabled />
			<span>読み取り専用</span>
			<OTPField {...args} aria-label="読み取り専用" defaultValue="481266" readOnly />
		</div>
	),
};

/** Field の中に置くと、ラベルと補足が結び付く。コードが違うときは、サーバーの答えを受けて Field に `invalid` を渡す */
export const WithField: Story = {
	name: "ラベルと補足",
	args: { "aria-label": undefined, groups: [3] },
	render: (args) => (
		<Field className="w-fit">
			<FieldLabel>確認コード</FieldLabel>
			<OTPField {...args} autoComplete="one-time-code" />
			<FieldDescription>メールで届いた 6 桁の数字</FieldDescription>
		</Field>
	),
};

/** 打つたびに次の枠へ進み、Backspace で戻って消える。貼り付けると全部の枠に一度に入る */
export const KeyboardInteraction: Story = {
	name: "キーボード操作",
	play: async ({ args, canvas }) => {
		const first = canvas.getByRole("textbox", { name: "確認コード" });
		await userEvent.tab();
		await expect(first).toHaveFocus();
		await userEvent.keyboard("481");
		const fourth = canvas.getByRole("textbox", { name: "4 文字目（全 6 文字）" });
		await expect(fourth).toHaveFocus();
		await userEvent.keyboard("{Backspace}");
		await expect(canvas.getByRole("textbox", { name: "3 文字目（全 6 文字）" })).toHaveValue("");
		await userEvent.keyboard("1266");
		await waitFor(() => expect(args.onValueComplete).toHaveBeenCalledWith("481266", expect.anything()));
	},
};

/** 数字だけの欄に英字を打っても入らない */
export const RejectsLetters: Story = {
	name: "英字を受け付けない",
	play: async ({ canvas }) => {
		const first = canvas.getByRole("textbox", { name: "確認コード" });
		await userEvent.click(first);
		await userEvent.keyboard("a");
		await expect(first).toHaveValue("");
		await userEvent.keyboard("7");
		await expect(first).toHaveValue("7");
	},
};

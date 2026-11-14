import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, userEvent, waitFor } from "storybook/test";
import type { ComponentDocs } from "../spec";
import { Field, FieldDescription, FieldError, FieldLabel } from "./field";
import { Input } from "./input";
import { Textarea } from "./textarea";

const meta = {
	title: "コンポーネント/フォーム/Field",
	component: Field,
	parameters: {
		takibi: {
			use: ["入力欄に、ラベル・補足・エラーの文を結び付ける", "入力の検証をして、エラーを欄の下に出す"],
			avoid: [{ case: "関連する入力欄をまとめて見出しを付ける", instead: "フォーム/Fieldset" }],
			dos: [
				"ラベルは必ず見えるように置く。プレースホルダーをラベルの代わりにしない",
				"エラーは、どう直せばよいかまで書く",
				"必須マークは、必須の項目が少ないときだけ付ける。多いときは任意の項目にマークを付ける",
			],
			donts: [
				"入力の途中でエラーを出さない。フォーカスを外したときか、送ったときに出す",
				"色だけでエラーを伝えない。文を必ず添える",
			],
			copy: {
				rules: [
					"ラベルは名詞で短く書く（メールアドレス）",
					"エラーは、何が起きていて、どうすればよいかを 1 文で書く",
					"補足は、入れる前に知っておきたいことだけにする",
				],
				examples: [
					{ good: "メールアドレスの形で入れてください", bad: "入力エラー", note: "直し方が分かる" },
					{ good: "8 文字以上にしてください", bad: "パスワードが不正です", note: "責める言い方にしない" },
				],
			},
			keyboard: [["Tab", "次の入力欄へ移る。ラベルを押しても入力欄にフォーカスが移る"]],
			a11y: [
				"ラベル、補足、エラーの文は、入力欄に自動で結び付き、読み上げられる",
				"エラーがあると入力欄に aria-invalid が付く",
			],
			motion: [
				"エラーの文は、動かさずに 120ms で薄く現れて消える（motion-fade）。周りの欄が動かないようにするため",
				"入力欄は hover で枠が明るくなり、フォーカスでブランドカラーの輪が付く",
			],
			related: ["フォーム/Input", "フォーム/Textarea", "フォーム/Fieldset", "フォーム/Form"],
		} satisfies ComponentDocs,
	},
	decorators: [
		(Story) => (
			<div className="w-80">
				<Story />
			</div>
		),
	],
} satisfies Meta<typeof Field>;

export default meta;
type Story = StoryObj<typeof meta>;

/** ラベルは上、補足は下。ラベルを押すと入力欄にフォーカスが移る */
export const Basic: Story = {
	name: "基本",
	render: (args) => (
		<Field {...args}>
			<FieldLabel>プロジェクト名</FieldLabel>
			<Input placeholder="takibi" />
			<FieldDescription>一覧と URL に表示されます</FieldDescription>
		</Field>
	),
};

/** 必須の項目。ラベルに必須マークが付き、空のままフォーカスを外すとエラーが出る */
export const Required: Story = {
	name: "必須",
	render: (args) => (
		<Field {...args} validationMode="onBlur">
			<FieldLabel required>表示名</FieldLabel>
			<Input required placeholder="山本" />
			<FieldError match="valueMissing">表示名を入れてください</FieldError>
		</Field>
	),
};

/** 状態ごとの見た目。エラーは枠と文が danger の色になり、無効はラベルごと薄くなる */
export const States: Story = {
	name: "状態",
	render: (args) => (
		<div className="flex flex-col gap-6">
			<Field {...args}>
				<FieldLabel>通常</FieldLabel>
				<Input defaultValue="ember-camp" />
				<FieldDescription>半角英数とハイフンだけ使えます</FieldDescription>
			</Field>
			<Field {...args} invalid>
				<FieldLabel>エラー</FieldLabel>
				<Input defaultValue="Ember Camp!" />
				<FieldError match>半角英数とハイフンだけ使えます</FieldError>
			</Field>
			<Field {...args} disabled>
				<FieldLabel>無効</FieldLabel>
				<Input defaultValue="ember-camp" />
				<FieldDescription>作成後は変えられません</FieldDescription>
			</Field>
		</div>
	),
};

/** Textarea にも、Input と同じようにラベルと補足が結び付く */
export const WithTextarea: Story = {
	name: "複数行の欄",
	render: (args) => (
		<Field {...args}>
			<FieldLabel>説明</FieldLabel>
			<Textarea placeholder="何のためのプロジェクトか" />
			<FieldDescription>200 字まで</FieldDescription>
		</Field>
	),
};

/** 独自の検証。`validate` が返した文がエラーとして出る */
export const CustomValidation: Story = {
	name: "独自の検証",
	render: (args) => (
		<Field
			{...args}
			validationMode="onChange"
			validate={(value) =>
				typeof value === "string" && !/^[a-z0-9-]*$/.test(value) ? "半角英数とハイフンだけ使えます" : null
			}
		>
			<FieldLabel>スラッグ</FieldLabel>
			<Input placeholder="ember-camp" />
			<FieldDescription>URL の末尾になります</FieldDescription>
			<FieldError />
		</Field>
	),
};

/** 形の合わないメールアドレスを入れてフォーカスを外すとエラーが出て、直すと消える */
export const ValidationOnBlur: Story = {
	name: "フォーカスを外したときの検証",
	render: (args) => (
		<Field {...args} validationMode="onBlur">
			<FieldLabel required>メールアドレス</FieldLabel>
			<Input type="email" required placeholder="you@example.com" />
			<FieldError match="valueMissing">メールアドレスを入れてください</FieldError>
			<FieldError match="typeMismatch">メールアドレスの形で入れてください</FieldError>
		</Field>
	),
	play: async ({ canvas }) => {
		const input = canvas.getByRole("textbox", { name: /メールアドレス/ });
		await userEvent.click(input);
		await userEvent.keyboard("takibi");
		await userEvent.tab();
		await waitFor(() => expect(canvas.getByText("メールアドレスの形で入れてください")).toBeVisible());
		await expect(input).toHaveAttribute("aria-invalid", "true");

		await userEvent.click(input);
		await userEvent.keyboard("@example.com");
		await userEvent.tab();
		await waitFor(() =>
			expect(canvas.queryByText("メールアドレスの形で入れてください")).not.toBeInTheDocument(),
		);
		await expect(input).not.toHaveAttribute("aria-invalid");
	},
};

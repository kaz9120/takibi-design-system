import type { Meta, StoryObj } from "@storybook/react-vite";
import * as React from "react";
import { expect, userEvent, waitFor } from "storybook/test";
import type { ComponentDocs } from "../spec";
import { Button, type ButtonStatus } from "./button";
import { Field, FieldError, FieldLabel } from "./field";
import { Form, FormActions } from "./form";
import { Input } from "./input";
import { PasswordInput } from "./password-input";

const meta = {
	title: "コンポーネント/フォーム/Form",
	component: Form,
	parameters: {
		takibi: {
			use: ["複数の入力欄をまとめて検証し、送る", "サーバーが返したエラーを、該当する欄の下に出す"],
			avoid: [{ case: "入力のたびにすぐ保存する設定", instead: "フォーム/Switch" }],
			dos: [
				"各 Field に name を付ける。送信の値とサーバーのエラーがこの名前で結び付く",
				"送信ボタンには status を渡し、送信中と完了を見せる",
				"送信ボタンは FormActions に入れて、フォームの最後に置く",
			],
			donts: [
				"エラーをフォームの上にまとめて出すだけにしない。欄の下に出す",
				"送信ボタンを無効にして入力を促さない。押せるようにして、足りない欄をエラーで示す",
			],
			copy: {
				rules: ["送信ボタンは、送ると何が起きるかを動詞で書く（ログイン、予約する）"],
				examples: [
					{ good: "予約する", bad: "送信", note: "何が起きるかが分かる" },
					{
						good: "メールアドレスを入れてください",
						bad: "必須項目です",
						note: "どの欄に何を入れればよいかが分かる",
					},
				],
			},
			keyboard: [["Enter", "入力欄にいるときに押すと送る"]],
			a11y: [
				"送ったときに検証に通らない欄があると、最初のエラーの欄にフォーカスが移る",
				"サーバーのエラーが届いたときも、最初のエラーの欄にフォーカスが移る",
			],
			motion: ["エラーの文は、動かさずに 120ms で薄く現れる（motion-fade）"],
			related: ["フォーム/Field", "フォーム/Fieldset", "アクション/Button"],
		} satisfies ComponentDocs,
	},
	decorators: [
		(Story) => (
			<div className="w-80">
				<Story />
			</div>
		),
	],
} satisfies Meta<typeof Form>;

export default meta;
type Story = StoryObj<typeof meta>;

type Errors = Record<string, string>;

/** サーバーの代わり。パスワードが takibi のときだけ通す */
async function signIn(values: Record<string, unknown>): Promise<Errors> {
	await new Promise((resolve) => setTimeout(resolve, 900));
	if (values.email === "new@example.com") return { email: "このメールアドレスは登録されていません" };
	if (values.password !== "takibi") return { password: "パスワードが違います" };
	return {};
}

function validateEmail(value: unknown) {
	if (!value) return "メールアドレスを入れてください";
	if (typeof value === "string" && !/^[^@\s]+@[^@\s]+$/.test(value))
		return "メールアドレスの形で入れてください";
	return null;
}

function SignInForm() {
	const [errors, setErrors] = React.useState<Errors>({});
	const [status, setStatus] = React.useState<ButtonStatus>("idle");
	return (
		<Form
			errors={errors}
			onFormSubmit={async (values) => {
				setStatus("loading");
				const next = await signIn(values);
				setErrors(next);
				if (Object.keys(next).length > 0) {
					setStatus("idle");
					return;
				}
				setStatus("success");
				setTimeout(() => setStatus("idle"), 1800);
			}}
		>
			{/* 手元の検証は validate で日本語の文を返す。サーバーのエラーも同じ FieldError に出る */}
			<Field name="email" validate={validateEmail}>
				<FieldLabel>メールアドレス</FieldLabel>
				<Input type="email" autoComplete="email" placeholder="you@example.com" />
				<FieldError />
			</Field>
			<Field name="password" validate={(value) => (value ? null : "パスワードを入れてください")}>
				<FieldLabel>パスワード</FieldLabel>
				<PasswordInput />
				<FieldError />
			</Field>
			<FormActions>
				<Button
					type="submit"
					className="w-full"
					status={status}
					loadingLabel="確かめています"
					successLabel="入りました"
				>
					ログイン
				</Button>
			</FormActions>
		</Form>
	);
}

/**
 * ログインの形。送るとボタンが送信中の形に変わり、サーバーのエラーはその欄の下に出る。
 * エラーの欄にはフォーカスが移り、打ち直すとエラーは消える。パスワードに takibi を入れると通る
 */
export const SignIn: Story = {
	name: "ログイン",
	render: () => <SignInForm />,
};

/** 送信時の検証。空のまま送ると、送らずに最初の欄へフォーカスが移ってエラーが出る */
export const ClientValidation: Story = {
	name: "送信時の検証",
	render: () => <SignInForm />,
	play: async ({ canvas }) => {
		await userEvent.click(canvas.getByRole("button", { name: "ログイン" }));
		const email = canvas.getByRole("textbox", { name: "メールアドレス" });
		await waitFor(() => expect(canvas.getByText("メールアドレスを入れてください")).toBeVisible());
		await expect(email).toHaveFocus();
	},
};

/** 違うパスワードで送ると、サーバーのエラーがパスワードの欄に出て、その欄にフォーカスが移る。直して送ると完了の形になる */
export const ServerErrors: Story = {
	name: "サーバーのエラー",
	render: () => <SignInForm />,
	play: async ({ canvas }) => {
		const email = canvas.getByRole("textbox", { name: "メールアドレス" });
		const password = canvas.getByLabelText("パスワード");
		await userEvent.click(email);
		await userEvent.keyboard("camp@example.com");
		await userEvent.tab();
		await userEvent.keyboard("ember");
		await userEvent.keyboard("{Enter}");
		await waitFor(() => expect(canvas.getByText("パスワードが違います")).toBeVisible(), { timeout: 3000 });
		await waitFor(() => expect(password).toHaveFocus());
		await expect(password).toHaveAttribute("aria-invalid", "true");

		await userEvent.clear(password);
		await userEvent.keyboard("takibi");
		await waitFor(() => expect(canvas.queryByText("パスワードが違います")).not.toBeInTheDocument());
		await userEvent.keyboard("{Enter}");
		await waitFor(
			() => expect(canvas.getByText("入りました", { selector: "[aria-live]" })).toBeInTheDocument(),
			{
				timeout: 3000,
			},
		);
	},
};

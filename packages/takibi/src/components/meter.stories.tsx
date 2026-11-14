import type { Meta, StoryObj } from "@storybook/react-vite";
import * as React from "react";
import { expect, userEvent } from "storybook/test";
import type { ComponentDocs } from "../spec";
import { Field, FieldDescription, FieldLabel } from "./field";
import { Input } from "./input";
import { Meter } from "./meter";

const strength = ["入力してください", "弱い", "まだ弱い", "普通", "強い"];

const meta = {
	title: "コンポーネント/フィードバック/Meter",
	component: Meter,
	parameters: {
		takibi: {
			use: [
				"パスワードの強さのように、値を段で評価して見せる",
				"保存容量など、決まった範囲のうちどれだけ使っているかを見せる",
			],
			avoid: [{ case: "処理がどこまで進んだかを見せる", instead: "フィードバック/Progress" }],
			dos: [
				"valueText で、段の意味を言葉にする（弱い、強い）",
				"区切りは既定の 4 にする。細かく見せたいときだけ増やす",
			],
			donts: ["色と長さだけで評価を伝えない。valueText を添える", "処理の進み具合に使わない"],
			copy: {
				rules: ["段の言葉は短い形容詞にする", "量を示すときは単位まで書く（6.2 / 10 GB）"],
				examples: [{ good: "強い", bad: "強度: 75%", note: "数より、意味で伝える" }],
			},
			a11y: [
				'role="meter" で、label がそのまま名前になる。label を省くときは aria-label を付ける',
				"valueText は aria-valuetext として読み上げられる",
				"区切りは飾りとしてスクリーンリーダーから隠す",
			],
			motion: [
				"火の粉の伝播: 段が上がると左から、下がると右から、区切りを 40ms ずつずらして色を変える（360ms、ease-standard）",
				"埋まった区切りの色は、段が上がるほど fg-subtle からブランドカラーに近づく。全部埋まると、区切りがブランドカラーで薄く光る",
			],
			related: ["フィードバック/Progress", "フォーム/PasswordInput", "フォーム/Field"],
		} satisfies ComponentDocs,
	},
	args: {
		value: 3,
		max: 4,
		label: "パスワードの強さ",
		valueText: (level: number, _value: number) => strength[level] ?? "",
	},
	argTypes: {
		value: { control: { type: "range", min: 0, max: 4, step: 1 } },
	},
	render: (args) => (
		<div className="w-72">
			<Meter {...args} />
		</div>
	),
} satisfies Meta<typeof Meter>;

export default meta;
type Story = StoryObj<typeof meta>;

/** 段が上がるほど、埋まった区切りの色がブランドカラーに近づく */
export const Basic: Story = { name: "基本" };

/** 0 から 4 までの各段の見た目 */
export const Levels: Story = {
	name: "段ごとの見た目",
	parameters: { section: "状態" },
	render: (args) => (
		<div className="flex w-72 flex-col gap-5">
			{[0, 1, 2, 3, 4].map((v) => (
				<Meter key={v} {...args} value={v} />
			))}
		</div>
	),
};

/** 区切りを 10 に増やした例。保存容量のように細かく見せたいときに使う */
export const Segments: Story = {
	name: "区切りの数",
	args: {
		value: 6.2,
		max: 10,
		segments: 10,
		label: "保存容量",
		valueText: (_level: number, value: number) => `${value} / 10 GB`,
	},
};

/** 文字の数と種類から強さを測る、簡単な目安 */
function score(password: string) {
	if (!password) return 0;
	let s = 0;
	if (password.length >= 8) s++;
	if (password.length >= 12) s++;
	if (/[A-Z]/.test(password) && /[a-z]/.test(password)) s++;
	if (/\d/.test(password) && /[^A-Za-z0-9]/.test(password)) s++;
	return Math.max(1, s);
}

function PasswordDemo() {
	const [password, setPassword] = React.useState("");
	const level = score(password);
	return (
		<Field className="w-72">
			<FieldLabel>新しいパスワード</FieldLabel>
			<Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
			<Meter value={level} max={4} aria-label="パスワードの強さ" valueText={(l) => strength[l] ?? ""} />
			<FieldDescription>12 文字以上で、記号と数字を混ぜると強くなります</FieldDescription>
		</Field>
	);
}

/** hidoko-id のパスワード欄。打つたびに段が上がり、区切りが左から順に埋まる */
export const PasswordStrength: Story = {
	name: "パスワードの強さ",
	render: () => <PasswordDemo />,
	play: async ({ canvas }) => {
		const input = canvas.getByLabelText("新しいパスワード");
		const meter = canvas.getByRole("meter", { name: "パスワードの強さ" });
		await expect(meter).toHaveAttribute("aria-valuetext", "入力してください");
		await userEvent.click(input);
		await userEvent.keyboard("takibi");
		await expect(meter).toHaveAttribute("aria-valuetext", "弱い");
		await userEvent.keyboard("-Hidoko-2026");
		await expect(meter).toHaveAttribute("aria-valuetext", "強い");
	},
};

import type { Meta, StoryObj } from "@storybook/react-vite";
import { Flame } from "lucide-react";
import { expect } from "storybook/test";
import type { ComponentDocs } from "../spec";
import { Button } from "./button";
import { VisuallyHidden } from "./visually-hidden";

const meta = {
	title: "コンポーネント/データ表示/VisuallyHidden",
	component: VisuallyHidden,
	parameters: {
		takibi: {
			summary: "画面には出さず、スクリーンリーダーにだけ読ませる。",
			use: [
				"アイコンだけのボタンに、読み上げる名前を添える",
				"画面では並びで分かるが、スクリーンリーダーでは見出しが要る場所に見出しを置く",
			],
			avoid: [
				{ case: "見える文言で足りる" },
				{ case: "キーボードで最初に本文へ飛ぶ", instead: "ナビゲーション/SkipLink" },
			],
			dos: ["render で要素を変えられる。見出しにするときは render={<h2 />} のように渡す"],
			donts: [
				"フォーカスできる要素を隠さない。見えないところにフォーカスが移ってしまう",
				"見える文言と違う内容を読ませない",
			],
			a11y: ["画面からは消えるが、スクリーンリーダーには普通の文字として読まれる（sr-only）"],
			related: ["ナビゲーション/SkipLink", "アクション/Button"],
		} satisfies ComponentDocs,
	},
} satisfies Meta<typeof VisuallyHidden>;

export default meta;
type Story = StoryObj<typeof meta>;

/** アイコンだけのボタンに、読み上げる名前を添える。画面には何も増えない */
export const Basic: Story = {
	name: "ボタンの名前",
	render: () => (
		<Button variant="secondary" size="icon">
			<Flame />
			<VisuallyHidden>火を入れる</VisuallyHidden>
		</Button>
	),
	play: async ({ canvas }) => {
		const button = canvas.getByRole("button", { name: "火を入れる" });
		await expect(button).toBeInTheDocument();
		const hidden = canvas.getByText("火を入れる");
		await expect(hidden.getBoundingClientRect().width).toBeLessThanOrEqual(1);
	},
};

/** render で見出しなどの要素に変えて使える */
export const AsHeading: Story = {
	name: "見出しにする",
	render: () => (
		<section className="text-sm text-fg-muted">
			{/* biome-ignore lint/a11y/useHeadingContent: 見出しの文字は VisuallyHidden の子として入る */}
			<VisuallyHidden render={<h2 />}>きょうの記録</VisuallyHidden>
			<p>見出しはスクリーンリーダーだけに出る。画面では表の並びで内容が伝わる。</p>
		</section>
	),
};

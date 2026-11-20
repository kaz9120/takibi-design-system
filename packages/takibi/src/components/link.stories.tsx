import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, userEvent } from "storybook/test";
import type { ComponentDocs } from "../spec";
import { Link } from "./link";

const meta = {
	title: "コンポーネント/ナビゲーション/Link",
	component: Link,
	args: { href: "#", children: "記録の書き方" },
	parameters: {
		takibi: {
			use: ["別のページや、ページの中の別の場所へ移る", "本文の中で、詳しい説明や出典へ案内する"],
			avoid: [
				{ case: "保存や送信など、押すと何かが起きる", instead: "アクション/Button" },
				{ case: "階層の中の位置を見せる", instead: "ナビゲーション/Breadcrumbs" },
			],
			dos: [
				"本文の中では default、足元や補足では muted にする",
				"別のサイトへのリンクには external を付ける。矢印が付き、新しいタブで開く",
			],
			donts: [
				"リンクの文字を「こちら」「詳しく」だけにしない",
				"見た目をボタンにしたいときに Link を使わない。押して何かが起きるなら Button にする",
			],
			copy: {
				rules: ["リンクの文字だけで、行き先が分かるようにする", "文の中では、行き先を表す名詞をリンクにする"],
				examples: [
					{ good: "記録の書き方", bad: "こちら", note: "リンクだけを読んでも行き先が分かる" },
					{
						good: "Base UI のドキュメント",
						bad: "詳しくはこちらをクリック",
						note: "操作の説明ではなく、行き先を書く",
					},
				],
			},
			keyboard: [
				["Tab", "リンクにフォーカスを移す"],
				["Enter", "リンク先へ移る"],
			],
			a11y: [
				"色だけに頼らず、いつも薄い下線を引いてリンクだと分かるようにする",
				"external では「（新しいタブで開く）」がアクセシブルネームに入る",
				"無効は aria-disabled で示し、押せず、文字を fg-subtle にする",
			],
			motion: [
				"hover すると、薄い下線の上に濃い線が左から描かれる（360ms、ease-ember）。離すと右へ抜けて消える（150ms、ease-out-expo）",
				"フォーカスでは、濃い下線とフォーカスリングが付く",
				"external の矢印は、hover で右上へ 2px ずつ動く（ease-pop、500ms）",
			],
			related: ["アクション/Button", "ナビゲーション/Breadcrumbs", "ナビゲーション/SkipLink"],
		} satisfies ComponentDocs,
	},
	argTypes: {
		variant: { control: "inline-radio", options: ["default", "muted"] },
		external: { control: "boolean" },
	},
} satisfies Meta<typeof Link>;

export default meta;
type Story = StoryObj<typeof meta>;

/** hover すると、薄い下線の上に濃い線が左から描かれる。離すと右へ抜けて消える */
export const Basic: Story = { name: "基本" };

/** 文の中に置いたリンク。折り返しても、行ごとに下線が引かれる */
export const InText: Story = {
	name: "文の中",
	render: () => (
		<p className="max-w-sm text-base text-fg">
			火を入れる前に、<Link href="#">薪の組み方と、風の向きの読み方をまとめた手引き</Link>
			を読んでおくと、最初の 10 分が楽になる。
		</p>
	),
};

/** 別のサイトへのリンク。右上を向いた矢印が付き、hover で右上へ少し動く。新しいタブで開く */
export const External: Story = {
	name: "別のサイトへ",
	args: { href: "https://example.com", external: true, children: "Base UI のドキュメント" },
};

/** default は本文に、muted は足元や補足に置く */
export const Variants: Story = {
	name: "種類",
	render: () => (
		<div className="flex flex-col items-start gap-3 text-sm">
			<Link href="#">default: 本文のリンク</Link>
			<Link href="#" variant="muted">
				muted: 足元のリンク
			</Link>
			<Link href="#" variant="muted" external>
				muted と external
			</Link>
		</div>
	),
};

/** 通常と無効。無効は aria-disabled で示す。フォーカスでは輪と濃い下線が付く */
export const States: Story = {
	name: "状態",
	render: () => (
		<div className="flex flex-col items-start gap-3 text-sm">
			<Link href="#">通常</Link>
			<Link href="#" aria-disabled>
				無効
			</Link>
		</div>
	),
};

/** ルーターのリンクにするときは render に要素を渡す。見た目と振る舞いはそのまま残る */
export const RouterLink: Story = {
	name: "ルーターのリンク",
	render: () => (
		<Link render={<a href="#settings" data-router="true" />} href="#settings">
			設定を開く
		</Link>
	),
};

/** Tab でフォーカスが移る。別のサイトへのリンクは、新しいタブで開くことがアクセシブルネームに入る */
export const KeyboardFocus: Story = {
	name: "キーボード操作",
	render: () => (
		<div className="flex gap-4 text-sm">
			<Link href="#">手引き</Link>
			<Link href="https://example.com" external>
				外のサイト
			</Link>
		</div>
	),
	play: async ({ canvas }) => {
		await userEvent.tab();
		await expect(canvas.getByRole("link", { name: "手引き" })).toHaveFocus();
		await userEvent.tab();
		const external = canvas.getByRole("link", { name: /外のサイト\s*（新しいタブで開く）/ });
		await expect(external).toHaveFocus();
		await expect(external).toHaveAttribute("target", "_blank");
		await expect(external).toHaveAttribute("rel", "noopener noreferrer");
	},
};

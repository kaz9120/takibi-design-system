import type { Meta, StoryObj } from "@storybook/react-vite";
import { ArrowRight, Flame, Plus, Trash2 } from "lucide-react";
import * as React from "react";
import { expect, fn, userEvent } from "storybook/test";
import type { ComponentDocs } from "../spec";
import { Button, type ButtonStatus } from "./button";

const meta = {
	title: "コンポーネント/アクション/Button",
	component: Button,
	args: { children: "保存する", onClick: fn() },
	parameters: {
		takibi: {
			use: [
				"送信、保存、次へ進むなど、押すと何かが起きる操作",
				"送信の結果を待つ操作。status を渡すと、送信中から完了まで、1 つのボタンのまま幅と中身が変わる",
			],
			avoid: [
				{ case: "別のページへ移るだけ", instead: "ナビゲーション/Link" },
				{ case: "押すたびにオンとオフが切り替わる", instead: "アクション/Toggle" },
				{ case: "並んだ選択肢から 1 つを選ぶ", instead: "アクション/ToggleGroup" },
			],
			dos: [
				"primary は 1 画面に 1 つにする。いちばん進めてほしい操作に使う",
				"取り消せない操作は danger にし、AlertDialog で確かめてから実行する",
				"送信するボタンには status を渡し、二重送信を防ぐ",
			],
			donts: [
				"primary を横に並べない。どれが主役か分からなくなる",
				"アイコンだけのボタンに名前を付け忘れない（aria-label）",
				"無効にした理由を見せずに、押せないままにしない",
			],
			copy: {
				rules: [
					"動詞で終える（保存する、送る）。名詞だけにしない",
					"何が起きるかが押す前に分かる言葉にする",
					"完了の文言は過去形にする（保存しました）",
				],
				examples: [
					{ good: "保存する", bad: "OK", note: "押すと何が起きるかが分かる" },
					{ good: "記録を消す", bad: "はい", note: "確かめる場面でも、操作の名前で答える" },
					{ good: "保存しました", bad: "保存が完了しました！", note: "短く、感嘆符を付けない" },
				],
			},
			keyboard: [
				["Tab", "ボタンにフォーカスを移す"],
				["Enter", "押す"],
				["Space", "押す"],
			],
			a11y: [
				"送信中は aria-busy が付き、押せなくなってもフォーカスは残る。スクリーンリーダーで状態が分かる",
				"完了の文言は、スクリーンリーダー向けの見えない欄（aria-live）でも知らせる",
				"アイコンだけのボタンには aria-label を付ける",
			],
			motion: [
				"hover で 1.02 倍に膨らみ、押すと 0.97 倍に沈む。離すと載る曲線（springs.land）で 12% 跳ね返ってから戻る",
				"メニューやポップオーバーを開くボタンは、大きさを変えない。ポップアップが一緒に揺れるため",
				"余熱: primary の hover の光は 120ms で出て、離れると 560ms かけて消える",
				"残り火: 送信中は幅が縮んでスピナーになり、完了で伸びてチェックマークが描かれ、右上の角の 1 点から火の粉が 6 つ飛ぶ。飛ぶ先と速さは毎回変わる",
				"動きを減らす設定では、拡大縮小と幅の補間をやめる",
			],
			related: [
				"アクション/Toggle",
				"アクション/ToggleGroup",
				"ナビゲーション/Link",
				"オーバーレイ/AlertDialog",
			],
		} satisfies ComponentDocs,
	},
	argTypes: {
		variant: { control: "inline-radio", options: ["primary", "secondary", "ghost", "danger", "link"] },
		size: { control: "inline-radio", options: ["sm", "md", "lg", "icon", "icon-sm"] },
	},
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

/** 主要な行動。hover で 1.02 倍に膨らんで光の影が付き、押すと沈み、離すと弾んで戻る */
export const Primary: Story = { name: "基本" };

export const Variants: Story = {
	name: "種類",
	render: (args) => (
		<div className="flex flex-wrap items-center gap-3">
			<Button {...args} variant="primary">
				保存する
			</Button>
			<Button {...args} variant="secondary">
				下書きに戻す
			</Button>
			<Button {...args} variant="ghost">
				キャンセル
			</Button>
			<Button {...args} variant="danger">
				<Trash2 />
				削除する
			</Button>
			<Button {...args} variant="link">
				詳しく見る
			</Button>
		</div>
	),
};

export const Sizes: Story = {
	name: "サイズ",
	render: (args) => (
		<div className="flex flex-wrap items-center gap-3">
			<Button {...args} size="sm">
				小
			</Button>
			<Button {...args} size="md">
				中（標準）
			</Button>
			<Button {...args} size="lg">
				大
			</Button>
			<Button {...args} size="icon" variant="secondary" aria-label="追加">
				<Plus />
			</Button>
			<Button {...args} size="icon-sm" variant="ghost" aria-label="追加">
				<Plus />
			</Button>
		</div>
	),
};

export const WithIcon: Story = {
	name: "アイコン付き",
	render: (args) => (
		<div className="flex flex-wrap items-center gap-3">
			<Button {...args}>
				<Flame />
				火を入れる
			</Button>
			<Button {...args} variant="secondary">
				次へ
				<ArrowRight />
			</Button>
		</div>
	),
};

/**
 * 残り火: 押すと送信中は幅が縮み、完了で伸びてチェックマークが描かれ、火の粉が舞い上がる。
 * 送信中から完了まで、1 つのボタンのまま幅と中身が変わる。
 */
export const Ember: Story = {
	name: "残り火（送信から完了まで）",
	render: (args) => <EmberDemo {...args} />,
};

function EmberDemo(args: React.ComponentProps<typeof Button>) {
	const [status, setStatus] = React.useState<ButtonStatus>("idle");
	const [labeled, setLabeled] = React.useState<ButtonStatus>("idle");
	const run = (set: (s: ButtonStatus) => void) => () => {
		set("loading");
		setTimeout(() => set("success"), 1400);
		setTimeout(() => set("idle"), 3200);
	};
	return (
		<div className="flex flex-wrap items-center gap-6">
			<Button {...args} status={status} successLabel="保存しました" onClick={run(setStatus)}>
				保存する
			</Button>
			<Button
				{...args}
				variant="secondary"
				status={labeled}
				loadingLabel="送信中"
				successLabel="送りました"
				onClick={run(setLabeled)}
			>
				<ArrowRight />
				送信する
			</Button>
		</div>
	);
}

/** 状態ごとの見た目。無効は 50% の濃さ、送信中はスピナーを出して押せなくする */
export const States: Story = {
	name: "状態",
	render: (args) => (
		<div className="grid grid-cols-[auto_repeat(3,max-content)] items-center gap-x-6 gap-y-3 text-sm text-fg-muted">
			<span />
			<span>通常</span>
			<span>無効</span>
			<span>送信中</span>
			{(["primary", "secondary", "ghost", "danger"] as const).map((variant) => (
				<div key={variant} className="contents">
					<span className="font-mono text-xs">{variant}</span>
					<Button {...args} variant={variant}>
						保存する
					</Button>
					<Button {...args} variant={variant} disabled>
						保存する
					</Button>
					<Button {...args} variant={variant} status="loading" loadingLabel="保存中">
						保存する
					</Button>
				</div>
			))}
		</div>
	),
};

/** キーボードで操作できることを確かめる。Tab でフォーカスし、Enter と Space で押せる */
export const KeyboardInteraction: Story = {
	name: "キーボード操作",
	play: async ({ args, canvas }) => {
		const button = canvas.getByRole("button", { name: "保存する" });
		await userEvent.tab();
		await expect(button).toHaveFocus();
		await userEvent.keyboard("{Enter}");
		await userEvent.keyboard(" ");
		await expect(args.onClick).toHaveBeenCalledTimes(2);
	},
};

/** 送信中は押しても反応しない。フォーカスは残るので、スクリーンリーダーで状態が分かる */
export const LoadingBlocksClick: Story = {
	name: "送信中は押せない",
	args: { status: "loading", loadingLabel: "保存中" },
	play: async ({ args, canvas }) => {
		const button = canvas.getByRole("button", { name: /保存中/ });
		await userEvent.click(button);
		await expect(args.onClick).not.toHaveBeenCalled();
		await expect(button).toHaveAttribute("aria-busy", "true");
	},
};

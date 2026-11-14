import type { Meta, StoryObj } from "@storybook/react-vite";
import * as React from "react";
import { expect, userEvent, waitFor } from "storybook/test";
import type { ComponentDocs } from "../spec";
import { Button } from "./button";
import { Progress } from "./progress";

const meta = {
	title: "コンポーネント/フィードバック/Progress",
	component: Progress,
	parameters: {
		takibi: {
			use: [
				"書き出しやアップロードなど、終わりが分かる処理の進み具合",
				"接続を待つなど、終わりが分からない処理を待っていることを見せる（value={null}）",
			],
			avoid: [
				{ case: "パスワードの強さや容量など、値を評価して見せる", instead: "フィードバック/Meter" },
				{ case: "手順のうちどこまで進んだかを見せる", instead: "データ表示/Steps" },
				{ case: "読み込み中の面の形を先に見せる", instead: "データ表示/Skeleton" },
			],
			dos: [
				"label で、何の処理かを書く。終わったら文言を完了の形に変える",
				"進み具合が分かるなら、value に割合を渡す",
			],
			donts: ["値を戻したり、止めたまま長く置いたりしない", "1 つの画面に何本も並べない"],
			copy: {
				rules: ["処理中は「〜しています」、終わったら過去形にする", "件数が分かるなら書く"],
				examples: [
					{ good: "3件をアップロードしています", bad: "処理中…", note: "何をしているかが分かる" },
					{ good: "アップロードしました", bad: "完了！", note: "過去形で、感嘆符を付けない" },
				],
			},
			a11y: [
				'role="progressbar" で、割合が aria-valuenow として読み上げられる',
				"label がそのまま名前になる。label を省くときは aria-label を付ける",
				"終わりが分からないときは aria-valuenow を持たない",
			],
			motion: [
				"線の長さは 600ms、ease-out-expo で伸びる",
				"導火線: 値が増えてから 700ms の間だけ、線の先端と周りが明るく光る。止まると 900ms かけて消える",
				"100% になった瞬間に 1 回だけ、ブランドカラーの光が線の外へ広がって消える（motion-flare、900ms）",
				"終わりが分からないときは、中央の線が幅 40%〜100% で伸び縮みしながら、2.4 秒周期で明るさを変える。動きを減らす設定では幅 70% で止める",
			],
			related: ["フィードバック/Meter", "データ表示/Steps", "データ表示/Skeleton"],
		} satisfies ComponentDocs,
	},
	args: { value: 40, label: "画像を書き出しています" },
	argTypes: {
		size: { control: "inline-radio", options: ["sm", "md"] },
		value: { control: { type: "range", min: 0, max: 100 } },
	},
	render: (args) => (
		<div className="w-80">
			<Progress {...args} />
		</div>
	),
} satisfies Meta<typeof Progress>;

export default meta;
type Story = StoryObj<typeof meta>;

/** 進み具合を線の長さで示す。ラベルがあると、右上に割合が出る */
export const Basic: Story = { name: "基本" };

function FuseDemo() {
	const [value, setValue] = React.useState(12);
	return (
		<div className="flex w-80 flex-col gap-4">
			<Progress value={value} label="ノートを書き出しています" />
			<div className="flex gap-2">
				<Button variant="secondary" size="sm" onClick={() => setValue((v) => Math.min(100, v + 18))}>
					進める
				</Button>
				<Button variant="ghost" size="sm" onClick={() => setValue(12)}>
					戻す
				</Button>
			</div>
		</div>
	);
}

/** 導火線: 線が伸びている間だけ先端が光り、止まると 900ms かけて消える。100% になった瞬間に 1 回だけ光が広がる */
export const Fuse: Story = { name: "導火線", render: () => <FuseDemo /> };

function UploadDemo() {
	const [value, setValue] = React.useState(0);
	React.useEffect(() => {
		if (value >= 100) return;
		const t = setTimeout(() => setValue((v) => Math.min(100, v + Math.round(6 + Math.random() * 14))), 900);
		return () => clearTimeout(t);
	}, [value]);
	return (
		<div className="flex w-80 flex-col gap-4">
			<Progress value={value} label={value >= 100 ? "アップロードしました" : "3件をアップロードしています"} />
			<Button variant="ghost" size="sm" className="self-start" onClick={() => setValue(0)}>
				もう一度
			</Button>
		</div>
	);
}

/** 実際のアップロードのように、間を空けて少しずつ進む。進むたびに先端が光り、待つ間に消える */
export const Upload: Story = { name: "アップロード", render: () => <UploadDemo /> };

/** 終わりが分からないとき。中央の線が伸び縮みしながら明るさを変える。左右に流れ続けるバーにはしない */
export const Indeterminate: Story = {
	name: "終わりが分からないとき",
	args: { value: null, label: "接続を待っています" },
};

/** sm は高さ 4px、md は 6px */
export const Sizes: Story = {
	name: "サイズ",
	render: (args) => (
		<div className="flex w-80 flex-col gap-6">
			<Progress {...args} size="sm" label="小" value={64} />
			<Progress {...args} size="md" label="中（標準）" value={64} />
		</div>
	),
};

/** 0%、途中、完了、終わりが分からない、ラベルなしの見た目 */
export const States: Story = {
	name: "状態",
	render: () => (
		<div className="flex w-80 flex-col gap-6">
			<Progress value={0} label="待機しています" />
			<Progress value={58} label="書き出しています" />
			<Progress value={100} label="完了しました" />
			<Progress value={null} label="準備しています" />
			<Progress value={30} aria-label="読み込みの進み具合" />
		</div>
	),
};

/** 値が増えると data-advancing が付いて先端が光り、700ms で外れる。割合は aria-valuenow でスクリーンリーダーにも伝わる */
export const Advancing: Story = {
	name: "先端の光と読み上げ",
	render: () => <FuseDemo />,
	play: async ({ canvas }) => {
		const bar = canvas.getByRole("progressbar");
		await expect(bar).toHaveAttribute("aria-valuenow", "12");
		await userEvent.click(canvas.getByRole("button", { name: "進める" }));
		await expect(bar).toHaveAttribute("aria-valuenow", "30");
		await expect(bar).toHaveAttribute("data-advancing");
		await waitFor(() => expect(bar).not.toHaveAttribute("data-advancing"), { timeout: 1500 });
	},
};

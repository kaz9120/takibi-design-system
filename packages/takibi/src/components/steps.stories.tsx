import type { Meta, StoryObj } from "@storybook/react-vite";
import * as React from "react";
import { expect, userEvent } from "storybook/test";
import type { ComponentDocs } from "../spec";
import { Button } from "./button";
import { Step, Steps } from "./steps";

const meta = {
	title: "コンポーネント/データ表示/Steps",
	component: Steps,
	args: { current: 1 },
	argTypes: {
		current: { control: { type: "range", min: 0, max: 4, step: 1 } },
		orientation: { control: "inline-radio", options: ["horizontal", "vertical"] },
	},
	parameters: {
		takibi: {
			use: ["登録や書き出しのように、段階に分かれた手続きで、今どこにいて、あといくつあるかを示す"],
			avoid: [
				{ case: "1 つの処理の進み具合", instead: "フィードバック/Progress" },
				{ case: "順に見る必要のない内容の切り替え", instead: "データ表示/Tabs" },
				{ case: "ページの階層を示す", instead: "ナビゲーション/Breadcrumbs" },
			],
			dos: [
				"段階は 4〜5 個までにする",
				'段階が多いときや説明が長いときは orientation="vertical" にする',
				"段階の名前は、その段階でする作業を短く書く",
			],
			donts: [
				"Steps を押して段階を移れるように見せない。このコンポーネントは表示だけで、押せない",
				"段階の数を途中で変えない",
			],
			copy: {
				rules: ["段階の名前は名詞か、短い動詞句にする（アカウント、画像を選ぶ）"],
			},
			a11y: [
				'今の段階に aria-current="step" が付く',
				"各段階の名前のあとに「完了」「進行中」「未着手」を読み上げる。色やアイコンだけに頼らない",
			],
			motion: [
				"導火線: 前の段階を終えると、つなぐ線が 420ms で伸び、伸びている間の 0.7 秒だけ先端に明るい点が出る",
				"線が伸びきってから（300ms 後）、次の丸がブランドカラーの薄い色になり、周りが淡く光る",
				"終えた丸は、番号が 0.5 倍に縮んで消え、チェックマークが線を描くように現れる（motion-draw）",
				"戻すと、線は 220ms で縮む。動きを減らす設定では、線は伸ばさずに切り替える",
			],
			related: ["フィードバック/Progress", "データ表示/Tabs", "フォーム/Form"],
		} satisfies ComponentDocs,
	},
	render: (args) => (
		<Steps {...args} className={args.orientation === "vertical" ? "w-72" : "w-[640px]"}>
			<Step title="アカウント" description="メールと名前" />
			<Step title="プラン" description="あとで変えられます" />
			<Step title="支払い" description="カードを登録" />
			<Step title="確認" />
		</Steps>
	),
} satisfies Meta<typeof Steps>;

export default meta;
type Story = StoryObj<typeof meta>;

/** 横に並べた基本の形。終えた段階にはチェックマークが付き、今の段階の丸はブランドカラーの薄い色になる */
export const Basic: Story = { name: "基本" };

/** 縦に並べる。段階の説明が長いときや、横幅が狭いときに使う */
export const Vertical: Story = { name: "縦に並べる", args: { orientation: "vertical", current: 2 } };

/** 始めたばかり、途中、すべて完了の見た目 */
export const States: Story = {
	name: "状態",
	render: (args) => (
		<div className="flex w-[640px] flex-col gap-10">
			{[0, 2, 4].map((current) => (
				<Steps key={current} {...args} current={current}>
					<Step title="アカウント" />
					<Step title="プラン" />
					<Step title="支払い" />
					<Step title="確認" />
				</Steps>
			))}
		</div>
	),
};

function FlowDemo({ orientation }: { orientation?: "horizontal" | "vertical" }) {
	const [current, setCurrent] = React.useState(0);
	return (
		<div className="flex flex-col gap-8">
			<Steps
				current={current}
				orientation={orientation}
				className={orientation === "vertical" ? "w-72" : "w-[640px]"}
			>
				<Step title="画像を選ぶ" description="1200 × 630 px" />
				<Step title="文字を入れる" description="40 文字まで" />
				<Step title="書き出す" description="PNG か JPEG" />
			</Steps>
			<div className="flex gap-2">
				<Button
					variant="secondary"
					size="sm"
					disabled={current === 0}
					onClick={() => setCurrent((c) => c - 1)}
				>
					戻る
				</Button>
				<Button size="sm" disabled={current === 3} onClick={() => setCurrent((c) => c + 1)}>
					{current >= 2 ? "完了する" : "次へ"}
				</Button>
			</div>
		</div>
	);
}

/** 進めると、先端に明るい点を付けた線が次の段階へ伸び、伸びきってから次の丸の色が変わる。戻すと線は速く縮む */
export const Flow: Story = { name: "段階を進める", render: () => <FlowDemo /> };

/** 縦に並べた形で、段階を進める */
export const VerticalFlow: Story = {
	name: "縦で段階を進める",
	render: () => <FlowDemo orientation="vertical" />,
};

/** 今の段階は aria-current="step" を持ち、スクリーンリーダーでは段階ごとに「完了」「進行中」「未着手」を伝える */
export const Accessibility: Story = {
	name: "読み上げ",
	render: () => <FlowDemo />,
	play: async ({ canvas }) => {
		const items = canvas.getAllByRole("listitem");
		await expect(items[0]).toHaveAttribute("aria-current", "step");
		await expect(items[0]).toHaveTextContent("進行中");
		const next = canvas.getByRole("button", { name: "次へ" });
		next.focus();
		await userEvent.keyboard("{Enter}");
		await expect(items[0]).toHaveTextContent("完了");
		await expect(items[1]).toHaveAttribute("aria-current", "step");
		await expect(items[2]).toHaveTextContent("未着手");
	},
};

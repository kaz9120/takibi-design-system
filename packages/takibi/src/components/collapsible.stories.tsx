import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, userEvent, waitFor } from "storybook/test";
import type { ComponentDocs } from "../spec";
import { Button } from "./button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "./collapsible";

const meta = {
	title: "コンポーネント/データ表示/Collapsible",
	component: Collapsible,
	parameters: {
		takibi: {
			use: [
				"詳しい設定や補足のように、普段は隠しておける内容",
				"一覧の最初の数件だけを見せ、「すべて見る」で残りを開く",
			],
			avoid: [
				{ case: "見出しが複数並ぶ", instead: "データ表示/Accordion" },
				{ case: "押したそばに小さな補足を浮かせる", instead: "オーバーレイ/Popover" },
			],
			dos: [
				"ボタンの文言で、開くと何が見えるかを伝える",
				"ボタンを Button に差し替えたときは、showIcon を false にする",
				"ページ内検索で見つけてほしい中身には hiddenUntilFound を渡す",
			],
			donts: ["エラーや注意など、必ず読んでほしい内容をたたまない"],
			copy: {
				rules: ["何が開くかを名詞で書く（詳しい設定）", "文言を切り替えるときは、開閉で対にする"],
				examples: [
					{ good: "すべて見る / たたむ", bad: "もっと / 閉じる", note: "何が起きるかが分かる対にする" },
				],
			},
			keyboard: [
				["Tab", "開け閉めするボタンにフォーカスを移す"],
				["Enter", "開く、閉じる"],
				["Space", "開く、閉じる"],
			],
			a11y: ["ボタンは、開いているかどうかを aria-expanded で読み上げる"],
			motion: [
				"中身は高さ 0 から伸び、閉じるときも同じ曲線で縮む（motion-fold、spring-glide の 330ms）",
				"ボタンは押すと 0.97 倍に縮み（motion-press）、矢印は開くと 180 度回る（spring-press の 460ms）",
			],
			related: ["データ表示/Accordion", "オーバーレイ/Popover"],
		} satisfies ComponentDocs,
	},
} satisfies Meta<typeof Collapsible>;

export default meta;
type Story = StoryObj<typeof meta>;

/** 押すと中身が高さ 0 から伸びて開き、もう一度押すと同じ曲線で縮む */
export const Basic: Story = {
	name: "基本",
	render: (args) => (
		<Collapsible className="max-w-md" {...args}>
			<CollapsibleTrigger>詳しい設定</CollapsibleTrigger>
			<CollapsibleContent>
				<ul className="flex flex-col gap-1.5">
					<li>書き出しの形式: Markdown</li>
					<li>下書きの保存: 30 秒ごと</li>
					<li>公開の範囲: 自分だけ</li>
				</ul>
			</CollapsibleContent>
		</Collapsible>
	),
};

/** 状態の一覧。閉じている、開いている、無効 */
export const States: Story = {
	name: "状態",
	render: () => (
		<div className="flex max-w-md flex-col gap-6">
			<Collapsible>
				<CollapsibleTrigger>閉じている</CollapsibleTrigger>
				<CollapsibleContent>押すと開く</CollapsibleContent>
			</Collapsible>
			<Collapsible defaultOpen>
				<CollapsibleTrigger>開いている</CollapsibleTrigger>
				<CollapsibleContent>矢印が上を向き、中身が見える</CollapsibleContent>
			</Collapsible>
			<Collapsible disabled>
				<CollapsibleTrigger>無効（押せない）</CollapsibleTrigger>
				<CollapsibleContent>表示されない</CollapsibleContent>
			</Collapsible>
		</div>
	),
};

/** 開け閉めするボタンを Button に差し替える。文言も状態に合わせて変える */
export const CustomTrigger: Story = {
	name: "ボタンを差し替える",
	render: () => (
		<Collapsible className="max-w-md gap-2">
			<p className="text-sm text-fg">最近の焚き火を 3 件だけ出しています</p>
			<CollapsibleContent className="pt-0">
				<ul className="flex flex-col gap-1.5 pb-2">
					<li>11 月 3 日 · 奥多摩</li>
					<li>10 月 27 日 · 道志</li>
					<li>10 月 20 日 · 丹沢</li>
				</ul>
			</CollapsibleContent>
			<CollapsibleTrigger
				showIcon={false}
				render={<Button variant="secondary" size="sm" />}
				className="mx-0 self-start"
			>
				<span className="group-data-panel-open:hidden">すべて見る</span>
				<span className="hidden group-data-panel-open:inline">たたむ</span>
			</CollapsibleTrigger>
		</Collapsible>
	),
};

/** Tab でボタンに移り、Enter と Space で開け閉めする */
export const KeyboardInteraction: Story = {
	...Basic,
	name: "キーボード操作",
	play: async ({ canvas }) => {
		const trigger = canvas.getByRole("button", { name: "詳しい設定" });
		await userEvent.tab();
		await expect(trigger).toHaveFocus();
		await expect(trigger).toHaveAttribute("aria-expanded", "false");

		await userEvent.keyboard("{Enter}");
		await expect(trigger).toHaveAttribute("aria-expanded", "true");
		await waitFor(() => expect(canvas.getByText("下書きの保存: 30 秒ごと")).toBeVisible());

		await userEvent.keyboard(" ");
		await expect(trigger).toHaveAttribute("aria-expanded", "false");
		await waitFor(() => expect(canvas.queryByText("下書きの保存: 30 秒ごと")).not.toBeInTheDocument());
	},
};

import type { Meta, StoryObj } from "@storybook/react-vite";
import { Bell, Download, Flame, MoreHorizontal, Palette } from "lucide-react";
import { expect, fn, userEvent } from "storybook/test";
import type { ComponentDocs } from "../spec";
import { Button } from "./button";
import {
	InteractiveList,
	InteractiveListItem,
	List,
	ListItem,
	ListItemButton,
	ListItemChevron,
	ListItemDescription,
	ListItemLeading,
	ListItemText,
	ListItemTitle,
	ListItemTrailing,
} from "./list";
import { Switch } from "./switch";

const meta = {
	title: "コンポーネント/データ表示/List",
	component: List,
	argTypes: {
		variant: { control: "inline-radio", options: ["unordered", "ordered", "plain"] },
	},
	parameters: {
		takibi: {
			summary: "文章の中の箇条書き（List）と、押せる行の並び（InteractiveList）。",
			use: [
				"文章の中の箇条書き。手順など順番に意味があるときは ordered にする",
				"設定の一覧や記録の一覧のように、行ごとに移動や操作がある並び（InteractiveList）",
			],
			avoid: [
				{ case: "複数の列で比べる", instead: "データ表示/Table" },
				{ case: "項目名と値の組", instead: "データ表示/DescriptionList" },
				{ case: "ページの間を移るナビゲーション", instead: "ナビゲーション/NavList" },
			],
			dos: [
				'行を押してほかの画面へ移るときは、ListItemButton に render={<a href="…" />} を渡す',
				"移動する行には ListItemChevron を付ける",
				"行の中の別の操作は ListItemTrailing に置く。押しても行は縮まない",
			],
			donts: [
				"InteractiveList に押せない行だけを並べない。その場合は List にする",
				"1 行に操作を詰め込まない。右端の操作は 1〜2 個にする",
			],
			keyboard: [
				["Tab", "次の行へ移る。右端の操作があれば、その操作へも移る"],
				["Enter", "行の操作を実行する"],
			],
			a11y: [
				"List は ul、ordered は ol で組むので、項目の数が読み上げられる",
				"無効の行は aria-disabled が付き、フォーカスは残る",
				"右端のアイコンだけのボタンには aria-label を付ける",
			],
			motion: [
				"行は hover で背景の色が付き（120ms）、押すと 0.98 倍に縮み、離すと載る曲線（ease-land）で戻る",
				"移動する行の矢印は、hover で右へ 2px 寄る（ease-pop）",
			],
			related: [
				"データ表示/Table",
				"データ表示/DescriptionList",
				"データ表示/Card",
				"ナビゲーション/NavList",
			],
		} satisfies ComponentDocs,
	},
} satisfies Meta<typeof List>;

export default meta;
type Story = StoryObj<typeof meta>;

/** 文章の中の箇条書き。マーカーは控えめな点にする */
export const Basic: Story = {
	name: "基本",
	args: { variant: "unordered" },
	render: (args) => (
		<List className="max-w-prose" {...args}>
			<ListItem>焚き付けは細い枝と松ぼっくり</ListItem>
			<ListItem>薪は広葉樹を親指、手首、腕の太さで 3 種類</ListItem>
			<ListItem>水を入れたバケツを手元に</ListItem>
		</List>
	),
};

/** 種類の一覧。手順には ordered を使う */
export const Variants: Story = {
	name: "種類",
	render: () => (
		<div className="grid max-w-3xl gap-8 sm:grid-cols-3">
			{(["unordered", "ordered", "plain"] as const).map((variant) => (
				<div key={variant} className="flex flex-col gap-2">
					<span className="text-sm text-fg-muted">{variant}</span>
					<List variant={variant}>
						<ListItem>焚き付けを組む</ListItem>
						<ListItem>下から火を入れる</ListItem>
						<ListItem>細い薪から足す</ListItem>
					</List>
				</div>
			))}
		</div>
	),
};

const rows = [
	{ icon: Bell, title: "通知", description: "完了と失敗だけを知らせる" },
	{ icon: Palette, title: "表示", description: "夜の配色、文字の大きさ" },
	{ icon: Download, title: "書き出し", description: "Markdown と JSON" },
];

/** 押せる行の並び。hover で背景の色が付き、押すと行全体が 0.98 倍に縮む。右の矢印は hover で右へ寄る */
export const Interactive: Story = {
	name: "押せる行",
	render: () => (
		<InteractiveList className="max-w-sm">
			{rows.map(({ icon: Icon, title, description }) => (
				<InteractiveListItem key={title}>
					<ListItemButton render={<a href={`#${title}`} />}>
						<ListItemLeading>
							<Icon />
						</ListItemLeading>
						<ListItemText>
							<ListItemTitle>{title}</ListItemTitle>
							<ListItemDescription>{description}</ListItemDescription>
						</ListItemText>
						<ListItemChevron />
					</ListItemButton>
				</InteractiveListItem>
			))}
		</InteractiveList>
	),
};

/** 右端に操作を置く。右端のスイッチやボタンを押しても、行は縮まない */
export const WithTrailingActions: Story = {
	name: "右端の操作",
	render: () => (
		<InteractiveList className="max-w-sm">
			<InteractiveListItem>
				<ListItemButton>
					<ListItemLeading>
						<Flame />
					</ListItemLeading>
					<ListItemText>
						<ListItemTitle>11 月 3 日 · 奥多摩</ListItemTitle>
						<ListItemDescription>2 時間 10 分</ListItemDescription>
					</ListItemText>
				</ListItemButton>
				<ListItemTrailing>
					<Button variant="ghost" size="icon-sm" aria-label="ほかの操作">
						<MoreHorizontal />
					</Button>
				</ListItemTrailing>
			</InteractiveListItem>
			<InteractiveListItem>
				<ListItemButton>
					<ListItemText>
						<ListItemTitle>火の粉を舞わせる</ListItemTitle>
						<ListItemDescription>完了したときに数個だけ散る</ListItemDescription>
					</ListItemText>
				</ListItemButton>
				<ListItemTrailing>
					<Switch defaultChecked aria-label="火の粉を舞わせる" />
				</ListItemTrailing>
			</InteractiveListItem>
			<InteractiveListItem>
				<ListItemButton>
					<ListItemText>
						<ListItemTitle>書き出しの形式</ListItemTitle>
					</ListItemText>
				</ListItemButton>
				<ListItemTrailing>Markdown</ListItemTrailing>
			</InteractiveListItem>
		</InteractiveList>
	),
};

/** 状態の一覧。通常、無効 */
export const States: Story = {
	name: "状態",
	render: () => (
		<InteractiveList className="max-w-sm">
			<InteractiveListItem>
				<ListItemButton>
					<ListItemText>
						<ListItemTitle>通常</ListItemTitle>
						<ListItemDescription>hover で背景が付き、押すと縮む</ListItemDescription>
					</ListItemText>
					<ListItemChevron />
				</ListItemButton>
			</InteractiveListItem>
			<InteractiveListItem>
				<ListItemButton disabled>
					<ListItemText>
						<ListItemTitle>無効</ListItemTitle>
						<ListItemDescription>押しても何も起きない</ListItemDescription>
					</ListItemText>
					<ListItemChevron />
				</ListItemButton>
			</InteractiveListItem>
		</InteractiveList>
	),
};

const onSelect = fn();

/** Tab で行から行へ移り、Enter で選ぶ */
export const KeyboardInteraction: Story = {
	name: "キーボード操作",
	render: () => (
		<InteractiveList className="max-w-sm">
			{["通知", "表示"].map((title) => (
				<InteractiveListItem key={title}>
					<ListItemButton onClick={() => onSelect(title)}>
						<ListItemText>
							<ListItemTitle>{title}</ListItemTitle>
						</ListItemText>
						<ListItemChevron />
					</ListItemButton>
				</InteractiveListItem>
			))}
		</InteractiveList>
	),
	play: async ({ canvas }) => {
		onSelect.mockClear();
		await userEvent.tab();
		await expect(canvas.getByRole("button", { name: "通知" })).toHaveFocus();
		await userEvent.tab();
		const second = canvas.getByRole("button", { name: "表示" });
		await expect(second).toHaveFocus();
		await userEvent.keyboard("{Enter}");
		await expect(onSelect).toHaveBeenCalledWith("表示");
	},
};

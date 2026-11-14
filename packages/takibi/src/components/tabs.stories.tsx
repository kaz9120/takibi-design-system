import type { Meta, StoryObj } from "@storybook/react-vite";
import { Activity, Flame, Settings } from "lucide-react";
import { expect, userEvent } from "storybook/test";
import type { ComponentDocs } from "../spec";
import { Tabs, TabsIndicator, TabsList, TabsPanel, TabsTab } from "./tabs";

const meta = {
	title: "コンポーネント/データ表示/Tabs",
	component: Tabs,
	parameters: {
		takibi: {
			use: ["概要、活動、設定のように、並列の内容を同じ場所で切り替える"],
			avoid: [
				{ case: "順に進む手順", instead: "データ表示/Steps" },
				{ case: "表示の形式など、値を 1 つ選ぶ", instead: "アクション/ToggleGroup" },
				{ case: "別のページへ移る", instead: "ナビゲーション/NavList" },
				{ case: "複数の内容を同時に開いておきたい", instead: "データ表示/Accordion" },
			],
			dos: ["TabsList の中に TabsIndicator を 1 つ置き、選択中の下線を出す", "タブの名前は短い名詞にする"],
			donts: [
				"タブを 1 行に収まらないほど並べない",
				"タブの中にさらにタブを入れない",
				"タブを切り替えたら保存される、のように操作を兼ねさせない",
			],
			copy: {
				rules: ["名詞で短く書く（概要、活動、設定）", "並んだタブの言葉の長さと種類をそろえる"],
			},
			keyboard: [
				["Tab", "選択中のタブにフォーカスを移す"],
				["→ / ←", "隣のタブへフォーカスを移す。端から先は反対の端へ戻る"],
				["Enter", "フォーカスしているタブを開く"],
				["Space", "フォーカスしているタブを開く"],
			],
			a11y: [
				"タブは tab、中身は tabpanel として読み上げられ、選択中のタブに aria-selected が付く",
				"矢印キーで移っただけでは開かない。開くのは Enter か Space を押したとき",
			],
			motion: [
				"炎の舌: 下線は、進む側の端が先に 160ms で伸び、反対の端が 330ms（spring-glide）で追いつく",
				"中身は、選んだタブの側から 8px 寄りながら現れる（motion-scene、330ms）",
				"タブの文字と背景の色は、hover で 120ms かけて変わる",
			],
			related: [
				"データ表示/Accordion",
				"データ表示/Steps",
				"アクション/ToggleGroup",
				"ナビゲーション/NavList",
			],
		} satisfies ComponentDocs,
	},
} satisfies Meta<typeof Tabs>;

export default meta;
type Story = StoryObj<typeof meta>;

/** 炎の舌: 下線は進む側の端が先に伸び、反対の端があとから追いつく。中身は選んだ側から寄ってくる */
export const Basic: Story = {
	name: "基本",
	render: () => (
		<Tabs defaultValue="overview" className="max-w-lg">
			<TabsList>
				<TabsTab value="overview">概要</TabsTab>
				<TabsTab value="activity">活動</TabsTab>
				<TabsTab value="settings">設定</TabsTab>
				<TabsTab value="members">参加している人</TabsTab>
				<TabsIndicator />
			</TabsList>
			<TabsPanel value="overview">火を入れて 12 日。記録は 48 件あります。</TabsPanel>
			<TabsPanel value="members">3 人が参加しています</TabsPanel>
			<TabsPanel value="activity">きのう 3 件の記録を足しました。</TabsPanel>
			<TabsPanel value="settings">名前、公開の範囲、通知を変えられます</TabsPanel>
		</Tabs>
	),
};

/** アイコン付きのタブと、無効のタブ */
export const States: Story = {
	name: "状態",
	render: () => (
		<Tabs defaultValue="ember" className="max-w-lg">
			<TabsList>
				<TabsTab value="ember">
					<Flame />
					選択中
				</TabsTab>
				<TabsTab value="activity">
					<Activity />
					通常
				</TabsTab>
				<TabsTab value="settings" disabled>
					<Settings />
					無効
				</TabsTab>
				<TabsIndicator />
			</TabsList>
			<TabsPanel value="ember">選択中のタブは文字が濃くなり、下線が付く</TabsPanel>
			<TabsPanel value="activity">hover すると文字が少し濃くなる</TabsPanel>
			<TabsPanel value="settings">無効のタブは選べない</TabsPanel>
		</Tabs>
	),
};

/** 矢印キーでタブを移り、Enter で開く。端から先は反対の端へ戻る */
export const KeyboardNavigation: Story = {
	...Basic,
	name: "キーボード操作",
	play: async ({ canvas }) => {
		const overview = canvas.getByRole("tab", { name: "概要" });
		const activity = canvas.getByRole("tab", { name: "活動" });
		const last = canvas.getByRole("tab", { name: "参加している人" });
		await userEvent.tab();
		await expect(overview).toHaveFocus();

		await userEvent.keyboard("{ArrowRight}");
		await expect(activity).toHaveFocus();
		await userEvent.keyboard("{Enter}");
		await expect(activity).toHaveAttribute("aria-selected", "true");
		await expect(await canvas.findByRole("tabpanel", { name: "活動" })).toHaveTextContent(
			"きのう 3 件の記録を足しました。",
		);

		await userEvent.keyboard("{ArrowLeft}{ArrowLeft}");
		await expect(last).toHaveFocus();
	},
};

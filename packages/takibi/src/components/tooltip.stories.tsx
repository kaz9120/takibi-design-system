import type { Meta, StoryObj } from "@storybook/react-vite";
import { Bold, Italic, Underline } from "lucide-react";
import { expect, screen, userEvent, waitFor } from "storybook/test";
import type { ComponentDocs } from "../spec";
import { Button } from "./button";
import { Tooltip, TooltipContent, TooltipTrigger } from "./tooltip";

const meta = {
	title: "コンポーネント/オーバーレイ/Tooltip",
	component: TooltipContent,
	parameters: {
		takibi: {
			use: ["アイコンだけのボタンに、操作の名前を見せる", "操作にショートカットキーがあることを知らせる"],
			avoid: [
				{ case: "知らないと操作できない説明", instead: "基本/Text" },
				{ case: "押せる要素や、長い説明を中に置く", instead: "オーバーレイ/Popover" },
				{ case: "リンク先の中身を見せる", instead: "オーバーレイ/PreviewCard" },
			],
			dos: [
				"文言は 1 行の名詞か動詞で短く書く",
				"アイコンだけのボタンでは、aria-label と同じ文言にする",
				"アプリの最上位に TooltipProvider を 1 つ置く",
			],
			donts: [
				"欠かせない情報を入れない。タッチ環境では hover できず、見えない",
				"中にボタンやリンクを置かない。ポインターを動かすと閉じて押せない",
			],
			copy: {
				rules: ["句点を付けない", "ボタンの名前と同じ言葉で書く"],
				examples: [{ good: "太字", bad: "テキストを太字にします。", note: "名前だけで足りる" }],
			},
			keyboard: [
				["Tab", "トリガーにフォーカスすると出る"],
				["Esc", "閉じる"],
			],
			a11y: [
				"中身はスクリーンリーダーに結び付かない。トリガーには、中身と同じ文言の aria-label を付ける",
				"キーボードでフォーカスしたときも、hover と同じように出る",
			],
			motion: [
				"トリガーの側から 4px 寄りながら、0.94 倍から等倍へ、ばね（spring-soft）で現れる（motion-rise）",
				"1 つ目は 400ms 待ってから出る。続けて隣のトリガーへ移ると、待たずに動きなしで切り替わる",
				"閉じるときは 150ms（ease-out-expo）で縮んで消える",
			],
			related: ["オーバーレイ/Popover", "オーバーレイ/PreviewCard", "アクション/Toolbar", "データ表示/Kbd"],
		} satisfies ComponentDocs,
	},
} satisfies Meta<typeof TooltipContent>;

export default meta;
type Story = StoryObj<typeof meta>;

/** hover かフォーカスで、操作の名前とショートカットが上に出る */
export const Basic: Story = {
	name: "ショートカット付き",
	render: () => (
		<Tooltip>
			<TooltipTrigger render={<Button variant="secondary" size="icon" aria-label="太字" />}>
				<Bold />
			</TooltipTrigger>
			<TooltipContent>
				太字
				<kbd className="rounded-sm bg-surface-sunken px-1.5 font-mono text-xs text-fg-muted">⌘B</kbd>
			</TooltipContent>
		</Tooltip>
	),
};

/** 1 つ目は 400ms 待って出る。続けて隣に移ると、待たずに切り替わる */
export const Group: Story = {
	name: "並んだボタン",
	render: () => (
		<div className="flex gap-1">
			{[
				{ label: "太字", icon: <Bold /> },
				{ label: "斜体", icon: <Italic /> },
				{ label: "下線", icon: <Underline /> },
			].map(({ label, icon }) => (
				<Tooltip key={label}>
					<TooltipTrigger render={<Button variant="ghost" size="icon" aria-label={label} />}>
						{icon}
					</TooltipTrigger>
					<TooltipContent>{label}</TooltipContent>
				</Tooltip>
			))}
		</div>
	),
};

/** キーボードでフォーカスしても出る */
export const OnFocus: Story = {
	...Basic,
	name: "フォーカスで出る",
	play: async () => {
		await userEvent.tab();
		await waitFor(() =>
			expect(
				screen.getByText("太字", { selector: "[data-slot=tooltip-content] *, [data-slot=tooltip-content]" }),
			).toBeVisible(),
		);
	},
};

import type { Meta, StoryObj } from "@storybook/react-vite";
import { Command } from "lucide-react";
import type { ComponentDocs } from "../spec";
import { Kbd, KbdGroup } from "./kbd";

const meta = {
	title: "コンポーネント/データ表示/Kbd",
	component: Kbd,
	args: { children: "Esc" },
	parameters: {
		takibi: {
			use: ["ショートカットの案内", "メニューの項目の右端に、同じ操作のキーを添える"],
			avoid: [
				{ case: "状態や分類のラベル", instead: "データ表示/Badge" },
				{ case: "押せるボタン", instead: "アクション/Button" },
			],
			dos: [
				"同時に押すキーは KbdGroup でまとめる",
				"キーの名前は、キーボードに刻まれた表記に合わせる（Esc、Shift、⌘）",
			],
			donts: ["Kbd を押せるようにしない", "キーの案内でない語を Kbd で囲まない"],
			a11y: [
				"kbd 要素なので、キーボードの入力として意味が伝わる",
				"アイコンだけのキーには、アクセシブルネーム用の名前（aria-label など）を付ける",
			],
			related: ["データ表示/Badge", "オーバーレイ/Menu", "オーバーレイ/Command"],
		} satisfies ComponentDocs,
	},
} satisfies Meta<typeof Kbd>;

export default meta;
type Story = StoryObj<typeof meta>;

/** 1 つのキー */
export const Basic: Story = { name: "基本" };

/** 同時に押すキーは KbdGroup でまとめる。記号のキーはアイコンでもよい */
export const Combination: Story = {
	name: "組み合わせ",
	render: () => (
		<div className="flex flex-col items-start gap-3 text-sm text-fg-muted">
			<KbdGroup>
				<Kbd>⌘</Kbd>
				<Kbd>K</Kbd>
			</KbdGroup>
			<KbdGroup>
				<Kbd>
					<Command />
				</Kbd>
				<Kbd>Shift</Kbd>
				<Kbd>P</Kbd>
			</KbdGroup>
		</div>
	),
};

/** 文の中で使う */
export const InText: Story = {
	name: "文の中",
	render: () => (
		<p className="text-sm text-fg-muted">
			<KbdGroup>
				<Kbd>⌘</Kbd>
				<Kbd>K</Kbd>
			</KbdGroup>{" "}
			で検索を開き、<Kbd>Esc</Kbd> で閉じる。
		</p>
	),
};

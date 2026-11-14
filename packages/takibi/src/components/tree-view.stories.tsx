import type { Meta, StoryObj } from "@storybook/react-vite";
import { FileCode2, FileImage, FileText } from "lucide-react";
import { useState } from "react";
import { expect, userEvent } from "storybook/test";
import type { ComponentDocs } from "../spec";
import { type TreeNode, TreeView } from "./tree-view";

const meta = {
	title: "コンポーネント/ナビゲーション/TreeView",
	component: TreeView,
	parameters: {
		takibi: {
			use: ["フォルダとファイルのように、入れ子になった項目を開閉しながらたどる"],
			avoid: [
				{ case: "入れ子が 1 段だけのナビゲーション", instead: "ナビゲーション/NavList" },
				{ case: "見出しごとに中身を開閉する", instead: "データ表示/Accordion" },
			],
			dos: [
				"ツリーには aria-label で名前を付ける",
				"label が文字列でないときは textValue を渡し、文字を打って探せるようにする",
				"選べない項目は disabled にする",
			],
			donts: ["入れ子を深くしすぎない。4 段を超えるなら分け方を見直す", "項目の中にボタンや入力欄を置かない"],
			keyboard: [
				["Tab", "ツリーに入る。最後に触った項目か、選んでいる項目にフォーカスが移る"],
				["↓ / ↑", "次の項目、前の項目へ移る"],
				["→", "閉じた親項目を開く。開いた親項目では最初の子へ移る"],
				["←", "開いた親項目を閉じる。閉じた親項目や子がない項目では親へ移る"],
				["Home / End", "最初の項目、最後の項目へ移る"],
				["Enter", "選ぶ。親項目なら開閉もする"],
				["Space", "選ぶ"],
				["*", "同じ階層の親項目をすべて開く"],
				["文字", "その文字で始まる項目へ移る"],
			],
			a11y: [
				'role="tree" と treeitem で組み、階層、位置、開閉、選択の状態が読み上げられる',
				"フォーカスが当たるのはツリーの中で 1 項目だけで、矢印キーで動かす",
				"無効の項目には aria-disabled が付き、選べない",
			],
			motion: [
				"親項目を開くと、矢印が 90 度回り（springs.snappy）、子の一覧の高さが広がってフェードインする（springs.glide、200ms）",
				"閉じるときは、180ms、ease-out-expo で高さがたたまれる",
				"選んだ項目の背景（ブランドカラーの薄い色）は、前の項目から滑って移る（springs.glide）。動きを減らす設定では動かさない",
			],
			related: ["ナビゲーション/NavList", "データ表示/Accordion", "データ表示/Collapsible"],
		} satisfies ComponentDocs,
	},
} satisfies Meta<typeof TreeView>;

export default meta;
type Story = StoryObj<typeof meta>;

const files: TreeNode[] = [
	{
		id: "src",
		label: "src",
		children: [
			{
				id: "components",
				label: "components",
				children: [
					{ id: "button", label: "button.tsx", icon: <FileCode2 /> },
					{ id: "tabs", label: "tabs.tsx", icon: <FileCode2 /> },
					{ id: "tree-view", label: "tree-view.tsx", icon: <FileCode2 /> },
				],
			},
			{
				id: "lib",
				label: "lib",
				children: [
					{ id: "motion", label: "motion.ts", icon: <FileCode2 /> },
					{ id: "theme", label: "theme.ts", icon: <FileCode2 /> },
				],
			},
			{ id: "tokens", label: "tokens.css", icon: <FileCode2 /> },
		],
	},
	{
		id: "assets",
		label: "assets",
		children: [
			{ id: "logo", label: "logo.svg", icon: <FileImage /> },
			{ id: "empty", label: "空のフォルダ", children: [] },
		],
	},
	{ id: "readme", label: "README.md", icon: <FileText /> },
	{ id: "lock", label: "bun.lock", disabled: true },
];

/** フォルダを押すと、矢印が回って中身が下へ広がる。選んだ項目の背景は、次の項目へ滑って移る */
export const Basic: Story = {
	name: "基本",
	args: {
		items: files,
		defaultExpanded: ["src", "components"],
		defaultSelected: "tabs",
		"aria-label": "ファイル",
	},
	render: (args) => <TreeView {...args} className="w-72" />,
};

/** 開いている項目と選んでいる項目を、外から渡す */
export const Controlled: Story = {
	name: "開閉と選択を外から操作",
	args: { items: files, "aria-label": "ファイル" },
	render: function Render(args) {
		const [expanded, setExpanded] = useState<string[]>(["assets"]);
		const [selected, setSelected] = useState<string | null>("logo");
		return (
			<div className="flex gap-8">
				<TreeView
					{...args}
					className="w-72"
					expanded={expanded}
					onExpandedChange={setExpanded}
					selected={selected}
					onSelectedChange={setSelected}
				/>
				<dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-sm">
					<dt className="text-fg-muted">開いている</dt>
					<dd className="text-fg">{expanded.join("、") || "なし"}</dd>
					<dt className="text-fg-muted">選んでいる</dt>
					<dd className="text-fg">{selected ?? "なし"}</dd>
				</dl>
			</div>
		);
	},
};

/** 選択中、通常（hover で背景が明るくなる）、無効、空のフォルダ */
export const States: Story = {
	name: "状態",
	args: {
		items: [
			{ id: "a", label: "選択中", icon: <FileText /> },
			{ id: "b", label: "通常", icon: <FileText /> },
			{ id: "c", label: "無効", icon: <FileText />, disabled: true },
			{ id: "d", label: "空のフォルダ", children: [] },
		],
		defaultSelected: "a",
		"aria-label": "状態の例",
	},
	render: (args) => <TreeView {...args} className="w-60" />,
};

/**
 * 上下で移り、右で開いて子へ進み、左で閉じて親へ戻る。Home と End で端へ、
 * Enter で選ぶ。文字を打つと、その文字で始まる項目へ移る
 */
export const KeyboardNavigation: Story = {
	name: "キーボード操作",
	args: { items: files, defaultExpanded: ["src"], "aria-label": "ファイル" },
	render: (args) => <TreeView {...args} className="w-72" />,
	play: async ({ canvas }) => {
		const item = (name: string) => canvas.getByRole("treeitem", { name: new RegExp(`^${name}`) });
		await userEvent.tab();
		await expect(item("src")).toHaveFocus();
		await userEvent.keyboard("{ArrowDown}");
		await expect(item("components")).toHaveFocus();
		await expect(item("components")).toHaveAttribute("aria-expanded", "false");
		await userEvent.keyboard("{ArrowRight}");
		await expect(item("components")).toHaveAttribute("aria-expanded", "true");
		await userEvent.keyboard("{ArrowRight}");
		await expect(item("button.tsx")).toHaveFocus();
		await userEvent.keyboard("{Enter}");
		await expect(item("button.tsx")).toHaveAttribute("aria-selected", "true");
		await userEvent.keyboard("{ArrowLeft}");
		await expect(item("components")).toHaveFocus();
		await userEvent.keyboard("{ArrowLeft}");
		await expect(item("components")).toHaveAttribute("aria-expanded", "false");
		await userEvent.keyboard("{End}");
		await expect(item("bun.lock")).toHaveFocus();
		await userEvent.keyboard("{Home}");
		await expect(item("src")).toHaveFocus();
		await userEvent.keyboard("r");
		await expect(item("README.md")).toHaveFocus();
	},
};

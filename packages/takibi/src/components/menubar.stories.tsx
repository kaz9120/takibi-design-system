import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { expect, screen, userEvent, waitFor } from "storybook/test";
import type { ComponentDocs } from "../spec";
import {
	MenuCheckboxItem,
	MenuItem,
	MenuRadioGroup,
	MenuRadioItem,
	MenuSeparator,
	MenuShortcut,
	MenuSub,
	MenuSubContent,
	MenuSubTrigger,
} from "./menu";
import { Menubar, MenubarContent, MenubarMenu, MenubarTrigger } from "./menubar";

const meta = {
	title: "コンポーネント/オーバーレイ/Menubar",
	component: Menubar,
	parameters: {
		takibi: {
			use: ["編集の道具など、操作の多いアプリの上に、ファイル・編集・表示のようなメニューを並べる"],
			avoid: [
				{ case: "操作が 1 つのボタンにまとまる", instead: "オーバーレイ/Menu" },
				{ case: "ページを移動するリンクを並べる", instead: "ナビゲーション/NavigationMenu" },
				{ case: "よく使う操作をアイコンで並べる", instead: "アクション/Toolbar" },
			],
			dos: [
				"メニューの名前は、中の操作をまとめる名詞にする（ファイル、編集）",
				"メニューバーには aria-label を付ける",
				"中の項目には Menu のコンポーネント（MenuItem、MenuSub など）を使う",
			],
			donts: [
				"ウェブサイトのナビゲーションに使わない",
				"並べるメニューを増やしすぎない。名前を見渡せる数にする",
			],
			keyboard: [
				["Tab", "メニューバーに入る。メニューバーの中は 1 つの Tab 位置になる"],
				["← →", "トリガーを移る。開いている間は、隣のメニューを開く"],
				["Home / End", "最初の / 最後のトリガーへ移る"],
				["↓", "メニューを開いて、最初の項目へ移る"],
				["Enter", "メニューを開く。項目では選んで閉じる"],
				["Esc", "閉じて、トリガーにフォーカスを戻す"],
			],
			a11y: ["role は menubar、トリガーは menuitem になる", "無効のメニューは灰色になり、開けない"],
			motion: [
				"開いているトリガーの下に面が敷かれ、隣へ移ると面がばね（springs.glide）で滑って移る",
				"1 つ開いたあとに隣へ移るときは、中身が動きなしですぐ切り替わる。最初に開くときは motion-rise で現れる",
				"サブメニューへ斜めに向かう途中で減速しても閉じない",
			],
			related: ["オーバーレイ/Menu", "オーバーレイ/ContextMenu", "アクション/Toolbar"],
		} satisfies ComponentDocs,
	},
} satisfies Meta<typeof Menubar>;

export default meta;
type Story = StoryObj<typeof meta>;

function AppMenubar() {
	const [grid, setGrid] = useState(true);
	const [zoom, setZoom] = useState("fit");
	const [last, setLast] = useState("なし");
	return (
		<div className="flex flex-col items-start gap-3">
			<Menubar aria-label="snapcrop のメニュー">
				<MenubarMenu>
					<MenubarTrigger>ファイル</MenubarTrigger>
					<MenubarContent>
						<MenuItem onClick={() => setLast("開く")}>
							開く
							<MenuShortcut>⌘O</MenuShortcut>
						</MenuItem>
						<MenuItem onClick={() => setLast("貼り付けて始める")}>
							貼り付けて始める
							<MenuShortcut>⌘V</MenuShortcut>
						</MenuItem>
						<MenuSeparator />
						<MenuSub>
							<MenuSubTrigger>書き出す</MenuSubTrigger>
							<MenuSubContent>
								<MenuItem onClick={() => setLast("PNG")}>PNG</MenuItem>
								<MenuItem onClick={() => setLast("JPEG")}>JPEG</MenuItem>
								<MenuItem onClick={() => setLast("WebP")}>WebP</MenuItem>
							</MenuSubContent>
						</MenuSub>
					</MenubarContent>
				</MenubarMenu>
				<MenubarMenu>
					<MenubarTrigger>編集</MenubarTrigger>
					<MenubarContent>
						<MenuItem onClick={() => setLast("元に戻す")}>
							元に戻す
							<MenuShortcut>⌘Z</MenuShortcut>
						</MenuItem>
						<MenuItem onClick={() => setLast("やり直す")}>
							やり直す
							<MenuShortcut>⇧⌘Z</MenuShortcut>
						</MenuItem>
						<MenuSeparator />
						<MenuItem disabled>切り抜きを解除</MenuItem>
					</MenubarContent>
				</MenubarMenu>
				<MenubarMenu>
					<MenubarTrigger>表示</MenubarTrigger>
					<MenubarContent>
						<MenuCheckboxItem checked={grid} onCheckedChange={setGrid}>
							グリッド
						</MenuCheckboxItem>
						<MenuSeparator />
						<MenuRadioGroup value={zoom} onValueChange={setZoom}>
							<MenuRadioItem value="fit">画面に合わせる</MenuRadioItem>
							<MenuRadioItem value="100">100%</MenuRadioItem>
							<MenuRadioItem value="200">200%</MenuRadioItem>
						</MenuRadioGroup>
					</MenubarContent>
				</MenubarMenu>
				<MenubarMenu disabled>
					<MenubarTrigger>共有</MenubarTrigger>
				</MenubarMenu>
			</Menubar>
			<p className="text-sm text-fg-muted">最後に選んだ項目: {last}</p>
		</div>
	);
}

/**
 * 1 つ開いたあとは、hover だけで隣のメニューへ移れる。移るときは中身がすぐ切り替わり、
 * 開いているトリガーの下の面だけが滑って移る
 */
export const Basic: Story = {
	name: "基本",
	render: () => <AppMenubar />,
};

/** Tab でメニューバーに入り、左右の矢印で項目を移る。下矢印で開き、開いたまま左右で隣のメニューへ移る */
export const KeyboardNavigation: Story = {
	name: "キーボード操作",
	render: () => <AppMenubar />,
	play: async ({ canvas }) => {
		const file = canvas.getByRole("menuitem", { name: "ファイル" });
		const edit = canvas.getByRole("menuitem", { name: "編集" });
		await userEvent.tab();
		await expect(file).toHaveFocus();
		await userEvent.keyboard("{ArrowRight}");
		await expect(edit).toHaveFocus();
		await userEvent.keyboard("{ArrowDown}");
		const undo = await screen.findByRole("menuitem", { name: /元に戻す/ });
		await waitFor(() => expect(undo).toHaveFocus());
		await userEvent.keyboard("{Enter}");
		await waitFor(() => expect(canvas.getByText("最後に選んだ項目: 元に戻す")).toBeInTheDocument());
		await waitFor(() => expect(edit).toHaveFocus());
	},
};

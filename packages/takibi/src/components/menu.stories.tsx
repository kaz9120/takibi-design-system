import type { Meta, StoryObj } from "@storybook/react-vite";
import { ChevronDown, Copy, Ellipsis, Pencil, Share2, Trash2 } from "lucide-react";
import { useState } from "react";
import { expect, screen, userEvent, waitFor } from "storybook/test";
import type { ComponentDocs } from "../spec";
import { Button } from "./button";
import {
	Menu,
	MenuCheckboxItem,
	MenuContent,
	MenuGroup,
	MenuGroupLabel,
	MenuItem,
	MenuRadioGroup,
	MenuRadioItem,
	MenuSeparator,
	MenuShortcut,
	MenuSub,
	MenuSubContent,
	MenuSubTrigger,
	MenuTrigger,
} from "./menu";

const meta = {
	title: "コンポーネント/オーバーレイ/Menu",
	component: MenuContent,
	parameters: {
		takibi: {
			use: [
				"ボタンから、名前の変更や複製など、対象への操作の一覧を開く",
				"表示の切り替えや並べ方など、その場で効く選択をまとめる",
			],
			avoid: [
				{ case: "フォームで値を 1 つ選ぶ", instead: "フォーム/Select" },
				{ case: "ページを移るためのリンクを並べる", instead: "ナビゲーション/NavigationMenu" },
				{ case: "操作を名前で探して実行する", instead: "オーバーレイ/Command" },
				{ case: "押した場所に開く", instead: "オーバーレイ/ContextMenu" },
			],
			dos: [
				"項目は動詞で書き、よく使う順に並べる",
				'削除など取り消せない操作は variant="danger" にし、区切り線のあとの末尾に置く',
				"サブメニューは MenuSub で組む",
				"MenuShortcut は表示だけなので、キーの割り当てはアプリ側で行う",
			],
			donts: [
				"サブメニューの中に、さらにサブメニューを入れない",
				"Base UI の SubmenuRoot を直に使わない。斜めに向かう途中で減速しただけで閉じる",
				"項目を 1 つだけのメニューにしない。ボタンにする",
			],
			copy: {
				rules: ["項目は動詞で終える（名前を変える）"],
				examples: [{ good: "複製する", bad: "複製", note: "押すと何が起きるかが分かる" }],
			},
			keyboard: [
				["Enter", "トリガーで開く。項目では選んで閉じる"],
				["Space", "トリガーで開く。項目では選んで閉じる"],
				["↑ ↓", "項目を移る。端まで行くと反対の端へ戻る"],
				["Home / End", "最初の / 最後の項目へ移る"],
				["文字キー", "その文字で始まる項目へ移る"],
				["→", "サブメニューを開いて、中へ移る"],
				["←", "サブメニューを閉じて、親の項目へ戻る"],
				["Esc", "閉じて、開いたボタンにフォーカスを戻す"],
			],
			a11y: [
				"role は menu、項目は menuitem になる。チェックとラジオの項目は、選んだ状態も読み上げられる",
				"無効の項目は灰色になり、選べない",
				"アイコンだけのトリガーには aria-label を付ける",
			],
			motion: [
				"ボタンの側から 4px 寄りながら、0.94 倍から等倍へ、はぜる曲線（ease-pop）で現れる（motion-rise）。閉じるときは 150ms で消える",
				"選んでいる項目の背景は、項目から項目へ揺れる曲線（springs.sway）で滑って移る",
				"サブメニューへ斜めに向かう途中で減速しても閉じない。項目を出た点とサブメニューの手前の辺で作る三角形の中にいる間は開いたままにし、300ms 近づかなければ閉じる",
				"開いたボタンは大きさを変えない。ポップアップが一緒に揺れるため",
			],
			related: [
				"オーバーレイ/ContextMenu",
				"オーバーレイ/Menubar",
				"フォーム/Select",
				"オーバーレイ/Command",
				"アクション/Toolbar",
			],
		} satisfies ComponentDocs,
	},
} satisfies Meta<typeof MenuContent>;

export default meta;
type Story = StoryObj<typeof meta>;

function BasicMenu() {
	const [last, setLast] = useState("なし");
	return (
		<div className="flex flex-col items-start gap-3">
			<Menu>
				<MenuTrigger render={<Button variant="secondary" />}>
					操作
					<ChevronDown />
				</MenuTrigger>
				<MenuContent>
					<MenuItem onClick={() => setLast("名前を変える")}>
						<Pencil />
						名前を変える
						<MenuShortcut>F2</MenuShortcut>
					</MenuItem>
					<MenuItem onClick={() => setLast("複製する")}>
						<Copy />
						複製する
						<MenuShortcut>⌘D</MenuShortcut>
					</MenuItem>
					<MenuItem disabled>
						<Share2 />
						共有する
					</MenuItem>
					<MenuSeparator />
					<MenuItem variant="danger" onClick={() => setLast("削除する")}>
						<Trash2 />
						削除する
						<MenuShortcut>⌘⌫</MenuShortcut>
					</MenuItem>
				</MenuContent>
			</Menu>
			<p className="text-sm text-fg-muted">最後に選んだ項目: {last}</p>
		</div>
	);
}

/** 項目、ショートカット、無効の項目、取り消せない操作。指している項目は背景の色で示す */
export const Basic: Story = {
	name: "基本",
	render: () => <BasicMenu />,
};

function CheckboxAndRadioMenu() {
	const [showGrid, setShowGrid] = useState(true);
	const [showRuler, setShowRuler] = useState(false);
	const [sort, setSort] = useState("updated");
	return (
		<Menu>
			<MenuTrigger render={<Button variant="secondary" />}>
				表示
				<ChevronDown />
			</MenuTrigger>
			<MenuContent>
				<MenuGroup>
					<MenuGroupLabel>表示するもの</MenuGroupLabel>
					<MenuCheckboxItem checked={showGrid} onCheckedChange={setShowGrid}>
						グリッド
					</MenuCheckboxItem>
					<MenuCheckboxItem checked={showRuler} onCheckedChange={setShowRuler}>
						ルーラー
					</MenuCheckboxItem>
				</MenuGroup>
				<MenuSeparator />
				<MenuGroup>
					<MenuGroupLabel>並べ方</MenuGroupLabel>
					<MenuRadioGroup value={sort} onValueChange={setSort}>
						<MenuRadioItem value="updated">更新した順</MenuRadioItem>
						<MenuRadioItem value="created">作った順</MenuRadioItem>
						<MenuRadioItem value="name">名前の順</MenuRadioItem>
					</MenuRadioGroup>
				</MenuGroup>
			</MenuContent>
		</Menu>
	);
}

/** チェックとラジオの項目。選んでもメニューは閉じない */
export const CheckboxAndRadio: Story = {
	name: "チェックとラジオ",
	render: () => <CheckboxAndRadioMenu />,
};

/** サブメニュー。右矢印か hover で開き、左矢印で親に戻る。斜めに向かう途中で減速しても閉じない */
export const Submenu: Story = {
	name: "サブメニュー",
	render: () => (
		<Menu>
			<MenuTrigger render={<Button variant="ghost" size="icon" aria-label="その他の操作" />}>
				<Ellipsis />
			</MenuTrigger>
			<MenuContent>
				<MenuItem>
					<Pencil />
					名前を変える
				</MenuItem>
				<MenuSub>
					<MenuSubTrigger>
						<Share2 />
						共有
					</MenuSubTrigger>
					<MenuSubContent>
						<MenuItem>リンクをコピーする</MenuItem>
						<MenuItem>メールで送る</MenuItem>
						<MenuItem>Slack に送る</MenuItem>
					</MenuSubContent>
				</MenuSub>
				<MenuSeparator />
				<MenuItem variant="danger">
					<Trash2 />
					削除する
				</MenuItem>
			</MenuContent>
		</Menu>
	),
};

/** Enter で開き、矢印で移って Enter で選ぶ。閉じると開いたボタンにフォーカスが戻る */
export const KeyboardNavigation: Story = {
	...Basic,
	name: "キーボード操作",
	play: async ({ canvas }) => {
		const trigger = canvas.getByRole("button", { name: "操作" });
		await userEvent.tab();
		await expect(trigger).toHaveFocus();
		await userEvent.keyboard("{Enter}");
		const first = await screen.findByRole("menuitem", { name: /名前を変える/ });
		await waitFor(() => expect(first).toHaveFocus());

		await userEvent.keyboard("{ArrowDown}");
		await expect(screen.getByRole("menuitem", { name: /複製する/ })).toHaveFocus();
		await userEvent.keyboard("{Enter}");

		await waitFor(() => expect(screen.queryByRole("menu")).not.toBeInTheDocument());
		await expect(canvas.getByText("最後に選んだ項目: 複製する")).toBeInTheDocument();
		await expect(trigger).toHaveFocus();
	},
};

import type { Meta, StoryObj } from "@storybook/react-vite";
import { ClipboardPaste, Copy, Crop, Scissors, Trash2 } from "lucide-react";
import { useState } from "react";
import { expect, screen, userEvent, waitFor } from "storybook/test";
import type { ComponentDocs } from "../spec";
import { ContextMenu, ContextMenuContent, ContextMenuTrigger } from "./context-menu";
import {
	MenuCheckboxItem,
	MenuGroup,
	MenuGroupLabel,
	MenuItem,
	MenuSeparator,
	MenuShortcut,
	MenuSub,
	MenuSubContent,
	MenuSubTrigger,
} from "./menu";

const meta = {
	title: "コンポーネント/オーバーレイ/ContextMenu",
	component: ContextMenuContent,
	parameters: {
		takibi: {
			summary: "右クリックや長押しで、押した場所に開く操作の一覧。",
			use: [
				"キャンバスや一覧の行など、対象に直接触れて操作する場面",
				"よく使う操作を、ポインターの近くで手早く選ばせる",
			],
			avoid: [
				{ case: "そこでしかできない操作を置く", instead: "オーバーレイ/Menu" },
				{ case: "アプリ全体の操作を並べる", instead: "オーバーレイ/Menubar" },
			],
			dos: [
				"同じ操作を、ボタンやメニューからも行えるようにする",
				"項目には Menu のコンポーネント（MenuItem、MenuSeparator など）を使う",
				"押した対象に関係のある操作だけを並べる",
			],
			donts: [
				"右クリックでしかできない操作を作らない。見つけにくく、キーボードでは開きにくい",
				"範囲を画面全体に広げない。ブラウザの右クリックメニュー（コピーなど）が使えなくなる",
			],
			keyboard: [
				["↑ ↓", "項目を移る。端まで行くと反対の端へ戻る"],
				["Home / End", "最初の / 最後の項目へ移る"],
				["Enter", "選んで閉じる"],
				["→ / ←", "サブメニューを開く / 閉じる"],
				["Esc", "閉じる"],
			],
			a11y: [
				"開いたあとのメニューは、Menu と同じく role は menu、項目は menuitem になる",
				"タッチ環境では 500ms の長押しで開く",
			],
			motion: [
				"押した点から 4px 寄りながら、0.94 倍から等倍へ、ばね（spring-soft）で現れる（motion-rise）",
				"開いている間は、右クリックを受ける範囲の枠線が 200ms で濃くなる",
				"選んでいる項目の背景は、項目から項目へ滑って移る。サブメニューへ斜めに向かう途中で減速しても閉じない",
			],
			related: ["オーバーレイ/Menu", "オーバーレイ/Menubar"],
		} satisfies ComponentDocs,
	},
} satisfies Meta<typeof ContextMenuContent>;

export default meta;
type Story = StoryObj<typeof meta>;

function Canvas() {
	const [last, setLast] = useState("なし");
	const [snap, setSnap] = useState(true);
	return (
		<div className="flex flex-col items-start gap-3">
			<ContextMenu>
				<ContextMenuTrigger
					aria-label="キャンバス"
					className={
						"flex aspect-video w-96 items-center justify-center rounded-lg border border-dashed border-line bg-surface-sunken text-sm text-fg-muted " +
						"bg-[radial-gradient(var(--color-line-subtle)_1px,transparent_1px)] bg-size-[16px_16px]"
					}
				>
					ここで右クリック
				</ContextMenuTrigger>
				<ContextMenuContent>
					<MenuItem onClick={() => setLast("切り抜く")}>
						<Crop />
						ここで切り抜く
						<MenuShortcut>C</MenuShortcut>
					</MenuItem>
					<MenuItem onClick={() => setLast("コピー")}>
						<Copy />
						コピー
						<MenuShortcut>⌘C</MenuShortcut>
					</MenuItem>
					<MenuItem disabled>
						<ClipboardPaste />
						貼り付け
						<MenuShortcut>⌘V</MenuShortcut>
					</MenuItem>
					<MenuSeparator />
					<MenuGroup>
						<MenuGroupLabel>表示</MenuGroupLabel>
						<MenuCheckboxItem checked={snap} onCheckedChange={setSnap}>
							端に吸い付ける
						</MenuCheckboxItem>
					</MenuGroup>
					<MenuSub>
						<MenuSubTrigger inset>比率をそろえる</MenuSubTrigger>
						<MenuSubContent>
							<MenuItem onClick={() => setLast("16:9")}>16:9</MenuItem>
							<MenuItem onClick={() => setLast("4:3")}>4:3</MenuItem>
							<MenuItem onClick={() => setLast("1:1")}>1:1</MenuItem>
						</MenuSubContent>
					</MenuSub>
					<MenuSeparator />
					<MenuItem variant="danger" onClick={() => setLast("消す")}>
						<Trash2 />
						選んだ範囲を消す
						<MenuShortcut>⌫</MenuShortcut>
					</MenuItem>
				</ContextMenuContent>
			</ContextMenu>
			<p className="text-sm text-fg-muted">最後に選んだ項目: {last}</p>
		</div>
	);
}

/** 右クリックした点から、メニューが大きくなって開く。開いている間は、範囲の枠線が少し濃くなる */
export const Basic: Story = {
	name: "キャンバス",
	render: () => <Canvas />,
};

/** 一覧の行のように、小さな範囲に付けたもの */
export const OnRow: Story = {
	name: "一覧の行",
	render: () => (
		<ul className="flex w-80 flex-col gap-1">
			{["screenshot-0412.png", "screenshot-0413.png"].map((name) => (
				<li key={name}>
					<ContextMenu>
						<ContextMenuTrigger className="flex h-10 items-center gap-2 rounded-md border border-transparent px-3 text-sm text-fg hover:bg-surface-hover">
							<Scissors className="size-4 text-fg-muted" />
							{name}
						</ContextMenuTrigger>
						<ContextMenuContent>
							<MenuItem>開く</MenuItem>
							<MenuItem>名前を変える</MenuItem>
							<MenuSeparator />
							<MenuItem variant="danger">消す</MenuItem>
						</ContextMenuContent>
					</ContextMenu>
				</li>
			))}
		</ul>
	),
};

/** 右クリックで開き、矢印で移って Enter で選ぶ。選ぶとメニューは閉じる */
export const KeyboardInMenu: Story = {
	name: "メニューの中のキーボード操作",
	render: () => <Canvas />,
	play: async ({ canvas }) => {
		const area = canvas.getByText("ここで右クリック");
		await userEvent.pointer({ keys: "[MouseRight]", target: area });
		const menu = await screen.findByRole("menu");
		await waitFor(() => expect(menu).toBeVisible());
		await userEvent.keyboard("{ArrowDown}");
		await waitFor(() => expect(screen.getByRole("menuitem", { name: /ここで切り抜く/ })).toHaveFocus());
		await userEvent.keyboard("{ArrowDown}");
		await expect(screen.getByRole("menuitem", { name: /コピー/ })).toHaveFocus();
		await userEvent.keyboard("{Enter}");
		await waitFor(() => expect(screen.queryByRole("menu")).not.toBeInTheDocument());
		await expect(canvas.getByText("最後に選んだ項目: コピー")).toBeInTheDocument();
	},
};

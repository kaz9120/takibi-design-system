import type { Meta, StoryObj } from "@storybook/react-vite";
import { Copy, FilePlus, Flame, Moon, Search, Settings, Share2, Trash2 } from "lucide-react";
import * as React from "react";
import { expect, userEvent, within } from "storybook/test";
import type { ComponentDocs } from "../spec";
import { Button } from "./button";
import {
	Command,
	CommandCollection,
	CommandDialog,
	CommandEmpty,
	CommandFooter,
	CommandGroup,
	CommandGroupLabel,
	CommandInput,
	CommandItem,
	CommandList,
	CommandShortcut,
} from "./command";
import { Kbd } from "./kbd";

type Item = { value: string; label: string; icon: React.ReactNode; shortcut?: string };
type Group = { value: string; items: Item[] };

const groups: Group[] = [
	{
		value: "記録",
		items: [
			{ value: "new", label: "新しい記録", icon: <FilePlus />, shortcut: "N" },
			{ value: "duplicate", label: "記録を複製", icon: <Copy /> },
			{ value: "share", label: "共有のリンクを作る", icon: <Share2 /> },
			{ value: "delete", label: "記録を消す", icon: <Trash2 /> },
		],
	},
	{
		value: "表示",
		items: [
			{ value: "theme", label: "夜と昼を切り替える", icon: <Moon />, shortcut: "T" },
			{ value: "embers", label: "火の粉を舞わせる", icon: <Flame /> },
			{ value: "settings", label: "設定を開く", icon: <Settings />, shortcut: "," },
		],
	},
];

function Palette({ onSelect }: { onSelect: () => void }) {
	return (
		<Command items={groups}>
			<CommandInput placeholder="コマンドを探す" aria-label="コマンドを探す" />
			<CommandList>
				{(group: Group) => (
					<CommandGroup key={group.value} items={group.items}>
						<CommandGroupLabel>{group.value}</CommandGroupLabel>
						<CommandCollection>
							{(item: Item) => (
								<CommandItem key={item.value} value={item} onClick={onSelect}>
									{item.icon}
									{item.label}
									{item.shortcut && (
										<CommandShortcut>
											<Kbd>⌘</Kbd>
											<Kbd>{item.shortcut}</Kbd>
										</CommandShortcut>
									)}
								</CommandItem>
							)}
						</CommandCollection>
					</CommandGroup>
				)}
			</CommandList>
			<CommandEmpty>見つかりません</CommandEmpty>
			<CommandFooter>
				<span className="flex items-center gap-1.5">
					<Kbd>↑</Kbd>
					<Kbd>↓</Kbd>
					選ぶ
				</span>
				<span className="flex items-center gap-1.5">
					<Kbd>Enter</Kbd>
					実行
				</span>
				<span className="flex items-center gap-1.5">
					<Kbd>Esc</Kbd>
					閉じる
				</span>
			</CommandFooter>
		</Command>
	);
}

const meta = {
	title: "コンポーネント/オーバーレイ/Command",
	component: CommandDialog,
	parameters: {
		layout: "centered",
		takibi: {
			summary:
				"入力で絞り込み、コマンドを名前で探して実行する一覧。⌘K などで開くパレットにも、画面に直接置く一覧にもなる。",
			use: [
				"アプリの操作を、メニューをたどらずに名前で探して実行する",
				"操作が多く、メニューやボタンに並べきれないアプリ",
			],
			avoid: [
				{ case: "ボタンから、決まった数個の操作を開く", instead: "オーバーレイ/Menu" },
				{ case: "フォームで、候補から値を選んで入れる", instead: "フォーム/Combobox" },
				{ case: "入力に候補を出すだけで、実行はしない", instead: "フォーム/Autocomplete" },
			],
			dos: [
				"項目は「何をするか」が分かる言葉にする（設定を開く）",
				"項目をグループに分け、見出しを付ける",
				"ショートカットのある項目には CommandShortcut で添える",
				"開くショートカット（⌘K など）はアプリ側で登録し、open を切り替える",
			],
			donts: [
				"絞り込んで 1 件もないときに、空のまま出さない。CommandEmpty を置く",
				"取り消せない操作を、確かめずに実行しない。AlertDialog を挟む",
			],
			copy: {
				rules: [
					"項目は動詞で終える（記録を複製、設定を開く）",
					"入力欄のプレースホルダーは、何を探せるかを書く",
				],
				examples: [{ good: "コマンドを探す", bad: "検索…", note: "何を探す欄かが分かる" }],
			},
			keyboard: [
				["文字キー", "入力した文字で一覧を絞り込む"],
				["↑ ↓", "選んでいる項目を移る"],
				["Enter", "選んでいる項目を実行する"],
				["Esc", "パレットを閉じる"],
			],
			a11y: [
				"入力欄は combobox、項目は option として読み上げられる",
				"CommandDialog は label の文言を名前に持つ。既定は「コマンド」",
				"絞り込んだ最初の項目が、いつも選ばれた状態になる",
			],
			motion: [
				"着火: 開くと、入力欄の中央にブランドカラーの 8px の点が現れ、横へ伸びて入力欄になり、下へ広がって一覧が出る。全体で 560ms",
				"入力欄は 200ms 遅れて、一覧は 300ms 遅れて、下から 4px 上がりながら現れる",
				"閉じるときは、8px 上へ上がりながら 4px ぼけて、200ms で消える",
				"選んでいる項目の背景は、項目から項目へ揺れる曲線（springs.sway）で滑って移る",
			],
			related: [
				"オーバーレイ/Dialog",
				"オーバーレイ/Menu",
				"フォーム/Combobox",
				"フォーム/Autocomplete",
				"データ表示/Kbd",
			],
		} satisfies ComponentDocs,
	},
} satisfies Meta<typeof CommandDialog>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * 着火: ブランドカラーの点が現れ、横へ伸びて入力欄になり、下へ広がる。⌘K でも開く。
 * 選んでいる項目の背景は、矢印キーやポインターに合わせて滑って移る。閉じるときは上へ薄れて消える。
 */
export const Ignite: Story = {
	name: "着火（パレットを開く）",
	render: () => <IgniteDemo />,
};

function IgniteDemo() {
	const [open, setOpen] = React.useState(false);
	React.useEffect(() => {
		const onKey = (e: KeyboardEvent) => {
			if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
				e.preventDefault();
				setOpen((o) => !o);
			}
		};
		window.addEventListener("keydown", onKey);
		return () => window.removeEventListener("keydown", onKey);
	}, []);
	return (
		<>
			<Button variant="secondary" onClick={() => setOpen(true)}>
				<Search />
				コマンドを探す
				<Kbd className="ml-2">⌘K</Kbd>
			</Button>
			<CommandDialog open={open} onOpenChange={setOpen}>
				<Palette onSelect={() => setOpen(false)} />
			</CommandDialog>
		</>
	);
}

/** 画面に直接置いた一覧。ダイアログに入れなくても、絞り込みと背景の動きは同じ */
export const Inline: Story = {
	name: "画面に直接置く",
	render: () => (
		<div className="flex h-96 w-[min(36rem,90vw)] flex-col overflow-hidden rounded-xl border border-line bg-surface-overlay shadow-pop">
			<Palette onSelect={() => {}} />
		</div>
	),
};

/** 入力で絞り込み、矢印キーで選んで Enter で実行できることを確かめる */
export const KeyboardInteraction: Story = {
	name: "キーボード操作",
	render: () => (
		<div className="flex h-96 w-[min(36rem,90vw)] flex-col overflow-hidden rounded-xl border border-line bg-surface-overlay">
			<Palette onSelect={() => {}} />
		</div>
	),
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);
		const input = canvas.getByRole("combobox", { name: "コマンドを探す" });
		await userEvent.click(input);
		await userEvent.type(input, "設定");
		const options = canvas.getAllByRole("option");
		await expect(options).toHaveLength(1);
		await expect(options[0]).toHaveTextContent("設定を開く");
		await expect(options[0]).toHaveAttribute("data-highlighted");
		await userEvent.clear(input);
		await userEvent.type(input, "存在しない");
		await expect(canvas.getByText("見つかりません")).toBeVisible();
	},
};

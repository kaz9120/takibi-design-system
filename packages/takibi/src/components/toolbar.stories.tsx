import type { Meta, StoryObj } from "@storybook/react-vite";
import {
	ArrowUpRight,
	Bold,
	Crop,
	Download,
	Italic,
	Minus,
	MousePointer2,
	Pencil,
	Plus,
	Redo2,
	Square,
	Type,
	Underline,
	Undo2,
} from "lucide-react";
import { useState } from "react";
import { expect, userEvent } from "storybook/test";
import type { ComponentDocs } from "../spec";
import { Kbd } from "./kbd";
import { Menu, MenuContent, MenuItem, MenuTrigger } from "./menu";
import {
	Toolbar,
	ToolbarButton,
	ToolbarGroup,
	ToolbarSeparator,
	ToolbarText,
	ToolbarToggleGroup,
	ToolbarToggleItem,
} from "./toolbar";

const meta = {
	title: "コンポーネント/アクション/Toolbar",
	component: Toolbar,
	parameters: {
		takibi: {
			use: [
				"文字の書式や履歴など、編集の操作を 1 列にまとめる",
				"キャンバスの横に縦のツールバーを置き、使うツールを選ばせる",
			],
			avoid: [
				{ case: "アプリ全体のメニューを並べる", instead: "オーバーレイ/Menubar" },
				{ case: "オン・オフの選択だけを並べる", instead: "アクション/ToggleGroup" },
				{ case: "フォームの送信と取り消し", instead: "アクション/Button" },
			],
			dos: [
				"ツールバーには aria-label を付ける",
				"関係のある項目を ToolbarGroup でまとめ、ToolbarSeparator で区切る",
				"アイコンだけのボタンには tooltip を渡し、aria-label と同じ文言にする",
				'縦に並べるときは orientation="vertical" にする',
			],
			donts: [
				"アイコンの意味が伝わりにくい操作を、アイコンだけにしない。文字を添える",
				"よく使わない操作まで並べない。メニューにまとめる",
			],
			keyboard: [
				[
					"Tab",
					"ツールバーに入る。ツールバーの中は 1 つの Tab 位置になり、もう一度押すとツールバーの外へ出る",
				],
				["← →", "項目間を移動する（横並び）。端まで行くと反対の端へ戻る"],
				["↑ ↓", "項目間を移動する（縦並び）"],
				["Enter", "ボタンを押す。トグルではオン・オフを切り替える"],
				["Space", "ボタンを押す。トグルではオン・オフを切り替える"],
			],
			a11y: [
				"role は toolbar になり、aria-label がツールバーの名前として読み上げられる",
				"無効の項目にもフォーカスは止まる。何があるかをスクリーンリーダーで確かめられる",
				"tooltip は見た目だけなので、アイコンだけのボタンには aria-label を必ず付ける",
			],
			motion: [
				"アイコンだけのボタンは押すと 0.92 倍、文字を含むボタンは 0.97 倍に沈み、離すとばねで戻る",
				"メニューを開くボタンは大きさを変えない。ポップアップが一緒に揺れるため",
				"ツールグループでは、選択インジケーターが進む側の辺から伸びて移る（炎の舌）",
			],
			related: [
				"アクション/ToggleGroup",
				"アクション/Toggle",
				"オーバーレイ/Menu",
				"オーバーレイ/Tooltip",
				"オーバーレイ/Menubar",
			],
		} satisfies ComponentDocs,
	},
} satisfies Meta<typeof Toolbar>;

export default meta;
type Story = StoryObj<typeof meta>;

/** 枠のあるツールバー。左右の矢印で項目間を移動する。書式のトグル、履歴のボタン、メニューを開くボタンを並べている */
export const Basic: Story = {
	name: "基本",
	render: () => (
		<Toolbar variant="outline" aria-label="文字の書式">
			<ToolbarToggleGroup multiple defaultValue={["bold"]} aria-label="文字の装飾">
				<ToolbarToggleItem value="bold" aria-label="太字">
					<Bold />
				</ToolbarToggleItem>
				<ToolbarToggleItem value="italic" aria-label="斜体">
					<Italic />
				</ToolbarToggleItem>
				<ToolbarToggleItem value="underline" aria-label="下線">
					<Underline />
				</ToolbarToggleItem>
			</ToolbarToggleGroup>
			<ToolbarSeparator />
			<ToolbarGroup aria-label="履歴">
				<ToolbarButton aria-label="元に戻す" tooltip="元に戻す">
					<Undo2 />
				</ToolbarButton>
				<ToolbarButton aria-label="やり直す" tooltip="やり直す" disabled>
					<Redo2 />
				</ToolbarButton>
			</ToolbarGroup>
			<ToolbarSeparator />
			<Menu>
				<ToolbarButton size="md" render={<MenuTrigger />}>
					書き出す
				</ToolbarButton>
				<MenuContent>
					<MenuItem>PNG</MenuItem>
					<MenuItem>JPEG</MenuItem>
				</MenuContent>
			</Menu>
		</Toolbar>
	),
};

/** 種類の一覧。flat はバーの中に、outline は面の上に、floating はキャンバスに浮かべる */
export const Variants: Story = {
	name: "種類",
	render: () => (
		<div className="flex flex-col items-start gap-6">
			{(["flat", "outline", "floating"] as const).map((variant) => (
				<div key={variant} className="flex items-center gap-4">
					<span className="w-16 text-xs text-fg-muted">{variant}</span>
					<Toolbar variant={variant} aria-label={`${variant} の例`}>
						<ToolbarButton aria-label="元に戻す">
							<Undo2 />
						</ToolbarButton>
						<ToolbarButton aria-label="やり直す">
							<Redo2 />
						</ToolbarButton>
						<ToolbarSeparator />
						<ToolbarButton size="md">
							<Download />
							書き出す
						</ToolbarButton>
					</Toolbar>
				</div>
			))}
		</div>
	),
};

const tools = [
	{ value: "select", label: "選ぶ", key: "V", icon: <MousePointer2 /> },
	{ value: "crop", label: "切り抜く", key: "C", icon: <Crop /> },
	{ value: "pen", label: "ペン", key: "P", icon: <Pencil /> },
	{ value: "arrow", label: "矢印", key: "A", icon: <ArrowUpRight /> },
	{ value: "rect", label: "四角", key: "R", icon: <Square /> },
	{ value: "text", label: "文字", key: "T", icon: <Type /> },
];

function SnapcropCanvas() {
	const [tool, setTool] = useState("crop");
	const [zoom, setZoom] = useState(100);
	const label = tools.find((t) => t.value === tool)?.label;
	return (
		<div className="relative flex h-[26rem] w-[44rem] gap-4 overflow-hidden rounded-xl border border-line-subtle bg-surface-sunken p-3">
			<Toolbar orientation="vertical" variant="outline" aria-label="ツール" className="self-start">
				<ToolbarToggleGroup
					value={[tool]}
					onValueChange={(v) => v[0] && setTool(v[0])}
					aria-label="使うツール"
				>
					{tools.map((t) => (
						<ToolbarToggleItem
							key={t.value}
							value={t.value}
							aria-label={t.label}
							tooltip={
								<>
									{t.label}
									<Kbd>{t.key}</Kbd>
								</>
							}
						>
							{t.icon}
						</ToolbarToggleItem>
					))}
				</ToolbarToggleGroup>
			</Toolbar>
			<div className="flex flex-1 items-center justify-center rounded-lg border border-dashed border-line text-sm text-fg-muted">
				使っているツール: {label}
			</div>
			<Toolbar
				variant="floating"
				aria-label="キャンバスの操作"
				className="absolute bottom-4 left-1/2 -translate-x-1/2"
			>
				<ToolbarButton aria-label="元に戻す" tooltip="元に戻す">
					<Undo2 />
				</ToolbarButton>
				<ToolbarButton aria-label="やり直す" tooltip="やり直す">
					<Redo2 />
				</ToolbarButton>
				<ToolbarSeparator />
				<ToolbarGroup aria-label="拡大と縮小">
					<ToolbarButton
						aria-label="縮小"
						tooltip="縮小"
						disabled={zoom <= 25}
						onClick={() => setZoom((z) => Math.max(25, z - 25))}
					>
						<Minus />
					</ToolbarButton>
					<ToolbarButton
						size="md"
						aria-label={`倍率 ${zoom}%、押すと 100% に戻す`}
						onClick={() => setZoom(100)}
					>
						<span className="w-10 tabular-nums">{zoom}%</span>
					</ToolbarButton>
					<ToolbarButton
						aria-label="拡大"
						tooltip="拡大"
						disabled={zoom >= 400}
						onClick={() => setZoom((z) => Math.min(400, z + 25))}
					>
						<Plus />
					</ToolbarButton>
				</ToolbarGroup>
				<ToolbarSeparator />
				<ToolbarButton size="md" className="text-fg-strong">
					<Download />
					書き出す
				</ToolbarButton>
			</Toolbar>
		</div>
	);
}

/**
 * snapcrop の画面。左に縦のツールバー、下に浮かぶ操作のツールバー。ツールを切り替えると、選択インジケーターが進む側の辺から伸びて移る。
 * アイコンに hover すると、名前とショートカットが出る
 */
export const CanvasApp: Story = {
	name: "キャンバスの画面",
	render: () => <SnapcropCanvas />,
};

/** 状態の一覧。通常、選択中、無効、文字の表示 */
export const States: Story = {
	name: "状態",
	render: () => (
		<Toolbar variant="outline" aria-label="状態の例">
			<ToolbarButton aria-label="通常">
				<Pencil />
			</ToolbarButton>
			<ToolbarToggleGroup defaultValue={["on"]} aria-label="選択の例">
				<ToolbarToggleItem value="on" aria-label="選択中">
					<Crop />
				</ToolbarToggleItem>
			</ToolbarToggleGroup>
			<ToolbarButton aria-label="無効" disabled>
				<Redo2 />
			</ToolbarButton>
			<ToolbarSeparator />
			<ToolbarText>3 枚</ToolbarText>
		</Toolbar>
	),
};

/** Tab でツールバーに入り、矢印キーで項目間を移動する。無効の項目にもフォーカスは止まる。Tab でツールバーの外へ出る */
export const KeyboardNavigation: Story = {
	name: "キーボード操作",
	render: () => (
		<div className="flex flex-col items-start gap-3">
			<Toolbar variant="outline" aria-label="履歴と書き出し">
				<ToolbarButton aria-label="元に戻す">
					<Undo2 />
				</ToolbarButton>
				<ToolbarButton aria-label="やり直す" disabled>
					<Redo2 />
				</ToolbarButton>
				<ToolbarSeparator />
				<ToolbarButton size="md">書き出す</ToolbarButton>
			</Toolbar>
			<button type="button" className="text-sm text-fg-muted">
				ツールバーの外
			</button>
		</div>
	),
	play: async ({ canvas }) => {
		const undo = canvas.getByRole("button", { name: "元に戻す" });
		const redo = canvas.getByRole("button", { name: "やり直す" });
		const exportButton = canvas.getByRole("button", { name: "書き出す" });
		await userEvent.tab();
		await expect(undo).toHaveFocus();
		await userEvent.keyboard("{ArrowRight}");
		await expect(redo).toHaveFocus();
		await userEvent.keyboard("{ArrowRight}");
		await expect(exportButton).toHaveFocus();
		await userEvent.keyboard("{ArrowRight}");
		await expect(undo).toHaveFocus();
		await userEvent.tab();
		await expect(canvas.getByRole("button", { name: "ツールバーの外" })).toHaveFocus();
	},
};

/** 縦のツールバーでは、上下の矢印でツール間を移動し、Enter か Space で選ぶ */
export const VerticalKeyboard: Story = {
	name: "縦のツールバーのキーボード操作",
	render: () => <SnapcropCanvas />,
	play: async ({ canvas }) => {
		await userEvent.tab();
		await expect(canvas.getByRole("button", { name: "選ぶ" })).toHaveFocus();
		await userEvent.keyboard("{ArrowDown}");
		await expect(canvas.getByRole("button", { name: "切り抜く" })).toHaveFocus();
		await userEvent.keyboard("{ArrowDown}");
		const pen = canvas.getByRole("button", { name: "ペン" });
		await expect(pen).toHaveFocus();
		await userEvent.keyboard(" ");
		await expect(pen).toHaveAttribute("aria-pressed", "true");
		await expect(canvas.getByText("使っているツール: ペン")).toBeInTheDocument();
	},
};

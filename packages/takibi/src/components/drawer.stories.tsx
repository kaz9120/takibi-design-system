import type { Meta, StoryObj } from "@storybook/react-vite";
import { SlidersHorizontal } from "lucide-react";
import * as React from "react";
import { expect, screen, userEvent, waitFor } from "storybook/test";
import type { ComponentDocs } from "../spec";
import { Button } from "./button";
import {
	Drawer,
	DrawerBody,
	DrawerClose,
	DrawerContent,
	DrawerDescription,
	DrawerFooter,
	DrawerHeader,
	DrawerTitle,
	DrawerTrigger,
} from "./drawer";
import { Switch } from "./switch";

const meta = {
	title: "コンポーネント/オーバーレイ/Drawer",
	component: Drawer,
	argTypes: {
		side: { control: "inline-radio", options: ["right", "left", "bottom"] },
	},
	parameters: {
		takibi: {
			use: ["一覧から開く詳細や、表示の設定など、画面の端に出すパネル", "スマートフォンで、下から出す操作盤"],
			avoid: [
				{ case: "指で引いて閉じる必要がない、短い入力や確認", instead: "オーバーレイ/Dialog" },
				{ case: "取り消せない操作の確認", instead: "オーバーレイ/AlertDialog" },
				{ case: "ボタンのそばに小さな設定を出す", instead: "オーバーレイ/Popover" },
			],
			dos: [
				"右は詳細や設定、左は目次やナビゲーション、下はスマートフォンの操作盤に使う",
				"中身が長いときは DrawerBody に入れ、そこだけをスクロールできるようにする",
				"下から出すシートは、snapPoints で途中の高さにも止める",
			],
			donts: [
				"ドロワーの上に、さらにドロワーを重ねない",
				"閉じる手段を引く操作だけにしない。閉じるボタンか Esc でも閉じられるようにする",
			],
			keyboard: [
				["Esc", "閉じて、開いたボタンにフォーカスを戻す"],
				["Tab", "ドロワーの中だけでフォーカスが回る"],
				["Shift + Tab", "逆の順にフォーカスが回る"],
			],
			a11y: [
				"開くと中にフォーカスが移り、閉じると開いたボタンに戻る",
				"DrawerTitle と DrawerDescription が、名前と説明として読み上げられる",
				"開いている間、後ろの画面は操作できない",
			],
			motion: [
				"開くときは、端からばね（spring-soft）で滑り込み、少し行き過ぎて止まる",
				"指で引いている間は、面が指にそのまま付いてくる。バックドロップは引いた分だけ薄くなる",
				"閉じるときは、はじく勢いが強いほど速く、最長 320ms（ease-out-expo）で引っ込む",
				"下から出すシートのハンドルは、引いている間だけ 40px から 48px に伸びて明るくなる",
			],
			related: ["オーバーレイ/Dialog", "オーバーレイ/AlertDialog", "オーバーレイ/Popover"],
		} satisfies ComponentDocs,
	},
} satisfies Meta<typeof Drawer>;

export default meta;
type Story = StoryObj<typeof meta>;

const settings = [
	{ id: "embers", label: "火の粉を舞わせる", description: "完了したときに、火の粉が数個だけ散る", on: true },
	{ id: "sound", label: "薪のはぜる音", description: "音は出さない設定が既定", on: false },
	{ id: "night", label: "夜の配色に固定", description: "端末の設定に合わせない", on: false },
];

function SettingRows() {
	return (
		<ul className="flex flex-col divide-y divide-line-subtle">
			{settings.map((s) => (
				<li key={s.id} className="flex items-center justify-between gap-4 py-3">
					<label htmlFor={s.id} className="flex flex-col gap-0.5">
						<span className="text-sm font-medium text-fg">{s.label}</span>
						<span className="text-sm text-fg-muted">{s.description}</span>
					</label>
					<Switch id={s.id} defaultChecked={s.on} />
				</li>
			))}
		</ul>
	);
}

/** 右の端から、ばねで滑り込む。指で右へ引くと付いてきて、はじくと勢いのまま閉じる */
export const Basic: Story = {
	name: "基本",
	args: { side: "right" },
	render: (args) => (
		<Drawer {...args}>
			<DrawerTrigger render={<Button variant="secondary" />}>
				<SlidersHorizontal />
				表示の設定
			</DrawerTrigger>
			<DrawerContent>
				<DrawerHeader>
					<DrawerTitle>表示の設定</DrawerTitle>
					<DrawerDescription>変えるとすぐに効きます</DrawerDescription>
				</DrawerHeader>
				<DrawerBody>
					<SettingRows />
				</DrawerBody>
				<DrawerFooter>
					<DrawerClose render={<Button variant="secondary" />}>閉じる</DrawerClose>
				</DrawerFooter>
			</DrawerContent>
		</Drawer>
	),
};

/** 出てくる端の一覧。左は目次やナビゲーション、下はスマートフォンの操作盤に使う */
export const Sides: Story = {
	name: "出てくる端",
	render: () => (
		<div className="flex flex-wrap gap-3">
			{(["left", "right", "bottom"] as const).map((side) => (
				<Drawer key={side} side={side}>
					<DrawerTrigger render={<Button variant="secondary" />}>{side}</DrawerTrigger>
					<DrawerContent>
						<DrawerHeader>
							<DrawerTitle>{side} から出る</DrawerTitle>
							<DrawerDescription>
								{side === "bottom"
									? "下へ引くと閉じます"
									: `${side === "left" ? "左" : "右"}へ引くと閉じます`}
							</DrawerDescription>
						</DrawerHeader>
						<DrawerBody>
							<SettingRows />
						</DrawerBody>
					</DrawerContent>
				</Drawer>
			))}
		</div>
	),
};

const snapPoints = ["220px", 1];

/**
 * 下から出るシートを、途中の高さ（220px）と全体の 2 か所に止める。
 * 引いて離すと、離したときの勢いに応じて、近い方か先の方の高さで止まる。
 */
export const BottomSheetSnapPoints: Story = {
	name: "下から出るシートの止まる高さ",
	render: () => {
		const [snap, setSnap] = React.useState<string | number | null>(snapPoints[0] ?? null);
		return (
			<Drawer side="bottom" snapPoints={snapPoints} snapPoint={snap} onSnapPointChange={setSnap}>
				<DrawerTrigger render={<Button variant="secondary" />}>操作盤を開く</DrawerTrigger>
				<DrawerContent>
					<DrawerHeader>
						<DrawerTitle>操作盤</DrawerTitle>
						<DrawerDescription>上へ引くと全部が見えます</DrawerDescription>
					</DrawerHeader>
					<DrawerBody>
						<SettingRows />
						<ul className="mt-2 flex flex-col gap-2" aria-label="最近の記録">
							{Array.from({ length: 12 }, (_, i) => (
								// biome-ignore lint/suspicious/noArrayIndexKey: 見本の並び
								<li key={i} className="rounded-md bg-surface-sunken px-3 py-2.5 text-fg-muted">
									{`11 月 ${i + 1} 日の焚き火`}
								</li>
							))}
						</ul>
					</DrawerBody>
				</DrawerContent>
			</Drawer>
		);
	},
};

/** Enter で開くと中にフォーカスが移り、Esc で閉じると開いたボタンにフォーカスが戻る */
export const FocusManagement: Story = {
	...Basic,
	name: "フォーカスの移り方",
	play: async ({ canvas }) => {
		const trigger = canvas.getByRole("button", { name: "表示の設定" });
		await userEvent.tab();
		await expect(trigger).toHaveFocus();
		await userEvent.keyboard("{Enter}");
		const drawer = await screen.findByRole("dialog");
		await waitFor(() => expect(drawer.contains(document.activeElement)).toBe(true));
		await userEvent.keyboard("{Escape}");
		await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
		await expect(trigger).toHaveFocus();
	},
};

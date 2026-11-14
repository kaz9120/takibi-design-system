import type { Meta, StoryObj } from "@storybook/react-vite";
import { Bell, X } from "lucide-react";
import { expect, screen, userEvent, waitFor } from "storybook/test";
import type { ComponentDocs } from "../spec";
import { Button } from "./button";
import {
	Popover,
	PopoverClose,
	PopoverContent,
	PopoverDescription,
	PopoverTitle,
	PopoverTrigger,
} from "./popover";

const meta = {
	title: "コンポーネント/オーバーレイ/Popover",
	component: PopoverContent,
	parameters: {
		takibi: {
			use: ["ボタンのそばに、補足の情報や小さな設定を出す", "共有のリンクなど、画面を止めずに済む短い操作"],
			avoid: [
				{ case: "操作の名前を見せるだけ", instead: "オーバーレイ/Tooltip" },
				{ case: "操作の一覧から 1 つを選ばせる", instead: "オーバーレイ/Menu" },
				{ case: "作業を止めて入力や確認をしてもらう", instead: "オーバーレイ/Dialog" },
			],
			dos: [
				"中身は 1 つの用件に絞る",
				"PopoverTitle で、何のための面かを示す",
				"閉じるボタンを置くときは右上に置き、aria-label を付ける",
			],
			donts: [
				"長い入力フォームを詰め込まない。Dialog かページに分ける",
				"ポップオーバーの中からさらにポップオーバーを開かない",
			],
			keyboard: [
				["Enter", "開いて、中にフォーカスを移す"],
				["Space", "開いて、中にフォーカスを移す"],
				["Esc", "閉じて、開いたボタンにフォーカスを戻す"],
			],
			a11y: [
				"role は dialog になり、PopoverTitle と PopoverDescription が名前と説明として読み上げられる",
				"外側を押しても閉じる。後ろの画面は操作できるまま残る",
			],
			motion: [
				"ボタンの側から 4px 寄りながら、0.94 倍から等倍へ、ばね（spring-soft）で現れる（motion-rise）",
				"閉じるときは 150ms（ease-out-expo）で縮んで消える",
				"開いたボタンは大きさを変えない。ポップアップが一緒に揺れるため",
			],
			related: [
				"オーバーレイ/Tooltip",
				"オーバーレイ/Menu",
				"オーバーレイ/Dialog",
				"オーバーレイ/PreviewCard",
			],
		} satisfies ComponentDocs,
	},
} satisfies Meta<typeof PopoverContent>;

export default meta;
type Story = StoryObj<typeof meta>;

/** ボタンの下に開く。外側を押すか Esc で閉じる */
export const Basic: Story = {
	name: "基本",
	render: () => (
		<Popover>
			<PopoverTrigger render={<Button variant="secondary" />}>
				<Bell />
				通知
			</PopoverTrigger>
			<PopoverContent>
				<PopoverTitle>通知</PopoverTitle>
				<PopoverDescription>新しい知らせはありません</PopoverDescription>
			</PopoverContent>
		</Popover>
	),
};

/** 小さな操作を置く。閉じるボタンは右上に置き、aria-label を付ける */
export const WithActions: Story = {
	name: "操作を置く",
	render: () => (
		<Popover>
			<PopoverTrigger render={<Button variant="secondary" />}>共有する</PopoverTrigger>
			<PopoverContent className="relative">
				<PopoverTitle>リンクで共有</PopoverTitle>
				<PopoverDescription>リンクを知っている人が読めます</PopoverDescription>
				<input
					aria-label="共有リンク"
					readOnly
					defaultValue="https://takibi.example/p/ember"
					className="h-9 rounded-md border border-line-strong bg-surface-sunken px-3 font-mono text-sm"
				/>
				<div className="flex justify-end gap-2">
					<PopoverClose render={<Button variant="ghost" size="sm" />}>閉じる</PopoverClose>
					<Button size="sm">コピーする</Button>
				</div>
				<PopoverClose
					aria-label="閉じる"
					className="absolute top-3 right-3 flex size-7 items-center justify-center rounded-md text-fg-muted hover:bg-surface-hover hover:text-fg focus-visible:outline-2 focus-visible:outline-focus"
				>
					<X className="size-4" />
				</PopoverClose>
			</PopoverContent>
		</Popover>
	),
};

/** 出す向き。画面の端では、はみ出さない向きに自動で反転する */
export const Sides: Story = {
	name: "出す向き",
	render: () => (
		<div className="flex flex-wrap gap-3 py-24 pl-24">
			{(["top", "right", "bottom", "left"] as const).map((side) => (
				<Popover key={side}>
					<PopoverTrigger render={<Button variant="secondary" />}>{side}</PopoverTrigger>
					<PopoverContent side={side} className="w-48">
						<PopoverDescription>{side} に出る</PopoverDescription>
					</PopoverContent>
				</Popover>
			))}
		</div>
	),
};

/** Enter で開くと中にフォーカスが移り、Esc で閉じると開いたボタンにフォーカスが戻る */
export const FocusManagement: Story = {
	...Basic,
	name: "フォーカスの移り方",
	play: async ({ canvas }) => {
		const trigger = canvas.getByRole("button", { name: "通知" });
		await userEvent.tab();
		await expect(trigger).toHaveFocus();
		await userEvent.keyboard("{Enter}");
		const popover = await screen.findByRole("dialog");
		await waitFor(() => expect(popover.contains(document.activeElement)).toBe(true));
		await userEvent.keyboard("{Escape}");
		await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
		await expect(trigger).toHaveFocus();
	},
};

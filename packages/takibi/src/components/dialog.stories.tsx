import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, screen, userEvent, waitFor } from "storybook/test";
import type { ComponentDocs } from "../spec";
import { Button } from "./button";
import {
	Dialog,
	DialogClose,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "./dialog";

const meta = {
	title: "コンポーネント/オーバーレイ/Dialog",
	component: DialogContent,
	parameters: {
		takibi: {
			use: [
				"今の作業を止めて、短い入力や確認をしてもらう場面",
				"ヘルプや規約など、画面を移らずに読ませたい内容",
			],
			avoid: [
				{ case: "取り消せない操作の確認", instead: "オーバーレイ/AlertDialog" },
				{ case: "操作の結果を短く知らせるだけ", instead: "フィードバック/Toast" },
				{ case: "画面の端に出して、作業を続けながら使うパネル", instead: "オーバーレイ/Drawer" },
				{ case: "ボタンのそばに小さな補足や設定を出す", instead: "オーバーレイ/Popover" },
			],
			dos: [
				"タイトルで、何のための画面かを言い切る",
				"閉じる手段を必ず残す（閉じるボタン、Esc、バックドロップのクリック）",
				"中身は 1 つの目的に絞る",
			],
			donts: ["ダイアログの上にダイアログを重ねない", "長い手順を詰め込まない。ページに分ける"],
			copy: {
				rules: ["タイトルは体言止めか、問いかけにする", "ボタンは、何が起きるかを動詞で書く"],
				examples: [
					{ good: "名前を変える", bad: "確認", note: "何をする画面かを言う" },
					{ good: "保存する / やめる", bad: "OK / キャンセル", note: "選ぶと何が起きるかが分かる" },
				],
			},
			keyboard: [
				["Esc", "閉じて、開いたボタンにフォーカスを戻す"],
				["Tab", "ダイアログの中だけでフォーカスが回る"],
				["Shift + Tab", "逆の順にフォーカスが回る"],
			],
			a11y: [
				"開くと、中の最初の操作できる要素にフォーカスが移る",
				"DialogTitle と DialogDescription が、ダイアログの名前と説明として読み上げられる",
				"開いている間、後ろの画面は操作も読み上げもできない",
			],
			motion: [
				"開くときは、12px 下で 0.96 倍、4px ぼけた状態から、着火の曲線（ease-ignite）で浮かび上がる（motion-dialog）",
				"閉じるときは、6px 下へ沈みながら 180ms（ease-out-expo）で消える",
				"バックドロップは 200ms で暗くなり、後ろを 2px ぼかす（motion-backdrop）",
			],
			related: [
				"オーバーレイ/AlertDialog",
				"オーバーレイ/Drawer",
				"オーバーレイ/Popover",
				"オーバーレイ/Command",
			],
		} satisfies ComponentDocs,
	},
} satisfies Meta<typeof DialogContent>;

export default meta;
type Story = StoryObj<typeof meta>;

/** 開くとぼけた状態から浮かび上がり、閉じるときは開くより速く消える */
export const Basic: Story = {
	name: "基本",
	render: () => (
		<Dialog>
			<DialogTrigger render={<Button variant="secondary" />}>名前を変える</DialogTrigger>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>名前を変える</DialogTitle>
					<DialogDescription>プロジェクトの一覧と URL に表示されます</DialogDescription>
				</DialogHeader>
				<input
					aria-label="プロジェクト名"
					defaultValue="takibi"
					className="h-9 rounded-md border border-line-strong bg-surface-sunken px-3 text-sm"
				/>
				<DialogFooter>
					<DialogClose render={<Button variant="ghost" />}>やめる</DialogClose>
					<DialogClose render={<Button />}>変える</DialogClose>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	),
};

/** 開くと中にフォーカスが移り、Esc で閉じると開いたボタンにフォーカスが戻る */
export const FocusManagement: Story = {
	...Basic,
	name: "フォーカスの移り方",
	play: async ({ canvas }) => {
		const trigger = canvas.getByRole("button", { name: "名前を変える" });
		await userEvent.click(trigger);
		const dialog = await screen.findByRole("dialog");
		await waitFor(() => expect(dialog.contains(document.activeElement)).toBe(true));
		await userEvent.keyboard("{Escape}");
		await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
		await expect(trigger).toHaveFocus();
	},
};

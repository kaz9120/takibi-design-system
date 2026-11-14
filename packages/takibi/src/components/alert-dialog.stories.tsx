import type { Meta, StoryObj } from "@storybook/react-vite";
import { Trash2 } from "lucide-react";
import { expect, screen, userEvent, waitFor } from "storybook/test";
import type { ComponentDocs } from "../spec";
import {
	AlertDialog,
	AlertDialogClose,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
	AlertDialogTrigger,
} from "./alert-dialog";
import { Button } from "./button";

const meta = {
	title: "コンポーネント/オーバーレイ/AlertDialog",
	component: AlertDialogContent,
	parameters: {
		takibi: {
			use: [
				"削除など、取り消せない操作の前に、本当に進めるかを確かめる",
				"公開など、やり直しに手間がかかる操作の前に確かめる",
			],
			avoid: [
				{ case: "あとから元に戻せる操作", instead: "フィードバック/Toast" },
				{ case: "入力や読み物を出す", instead: "オーバーレイ/Dialog" },
			],
			dos: [
				"タイトルで、何をするかを問う（記録を消しますか）",
				"説明で、何が失われるかを具体的に書く",
				"取り消せない操作の確定ボタンは danger、取り消しは ghost にする",
			],
			donts: [
				"取り消しで済む操作に使わない。確認が増えると、読まずに押すようになる",
				"確定と取り消しのボタンを同じ見た目にしない",
			],
			copy: {
				rules: ["タイトルは「〜しますか」と問う", "ボタンは「はい / いいえ」ではなく、操作の名前で答える"],
				examples: [
					{ good: "削除する / やめる", bad: "はい / いいえ", note: "選ぶと何が起きるかが分かる" },
					{ good: "プロジェクトを削除しますか", bad: "確認", note: "何を確かめているかが分かる" },
				],
			},
			keyboard: [
				["Esc", "閉じて、開いたボタンにフォーカスを戻す"],
				["Tab", "ダイアログの中だけでフォーカスが回る"],
				["Shift + Tab", "逆の順にフォーカスが回る"],
				["Enter", "フォーカスのあるボタンを押す"],
			],
			a11y: [
				"role は alertdialog になり、タイトルと説明が読み上げられる",
				"開くと中にフォーカスが移り、閉じると開いたボタンに戻る",
				"背景を押しても閉じない。ボタンか Esc で選ぶまで後ろの画面は操作できない",
			],
			motion: [
				"開くときは、12px 下で 0.96 倍、4px ぼけた状態から、ばね（spring-soft）で浮かび上がる（motion-dialog）",
				"閉じるときは 6px 下へ沈みながら、180ms（ease-out-expo）で消える",
				"背景は 200ms で暗くなり、後ろを 2px ぼかす（motion-backdrop）",
			],
			related: ["オーバーレイ/Dialog", "アクション/Button", "フィードバック/Toast"],
		} satisfies ComponentDocs,
	},
} satisfies Meta<typeof AlertDialogContent>;

export default meta;
type Story = StoryObj<typeof meta>;

/** 取り消せない操作の確認。確定のボタンは danger、取り消しは ghost にする */
export const Basic: Story = {
	name: "取り消せない操作の確認",
	render: () => (
		<AlertDialog>
			<AlertDialogTrigger render={<Button variant="danger" />}>
				<Trash2 />
				プロジェクトを削除する
			</AlertDialogTrigger>
			<AlertDialogContent>
				<AlertDialogHeader>
					<AlertDialogTitle>プロジェクトを削除しますか</AlertDialogTitle>
					<AlertDialogDescription>
						takibi のページと記録がすべて消えます。この操作は取り消せません。
					</AlertDialogDescription>
				</AlertDialogHeader>
				<AlertDialogFooter>
					<AlertDialogClose render={<Button variant="ghost" />}>やめる</AlertDialogClose>
					<AlertDialogClose render={<Button variant="danger" />}>削除する</AlertDialogClose>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	),
};

/** 消えはしないが、やり直しに手間がかかる操作の確認。確定のボタンは primary にする */
export const NonDestructive: Story = {
	name: "やり直しに手間がかかる操作の確認",
	render: () => (
		<AlertDialog>
			<AlertDialogTrigger render={<Button variant="secondary" />}>公開する</AlertDialogTrigger>
			<AlertDialogContent>
				<AlertDialogHeader>
					<AlertDialogTitle>公開しますか</AlertDialogTitle>
					<AlertDialogDescription>URL を知っている人なら誰でも読めるようになります。</AlertDialogDescription>
				</AlertDialogHeader>
				<AlertDialogFooter>
					<AlertDialogClose render={<Button variant="ghost" />}>やめる</AlertDialogClose>
					<AlertDialogClose render={<Button />}>公開する</AlertDialogClose>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	),
};

/** 背景を押しても閉じない。「やめる」で閉じると、開いたボタンにフォーカスが戻る */
export const BackdropDoesNotClose: Story = {
	...Basic,
	name: "背景では閉じない",
	play: async ({ canvas }) => {
		const trigger = canvas.getByRole("button", { name: "プロジェクトを削除する" });
		await userEvent.click(trigger);
		const dialog = await screen.findByRole("alertdialog");
		await waitFor(() => expect(dialog.contains(document.activeElement)).toBe(true));

		const backdrop = document.querySelector<HTMLElement>("[data-slot=alert-dialog-backdrop]");
		if (!backdrop) throw new Error("背景が見つからない");
		await userEvent.click(backdrop);
		await expect(screen.getByRole("alertdialog")).toBeInTheDocument();

		await userEvent.click(screen.getByRole("button", { name: "やめる" }));
		await waitFor(() => expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument());
		await expect(trigger).toHaveFocus();
	},
};

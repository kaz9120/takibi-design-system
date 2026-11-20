import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, userEvent, waitFor } from "storybook/test";
import { setTheme } from "../lib/theme";
import type { ComponentDocs } from "../spec";
import { ThemeToggle, ThemeToggleGroup } from "./theme-toggle";

/*
 * Storybook のツールバーもテーマを切り替える。コンポーネントは画面の data-theme を見張るので、
 * どちらで切り替えても表示がずれない。ストーリーの最後に、ツールバーの値へ戻しておく。
 */
const meta = {
	title: "コンポーネント/アクション/ThemeToggle",
	component: ThemeToggle,
	parameters: {
		takibi: {
			use: [
				"画面の上の帯などに置き、夜と昼をすぐに切り替える（ThemeToggle）",
				"設定の画面で、夜・昼・端末に合わせる・時刻に合わせる、から選ぶ（ThemeToggleGroup）",
			],
			avoid: [{ case: "テーマ以外のオン・オフ", instead: "アクション/Toggle" }],
			dos: [
				"アプリの起動時に restoreTheme() を 1 回呼び、保存した設定を当てる",
				"1 つの画面に ThemeToggle と ThemeToggleGroup を両方置いてもよい。表示はそろう",
				"狭い場所では ThemeToggleGroup を iconOnly にする",
			],
			donts: [
				"data-theme を直に書き換えない。コンポーネントごとに色の変わるタイミングがずれる。setTheme() を使う",
			],
			keyboard: [
				["Enter", "ThemeToggle では夜と昼を切り替える。ThemeToggleGroup ではフォーカスのある項目を選ぶ"],
				["Space", "Enter と同じ"],
				["← →", "ThemeToggleGroup の中で項目を移る"],
			],
			a11y: [
				"ThemeToggle のアクセシブルネームは、押すと移る先になる（昼にする / 夜にする）",
				"ThemeToggleGroup では、選んでいる項目が aria-pressed で読み上げられる",
			],
			motion: [
				"ThemeToggle を押すと、月と太陽が、ボタンの下にある点を中心に 75 度ずつ回って入れ替わる。次のアイコンは左下から現れ、前のアイコンは右下へ消える。動きは揺れる曲線（springs.sway）",
				"画面全体は、対応するブラウザでは 720ms で切り替わる。昼へは新しい画面が下の端から上へ、夜へは上の端から下へ広がる（夜明けと日暮れ）",
				"ThemeToggleGroup では、選んだ面が溝の中を滑って移る（炎の舌）",
				"動きを減らす設定では、アイコンの回転と画面が広がる動きをやめ、すぐに切り替える",
			],
			related: ["アクション/ToggleGroup", "アクション/Toggle", "アクション/Button"],
		} satisfies ComponentDocs,
	},
	decorators: [
		(Story, context) => {
			const restore = () => setTheme(context.globals.theme ?? "dark");
			return (
				<div className="flex flex-col items-start gap-3">
					<Story />
					<button type="button" onClick={restore} className="text-xs text-fg-subtle underline">
						ツールバーのテーマに戻す
					</button>
				</div>
			);
		},
	],
} satisfies Meta<typeof ThemeToggle>;

export default meta;
type Story = StoryObj<typeof meta>;

/** 押すと、出ていたアイコンが右下へ沈み、次のアイコンが左下から昇る。画面全体は 720ms で切り替わる。昼へは下の端から上へ、夜へは上の端から下へ広がる */
export const Basic: Story = { name: "ボタン" };

/** 夜、昼、端末に合わせる、時刻に合わせる、の 4 つから選ぶ。選んだ面が溝の中を滑って移る。時刻に合わせると、5 時 45 分に昼、18 時 15 分に夜へ切り替わる */
export const Segmented: Story = {
	name: "4 つから選ぶ",
	render: () => <ThemeToggleGroup />,
};

/** 狭い場所に置くときは、アイコンだけにする */
export const SegmentedIconOnly: Story = {
	name: "4 つから選ぶ（アイコンだけ）",
	render: () => <ThemeToggleGroup iconOnly />,
};

/** 同じ設定を見るコンポーネントは、どこで切り替えても表示がそろう */
export const Synced: Story = {
	name: "表示がそろう",
	render: () => (
		<div className="flex items-center gap-3">
			<ThemeToggle />
			<ThemeToggleGroup />
		</div>
	),
};

/** Enter で切り替わり、アクセシブルネームが次に移る先に変わる。3 択の側にも同じテーマが選ばれる */
export const KeyboardInteraction: Story = {
	name: "キーボード操作",
	render: () => (
		<div className="flex items-center gap-3">
			<ThemeToggle />
			<ThemeToggleGroup />
		</div>
	),
	play: async ({ canvas, globals }) => {
		const start = globals.theme === "light" ? "light" : "dark";
		setTheme(start);
		const toggle = await canvas.findByRole("button", { name: start === "dark" ? "昼にする" : "夜にする" });
		await userEvent.tab();
		await expect(toggle).toHaveFocus();
		await userEvent.keyboard("{Enter}");
		const flipped = start === "dark" ? "light" : "dark";
		await waitFor(() => expect(document.documentElement.dataset.theme).toBe(flipped));
		await waitFor(() => expect(toggle).toHaveAccessibleName(start === "dark" ? "夜にする" : "昼にする"));
		// 3 択の側にも、同じテーマが選ばれて見える
		await expect(canvas.getByRole("button", { name: flipped === "light" ? "昼" : "夜" })).toHaveAttribute(
			"aria-pressed",
			"true",
		);
		// 元のテーマに戻す
		await userEvent.keyboard("{Enter}");
		await waitFor(() => expect(document.documentElement.dataset.theme).toBe(start));
	},
};

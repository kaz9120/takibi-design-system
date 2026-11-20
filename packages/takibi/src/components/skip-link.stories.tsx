import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, userEvent, waitFor } from "storybook/test";
import type { ComponentDocs } from "../spec";
import { SkipLink } from "./skip-link";

const meta = {
	title: "コンポーネント/ナビゲーション/SkipLink",
	component: SkipLink,
	parameters: {
		layout: "fullscreen",
		takibi: {
			use: ["上にナビゲーションが並ぶページで、キーボードで操作する人が本文へすぐ移れるようにする"],
			avoid: [{ case: "画面に見せておくリンク", instead: "ナビゲーション/Link" }],
			dos: [
				"ページの先頭、最初に Tab で届く位置に 1 つだけ置く",
				"飛び先の要素に id と tabIndex={-1} を付け、フォーカスを受け取れるようにする",
			],
			donts: ["飛び先のない href にしない", "常に見える位置に出しておかない。Tab を押したときだけ出す"],
			copy: {
				rules: ["移った先を短く書く。既定は「本文へ移動」"],
				examples: [{ good: "本文へ移動", bad: "スキップ", note: "どこへ移るかが分かる" }],
			},
			keyboard: [
				["Tab", "ページを開いて最初の Tab で、リンクが現れてフォーカスが当たる"],
				["Enter", "飛び先の要素へフォーカスを移す"],
			],
			a11y: [
				"隠れている間も読み上げとフォーカスの順には残る",
				"フォーカスが当たると、ほかの要素より手前に表示される",
			],
			motion: [
				"フォーカスが当たると、左上の外から 510ms、ease-ignite で定位置へ動いて現れる",
				"フォーカスが外れると、150ms、ease-out-expo で左上の外へ戻って消える",
			],
			related: ["ナビゲーション/Link", "ナビゲーション/NavigationMenu"],
		} satisfies ComponentDocs,
	},
} satisfies Meta<typeof SkipLink>;

export default meta;
type Story = StoryObj<typeof meta>;

function Page() {
	return (
		<div className="min-h-80">
			<SkipLink href="#main" />
			<header className="flex items-center gap-4 border-b border-line-subtle px-6 py-3 text-sm">
				<span className="font-medium text-fg-strong">ひどこ</span>
				<a href="#a" className="text-fg-muted">
					記録
				</a>
				<a href="#b" className="text-fg-muted">
					道具
				</a>
				<a href="#c" className="text-fg-muted">
					設定
				</a>
			</header>
			<main id="main" tabIndex={-1} className="px-6 py-6 text-sm text-fg outline-none">
				<h1 className="mb-2 text-lg font-medium text-fg-strong">きょうの記録</h1>
				<p className="text-fg-muted">Tab を押すと、左上に「本文へ移動」が現れる。</p>
			</main>
		</div>
	);
}

/** 普段は見えない。Tab を押すと左上に現れ、フォーカスが外れると速く隠れる */
export const Basic: Story = {
	name: "基本",
	render: () => <Page />,
};

/** フォーカスすると見え、Enter で本文にフォーカスが移る */
export const KeyboardSkip: Story = {
	name: "本文へ移る",
	render: () => <Page />,
	play: async ({ canvas }) => {
		const link = canvas.getByRole("link", { name: "本文へ移動" });
		await userEvent.tab();
		await expect(link).toHaveFocus();
		await waitFor(() => expect(getComputedStyle(link).opacity).toBe("1"));
		await userEvent.keyboard("{Enter}");
		await waitFor(() => expect(canvas.getByRole("main")).toHaveFocus());
	},
};

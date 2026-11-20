import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, userEvent, waitFor } from "storybook/test";
import type { ComponentDocs } from "../spec";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "./accordion";

const meta = {
	title: "コンポーネント/データ表示/Accordion",
	component: Accordion,
	parameters: {
		takibi: {
			use: [
				"よくある質問や詳しい設定のように、全部を一度に見せると長すぎる内容",
				"見出しを見て、読みたい項目だけを開いてもらう場面",
			],
			avoid: [
				{ case: "たたむ場所が 1 か所だけ", instead: "データ表示/Collapsible" },
				{ case: "同じ場所で中身を切り替えて見せる", instead: "データ表示/Tabs" },
				{ case: "最初から読んでほしい内容" },
			],
			dos: [
				"見出しだけで中身が分かるように書く",
				"ページの見出しの階層に合わないときは、AccordionTrigger の render で h3 を変える",
			],
			donts: ["大事な注意をたたんだ中に隠さない", "たたんだ中に、さらにアコーディオンを入れない"],
			keyboard: [
				["Tab", "次の見出しへ移る。矢印キーでは移らない"],
				["Enter", "開く、閉じる"],
				["Space", "開く、閉じる"],
			],
			a11y: [
				"見出しはボタンで、開いているかどうかが aria-expanded で読み上げられる",
				"見出しは h3 で包むので、見出しの一覧からもたどれる",
			],
			motion: [
				"中身は高さ 0 から伸びながら現れ、閉じるときも同じ曲線で縮む（motion-fold、ease-sway の 330ms）",
				"見出しの矢印は、開くと 180 度回って上を向く（ease-sway の 330ms）",
			],
			related: ["データ表示/Collapsible", "データ表示/Tabs"],
		} satisfies ComponentDocs,
	},
} satisfies Meta<typeof Accordion>;

export default meta;
type Story = StoryObj<typeof meta>;

const faq = [
	{
		q: "ひどこは無料で使えますか",
		a: "個人で使う範囲なら無料です。チームで使うときは有料のプランがあります。",
	},
	{ q: "書いた記録は書き出せますか", a: "設定の「書き出し」から、Markdown と JSON で書き出せます。" },
	{ q: "退会すると記録はどうなりますか", a: "30 日後にすべて消えます。それまでは戻せます。" },
];

/** 1 つ開くと、ほかは閉じる。中身は高さ 0 から伸びて現れる */
export const Basic: Story = {
	name: "基本",
	render: (args) => (
		<Accordion className="max-w-lg" {...args}>
			{faq.map(({ q, a }) => (
				<AccordionItem key={q} value={q}>
					<AccordionTrigger>{q}</AccordionTrigger>
					<AccordionContent>{a}</AccordionContent>
				</AccordionItem>
			))}
		</Accordion>
	),
};

/** multiple を付けると、複数を同時に開ける */
export const Multiple: Story = {
	...Basic,
	name: "複数を開く",
	args: { multiple: true, defaultValue: [faq[0]?.q, faq[1]?.q] },
};

/** 状態の一覧。開いた項目、閉じた項目、無効の項目 */
export const States: Story = {
	name: "状態",
	render: () => (
		<Accordion className="max-w-lg" defaultValue={["open"]}>
			<AccordionItem value="open">
				<AccordionTrigger>開いている</AccordionTrigger>
				<AccordionContent>矢印が上を向き、中身が見える。</AccordionContent>
			</AccordionItem>
			<AccordionItem value="closed">
				<AccordionTrigger>閉じている</AccordionTrigger>
				<AccordionContent>押すと開く。</AccordionContent>
			</AccordionItem>
			<AccordionItem value="disabled" disabled>
				<AccordionTrigger>無効（押せない）</AccordionTrigger>
				<AccordionContent>表示されない。</AccordionContent>
			</AccordionItem>
		</Accordion>
	),
};

/** Enter で開閉し、Tab で次の見出しへ移る。矢印キーでは移らない（APG の改訂に合わせた Base UI の仕様） */
export const KeyboardInteraction: Story = {
	...Basic,
	name: "キーボード操作",
	play: async ({ canvas }) => {
		const first = canvas.getByRole("button", { name: faq[0]?.q });
		const second = canvas.getByRole("button", { name: faq[1]?.q });
		await userEvent.tab();
		await expect(first).toHaveFocus();
		await expect(first).toHaveAttribute("aria-expanded", "false");

		await userEvent.keyboard("{Enter}");
		await expect(first).toHaveAttribute("aria-expanded", "true");
		await waitFor(() => expect(canvas.getByText(faq[0]?.a ?? "")).toBeVisible());

		await userEvent.keyboard("{Enter}");
		await expect(first).toHaveAttribute("aria-expanded", "false");

		await userEvent.tab();
		await expect(second).toHaveFocus();
	},
};

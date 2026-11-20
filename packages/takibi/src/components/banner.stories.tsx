import type { Meta, StoryObj } from "@storybook/react-vite";
import * as React from "react";
import { expect, userEvent, waitFor } from "storybook/test";
import type { ComponentDocs } from "../spec";
import { Banner, BannerLink } from "./banner";
import { Button } from "./button";

const meta = {
	title: "コンポーネント/フィードバック/Banner",
	component: Banner,
	parameters: {
		layout: "fullscreen",
		takibi: {
			use: [
				"止まる予定、支払いの失敗など、サービス全体に関わる知らせ",
				"どの画面にいても、直すまで見えていてほしいこと",
			],
			avoid: [
				{ case: "画面の一部だけに関わる知らせ", instead: "フィードバック/Alert" },
				{ case: "操作の結果を短く知らせる", instead: "フィードバック/Toast" },
			],
			dos: [
				"ページの上端に 1 つだけ出す",
				"直さないと進めない知らせは dismissible={false} にし、直すまで出し続ける",
				"詳しい説明は BannerLink で別のページへ送る",
			],
			donts: ["宣伝や、急がない新機能の案内に使わない", "閉じたあと、同じ知らせをすぐにまた出さない"],
			copy: {
				rules: [
					"1〜2 文で書く。何が起きているかを先に、どうすればよいかをあとに書く",
					"日時と量は数字で書く",
					"操作は action に動詞で置く（カードを変える）",
				],
				examples: [
					{
						good: "11 月 20 日 2 時から 30 分ほど止まります。",
						bad: "メンテナンスのお知らせ",
						note: "いつ、どれだけかが分かる",
					},
					{
						good: "支払いに失敗しました。カードの有効期限を確かめてください。",
						bad: "お支払いに問題があります！",
						note: "何をすればよいかまで書き、感嘆符を付けない",
					},
				],
			},
			keyboard: [
				["Tab", "本文のリンク、操作、閉じるボタンの順にフォーカスが移る"],
				["Enter", "閉じるボタンで、知らせを閉じる"],
				["Space", "閉じるボタンで、知らせを閉じる"],
			],
			a11y: [
				'danger は role="alert" で読み上げが割り込み、info と warning は role="status" で読まれる',
				"閉じるボタンには「閉じる」という名前が付いている",
				"閉じた知らせは DOM から外れ、スクリーンリーダーにも残らない",
			],
			motion: [
				"閉じると、中身が 6px 上がりながら薄れて 2px ぼけ（120ms）、高さが 0 までたたまれる（260ms、ease-sway）",
				"出すときは、高さが広がり（330ms、ease-sway）、中身が 6px 上から下りながら現れる（200ms、ease-standard）",
			],
			related: ["フィードバック/Alert", "フィードバック/Toast", "フィードバック/Callout"],
		} satisfies ComponentDocs,
	},
	argTypes: {
		variant: { control: "inline-radio", options: ["info", "warning", "danger"] },
	},
} satisfies Meta<typeof Banner>;

export default meta;
type Story = StoryObj<typeof meta>;

function Page() {
	return (
		<div className="flex flex-col gap-2 p-8">
			<h1 className="text-2xl font-semibold tracking-snug text-fg-strong">焚き火の記録</h1>
			<p className="text-sm text-fg-muted">知らせを閉じると、この見出しが上へ詰まる。</p>
		</div>
	);
}

/** 閉じると中身が上へ薄れ、高さがたたまれて、下の内容が上へ詰まる */
export const Basic: Story = {
	name: "基本",
	args: { variant: "info" },
	render: (args) => (
		<div>
			<Banner {...args}>
				11 月 20 日 2 時から 30 分ほど止まります。 <BannerLink href="#status">詳しく</BannerLink>
			</Banner>
			<Page />
		</div>
	),
};

/** 種類ごとの色とアイコン。面は薄い色にし、アイコンだけを状態の色にする */
export const Variants: Story = {
	name: "種類",
	render: () => (
		<div className="flex flex-col">
			<Banner variant="info">記録を Markdown で書き出せるようになりました。</Banner>
			<Banner variant="warning">容量が残り 10% です。古い記録を書き出すと空きが増えます。</Banner>
			<Banner variant="danger">支払いに失敗しました。カードの有効期限を確かめてください。</Banner>
		</div>
	),
};

/** 右に操作を置いた形、閉じられない形、アイコンを出さない形 */
export const Compositions: Story = {
	name: "組み合わせ",
	render: () => (
		<div className="flex flex-col">
			<Banner
				variant="danger"
				action={
					<Button variant="secondary" size="sm">
						カードを変える
					</Button>
				}
			>
				支払いに失敗しました。
			</Banner>
			<Banner variant="warning" dismissible={false}>
				閉じられない知らせ。直すまで出し続ける。
			</Banner>
			<Banner variant="info" icon={null}>
				アイコンを出さない。
			</Banner>
		</div>
	),
};

/** open を外から渡す。閉じたあとにもう一度出すと、高さが広がって中身が上から下りてくる */
export const Controlled: Story = {
	name: "開閉を外から操作",
	render: () => {
		const [open, setOpen] = React.useState(true);
		return (
			<div>
				<Banner variant="warning" open={open} onDismiss={() => setOpen(false)}>
					容量が残り 10% です。
				</Banner>
				<div className="p-8">
					<Button variant="secondary" onClick={() => setOpen((o) => !o)}>
						{open ? "知らせを閉じる" : "知らせを出す"}
					</Button>
				</div>
			</div>
		);
	},
};

/** Tab で閉じるボタンに移り、Enter で閉じる。閉じると知らせは DOM から外れる */
export const KeyboardDismiss: Story = {
	name: "キーボードで閉じる",
	...Basic,
	play: async ({ canvas }) => {
		await userEvent.tab();
		await expect(canvas.getByRole("link", { name: "詳しく" })).toHaveFocus();
		await userEvent.tab();
		const close = canvas.getByRole("button", { name: "閉じる" });
		await expect(close).toHaveFocus();
		await userEvent.keyboard("{Enter}");
		await waitFor(() => expect(canvas.queryByRole("status")).not.toBeInTheDocument());
	},
};

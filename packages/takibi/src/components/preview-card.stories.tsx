import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, screen, userEvent, waitFor } from "storybook/test";
import type { ComponentDocs } from "../spec";
import { Image } from "./image";
import { PreviewCard, PreviewCardContent, PreviewCardTrigger } from "./preview-card";

const meta = {
	title: "コンポーネント/オーバーレイ/PreviewCard",
	component: PreviewCardContent,
	parameters: {
		takibi: {
			use: [
				"文中の人やページへのリンクで、移動する前に中身を見せる",
				"リンク先が何かを、画像と要約で手早く確かめてもらう",
			],
			avoid: [
				{ case: "操作の名前やショートカットを見せる", instead: "オーバーレイ/Tooltip" },
				{ case: "中にボタンや入力欄を置く", instead: "オーバーレイ/Popover" },
			],
			dos: ["リンク先にある情報だけを載せる。見なくても困らない中身にする", "中身は、名前と短い要約に絞る"],
			donts: ["中にボタンやリンクを置かない。キーボードでは中へ移れない", "リンクではない文字に付けない"],
			keyboard: [
				["Tab", "リンクにフォーカスすると、少し待ってから開く"],
				["Enter", "リンク先へ移る"],
				["Esc", "閉じる"],
			],
			a11y: [
				"中身にはキーボードでもスクリーンリーダーでも届かない。リンク先で同じ情報を読めるようにする",
				"トリガーはふつうのリンクとして読み上げられる",
			],
			motion: [
				"hover かフォーカスから 500ms 待って開き、離れてから 200ms で閉じる",
				"リンクの側から 4px 寄りながら、0.94 倍から等倍へ、ばね（spring-soft）で現れる（motion-rise）",
				"開いている間は、リンクの下線が文字と同じ濃さになる",
			],
			related: ["オーバーレイ/Tooltip", "オーバーレイ/Popover", "ナビゲーション/Link"],
		} satisfies ComponentDocs,
	},
} satisfies Meta<typeof PreviewCardContent>;

export default meta;
type Story = StoryObj<typeof meta>;

const cover = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(
	`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 180"><defs><radialGradient id="g" cx="50%" cy="90%" r="80%"><stop offset="0" stop-color="#f8a05c"/><stop offset=".4" stop-color="#9a3210"/><stop offset="1" stop-color="#13110e"/></radialGradient></defs><rect width="320" height="180" fill="url(#g)"/></svg>`,
)}`;

/** 人へのリンクに hover すると、500ms 待ってから紹介が出る。離れると縮んで消える */
export const Basic: Story = {
	name: "人の紹介",
	render: () => (
		<p className="max-w-md text-base text-fg">
			薪の組み方は{" "}
			<PreviewCard>
				<PreviewCardTrigger href="#kaz">山本さん</PreviewCardTrigger>
				<PreviewCardContent>
					<div className="flex items-center gap-3">
						<span
							aria-hidden
							className="flex size-10 items-center justify-center rounded-full bg-brand-soft text-sm font-semibold text-brand"
						>
							山
						</span>
						<div className="flex flex-col">
							<span className="font-semibold text-fg-strong">山本 一正</span>
							<span className="text-fg-muted">@kaz · 焚き火 214 回</span>
						</div>
					</div>
					<p className="text-fg-muted">週末は川辺で火を起こしている。薪は広葉樹を好む。</p>
				</PreviewCardContent>
			</PreviewCard>{" "}
			の記録がいちばん詳しい。
		</p>
	),
};

/** ページへのリンク。移動する前に、画像と要約を見せる */
export const LinkPreview: Story = {
	name: "ページの要約",
	render: () => (
		<p className="max-w-md text-base text-fg">
			詳しくは{" "}
			<PreviewCard>
				<PreviewCardTrigger href="#article">雨の日に火を起こす方法</PreviewCardTrigger>
				<PreviewCardContent className="w-80 p-2">
					<Image src={cover} alt="" ratio="16/9" rounded="md" />
					<div className="flex flex-col gap-1 px-2 pb-2">
						<span className="font-semibold text-fg-strong">雨の日に火を起こす方法</span>
						<span className="text-fg-muted">湿った薪を割って、乾いた芯から燃やす。5 分で読める。</span>
					</div>
				</PreviewCardContent>
			</PreviewCard>{" "}
			を読む。
		</p>
	),
};

/** 出す向き。画面の端では、はみ出さない向きに自動で反転する */
export const Sides: Story = {
	name: "出す向き",
	render: () => (
		<div className="flex flex-wrap gap-6 py-24 pl-24 text-base">
			{(["top", "right", "bottom", "left"] as const).map((side) => (
				<PreviewCard key={side}>
					<PreviewCardTrigger href={`#${side}`}>{side}</PreviewCardTrigger>
					<PreviewCardContent side={side} className="w-48">
						<span className="text-fg-muted">{side} に出る</span>
					</PreviewCardContent>
				</PreviewCard>
			))}
		</div>
	),
};

/** Tab でリンクにフォーカスすると開き、フォーカスが離れると閉じる。中身にはフォーカスが入らない */
export const KeyboardFocus: Story = {
	name: "フォーカスで開く",
	render: () => (
		<div className="flex gap-6 text-base">
			<PreviewCard>
				<PreviewCardTrigger href="#a">薪の選び方</PreviewCardTrigger>
				<PreviewCardContent>
					<span className="text-fg-muted">広葉樹は長く、針葉樹は速く燃える。</span>
				</PreviewCardContent>
			</PreviewCard>
			<a href="#b" className="text-fg-muted">
				次のリンク
			</a>
		</div>
	),
	play: async ({ canvas }) => {
		const trigger = canvas.getByRole("link", { name: "薪の選び方" });
		await userEvent.tab();
		await expect(trigger).toHaveFocus();
		await waitFor(() => expect(screen.getByText("広葉樹は長く、針葉樹は速く燃える。")).toBeVisible(), {
			timeout: 2000,
		});
		await userEvent.tab();
		await expect(canvas.getByRole("link", { name: "次のリンク" })).toHaveFocus();
		await waitFor(
			() => expect(screen.queryByText("広葉樹は長く、針葉樹は速く燃える。")).not.toBeInTheDocument(),
			{
				timeout: 2000,
			},
		);
	},
};

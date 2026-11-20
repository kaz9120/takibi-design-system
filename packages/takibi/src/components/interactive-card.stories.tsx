import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fn, userEvent } from "storybook/test";
import type { ComponentDocs } from "../spec";
import {
	InteractiveCard,
	InteractiveCardArrow,
	InteractiveCardDescription,
	InteractiveCardTitle,
} from "./interactive-card";

const meta = {
	title: "コンポーネント/アクション/InteractiveCard",
	component: InteractiveCard,
	parameters: {
		takibi: {
			summary: "カード全体を押せるようにする。記事や記録の一覧から、詳しいページへ移るときに使う。",
			use: [
				"記事や記録の一覧から、詳しいページへ移る",
				"カード全体を 1 つのリンクかボタンとして押せるようにする",
			],
			avoid: [
				{ case: "カードの中にボタンやリンクを置く", instead: "データ表示/Card" },
				{ case: "文中で別のページへ移る", instead: "ナビゲーション/Link" },
			],
			dos: [
				"移動するなら href を渡してリンクにし、その場で何かが起きるならボタンにする",
				"タイトルで、移った先に何があるかを言い切る",
				"InteractiveCardArrow を添えて、押すと移ることを示す",
			],
			donts: [
				"中にほかのボタンやリンクを置かない。押せる場所が重なる",
				"説明を長くしない。カード全体がアクセシブルネームになる",
			],
			keyboard: [
				["Tab", "カードにフォーカスを移す"],
				["Enter", "開く"],
				["Space", "ボタンのときだけ押す"],
			],
			a11y: [
				"href を渡すと a、省くと button になり、それぞれの役割で読み上げられる",
				"中の文字はすべてカードの名前として読み上げられる",
				"無効にするときは aria-disabled と tabIndex={-1} を渡す",
			],
			motion: [
				"hover で 2px 持ち上がり、枠線にブランドカラーが混ざって、外側に薄い光の影が付く。持ち上げと戻りは着火の曲線（ease-ignite）",
				"押すと 0.98 倍に沈み、離すと載る曲線（ease-land）で戻る。持ち上がったまま沈む",
				"手元の光: hover の間、ポインターの位置を中心に半径 220px の淡い光が面に乗る。離れると最後の位置に残ったまま 560ms かけて消える",
				"矢印は hover で 3px 前へ寄ってブランドカラーになり、押している間は 4px まで出る",
			],
			related: ["データ表示/Card", "ナビゲーション/Link", "アクション/Button"],
		} satisfies ComponentDocs,
	},
} satisfies Meta<typeof InteractiveCard>;

export default meta;
type Story = StoryObj<typeof meta>;

/** hover で 2px 持ち上がり、枠線にブランドカラーが混ざり、矢印が前へ寄る。押すと 0.98 倍に沈む */
export const Basic: Story = {
	name: "基本",
	render: () => (
		<InteractiveCard href="#rain" className="max-w-sm">
			<InteractiveCardTitle>
				雨の日に火を起こす
				<InteractiveCardArrow />
			</InteractiveCardTitle>
			<InteractiveCardDescription>
				湿った薪を割って、乾いた芯から燃やす。5 分で読める。
			</InteractiveCardDescription>
		</InteractiveCard>
	),
};

const articles = [
	{ id: "wood", title: "薪の選び方", description: "広葉樹は長く、針葉樹は速く燃える。" },
	{ id: "build", title: "組み方の 3 つの型", description: "井桁、合掌、差しかけの違い" },
	{ id: "end", title: "火の消し方", description: "灰が手で触れられるまで冷ます。" },
];

/** 一覧に並べる。持ち上がるのはポインターを乗せた 1 枚だけで、隣は動かない */
export const Grid: Story = {
	name: "一覧に並べる",
	render: () => (
		<div className="grid max-w-3xl gap-4 sm:grid-cols-3">
			{articles.map((a) => (
				<InteractiveCard key={a.id} href={`#${a.id}`}>
					<InteractiveCardTitle className="justify-between">
						{a.title}
						<InteractiveCardArrow />
					</InteractiveCardTitle>
					<InteractiveCardDescription>{a.description}</InteractiveCardDescription>
				</InteractiveCard>
			))}
		</div>
	),
};

/** 状態の一覧。リンク、ボタン、無効 */
export const States: Story = {
	name: "状態",
	render: () => (
		<div className="grid max-w-3xl gap-4 sm:grid-cols-3">
			<InteractiveCard href="#link">
				<InteractiveCardTitle>リンク</InteractiveCardTitle>
				<InteractiveCardDescription>href を渡すと a で描く</InteractiveCardDescription>
			</InteractiveCard>
			<InteractiveCard>
				<InteractiveCardTitle>ボタン</InteractiveCardTitle>
				<InteractiveCardDescription>href を省くと button で描く</InteractiveCardDescription>
			</InteractiveCard>
			<InteractiveCard aria-disabled href="#disabled" tabIndex={-1}>
				<InteractiveCardTitle>無効</InteractiveCardTitle>
				<InteractiveCardDescription>押せない。持ち上がらない。</InteractiveCardDescription>
			</InteractiveCard>
		</div>
	),
};

const onOpen = fn();

/** Tab でカードに移るとブランドカラーの輪が付き、Enter で開く */
export const KeyboardInteraction: Story = {
	name: "キーボード操作",
	render: () => (
		<div className="flex max-w-sm flex-col gap-4">
			<InteractiveCard onClick={() => onOpen("wood")}>
				<InteractiveCardTitle>薪の選び方</InteractiveCardTitle>
			</InteractiveCard>
			<InteractiveCard onClick={() => onOpen("end")}>
				<InteractiveCardTitle>火の消し方</InteractiveCardTitle>
			</InteractiveCard>
		</div>
	),
	play: async ({ canvas }) => {
		onOpen.mockClear();
		await userEvent.tab();
		await expect(canvas.getByRole("button", { name: "薪の選び方" })).toHaveFocus();
		await userEvent.tab();
		await expect(canvas.getByRole("button", { name: "火の消し方" })).toHaveFocus();
		await userEvent.keyboard("{Enter}");
		await expect(onOpen).toHaveBeenCalledWith("end");
	},
};

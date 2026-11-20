import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, userEvent, waitFor } from "storybook/test";
import type { ComponentDocs } from "../spec";
import {
	Carousel,
	CarouselDots,
	CarouselNext,
	CarouselPrevious,
	CarouselSlide,
	CarouselViewport,
} from "./carousel";

const meta = {
	title: "コンポーネント/データ表示/Carousel",
	component: Carousel,
	parameters: {
		takibi: {
			use: ["写真や記録など、同じ重みの内容を横に送りながら 1 つずつ見せる"],
			avoid: [
				{ case: "すべてを一度に見比べたい内容", instead: "データ表示/List" },
				{ case: "見出しで内容を切り替える", instead: "データ表示/Tabs" },
				{ case: "手順を順に進める", instead: "データ表示/Steps" },
			],
			dos: [
				"Carousel の aria-label で、何の並びかを伝える",
				"前後のボタンか点を置き、払う操作のほかにも送る手段を残す",
			],
			donts: [
				"大事な情報を 2 枚目以降に置かない。見られないことが多い",
				"自動で送らない。このコンポーネントは自動送りを持たない",
			],
			keyboard: [
				["Tab", "窓にフォーカスを移す。次の Tab で点、前後のボタンへ移る"],
				["→", "次の面へ送る"],
				["←", "前の面へ送る"],
				["Home", "最初の面へ送る"],
				["End", "最後の面へ送る"],
			],
			a11y: [
				"各面は「1 / 5」のように、何枚目かを名前として読み上げる",
				'窓は aria-live="polite" なので、送った先の面の中身が読み上げられる',
				"端では前後のボタンが押せなくなる",
			],
			motion: [
				"面はスクロールスナップで止まり、払っても面の途中では止まらない",
				"ボタン、点、キーで送ると、なめらかにスクロールする",
				"炎の舌: ドットインジケーターは、進む側の端が先に 160ms で伸び、反対の端が 330ms（ease-sway）で追いつく",
				"動きを減らす設定では、なめらかなスクロールをやめて、すぐに切り替える",
			],
			related: ["データ表示/Tabs", "データ表示/Image", "データ表示/ScrollArea"],
		} satisfies ComponentDocs,
	},
} satisfies Meta<typeof Carousel>;

export default meta;
type Story = StoryObj<typeof meta>;

const nights = [
	{
		title: "11 月 2 日",
		body: "風が弱く、薪がよく燃えた。熾火で芋を焼いた。",
		tone: "from-(--ember-500)/30",
	},
	{ title: "11 月 5 日", body: "小雨のあと。湿った杉は火が付きにくかった。", tone: "from-(--ember-300)/25" },
	{
		title: "11 月 8 日",
		body: "広葉樹だけで組んだ。煙が少なく、火が長く続いた。",
		tone: "from-(--ember-700)/30",
	},
	{
		title: "11 月 9 日",
		body: "初めて焚き火台を替えた。灰の始末が楽になった。",
		tone: "from-(--ember-400)/25",
	},
	{ title: "11 月 10 日", body: "雲がなく、星が多かった。火を小さく保った。", tone: "from-(--ember-600)/30" },
];

function NightSlide({ title, body, tone }: (typeof nights)[number]) {
	return (
		<article
			className={`flex aspect-[16/9] flex-col justify-end gap-1 rounded-lg border border-line-subtle bg-linear-to-br ${tone} to-transparent bg-surface-raised p-6`}
		>
			<h3 className="text-lg font-medium text-fg-strong">{title}</h3>
			<p className="text-sm text-fg-muted">{body}</p>
		</article>
	);
}

/** 指で払うか、前後のボタン、点、矢印キーで送る。ドットインジケーターは、進む側の端が先に伸び、反対の端があとから追いつく */
export const Basic: Story = {
	name: "基本",
	render: () => (
		<Carousel aria-label="焚き火の記録" className="w-[32rem]">
			<CarouselViewport>
				{nights.map((n) => (
					<CarouselSlide key={n.title}>
						<NightSlide {...n} />
					</CarouselSlide>
				))}
			</CarouselViewport>
			<div className="flex items-center justify-between">
				<CarouselDots />
				<div className="flex gap-2">
					<CarouselPrevious />
					<CarouselNext />
				</div>
			</div>
		</Carousel>
	),
};

/** 1 画面に 2 枚ずつ見せる。面の幅は CarouselSlide の className で決める */
export const MultiplePerView: Story = {
	name: "2 枚ずつ見せる",
	render: () => (
		<Carousel aria-label="焚き火の記録" className="w-[36rem]">
			<CarouselViewport>
				{nights.map((n) => (
					<CarouselSlide key={n.title} className="basis-[calc(50%-0.5rem)]">
						<NightSlide {...n} />
					</CarouselSlide>
				))}
			</CarouselViewport>
			<div className="flex items-center justify-center gap-3">
				<CarouselPrevious variant="ghost" />
				<CarouselDots />
				<CarouselNext variant="ghost" />
			</div>
		</Carousel>
	),
};

/** 窓にフォーカスして右矢印で次へ、End で最後へ送る。端ではボタンが押せなくなる */
export const KeyboardNavigation: Story = {
	...Basic,
	name: "キーボード操作",
	play: async ({ canvas }) => {
		const viewport = canvas
			.getByRole("region", { name: "焚き火の記録" })
			.querySelector<HTMLElement>('[data-slot="carousel-viewport"]');
		if (!viewport) throw new Error("窓が見つからない");
		const prev = canvas.getByRole("button", { name: "前へ" });
		await expect(prev).toBeDisabled();
		await expect(canvas.getByRole("button", { name: "1 枚目へ" })).toHaveAttribute("aria-current", "true");
		viewport.focus();
		await userEvent.keyboard("{ArrowRight}");
		await waitFor(() =>
			expect(canvas.getByRole("button", { name: "2 枚目へ" })).toHaveAttribute("aria-current", "true"),
		);
		await waitFor(() => expect(prev).toBeEnabled());
		await userEvent.keyboard("{End}");
		await waitFor(() =>
			expect(canvas.getByRole("button", { name: "5 枚目へ" })).toHaveAttribute("aria-current", "true"),
		);
		await waitFor(() => expect(canvas.getByRole("button", { name: "次へ" })).toBeDisabled());
		await userEvent.click(canvas.getByRole("button", { name: "1 枚目へ" }));
		await waitFor(() =>
			expect(canvas.getByRole("button", { name: "1 枚目へ" })).toHaveAttribute("aria-current", "true"),
		);
	},
};

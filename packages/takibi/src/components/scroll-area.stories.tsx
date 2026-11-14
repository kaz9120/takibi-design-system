import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, userEvent, waitFor } from "storybook/test";
import type { ComponentDocs } from "../spec";
import { ScrollArea } from "./scroll-area";

const meta = {
	title: "コンポーネント/データ表示/ScrollArea",
	component: ScrollArea,
	argTypes: {
		orientation: { control: "inline-radio", options: ["vertical", "horizontal", "both"] },
	},
	parameters: {
		takibi: {
			use: [
				"決まった高さや幅の中で、長い一覧や広い表をスクロールして見せる",
				'写真やカードを横に並べてスクロールする（orientation="horizontal"）',
			],
			avoid: [
				{ case: "1 枚ずつ送って見せる", instead: "データ表示/Carousel" },
				{ case: "ページ全体のスクロール。ブラウザのスクロールに任せる" },
			],
			dos: [
				"高さか幅を className で指定する。指定しないと中身の大きさまで広がり、スクロールできない",
				"余白は viewportClassName に付ける",
			],
			donts: [
				"ScrollArea の中に、同じ向きの ScrollArea を入れない",
				"大事な操作を、スクロールしないと見えない位置に置かない",
			],
			keyboard: [
				["Tab", "中身の枠にフォーカスを移す"],
				["↑ ↓ ← →", "中身をスクロールする（ブラウザ標準のスクロール）"],
			],
			a11y: [
				"中身の枠にはフォーカスが当たり、ブランドカラーのフォーカスリングが付く",
				"ハンドルはポインターのためのもので、スクリーンリーダーには出ない",
			],
			motion: [
				"ハンドルは、ポインターが乗るかスクロールすると 120ms で現れ、離れると 360ms かけて消える",
				"溝にポインターを乗せると、ハンドルが 4px から 6px に太る（spring-press）",
				"続きのある端は 24px かけて透かし、端に着くと透かしが消える",
			],
			related: ["データ表示/Carousel", "データ表示/Table", "データ表示/List"],
		} satisfies ComponentDocs,
	},
} satisfies Meta<typeof ScrollArea>;

export default meta;
type Story = StoryObj<typeof meta>;

const logs = Array.from({ length: 30 }, (_, i) => ({
	id: i,
	date: `11 月 ${30 - i} 日`,
	place: ["奥多摩", "道志", "丹沢", "秩父", "富士見"][i % 5],
	minutes: 40 + ((i * 17) % 90),
}));

function LogList() {
	return (
		<ul className="flex flex-col divide-y divide-line-subtle">
			{logs.map((l) => (
				<li key={l.id} className="flex items-center justify-between px-4 py-2.5 text-sm">
					<span className="text-fg">
						{l.date} · {l.place}
					</span>
					<span className="tabular-nums text-fg-muted">{l.minutes} 分</span>
				</li>
			))}
		</ul>
	);
}

/** ポインターを乗せるかスクロールすると細いハンドルが出て、止まると消える。続きのある端は透ける */
export const Basic: Story = {
	name: "基本",
	render: (args) => (
		<ScrollArea className="h-72 w-80 rounded-lg border border-line bg-surface-raised" {...args}>
			<LogList />
		</ScrollArea>
	),
};

/** 横にスクロールする。写真やカードを横に並べるときに使う */
export const Horizontal: Story = {
	name: "横スクロール",
	render: () => (
		<ScrollArea orientation="horizontal" className="w-96 max-w-full" viewportClassName="pb-3">
			<ul className="flex w-max gap-3">
				{logs.slice(0, 12).map((l) => (
					<li
						key={l.id}
						className="flex h-28 w-36 flex-col justify-end rounded-lg border border-line-subtle bg-surface-raised p-3 text-sm"
					>
						<span className="font-medium text-fg-strong">{l.place}</span>
						<span className="text-fg-muted">{l.date}</span>
					</li>
				))}
			</ul>
		</ScrollArea>
	),
};

/** 縦横どちらにもスクロールする。広い表に使う */
export const Both: Story = {
	name: "縦横スクロール",
	render: () => (
		<ScrollArea
			orientation="both"
			className="h-64 w-96 max-w-full rounded-lg border border-line bg-surface-raised"
		>
			<table className="w-[44rem] text-left text-sm">
				<thead className="text-fg-muted">
					<tr>
						{["日付", "場所", "時間", "薪", "天気", "気温", "風", "メモ"].map((h) => (
							<th key={h} className="px-4 py-2 font-medium">
								{h}
							</th>
						))}
					</tr>
				</thead>
				<tbody className="text-fg">
					{logs.map((l) => (
						<tr key={l.id} className="border-t border-line-subtle">
							<td className="px-4 py-2">{l.date}</td>
							<td className="px-4 py-2">{l.place}</td>
							<td className="px-4 py-2 tabular-nums">{l.minutes} 分</td>
							<td className="px-4 py-2">ナラ</td>
							<td className="px-4 py-2">晴れ</td>
							<td className="px-4 py-2 tabular-nums">8℃</td>
							<td className="px-4 py-2">弱い</td>
							<td className="px-4 py-2 text-fg-muted">よく燃えた</td>
						</tr>
					))}
				</tbody>
			</table>
		</ScrollArea>
	),
};

/** 端を透かすかどうか。透かさないと、端で文字が途切れて見える */
export const Fade: Story = {
	name: "端の透かし",
	render: () => (
		<div className="flex flex-wrap gap-6">
			{[true, false].map((fade) => (
				<figure key={String(fade)} className="flex flex-col gap-2">
					<ScrollArea fade={fade} className="h-56 w-64 rounded-lg border border-line bg-surface-raised">
						<LogList />
					</ScrollArea>
					<figcaption className="text-sm text-fg-muted">{fade ? "透かす（既定）" : "透かさない"}</figcaption>
				</figure>
			))}
		</div>
	),
};

/** Tab で中身に移るとブランドカラーのフォーカスリングが付き、矢印キーでスクロールできる。スクロールすると上の端も透ける */
export const KeyboardScroll: Story = {
	...Basic,
	name: "キーボード操作",
	play: async ({ canvasElement }) => {
		const viewport = canvasElement.querySelector<HTMLElement>("[data-slot=scroll-area-viewport]");
		if (!viewport) throw new Error("scroll-area のコンポーネントがない");
		await userEvent.tab();
		await expect(viewport).toHaveFocus();
		// 矢印キーでのスクロールはブラウザが行うので、ここではスクロールしたあとに上の端の印が付くことを確かめる
		viewport.scrollTop = 160;
		await waitFor(() =>
			expect(canvasElement.querySelector("[data-slot=scroll-area]")).toHaveAttribute("data-overflow-y-start"),
		);
	},
};

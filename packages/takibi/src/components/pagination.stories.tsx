import type { Meta, StoryObj } from "@storybook/react-vite";
import * as React from "react";
import { expect, userEvent } from "storybook/test";
import type { ComponentDocs } from "../spec";
import {
	getPaginationRange,
	Pagination,
	PaginationContent,
	PaginationEllipsis,
	PaginationItem,
	PaginationLink,
	PaginationNext,
	PaginationPrevious,
} from "./pagination";

const meta = {
	title: "コンポーネント/ナビゲーション/Pagination",
	component: Pagination,
	parameters: {
		takibi: {
			use: ["検索の結果や記録の一覧など、長い一覧をページに分けて行き来する"],
			avoid: [
				{ case: "下へ読み進めながら続きを足す一覧", instead: "アクション/Button" },
				{ case: "手順のうちどこまで進んだかを見せる", instead: "データ表示/Steps" },
			],
			dos: [
				"番号の並びは getPaginationRange で作る。両端と今のページの前後を残し、間を省く",
				"URL で行き来するときは、各項目の render に <a href> を渡す",
				"最初と最後のページでは、前へ・次へを押せなくする（ボタンは disabled、リンクは aria-disabled）",
			],
			donts: ["ページが 1 つしかないときに出さない", "ページを移ったあと、一覧の先頭が見えないままにしない"],
			copy: {
				rules: ["前後の移動は「前へ」「次へ」にする", "番号は半角の数字だけにする"],
				examples: [{ good: "次へ", bad: "次のページへ進む >>", note: "短く、記号を重ねない" }],
			},
			keyboard: [
				["Tab", "前へ、各ページ、次へを順に移る。押せない項目は飛ばす"],
				["Enter", "そのページへ移る"],
			],
			a11y: [
				"nav に「ページ送り」という名前が付く",
				'今のページに aria-current="page" が付く',
				"省いたページは「ほかのページ」と読み上げる",
			],
			motion: [
				"今のページのインジケーター（ブランドカラーの薄い色の背景と細い枠）は、選んだページへ滑って移る（springs.sway）",
				"項目は押すと 0.97 倍に沈み、離すと戻る（motion-press）",
			],
			related: ["ナビゲーション/Breadcrumbs", "データ表示/Table", "データ表示/Steps"],
		} satisfies ComponentDocs,
	},
} satisfies Meta<typeof Pagination>;

export default meta;
type Story = StoryObj<typeof meta>;

function ButtonDemo({ total = 12, initial = 1 }: { total?: number; initial?: number }) {
	const [page, setPage] = React.useState(initial);
	return (
		<Pagination>
			<PaginationContent>
				<PaginationItem>
					<PaginationPrevious disabled={page === 1} onClick={() => setPage((p) => p - 1)} />
				</PaginationItem>
				{getPaginationRange(page, total).map((item, i) =>
					item === "ellipsis" ? (
						// biome-ignore lint/suspicious/noArrayIndexKey: 省略の記号は位置で見分ける
						<PaginationItem key={`e${i}`}>
							<PaginationEllipsis />
						</PaginationItem>
					) : (
						<PaginationItem key={item}>
							<PaginationLink isActive={item === page} onClick={() => setPage(item)}>
								{item}
							</PaginationLink>
						</PaginationItem>
					),
				)}
				<PaginationItem>
					<PaginationNext disabled={page === total} onClick={() => setPage((p) => p + 1)} />
				</PaginationItem>
			</PaginationContent>
		</Pagination>
	);
}

/** 項目はボタン。押したページへ、今のページのインジケーターが滑って移る */
export const Basic: Story = { name: "基本", render: () => <ButtonDemo /> };

/** ページが少ないときは、省略せずに全部並べる */
export const FewPages: Story = {
	name: "ページが少ないとき",
	render: () => <ButtonDemo total={5} initial={2} />,
};

/** 最初、途中、最後のページにいるときの見た目。端では前へ・次へが押せなくなる */
export const States: Story = {
	name: "状態",
	render: () => (
		<div className="flex flex-col gap-4">
			<ButtonDemo total={20} initial={1} />
			<ButtonDemo total={20} initial={10} />
			<ButtonDemo total={20} initial={20} />
		</div>
	),
};

function LinkDemo() {
	const [page, setPage] = React.useState(3);
	const total = 8;
	const go = (next: number) => (event: React.MouseEvent) => {
		// カタログの中ではページを移らずに、インジケーターの動きだけを見せる
		event.preventDefault();
		setPage(next);
	};
	return (
		<Pagination>
			<PaginationContent>
				<PaginationItem>
					<PaginationPrevious
						render={<a href={`?page=${page - 1}`} />}
						aria-disabled={page === 1 || undefined}
						onClick={go(page - 1)}
					/>
				</PaginationItem>
				{getPaginationRange(page, total).map((item, i) =>
					item === "ellipsis" ? (
						// biome-ignore lint/suspicious/noArrayIndexKey: 省略の記号は位置で見分ける
						<PaginationItem key={`e${i}`}>
							<PaginationEllipsis />
						</PaginationItem>
					) : (
						<PaginationItem key={item}>
							<PaginationLink
								render={<a href={`?page=${item}`} />}
								isActive={item === page}
								onClick={go(item)}
							>
								{item}
							</PaginationLink>
						</PaginationItem>
					),
				)}
				<PaginationItem>
					<PaginationNext
						render={<a href={`?page=${page + 1}`} />}
						aria-disabled={page === total || undefined}
						onClick={go(page + 1)}
					/>
				</PaginationItem>
			</PaginationContent>
		</Pagination>
	);
}

/** URL で行き来するとき。`render` に `<a href>` を渡すとリンクになる。端では aria-disabled で押せなくする */
export const AsLinks: Story = { name: "リンクで行き来する", render: () => <LinkDemo /> };

/** Tab で項目を順に移り、Enter で開く。今のページは aria-current="page" を持つ */
export const KeyboardInteraction: Story = {
	name: "キーボード操作",
	render: () => <ButtonDemo total={5} initial={1} />,
	play: async ({ canvas }) => {
		const prev = canvas.getByRole("button", { name: "前へ" });
		await expect(prev).toBeDisabled();
		await userEvent.tab();
		await expect(canvas.getByRole("button", { name: "1" })).toHaveFocus();
		await userEvent.tab();
		const two = canvas.getByRole("button", { name: "2" });
		await expect(two).toHaveFocus();
		await userEvent.keyboard("{Enter}");
		await expect(two).toHaveAttribute("aria-current", "page");
		await expect(canvas.getByRole("button", { name: "1" })).not.toHaveAttribute("aria-current");
		await expect(prev).toBeEnabled();
	},
};

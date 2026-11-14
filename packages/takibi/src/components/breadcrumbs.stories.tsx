import type { Meta, StoryObj } from "@storybook/react-vite";
import { Slash } from "lucide-react";
import { expect, screen, userEvent, waitFor } from "storybook/test";
import type { ComponentDocs } from "../spec";
import {
	Breadcrumbs,
	BreadcrumbsEllipsis,
	BreadcrumbsItem,
	BreadcrumbsLink,
	BreadcrumbsList,
	BreadcrumbsPage,
	BreadcrumbsSeparator,
	BreadcrumbsTrail,
} from "./breadcrumbs";

const meta = {
	title: "コンポーネント/ナビゲーション/Breadcrumbs",
	component: Breadcrumbs,
	parameters: {
		takibi: {
			use: ["2 階層以上ある画面で、今のページの位置と、上の階層への戻り道を見せる"],
			avoid: [
				{ case: "階層が 1 つしかない" },
				{ case: "同じ階層のページを行き来する", instead: "ナビゲーション/NavList" },
				{ case: "手順のうちどこまで進んだかを見せる", instead: "データ表示/Steps" },
			],
			dos: [
				"最後の項目は今のページにし、リンクにしない（BreadcrumbsPage）",
				"5 階層以上になるときは BreadcrumbsTrail を使い、中ほどをたたむ",
				"項目の名前は、各ページの見出しと同じ言葉にする",
			],
			donts: ["ページの主なナビゲーションの代わりにしない", "区切りの記号に意味を持たせない"],
			copy: {
				rules: ["項目はページの見出しと同じ名詞にする。短くするために言葉を変えない"],
				examples: [{ good: "焚き火台", bad: "焚き火台一覧ページへ", note: "見出しと同じ名詞で書く" }],
			},
			keyboard: [
				["Tab", "上の階層のリンクと、たたんだ階層のボタンを順に移る"],
				["Enter", "リンクで移る。たたんだ階層のボタンでは、メニューを開いて最初の項目にフォーカスを移す"],
				["↑ / ↓", "開いたメニューの中で項目を移る"],
				["Esc", "メニューを閉じて、ボタンにフォーカスを戻す"],
			],
			a11y: [
				"nav に「パンくずリスト」という名前が付き、ランドマークとしてたどれる",
				'今のページに aria-current="page" が付く',
				"区切りの記号はスクリーンリーダーから隠す",
			],
			motion: [
				"リンクに hover すると、薄い下線の上に濃い線が左から描かれる（Link と同じ）",
				"たたんだ階層のメニューは motion-rise で、0.94 倍から 4px 上がりながら開く。ボタンは押しても大きさを変えない",
			],
			related: ["ナビゲーション/Link", "ナビゲーション/NavList", "オーバーレイ/Menu"],
		} satisfies ComponentDocs,
	},
} satisfies Meta<typeof Breadcrumbs>;

export default meta;
type Story = StoryObj<typeof meta>;

/** 上の階層はリンクで、hover すると下線が描かれる。最後の項目が今のページ */
export const Basic: Story = {
	name: "基本",
	render: () => (
		<Breadcrumbs>
			<BreadcrumbsList>
				<BreadcrumbsItem>
					<BreadcrumbsLink href="#">ホーム</BreadcrumbsLink>
				</BreadcrumbsItem>
				<BreadcrumbsSeparator />
				<BreadcrumbsItem>
					<BreadcrumbsLink href="#">記録</BreadcrumbsLink>
				</BreadcrumbsItem>
				<BreadcrumbsSeparator />
				<BreadcrumbsItem>
					<BreadcrumbsPage>11 月の焚き火</BreadcrumbsPage>
				</BreadcrumbsItem>
			</BreadcrumbsList>
		</Breadcrumbs>
	),
};

const deepPath = [
	{ label: "ホーム", href: "#home" },
	{ label: "道具", href: "#tools" },
	{ label: "焚き火台", href: "#stands" },
	{ label: "ステンレス", href: "#stainless" },
	{ label: "折りたためるもの", href: "#folding" },
	{ label: "手入れの記録" },
];

/** 長い階層は、先頭と末尾の 2 つを残して中ほどをたたむ。「…」を押すと、たたんだ階層がメニューで開く */
export const Collapsed: Story = {
	name: "長い階層をたたむ",
	render: () => <BreadcrumbsTrail items={deepPath} />,
};

/** 区切りの記号は差し替えられる */
export const CustomSeparator: Story = {
	name: "区切りの記号を変える",
	render: () => (
		<Breadcrumbs>
			<BreadcrumbsList>
				<BreadcrumbsItem>
					<BreadcrumbsLink href="#">hidoko</BreadcrumbsLink>
				</BreadcrumbsItem>
				<BreadcrumbsSeparator>
					<Slash className="-rotate-12" />
				</BreadcrumbsSeparator>
				<BreadcrumbsItem>
					<BreadcrumbsLink href="#">packages</BreadcrumbsLink>
				</BreadcrumbsItem>
				<BreadcrumbsSeparator>
					<Slash className="-rotate-12" />
				</BreadcrumbsSeparator>
				<BreadcrumbsItem>
					<BreadcrumbsPage>ui</BreadcrumbsPage>
				</BreadcrumbsItem>
			</BreadcrumbsList>
		</Breadcrumbs>
	),
};

/** コンポーネントを組み合わせて、たたむ場所を自分で決める */
export const ManualEllipsis: Story = {
	name: "たたむ場所を決める",
	render: () => (
		<Breadcrumbs>
			<BreadcrumbsList>
				<BreadcrumbsItem>
					<BreadcrumbsLink href="#">ホーム</BreadcrumbsLink>
				</BreadcrumbsItem>
				<BreadcrumbsSeparator />
				<BreadcrumbsItem>
					<BreadcrumbsEllipsis
						items={[
							{ label: "道具", href: "#tools" },
							{ label: "焚き火台", href: "#stands" },
						]}
					/>
				</BreadcrumbsItem>
				<BreadcrumbsSeparator />
				<BreadcrumbsItem>
					<BreadcrumbsPage>手入れの記録</BreadcrumbsPage>
				</BreadcrumbsItem>
			</BreadcrumbsList>
		</Breadcrumbs>
	),
};

/** Tab でリンクと「…」のボタンを移り、Enter でメニューを開いて矢印キーで選ぶ。今のページには aria-current が付く */
export const KeyboardNavigation: Story = {
	name: "キーボード操作",
	...Collapsed,
	play: async ({ canvas }) => {
		await expect(canvas.getByText("手入れの記録")).toHaveAttribute("aria-current", "page");
		await userEvent.tab();
		await expect(canvas.getByRole("link", { name: "ホーム" })).toHaveFocus();
		await userEvent.tab();
		const ellipsis = canvas.getByRole("button", { name: "ほかの階層を見る" });
		await expect(ellipsis).toHaveFocus();
		await userEvent.keyboard("{Enter}");
		const first = await screen.findByRole("menuitem", { name: "道具" });
		await waitFor(() => expect(first).toHaveFocus());
		await userEvent.keyboard("{ArrowDown}");
		await expect(screen.getByRole("menuitem", { name: "焚き火台" })).toHaveFocus();
		await userEvent.keyboard("{Escape}");
		await waitFor(() => expect(screen.queryByRole("menu")).not.toBeInTheDocument());
		await expect(ellipsis).toHaveFocus();
	},
};

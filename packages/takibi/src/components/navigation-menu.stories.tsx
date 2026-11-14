import type { Meta, StoryObj } from "@storybook/react-vite";
import {
	BookOpen,
	Flame,
	Image as ImageIcon,
	KeyRound,
	Layers,
	Palette,
	Scissors,
	Sparkles,
} from "lucide-react";
import { expect, screen, userEvent, waitFor } from "storybook/test";
import type { ComponentDocs } from "../spec";
import {
	NavigationMenu,
	NavigationMenuCard,
	NavigationMenuContent,
	NavigationMenuItem,
	NavigationMenuLink,
	NavigationMenuList,
	NavigationMenuTrigger,
} from "./navigation-menu";

const meta = {
	title: "コンポーネント/ナビゲーション/NavigationMenu",
	component: NavigationMenu,
	parameters: {
		layout: "fullscreen",
		takibi: {
			use: [
				"サイトの上端に置く、横並びのナビゲーション",
				"項目の下にパネルを開き、関連するページを説明付きで並べる",
			],
			avoid: [
				{ case: "アプリの中の操作を並べる", instead: "オーバーレイ/Menubar" },
				{ case: "設定画面などで、横に縦の一覧を置く", instead: "ナビゲーション/NavList" },
				{ case: "ページの中で表示を切り替える", instead: "データ表示/Tabs" },
			],
			dos: [
				"パネルを開く項目は NavigationMenuTrigger、ページへ直接移る項目は NavigationMenuLink にする",
				"パネルの中のリンクは NavigationMenuCard にし、タイトルと 1 行の説明を書く",
				"今のページの項目には active を付ける",
			],
			donts: [
				"パネルの中に入力欄やボタンを置かない。リンクだけにする",
				"項目を 6 つより多く並べない。入りきらない分はパネルにまとめる",
			],
			copy: {
				rules: ["項目は短い名詞にする", "カードの説明は、行き先で何ができるかを 1 行で書く。句点を付けない"],
				examples: [
					{ good: "画面の写しを切り抜いて整える", bad: "便利な画像ツールです！", note: "何ができるかを書く" },
				],
			},
			keyboard: [
				["Tab", "項目を順に移る。パネルが開いていれば、パネルの中のリンクへ進む"],
				["Enter", "パネルを開く。リンクではページへ移る"],
				["Esc", "パネルを閉じて、開いた項目にフォーカスを戻す"],
			],
			a11y: [
				"パネルを開く項目には aria-expanded が付き、開閉がスクリーンリーダーで分かる",
				'今のページの項目に aria-current="page" が付く',
			],
			motion: [
				"パネルは 0.96 倍から薄く現れて開き（330ms、ease-spring-glide）、閉じるときは 150ms、ease-out-expo で引く",
				"隣の項目へ移ると、パネルの位置と幅と高さが 330ms で新しい中身に合わせて変わる",
				"中身は進んだ向きから幅の 1/4 だけ寄りながら現れ、前の中身は反対へ抜けながら 2px ぼけて消える",
				"開いている項目の下の背景は、項目から項目へ滑って移る（springs.glide）。矢印は 180 度回る",
			],
			related: ["ナビゲーション/NavList", "オーバーレイ/Menubar", "ナビゲーション/Link"],
		} satisfies ComponentDocs,
	},
} satisfies Meta<typeof NavigationMenu>;

export default meta;
type Story = StoryObj<typeof meta>;

function Header() {
	return (
		<div className="min-h-96 px-6 py-4">
			<div className="flex items-center gap-6 border-b border-line-subtle pb-3">
				<span className="flex items-center gap-1.5 text-sm font-medium text-fg-strong">
					<Flame className="size-4 text-brand" />
					ひどこ
				</span>
				<NavigationMenu>
					<NavigationMenuList>
						<NavigationMenuItem>
							<NavigationMenuTrigger>アプリ</NavigationMenuTrigger>
							<NavigationMenuContent>
								<ul className="grid w-[30rem] grid-cols-2 gap-1">
									<li>
										<NavigationMenuCard
											href="#snapcrop"
											icon={<Scissors />}
											title="snapcrop"
											description="画面の写しを切り抜いて整える"
										/>
									</li>
									<li>
										<NavigationMenuCard
											href="#note-ogp"
											icon={<ImageIcon />}
											title="note-ogp"
											description="記事の見出し画像をつくる"
										/>
									</li>
									<li>
										<NavigationMenuCard
											href="#hidoko-id"
											icon={<KeyRound />}
											title="hidoko-id"
											description="すべてのアプリに同じ鍵で入る"
										/>
									</li>
									<li>
										<NavigationMenuCard
											href="#homepage"
											icon={<Sparkles />}
											title="homepage"
											description="焚き火の記録と、作ったもの"
										/>
									</li>
								</ul>
							</NavigationMenuContent>
						</NavigationMenuItem>
						<NavigationMenuItem>
							<NavigationMenuTrigger>手引き</NavigationMenuTrigger>
							<NavigationMenuContent>
								<ul className="flex w-72 flex-col gap-1">
									<li>
										<NavigationMenuCard href="#start" icon={<BookOpen />} title="はじめに" />
									</li>
									<li>
										<NavigationMenuCard href="#tokens" icon={<Palette />} title="色と文字" />
									</li>
									<li>
										<NavigationMenuCard href="#components" icon={<Layers />} title="コンポーネントの使い方" />
									</li>
								</ul>
							</NavigationMenuContent>
						</NavigationMenuItem>
						<NavigationMenuItem>
							<NavigationMenuLink href="#journal" active>
								記録
							</NavigationMenuLink>
						</NavigationMenuItem>
						<NavigationMenuItem>
							<NavigationMenuLink href="#about">このサイトについて</NavigationMenuLink>
						</NavigationMenuItem>
					</NavigationMenuList>
				</NavigationMenu>
			</div>
		</div>
	);
}

/**
 * 項目に hover するとパネルが開く。隣の項目へ移ると、パネルの幅と高さが新しい中身に合わせて変わり、
 * 中身は進んだ向きから入ってくる。開いている項目の下の背景も滑って移る
 */
export const Basic: Story = {
	name: "基本",
	render: () => <Header />,
};

/** Tab で項目へ移り、Enter でパネルを開く。Esc で閉じると、項目にフォーカスが戻る */
export const KeyboardNavigation: Story = {
	name: "キーボード操作",
	render: () => <Header />,
	play: async ({ canvas }) => {
		const apps = canvas.getByRole("button", { name: "アプリ" });
		await userEvent.tab();
		await expect(apps).toHaveFocus();
		await userEvent.keyboard("{Enter}");
		await waitFor(() => expect(apps).toHaveAttribute("aria-expanded", "true"));
		// パネルの中への Tab 移動は Base UI のフォーカスの番人が受け持つ。userEvent.tab はそれを通らないので、ここでは見えることだけ確かめる
		const card = await screen.findByRole("link", { name: /snapcrop/ });
		await waitFor(() => expect(card).toBeVisible());
		await userEvent.keyboard("{Escape}");
		await waitFor(() => expect(apps).toHaveAttribute("aria-expanded", "false"));
		await expect(apps).toHaveFocus();
		await expect(canvas.getByRole("link", { name: "記録" })).toHaveAttribute("aria-current", "page");
	},
};

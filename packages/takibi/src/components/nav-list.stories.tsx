import type { Meta, StoryObj } from "@storybook/react-vite";
import { Bell, CreditCard, KeyRound, Link2, Palette, ShieldCheck, Trash2, User } from "lucide-react";
import { useState } from "react";
import { expect, userEvent } from "storybook/test";
import type { ComponentDocs } from "../spec";
import { Badge } from "./badge";
import { NavList, NavListGroup, NavListItem, NavListLabel } from "./nav-list";

const meta = {
	title: "コンポーネント/ナビゲーション/NavList",
	component: NavList,
	parameters: {
		takibi: {
			use: [
				"設定やアカウントの画面の横に置く、縦のナビゲーション",
				"項目をまとまりに分けて、見出しを付けて並べる",
			],
			avoid: [
				{ case: "ページの中で表示を切り替える", instead: "データ表示/Tabs" },
				{ case: "サイトの上端に置く横並びのナビゲーション", instead: "ナビゲーション/NavigationMenu" },
				{ case: "階層の中の位置を見せる", instead: "ナビゲーション/Breadcrumbs" },
			],
			dos: [
				"今のページの項目に active を付ける",
				"項目が 7 つを超えるなら、NavListGroup と NavListLabel でまとまりに分ける",
				"件数は badge に Badge を渡して添える",
			],
			donts: [
				"アイコンを一部の項目にだけ付けない。付けるなら全部に付ける",
				"項目を押して画面の中の操作をしない。ページの移動だけに使う",
			],
			copy: {
				rules: ["項目は、移った先のページの見出しと同じ名詞にする", "まとまりの見出しは短い名詞にする"],
				examples: [{ good: "通知", bad: "通知の設定を変更する", note: "移った先の見出しと同じ言葉にする" }],
			},
			keyboard: [
				["Tab", "項目を上から順に移る。無効の項目は飛ばす"],
				["Enter", "その項目のページへ移る"],
			],
			a11y: [
				"nav に名前が付く（既定は「サイドメニュー」）。画面に合わせて aria-label で変える",
				"NavListLabel を置いたまとまりは、その見出しを名前に持つ group になる",
				'今のページの項目に aria-current="page" が付く。無効の項目には aria-disabled が付く',
			],
			motion: [
				"選択中の背景（ブランドカラーの薄い色）は、前の項目から新しい項目へ滑って移る（springs.glide）。動きを減らす設定では移らずに切り替わる",
				"項目は押すと 0.98 倍に沈み、離すと戻る（motion-press-surface）",
			],
			related: ["ナビゲーション/NavigationMenu", "データ表示/Tabs", "ナビゲーション/Breadcrumbs"],
		} satisfies ComponentDocs,
	},
} satisfies Meta<typeof NavList>;

export default meta;
type Story = StoryObj<typeof meta>;

const groups = [
	{
		label: "アカウント",
		items: [
			{ id: "profile", label: "プロフィール", icon: <User /> },
			{ id: "security", label: "ログインと安全", icon: <ShieldCheck /> },
			{ id: "passkeys", label: "パスキー", icon: <KeyRound />, badge: <Badge>2</Badge> },
			{ id: "connections", label: "連携しているアプリ", icon: <Link2 /> },
		],
	},
	{
		label: "このアプリ",
		items: [
			{ id: "appearance", label: "見た目", icon: <Palette /> },
			{ id: "notifications", label: "通知", icon: <Bell />, badge: <Badge variant="brand">3</Badge> },
			{ id: "billing", label: "支払い", icon: <CreditCard /> },
		],
	},
];

function Sidebar({ initial = "profile" }: { initial?: string }) {
	const [active, setActive] = useState(initial);
	return (
		<div className="flex gap-8">
			<NavList className="w-60" aria-label="設定">
				{groups.map((g) => (
					<NavListGroup key={g.label}>
						<NavListLabel>{g.label}</NavListLabel>
						{g.items.map((item) => (
							<NavListItem
								key={item.id}
								href={`#${item.id}`}
								icon={item.icon}
								badge={item.badge}
								active={active === item.id}
								onClick={(e) => {
									e.preventDefault();
									setActive(item.id);
								}}
							>
								{item.label}
							</NavListItem>
						))}
					</NavListGroup>
				))}
				<NavListGroup>
					<NavListItem href="#delete" icon={<Trash2 />} disabled>
						アカウントの削除
					</NavListItem>
				</NavListGroup>
			</NavList>
			<p className="pt-6 text-sm text-fg-muted">開いているページ: {active}</p>
		</div>
	);
}

/** 項目を押すと、選択中の背景が今の項目から次の項目へ滑って移る */
export const Basic: Story = {
	name: "基本",
	render: () => <Sidebar />,
};

/** アイコンもまとまりの見出しもない、いちばん簡素な形 */
export const Plain: Story = {
	name: "アイコンなし",
	render: function Render() {
		const [active, setActive] = useState("general");
		const items = [
			["general", "一般"],
			["members", "メンバー"],
			["export", "書き出し"],
		] as const;
		return (
			<NavList className="w-48">
				<NavListGroup>
					{items.map(([id, label]) => (
						<NavListItem
							key={id}
							href={`#${id}`}
							active={active === id}
							onClick={(e) => {
								e.preventDefault();
								setActive(id);
							}}
						>
							{label}
						</NavListItem>
					))}
				</NavListGroup>
			</NavList>
		);
	},
};

/** 選択中、通常（hover で背景が明るくなる）、件数付き、無効 */
export const States: Story = {
	name: "状態",
	render: () => (
		<NavList className="w-60">
			<NavListGroup>
				<NavListItem href="#" icon={<User />} active>
					選択中
				</NavListItem>
				<NavListItem href="#" icon={<Bell />}>
					通常
				</NavListItem>
				<NavListItem href="#" icon={<Bell />} badge={<Badge variant="brand">12</Badge>}>
					件数付き
				</NavListItem>
				<NavListItem href="#" icon={<Trash2 />} disabled>
					無効
				</NavListItem>
			</NavListGroup>
		</NavList>
	),
};

/** Tab で項目を順に移り、Enter で開く。今のページには aria-current="page" が付く */
export const KeyboardNavigation: Story = {
	name: "キーボード操作",
	render: () => <Sidebar />,
	play: async ({ canvas }) => {
		const profile = canvas.getByRole("link", { name: "プロフィール" });
		await expect(profile).toHaveAttribute("aria-current", "page");
		await userEvent.tab();
		await expect(profile).toHaveFocus();
		await userEvent.tab();
		const security = canvas.getByRole("link", { name: "ログインと安全" });
		await expect(security).toHaveFocus();
		await userEvent.keyboard("{Enter}");
		await expect(security).toHaveAttribute("aria-current", "page");
		await expect(profile).not.toHaveAttribute("aria-current");
		await expect(canvas.getByRole("group", { name: "アカウント" })).toBeInTheDocument();
	},
};

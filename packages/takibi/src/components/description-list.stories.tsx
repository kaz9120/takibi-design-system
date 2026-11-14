import type { Meta, StoryObj } from "@storybook/react-vite";
import type { ComponentDocs } from "../spec";
import { Badge } from "./badge";
import { Button } from "./button";
import { Card, CardContent, CardHeader, CardTitle } from "./card";
import { DescriptionDetails, DescriptionItem, DescriptionList, DescriptionTerm } from "./description-list";

const meta = {
	title: "コンポーネント/データ表示/DescriptionList",
	component: DescriptionList,
	argTypes: {
		layout: { control: "inline-radio", options: ["horizontal", "stacked"] },
	},
	parameters: {
		takibi: {
			use: ["アカウントの設定や詳細の画面で、項目名と値の組を読ませる"],
			avoid: [
				{ case: "値をその場で書き換えさせる", instead: "フォーム/Field" },
				{ case: "複数の行を列で比べる", instead: "データ表示/Table" },
				{ case: "項目名のない並び", instead: "データ表示/List" },
			],
			dos: [
				'狭い幅やカードの中では layout="stacked" にする',
				"値を変える操作は、値の横に ghost のボタンで添える",
				"日付や金額には tabular-nums を付けて桁をそろえる",
			],
			donts: ["値の欄に長い文章を入れない", "項目名を省いて値だけを並べない"],
			copy: {
				rules: ["項目名は名詞で短く書く（表示名、登録日）"],
			},
			a11y: ["dl・dt・dd で組むので、スクリーンリーダーで項目名と値の組が伝わる"],
			related: ["データ表示/Table", "データ表示/List", "データ表示/Card", "フォーム/Field"],
		} satisfies ComponentDocs,
	},
	render: (args) => (
		<DescriptionList {...args} className="w-[560px]">
			<DescriptionItem>
				<DescriptionTerm>表示名</DescriptionTerm>
				<DescriptionDetails>山本 一真</DescriptionDetails>
			</DescriptionItem>
			<DescriptionItem>
				<DescriptionTerm>メールアドレス</DescriptionTerm>
				<DescriptionDetails>
					kazumasa@hidoko.dev
					<Badge variant="success">確認済み</Badge>
				</DescriptionDetails>
			</DescriptionItem>
			<DescriptionItem>
				<DescriptionTerm>プラン</DescriptionTerm>
				<DescriptionDetails>焚き火（月 480円）</DescriptionDetails>
			</DescriptionItem>
			<DescriptionItem>
				<DescriptionTerm>登録日</DescriptionTerm>
				<DescriptionDetails className="tabular-nums">2025年3月14日</DescriptionDetails>
			</DescriptionItem>
		</DescriptionList>
	),
} satisfies Meta<typeof DescriptionList>;

export default meta;
type Story = StoryObj<typeof meta>;

/** 項目名を左、値を右に置く。アカウントの設定画面の基本の形 */
export const Horizontal: Story = { name: "横並び" };

/** 項目名を上に置く。狭い幅やカードの中で使う */
export const Stacked: Story = { name: "縦積み", args: { layout: "stacked" } };

/** 設定のカードの中に置き、値の横に変えるボタンを添える */
export const InCard: Story = {
	name: "カードの中",
	render: () => (
		<Card className="w-[560px]">
			<CardHeader>
				<CardTitle>アカウント</CardTitle>
			</CardHeader>
			<CardContent>
				<DescriptionList>
					<DescriptionItem>
						<DescriptionTerm>ユーザー名</DescriptionTerm>
						<DescriptionDetails className="justify-between">
							@kyamamoto
							<Button variant="ghost" size="sm">
								変える
							</Button>
						</DescriptionDetails>
					</DescriptionItem>
					<DescriptionItem>
						<DescriptionTerm>パスワード</DescriptionTerm>
						<DescriptionDetails className="justify-between">
							<span className="text-fg-muted">32日前に変更</span>
							<Button variant="ghost" size="sm">
								変える
							</Button>
						</DescriptionDetails>
					</DescriptionItem>
					<DescriptionItem>
						<DescriptionTerm>2 段階認証</DescriptionTerm>
						<DescriptionDetails className="justify-between">
							<Badge variant="neutral">未設定</Badge>
							<Button variant="ghost" size="sm">
								設定する
							</Button>
						</DescriptionDetails>
					</DescriptionItem>
				</DescriptionList>
			</CardContent>
		</Card>
	),
};

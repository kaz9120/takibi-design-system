import type { Meta, StoryObj } from "@storybook/react-vite";
import type { ComponentDocs } from "../spec";
import { Skeleton } from "./skeleton";

const meta = {
	title: "コンポーネント/データ表示/Skeleton",
	component: Skeleton,
	parameters: {
		takibi: {
			use: ["読み込み中に、読み込んだあとの形と大きさで場所を確保する"],
			avoid: [
				{ case: "進み具合が分かる待ち", instead: "フィードバック/Progress" },
				{ case: "ボタンを押したあとの送信中", instead: "アクション/Button" },
				{ case: "画像の読み込み。Image が自分で待つ面を出す", instead: "データ表示/Image" },
			],
			dos: [
				"読み込んだあとの形に合わせて組む。届いてもレイアウトがずれない",
				"囲む要素に aria-busy を付けるなど、待っていることを別に伝える",
			],
			donts: [
				"読み込みがすぐ終わる場面で出さない。一瞬だけ出ると、ちらついて見える",
				"形の違う汎用の帯だけを並べない",
			],
			a11y: ["Skeleton は aria-hidden なので読み上げない。待っていることは aria-busy などで伝える"],
			motion: [
				"ブランドカラーを薄く混ぜた帯が、1.8 秒で左から右へ流れ続ける（motion-ember-pulse、ease-breath）",
				"動きを減らす設定では、帯は流れない",
			],
			related: ["データ表示/Image", "フィードバック/Progress", "フィードバック/EmptyState"],
		} satisfies ComponentDocs,
	},
} satisfies Meta<typeof Skeleton>;

export default meta;
type Story = StoryObj<typeof meta>;

/** ブランドカラーを薄く混ぜた帯が、1.8 秒で左から右へ流れる */
export const Basic: Story = {
	name: "基本",
	args: { className: "h-4 w-64" },
};

/** 読み込んだあとの形に合わせて組む。カードの例 */
export const CardShape: Story = {
	name: "カードの形",
	render: () => (
		<div
			aria-busy
			className="flex max-w-sm flex-col gap-4 rounded-lg border border-line-subtle bg-surface-raised p-5"
		>
			<div className="flex items-center gap-3">
				<Skeleton className="size-10 rounded-full" />
				<div className="flex flex-1 flex-col gap-2">
					<Skeleton className="h-4 w-1/2" />
					<Skeleton className="h-3 w-1/3" />
				</div>
			</div>
			<Skeleton className="h-24 w-full rounded-lg" />
			<div className="flex flex-col gap-2">
				<Skeleton className="h-3 w-full" />
				<Skeleton className="h-3 w-5/6" />
			</div>
		</div>
	),
};

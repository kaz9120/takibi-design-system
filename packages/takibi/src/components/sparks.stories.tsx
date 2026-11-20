import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import type { ComponentDocs } from "../spec";
import { Button } from "./button";
import { Sparks } from "./sparks";

const meta = {
	title: "コンポーネント/フィードバック/Sparks",
	component: Sparks,
	parameters: {
		takibi: {
			summary: "完了の瞬間に、親の上の縁から火の粉を数個だけ飛ばす。",
			use: ["保存や送信など、利用者が待っていた処理が終わった瞬間を知らせる"],
			avoid: [
				{
					case: "送信するボタン。status を渡すと、自分で右上の角の 1 点から火の粉を出す",
					instead: "アクション/Button",
				},
				{ case: "完了を文言で知らせる", instead: "フィードバック/Toast" },
			],
			dos: [
				"親を position: relative にして、完了したときだけ描画する",
				"もう一度出すときは key を変えて描画し直す",
			],
			donts: [
				"1 つの操作で 2 か所以上に出さない",
				"hover や選択など、完了ではない操作に使わない",
				"火の粉だけで完了を伝えない。文言かアイコンを添える",
			],
			a11y: ["aria-hidden なので読み上げない。完了は文言で別に伝える"],
			motion: [
				"火の粉は上の縁から飛ぶ。3 割は小さい粒で、26〜44px まで速く上がって 280〜460ms で消える。残りは大きい粒で、14〜26px までゆっくり上がって 520〜830ms で消える",
				"横の動きは最初の 30% でほぼ止まり、縦は最後まで上がり続けるので、軌道は上へ曲がる",
				"色は heat-core から heat-ash まで順に変わり、途中で 2 回、明るさが落ちて戻る",
				"飛ぶ先、速さ、大きさは描画のたびに変わる",
				'from="corner" では、右上の角の 1 点から、真上から右へ 60 度、左へ 35 度までの扇形に飛ぶ',
				"縁から外へ 10px 広がる光（motion-flare）が 900ms で消える。flare={false} で外せる",
				"動きを減らす設定では何も見えない",
			],
			related: ["アクション/Button", "フィードバック/Toast", "フィードバック/Progress"],
		} satisfies ComponentDocs,
	},
} satisfies Meta<typeof Sparks>;

export default meta;
type Story = StoryObj<typeof meta>;

/** 押すたびに、面の上の縁から火の粉が 7 つ飛ぶ。飛ぶ先と速さは毎回変わる */
export const Basic: Story = {
	name: "基本",
	render: function Render(args) {
		const [count, setCount] = useState(0);
		return (
			<div className="flex flex-col items-start gap-10 pt-12">
				<div className="relative rounded-lg border border-line bg-surface-raised px-6 py-4 text-sm text-fg-strong">
					記録を保存した
					{count > 0 && <Sparks key={count} {...args} />}
				</div>
				<Button variant="secondary" size="sm" onClick={() => setCount((c) => c + 1)}>
					もう一度
				</Button>
			</div>
		);
	},
};

function Compare({ from, label }: { from: "edge" | "corner"; label: string }) {
	const [count, setCount] = useState(0);
	return (
		<div className="flex flex-col items-start gap-3">
			<span className="text-sm text-fg-muted">{label}</span>
			<Button onClick={() => setCount((c) => c + 1)}>
				保存した
				{count > 0 && <Sparks key={count} count={6} from={from} />}
			</Button>
		</div>
	);
}

/** 火の粉の出どころを比べる。左は上の縁の全体から、右は右上の角の 1 点から扇形に飛ぶ。押すたびに飛ぶ */
export const Origins: Story = {
	name: "出どころ",
	render: () => (
		<div className="flex gap-16 pt-14">
			<Compare from="edge" label='from="edge"（既定）' />
			<Compare from="corner" label='from="corner"' />
		</div>
	),
};

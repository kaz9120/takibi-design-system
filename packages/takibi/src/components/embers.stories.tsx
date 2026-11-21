import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import "../embers";
import { Slider } from "./slider";

const meta = {
	title: "コンポーネント/ブランドの演出/takibi-embers",
	tags: ["!autodocs"],
	parameters: {
		takibi: {
			summary:
				"火の粉が下の端から昇る背景を描くカスタム要素。火は要素の下の端の外にあるものとして、火の粉だけを描く。",
			import: 'import "takibi-design-system/embers";',
			use: ["トップページの見出しの背景", "ログイン画面や空の状態など、文字の少ない面の背景"],
			avoid: [
				{ case: "炎そのものを見せる", instead: "ブランドの演出/takibi-fire" },
				{ case: "完了の瞬間を知らせる", instead: "フィードバック/Sparks" },
			],
			dos: [
				"親を position: relative にする",
				"上に重ねる文字やボタンにも position: relative を付け、前に出す",
			],
			donts: [
				"焚き火（takibi-fire）と同じ画面に置かない。合わせて 1 画面に 1 つまで",
				"表や長い本文の後ろに置かない",
			],
			api: [
				{
					title: "属性",
					rows: [
						["density", "火の粉の多さ。既定 45。45 のとき、平均 0.4 秒に 1 回、1〜4 個が飛ぶ"],
						["wind", "横方向の風。-1〜1、既定 0。1 で毎秒 0.6m"],
						["glow", '下の端の淡い光。"on"（既定）か "off"'],
					],
				},
			],
			a11y: [
				"背景として置く。ポインターの操作は受けず、読み上げる内容も持たない",
				"動きを減らす設定では、火の粉を描かずに下の端の光だけを残す",
			],
			motion: [
				"要素の高さを 1.8m として、焚き火の計算モデルの火の粉と同じ式で動かす",
				"飛び出した粒は 0.12 秒ほどで気流に乗る。小さい粒は 0.8 秒、大きい粒は 2.4 秒ほどで消える",
				"色は粒の温度で決まり、冷えるにつれて黄から赤へ変わる",
				"画面の外にある間は止まる",
			],
			related: ["ブランドの演出/takibi-fire", "ブランドの演出/takibi-stars"],
		},
	},
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

/** 見出しの後ろに置いた火の粉。スライダーで多さ（`density`）を 0 から 150 まで変えられる。 */
export const Default: Story = {
	name: "基本",
	render: function Render() {
		const [density, setDensity] = useState(45);
		return (
			<div className="flex flex-col gap-4">
				<div className="relative flex h-[24rem] flex-col items-center justify-center gap-3 overflow-hidden rounded-xl border border-line-subtle bg-surface">
					<takibi-embers density={density} wind={0.15} />
					<span className="relative font-mono text-xs tracking-mark text-fg-subtle uppercase">Takibi</span>
					<p className="relative text-3xl font-semibold tracking-tight text-fg-strong">
						静かに燃える、手元の道具
					</p>
				</div>
				<div className="flex w-64 items-center gap-3 text-sm text-fg-muted">
					<span className="shrink-0">多さ</span>
					<Slider
						aria-label="火の粉の多さ"
						min={0}
						max={150}
						step={5}
						value={density}
						onValueChange={(v) => setDensity(v as number)}
					/>
					<span className="w-8 font-mono text-fg tabular-nums">{density}</span>
				</div>
			</div>
		);
	},
};

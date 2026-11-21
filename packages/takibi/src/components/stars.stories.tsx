import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import "../stars";
import { Slider } from "./slider";

const meta = {
	title: "コンポーネント/ブランドの演出/takibi-stars",
	tags: ["!autodocs"],
	parameters: {
		takibi: {
			summary:
				"星空の背景を描くカスタム要素。浅間山麓（北緯 36.4 度）の秋分の日の空を、実在の星のカタログから計算して 1 回だけ描く。",
			import: 'import "takibi-design-system/stars";',
			use: ["夜のテーマの、見出しや空の状態の背景", "焚き火（takibi-fire）の上の空"],
			avoid: [{ case: "昼のテーマで背景を飾る（昼は星が消える）" }],
			dos: [
				"親を position: relative にする",
				"焚き火と重ねるときは mask-image で下の側を消し、地面に星が写らないようにする",
				"アプリのクレジットに、星のデータの出典を載せる",
			],
			donts: ["星を動かしたり、またたかせたりしない", "表や長い本文の後ろに置かない"],
			api: [
				{
					title: "属性",
					rows: [
						["hour", '見上げる時刻。0〜24、既定 21。"now" にすると今の時刻に合わせ、1 分ごとに描き直す'],
						["azimuth", "向く方角（度）。北が 0、東が 90、既定 180（南）"],
						["altitude", "見上げる角度（度）。既定 40"],
					],
				},
				{
					title: "出典の表示",
					rows: [
						[
							'customElements.get("takibi-stars").credit',
							"星のデータの出典とライセンスの文。HYG Database v4.4（David Nash）から抜き出して改変したもので、CC BY-SA 4.0",
						],
					],
				},
			],
			a11y: ["背景として置く。ポインターの操作は受けず、読み上げる内容も持たない"],
			motion: [
				"動かない。描き直すのは、大きさか属性が変わったときだけ",
				"夜のテーマでだけ見える。薄明の間はその分だけ薄くなり、昼のテーマでは消える",
			],
			related: ["ブランドの演出/takibi-fire", "ブランドの演出/takibi-embers"],
		},
	},
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

const clock = (h: number) => `${Math.floor(h)}:${String(Math.round((h % 1) * 60)).padStart(2, "0")}`;

/**
 * 21 時に南を 40 度見上げた空。5.0 等より明るい 1637 個の星から、地平線より上にあるものを描く。
 * スライダーで時刻を変えると、星が東（左）から西（右）へ、1 時間に 15 度回る。昼のテーマでは見えない。
 */
export const Default: Story = {
	name: "基本",
	render: function Render() {
		const [hour, setHour] = useState(21);
		return (
			<div className="flex flex-col gap-4">
				<div className="relative flex h-[24rem] flex-col items-center overflow-hidden rounded-xl border border-line-subtle bg-surface">
					<takibi-stars hour={hour} />
					<p className="relative pt-10 text-3xl font-semibold tracking-tight text-fg-strong">
						静かに燃える、手元の道具
					</p>
				</div>
				<div className="flex w-64 items-center gap-3 text-sm text-fg-muted">
					<span className="shrink-0">時刻</span>
					<Slider
						aria-label="時刻"
						min={18.5}
						max={29.5}
						step={0.25}
						value={hour}
						onValueChange={(v) => setHour(v as number)}
					/>
					<span className="w-12 font-mono text-fg tabular-nums">{clock(hour % 24)}</span>
				</div>
				<p className="max-w-xl text-sm text-fg-muted">
					星のデータ: HYG Database v4.4（David Nash、https://codeberg.org/astronexus/hyg
					）から抜き出して改変したもの。CC BY-SA 4.0（https://creativecommons.org/licenses/by-sa/4.0/ ）。
				</p>
			</div>
		);
	},
};

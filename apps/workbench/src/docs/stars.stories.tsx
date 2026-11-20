import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import "takibi-design-system/fire";
import "takibi-design-system/stars";
import { Slider } from "takibi-design-system";
import { Page } from "./catalog";

const meta = {
	title: "ブランドの演出/星空",
	tags: ["!autodocs"],
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

const clock = (h: number) => `${Math.floor(h)}:${String(Math.round((h % 1) * 60)).padStart(2, "0")}`;

/**
 * 星空。`import "takibi-design-system/stars"` で `<takibi-stars>` が使えるようになる。
 * 浅間山麓（北緯 36.4 度）の秋分の日に、南を 40 度見上げたときの星を、実在の星のカタログ（5.0 等より明るい 1637 個）から計算して 1 回だけ描く。
 * 星は動かず、またたかない。夜のテーマでだけ見え、薄明の間は薄くなる。親に position: relative が要る。
 * スライダーで時刻を変えると、星が東（左）から西（右）へ、1 時間に 15 度回る。
 */
export const Stars: Story = {
	name: "星空",
	render: function Render() {
		const [hour, setHour] = useState(21);
		return (
			<Page>
				<div className="relative flex h-[30rem] flex-col items-center overflow-hidden rounded-xl border border-line-subtle bg-surface">
					<takibi-stars hour={hour} />
					<div className="pointer-events-none relative flex flex-col items-center gap-2 pt-10">
						<span className="font-mono text-xs tracking-mark text-fg-subtle uppercase">Takibi</span>
						<h1 className="text-3xl font-semibold tracking-tight text-fg-strong">静かに燃える、手元の道具</h1>
					</div>
				</div>
				<div className="flex w-64 items-center gap-3">
					<Slider
						aria-label="時刻"
						min={18.5}
						max={29.5}
						step={0.25}
						value={hour}
						onValueChange={(v) => setHour(v as number)}
					/>
					<span className="w-12 font-mono text-sm text-fg-muted tabular-nums">{clock(hour % 24)}</span>
				</div>
				<p className="max-w-xl text-sm text-fg-muted">
					星のデータ: HYG Database v4.4（David Nash、https://codeberg.org/astronexus/hyg
					）から抜き出して改変したもの。CC BY-SA 4.0（https://creativecommons.org/licenses/by-sa/4.0/ ）。
				</p>
			</Page>
		);
	},
};

/** 使う場所の例。夜のテーマの見出しで、上に星空、下に焚き火を置く。星空は mask-image で、高さの 35% から 70% にかけて消し、地面に星が写らないようにする。昼のテーマでは星空が消え、焚き火だけが残る */
export const WithFire: Story = {
	name: "焚き火と重ねる",
	render: () => (
		<Page>
			<div className="relative flex h-[34rem] flex-col items-center overflow-hidden rounded-xl border border-line-subtle bg-surface">
				<takibi-stars className="[mask-image:linear-gradient(to_bottom,black_35%,transparent_70%)]" />
				<takibi-fire />
				<div className="pointer-events-none relative flex flex-col items-center gap-2 pt-10">
					<span className="font-mono text-xs tracking-mark text-fg-subtle uppercase">Takibi</span>
					<h1 className="text-3xl font-semibold tracking-tight text-fg-strong">静かに燃える、手元の道具</h1>
				</div>
			</div>
			<p className="max-w-xl text-sm text-fg-muted">
				星のデータ: HYG Database v4.4（David Nash、https://codeberg.org/astronexus/hyg
				）から抜き出して改変したもの。CC BY-SA 4.0（https://creativecommons.org/licenses/by-sa/4.0/ ）。
			</p>
		</Page>
	),
};

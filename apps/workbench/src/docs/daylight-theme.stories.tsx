import type { Meta, StoryObj } from "@storybook/react-vite";
import { useEffect, useState } from "react";
import "takibi-design-system/fire";
import {
	applySky,
	Button,
	DAYLIGHT_SITE,
	InteractiveCard,
	InteractiveCardDescription,
	InteractiveCardTitle,
	Slider,
	setWeather,
	skyAt,
	ToggleGroup,
	ToggleGroupItem,
	type Weather,
} from "takibi-design-system";
import { Page, Section } from "./catalog";

const meta = {
	title: "ブランドの演出/時刻と天気",
	tags: ["!autodocs"],
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

const swatches = [
	["surface", "bg-surface"],
	["surface-raised", "bg-surface-raised"],
	["surface-overlay", "bg-surface-overlay"],
	["surface-sunken", "bg-surface-sunken"],
	["line", "bg-line"],
	["line-strong", "bg-line-strong"],
	["fg-muted", "bg-fg-muted"],
	["fg", "bg-fg"],
	["brand", "bg-brand"],
] as const;

const clock = (h: number) =>
	`${String(Math.floor(h)).padStart(2, "0")}:${String(Math.round((h % 1) * 60)).padStart(2, "0")}`;

/**
 * 時刻のつまみを動かすと、その時刻の空の状態を画面全体に当てる。5 時 45 分に昼、18 時 15 分に夜へ切り替わる。
 * 夜は薄明に近いほど面に青が乗り、昼は日の出・日の入りに近いほど面が暖かい色に寄る。曇りにすると色みが抜ける。
 * ブランドカラーは、時刻でも天気でも変わらない。
 */
export const Clock: Story = {
	name: "24 時間の色",
	render: function Render() {
		const [hours, setHours] = useState(21);
		const [weather, setW] = useState<Weather>("clear");
		const sky = skyAt(hours);
		useEffect(() => {
			applySky(skyAt(hours));
		}, [hours]);
		useEffect(() => {
			setWeather(weather);
		}, [weather]);
		// ほかのストーリーへ移るときに、空の状態を元に戻す
		useEffect(
			() => () => {
				document.documentElement.style.removeProperty("--sky-phase");
				setWeather("clear");
			},
			[],
		);
		return (
			<Page>
				<Section
					title="24 時間の色"
					description={`場所と日付は固定（${DAYLIGHT_SITE.name}）。太陽は 6 時に出て 18 時に沈み、12 時に高度 53.6 度で最も高くなる。面、文字、枠線の明るさは変えず、色相と彩度だけを空に合わせるので、文字と面の明るさの比はどの時刻でも変わらない。`}
				>
					<div className="flex flex-wrap items-center gap-6">
						<div className="w-80">
							<Slider
								aria-label="時刻"
								min={0}
								max={24}
								step={0.25}
								value={hours}
								onValueChange={(v) => setHours(v as number)}
							/>
						</div>
						<span className="font-mono text-sm text-fg-strong tabular-nums">{clock(hours)}</span>
						<ToggleGroup
							variant="segmented"
							size="sm"
							aria-label="天気"
							value={[weather]}
							onValueChange={(v) => v[0] && setW(v[0] as Weather)}
						>
							<ToggleGroupItem value="clear">晴れ</ToggleGroupItem>
							<ToggleGroupItem value="cloudy">曇り</ToggleGroupItem>
						</ToggleGroup>
					</div>
					<p className="font-mono text-sm text-fg-muted tabular-nums">
						太陽の高度 {sky.elevation.toFixed(1)}° ・ テーマ {sky.theme === "light" ? "昼" : "夜"} ・
						--sky-phase {sky.phase.toFixed(2)}
					</p>
					<div className="grid grid-cols-3 gap-3 sm:grid-cols-9">
						{swatches.map(([name, cls]) => (
							<div key={name} className="flex flex-col gap-1.5">
								<div className={`h-14 rounded-md border border-line-subtle ${cls}`} />
								<code className="font-mono text-xs text-fg-muted">{name}</code>
							</div>
						))}
					</div>
				</Section>
				<Section
					title="部品での見え方"
					description="面、文字、枠線が空の色で動き、ブランドカラーのボタンと焚き火は変わらない。"
				>
					<div className="grid gap-4 md:grid-cols-[1fr_1fr]">
						<div className="relative flex h-72 flex-col items-center overflow-hidden rounded-xl border border-line-subtle bg-surface">
							<takibi-fire />
							<div className="pointer-events-none relative pt-6 text-center">
								<h2 className="text-xl font-semibold text-fg-strong">火のそばで、手を動かす</h2>
							</div>
						</div>
						<div className="flex flex-col gap-3">
							<InteractiveCard>
								<InteractiveCardTitle>焚き火の記録</InteractiveCardTitle>
								<InteractiveCardDescription>
									浅間山麓、標高 1200m。薪はナラ、6 本。
								</InteractiveCardDescription>
							</InteractiveCard>
							<div className="rounded-lg border border-line bg-surface-raised p-5">
								<p className="text-base text-fg">本文の文字。面との明るさの比は 14:1 以上。</p>
								<p className="mt-1 text-sm text-fg-muted">補足の文字。面との明るさの比は 5.9:1 以上。</p>
								<div className="mt-4 flex gap-2">
									<Button>記録を書く</Button>
									<Button variant="secondary">あとで</Button>
								</div>
							</div>
						</div>
					</div>
				</Section>
			</Page>
		);
	},
};

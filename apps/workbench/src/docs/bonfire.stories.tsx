import type { Meta, StoryObj } from "@storybook/react-vite";
import { Flame } from "lucide-react";
import { useState } from "react";
import "takibi-design-system/fire";
import {
	Button,
	type ButtonStatus,
	InteractiveCard,
	InteractiveCardArrow,
	InteractiveCardDescription,
	InteractiveCardTitle,
	Skeleton,
	Slider,
} from "takibi-design-system";
import { Page, Section } from "./catalog";

const meta = {
	title: "ブランドの演出/焚き火",
	tags: ["!autodocs"],
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

const heat = [
	["heat-core", "芯", "生まれた瞬間、最も近い所"],
	["heat-flame", "炎", "光の内側"],
	["heat-ember", "熾火", "ブランドカラーと同じ"],
	["heat-coal", "冷め始め", "光の外側"],
	["heat-ash", "灰", "消える直前"],
] as const;

/**
 * 焚き火。`import "takibi-design-system/fire"` で `<takibi-fire>` が使えるようになる。
 * 太い丸太 2 本の間に、割った薪を 2 段でくべたロングファイヤー型の焚き火を、薪の向きから 28 度横、12 度見下ろした位置から映す。
 * 絵と動きは焚き火の計算モデルから書き出したもので、実行時は 4 つの層（下地、炎の光、炎と火の粉の動画）を重ねるだけ。
 * 親に position: relative が要る。1 画面に 1 つまで。スライダーで、炎と、炎が薪と地面を照らす光の濃さが変わる。
 */
export const Fire: Story = {
	render: function Render() {
		const [intensity, setIntensity] = useState(0.8);
		return (
			<Page>
				<div className="relative flex h-[30rem] flex-col items-center overflow-hidden rounded-xl border border-line-subtle bg-surface">
					<takibi-fire intensity={intensity} />
					<div className="pointer-events-none relative flex flex-col items-center gap-2 pt-10">
						<span className="font-mono text-xs tracking-mark text-fg-subtle uppercase">Takibi</span>
						<h1 className="text-3xl font-semibold tracking-tight text-fg-strong">静かに燃える、手元の道具</h1>
					</div>
				</div>
				<div className="w-64">
					<Slider
						aria-label="火の強さ"
						min={0}
						max={1}
						step={0.05}
						value={intensity}
						onValueChange={(v) => setIntensity(v as number)}
					/>
				</div>
			</Page>
		);
	},
};

/** 使う場所の例。記録が 1 件もない画面で、高さ 160px の焚き火を説明の上に置く */
export const InEmptyState: Story = {
	name: "空の状態に置く",
	render: () => (
		<Page>
			<div className="mx-auto flex w-full max-w-md flex-col items-center gap-4 rounded-xl border border-line-subtle bg-surface-raised px-8 py-10 text-center">
				<div className="relative h-40 w-full">
					<takibi-fire />
				</div>
				<div className="flex flex-col gap-1">
					<h2 className="text-lg font-semibold text-fg-strong">まだ記録がない</h2>
					<p className="text-sm text-fg-muted">焚き火をしたら、日付と場所を残す。</p>
				</div>
				<Button>記録を書く</Button>
			</div>
		</Page>
	),
};

function Demo({
	name,
	title,
	use,
	children,
}: {
	name: string;
	title: string;
	use: string;
	children: React.ReactNode;
}) {
	return (
		<div className="flex flex-col gap-3 rounded-lg border border-line-subtle bg-surface-raised p-5">
			<div className="flex flex-col gap-0.5">
				<div className="flex items-baseline gap-2">
					<span className="text-base font-semibold text-fg-strong">{title}</span>
					<code className="font-mono text-xs text-fg-subtle">{name}</code>
				</div>
				<span className="text-sm text-fg-muted">{use}</span>
			</div>
			<div className="flex min-h-36 flex-col items-start justify-center gap-3">{children}</div>
		</div>
	);
}

function SparkDemo() {
	const [status, setStatus] = useState<ButtonStatus>("idle");
	const run = () => {
		setStatus("loading");
		window.setTimeout(() => setStatus("success"), 900);
		window.setTimeout(() => setStatus("idle"), 2600);
	};
	return (
		<Button status={status} loadingLabel="保存中" successLabel="保存した" onClick={run}>
			保存する
		</Button>
	);
}

/** 焚き火から取った 4 つの決まり（温度、余熱、ゆらぎ、浮力）を、単体で見せる */
export const Principles: Story = {
	render: () => (
		<Page>
			<Section
				title="温度"
				description="光、火の粉、炎は、時間と距離で左から右の順に色を変える。昼は全体を暗い側へずらす。文字や面の色には使わない。"
			>
				<div className="grid grid-cols-5 gap-3">
					{heat.map(([name, label, use]) => (
						<div key={name} className="flex flex-col gap-2">
							<div
								className="h-16 rounded-md border border-line-subtle"
								style={{ backgroundColor: `var(--color-${name})` }}
							/>
							<code className="font-mono text-sm text-fg-strong">{name}</code>
							<span className="text-xs text-fg-muted">
								{label} ・ {use}
							</span>
						</div>
					))}
				</div>
			</Section>
			<div className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-4">
				<Demo
					name="motion-afterglow"
					title="余熱"
					use="hover の光は 120ms で出て、離れると 560ms かけて消える。Button が使う"
				>
					<Button>乗せて、離す</Button>
				</Demo>
				<Demo
					name="motion-warmth"
					title="手元の光"
					use="ポインターの位置を中心に、半径 220px の淡い光が面に乗る。InteractiveCard が使う"
				>
					<InteractiveCard className="w-full">
						<InteractiveCardTitle>
							焚き火の記録
							<InteractiveCardArrow />
						</InteractiveCardTitle>
						<InteractiveCardDescription>ポインターを動かす</InteractiveCardDescription>
					</InteractiveCard>
				</Demo>
				<Demo
					name="motion-flicker"
					title="ゆらぎ"
					use="明るさは 4.7 秒に山が 4 つ、大きさは 1.3 秒、位置は 2.9 秒の周期で動く。値は焚き火の計算モデルの炎を測って決めた。光の飾りだけに使う"
				>
					<div className="relative flex size-20 items-center justify-center">
						<span className="motion-flicker absolute inset-0 rounded-full bg-[radial-gradient(circle,color-mix(in_oklab,var(--color-heat-flame)_45%,transparent),color-mix(in_oklab,var(--color-heat-coal)_22%,transparent)_45%,transparent_70%)]" />
						<Flame className="relative size-6 text-brand" />
					</div>
				</Demo>
				<Demo
					name="Sparks"
					title="はぜる"
					use="完了の瞬間に、火の粉が上の縁から飛ぶ。飛ぶ先と速さは毎回変わり、色は heat-core から heat-ash まで順に変わる"
				>
					<SparkDemo />
				</Demo>
				<Demo
					name="motion-ember-pulse"
					title="読み込み中の面"
					use="濃い帯が 2.9 秒、薄い帯が 4.7 秒で逆向きに流れ、重なった所が明るくなる"
				>
					<div className="flex w-full flex-col gap-2">
						<Skeleton className="h-4 w-3/4" />
						<Skeleton className="h-4 w-full" />
						<Skeleton className="h-4 w-1/2" />
					</div>
				</Demo>
				<Demo
					name="shadow-glow"
					title="光の距離"
					use="光は内側ほど明るく黄色く、外側ほど暗く赤い。左から soft、標準、strong"
				>
					<div className="flex gap-6 p-3">
						<div className="size-14 rounded-lg border border-line-subtle bg-surface-overlay shadow-glow-soft" />
						<div className="size-14 rounded-lg border border-line-subtle bg-surface-overlay shadow-glow" />
						<div className="size-14 rounded-lg border border-line-subtle bg-surface-overlay shadow-glow-strong" />
					</div>
				</Demo>
			</div>
		</Page>
	),
};

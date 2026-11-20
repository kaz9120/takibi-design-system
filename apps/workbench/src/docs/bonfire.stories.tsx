import type { Meta, StoryObj } from "@storybook/react-vite";
import { Flame } from "lucide-react";
import { useEffect, useRef, useState } from "react";
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
import type { TakibiFireElement, TakibiFireState } from "takibi-design-system/fire";
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

/** 見出しを重ねた焚き火の枠 */
function Hearth({ children, className = "h-[30rem]" }: { children: React.ReactNode; className?: string }) {
	return (
		<div
			className={`relative flex flex-col items-center overflow-hidden rounded-xl border border-line-subtle bg-surface ${className}`}
		>
			{children}
			<div className="pointer-events-none relative flex flex-col items-center gap-2 pt-10">
				<span className="font-mono text-xs tracking-mark text-fg-subtle uppercase">Takibi</span>
				<h1 className="text-3xl font-semibold tracking-tight text-fg-strong">静かに燃える、手元の道具</h1>
			</div>
		</div>
	);
}

function Dial({
	label,
	value,
	onChange,
	min,
	max,
	step,
	format,
}: {
	label: string;
	value: number;
	onChange: (v: number) => void;
	min: number;
	max: number;
	step: number;
	format: (v: number) => string;
}) {
	return (
		<div className="flex flex-col gap-1.5">
			<div className="flex items-baseline justify-between text-sm">
				<span className="text-fg-muted">{label}</span>
				<span className="font-mono text-fg tabular-nums">{format(value)}</span>
			</div>
			<Slider
				aria-label={label}
				min={min}
				max={max}
				step={step}
				value={value}
				onValueChange={(v) => onChange(v as number)}
			/>
		</div>
	);
}

const eventNames = {
	ready: "描き方が決まった",
	stoke: "薪をくべた",
	break: "薪が折れた",
	ember: "薪が熾になった",
	low: "薪がなくなった",
} as const;

/**
 * 焚き火。`import "takibi-design-system/fire"` で `<takibi-fire>` が使えるようになる。
 * 太い丸太 2 本の間に、割った薪を 2 段でくべたロングファイヤー型の焚き火を、焚き火の計算モデルでその場で描く。
 * 時間が進むと薪は折れて熾になり、折れていない薪が 3 本を切ると新しい薪が 25cm 上から落ちてくる。
 * 「薪の燃える速さ」を 60 倍にすると、1 本が約 13 秒で折れる。ボタンは `stoke()`、`tend()`、`blow()` を呼ぶ。
 * 下の記録には、要素が出したイベントが新しい順に 6 件並ぶ。親に position: relative が要る。1 画面に 1 つまで。
 */
export const Fire: Story = {
	render: function Render() {
		const ref = useRef<TakibiFireElement>(null);
		const [intensity, setIntensity] = useState(0.8);
		const [speed, setSpeed] = useState(1);
		const [wind, setWind] = useState(0);
		const [auto, setAuto] = useState(true);
		const [log, setLog] = useState<string[]>([]);
		const [state, setState] = useState<TakibiFireState | null>(null);
		const [renderer, setRenderer] = useState("still");
		useEffect(() => {
			const el = ref.current;
			if (!el) return;
			const started = performance.now();
			const names = Object.keys(eventNames) as (keyof typeof eventNames)[];
			const handlers = names.map((name) => {
				const handler = (event: Event) => {
					const detail = (event as CustomEvent<{ auto?: boolean }>).detail;
					const note = name === "stoke" ? (detail.auto ? "（自動）" : "（手で）") : "";
					const at = ((performance.now() - started) / 1000).toFixed(0);
					setLog((prev) => [`${at} 秒 ${eventNames[name]}${note}`, ...prev].slice(0, 6));
				};
				el.addEventListener(name, handler);
				return [name, handler] as const;
			});
			const timer = window.setInterval(() => {
				setState(el.state);
				setRenderer(el.renderer);
			}, 500);
			return () => {
				for (const [name, handler] of handlers) el.removeEventListener(name, handler);
				window.clearInterval(timer);
			};
		}, []);
		return (
			<Page>
				<Hearth>
					<takibi-fire
						ref={ref}
						intensity={intensity}
						speed={speed}
						wind={wind}
						feed={auto ? "auto" : "manual"}
					/>
				</Hearth>
				<div className="grid grid-cols-[repeat(auto-fill,minmax(240px,1fr))] gap-6">
					<div className="flex flex-col gap-4">
						<Dial
							label="火の強さ"
							value={intensity}
							onChange={setIntensity}
							min={0}
							max={1}
							step={0.05}
							format={(v) => v.toFixed(2)}
						/>
						<Dial
							label="薪の燃える速さ"
							value={speed}
							onChange={setSpeed}
							min={0}
							max={60}
							step={1}
							format={(v) => (v === 0 ? "止める" : `${v} 倍`)}
						/>
						<Dial
							label="風"
							value={wind}
							onChange={setWind}
							min={-1}
							max={1}
							step={0.05}
							format={(v) => `毎秒 ${(v * 1.5).toFixed(1)}m`}
						/>
					</div>
					<div className="flex flex-col gap-3">
						<div className="flex flex-wrap gap-2">
							<Button variant="secondary" size="sm" onClick={() => ref.current?.stoke()}>
								薪をくべる
							</Button>
							<Button variant="secondary" size="sm" onClick={() => ref.current?.tend()}>
								熾を寄せる
							</Button>
							<Button variant="secondary" size="sm" onClick={() => ref.current?.blow(0.8)}>
								息を吹く
							</Button>
						</div>
						<Button variant="ghost" size="sm" aria-pressed={auto} onClick={() => setAuto((v) => !v)}>
							{auto ? "自動でくべる: する" : "自動でくべる: しない"}
						</Button>
						<p className="text-sm text-fg-muted tabular-nums">
							{state
								? `薪 ${state.logs} 本、折れた薪 ${state.pieces} 本、熾の量 ${state.embers.toFixed(2)}、明るさ ${state.brightness.toFixed(2)}`
								: "準備中"}
							<br />
							描き方: {renderer}
						</p>
					</div>
					<ol className="flex flex-col gap-1 text-sm text-fg-muted tabular-nums" aria-label="イベントの記録">
						{log.length === 0 ? <li>イベントはまだない</li> : log.map((line) => <li key={line}>{line}</li>)}
					</ol>
				</div>
			</Page>
		);
	},
};

/**
 * 触れる焚き火。`interactive` を付けると、焚き火をクリックするたびに薪が 1 本落ちてきて、ドラッグすると視点が回る
 * （1px で横へ 0.35 度、縦へ 0.25 度）。回している間は薪と地面を 4 割の解像度で描き、止めると 0.2 秒で元の細かさに戻る。
 * `feed="manual"` なので、くべなければ約 22 分で熾だけになる。キーボードでは操作できないので、同じ操作のボタンを別に置く。
 */
export const Play: Story = {
	name: "触って遊ぶ",
	render: function Render() {
		const ref = useRef<TakibiFireElement>(null);
		const [count, setCount] = useState(0);
		return (
			<Page>
				<Hearth>
					<takibi-fire ref={ref} interactive feed="manual" onstoke={() => setCount((n) => n + 1)} />
				</Hearth>
				<div className="flex items-center gap-3">
					<Button variant="secondary" size="sm" onClick={() => ref.current?.stoke()}>
						薪をくべる
					</Button>
					<span className="text-sm text-fg-muted tabular-nums">くべた薪 {count} 本</span>
				</div>
			</Page>
		);
	},
};

/**
 * 視点の候補。`azimuth`（薪の向きから横へ回った角度）、`elevation`（見下ろす角度）、`distance`（中心からの距離）で決める。
 * 値を変えると、視点は 0.15 秒ほどで新しい位置へ動く。
 */
export const Angles: Story = {
	name: "視点",
	render: function Render() {
		const angles = [
			{ name: "斜め前・低め（既定）", azimuth: 28, elevation: 12, distance: 1.5 },
			{ name: "薪の端から", azimuth: 8, elevation: 16, distance: 1.2 },
			{ name: "真横", azimuth: 90, elevation: 10, distance: 1.3 },
			{ name: "見下ろす", azimuth: 40, elevation: 38, distance: 1.25 },
		];
		const [index, setIndex] = useState(0);
		const angle = angles[index] ?? angles[0];
		return (
			<Page>
				<Hearth>
					<takibi-fire azimuth={angle?.azimuth} elevation={angle?.elevation} distance={angle?.distance} />
				</Hearth>
				<div className="flex flex-wrap gap-2">
					{angles.map((a, i) => (
						<Button
							key={a.name}
							variant={i === index ? "primary" : "secondary"}
							size="sm"
							aria-pressed={i === index}
							onClick={() => setIndex(i)}
						>
							{a.name}
						</Button>
					))}
				</div>
			</Page>
		);
	},
};

/**
 * 炎の明るさを周りに写す。`glow-target="parent"` を付けると、炎の明るさ（平均が 1）が 0.1 秒おきに親要素の
 * `--takibi-fire-glow` に入る。ここでは、右のカードの上に重ねたブランドカラーの光の濃さを、この値の 12% にしている。
 */
export const Glow: Story = {
	name: "周りを照らす",
	render: () => (
		<Page>
			<div className="relative grid h-[26rem] grid-cols-[1fr_16rem] items-end gap-6 overflow-hidden rounded-xl border border-line-subtle bg-surface p-6">
				<takibi-fire glow-target="parent" />
				<div />
				<div className="relative overflow-hidden rounded-lg border border-line-subtle bg-surface-raised p-5">
					<span
						aria-hidden
						className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_0%_100%,var(--color-heat-ember),transparent_70%)] opacity-[calc(var(--takibi-fire-glow,1)*0.12)] transition-opacity duration-(--duration-fast) ease-linear"
					/>
					<h2 className="relative text-base font-semibold text-fg-strong">今夜の記録</h2>
					<p className="relative mt-1 text-sm text-fg-muted">薪 4 本、2 時間 10 分。</p>
				</div>
			</div>
		</Page>
	),
};

/**
 * 計算モデルを使わない描き方。`render="video"` は書き出しておいた 6 秒の動画、`render="still"` は止まった 1 枚を出す。
 * WebGL2 が使えないときと、描くのが追いつかないときは、自動で動画に替わる。動きを減らす設定では、止まった 1 枚になる。
 */
export const Fallbacks: Story = {
	name: "動画と止まった絵",
	render: () => (
		<Page>
			<div className="grid grid-cols-2 gap-4">
				{(["video", "still"] as const).map((mode) => (
					<figure key={mode} className="flex flex-col gap-2">
						<div className="relative h-72 overflow-hidden rounded-xl border border-line-subtle bg-surface">
							<takibi-fire render={mode} />
						</div>
						<figcaption className="font-mono text-sm text-fg-muted">render="{mode}"</figcaption>
					</figure>
				))}
			</div>
		</Page>
	),
};

/**
 * 使う場所の例。記録が 1 件もない画面で、高さ 160px の焚き火を説明の上に置く。
 * 小さく添えるだけの所なので、計算モデルは動かさず、書き出しておいた動画を出す（`render="video"`）。
 */
export const InEmptyState: Story = {
	name: "空の状態に置く",
	render: () => (
		<Page>
			<div className="mx-auto flex w-full max-w-md flex-col items-center gap-4 rounded-xl border border-line-subtle bg-surface-raised px-8 py-10 text-center">
				<div className="relative h-40 w-full">
					<takibi-fire render="video" />
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

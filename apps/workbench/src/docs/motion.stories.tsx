import type { Meta, StoryObj } from "@storybook/react-vite";
import { useEffect, useRef, useState } from "react";
import { Button, cn } from "takibi-design-system";
import { Page, Section, useCssVar } from "./catalog";

const meta = {
	title: "基礎/モーション",
	tags: ["!autodocs"],
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

/* 値は書き写さず、tokens.css の変数から読んで表示する。ここに書くのは名前と使い道だけ */

const durations = [
	["instant", "押下、focus の表示開始"],
	["fast", "hover の色、ツールチップ"],
	["base", "状態の切り替え（標準）"],
	["slow", "ダイアログ、パネルの開閉"],
	["relax", "レイアウトの移動、ページ遷移"],
	["cool", "余熱。hover の光が消えるまで。1500K の火の粉の明るさが 1% になるまでの 0.56 秒から"],
] as const;

/** 焚き火の動きから取った 4 つの曲線。同じ名前の --ease-* と --duration-* を組で使う */
const fireCurves = [
	[
		"pop",
		"はぜる",
		"火の粉が飛び出す動き。速さは空気の抵抗で 0.12 秒ごとに約 1/3 になり、行き過ぎずに止まる。長さは 0.12 秒の 3 倍",
		"アイコンの入れ替え、小さな飾り",
	],
	[
		"land",
		"載る",
		"薪が落ちて載る動き。全体の 51% で届いて 12% 跳ね返り、もう一度小さく跳ねて止まる。長さは、6cm 落ちて止まるまでの 0.21 秒から",
		"押下から戻る、hover の拡大、ハンドル",
	],
	[
		"ignite",
		"着火",
		"炎が立ち上がる動き。計算モデルで明るさを 14 回測って平均した。出だしは遅く、8% 行き過ぎて戻る。長さは、実測の 0.75 秒の 3 分の 2",
		"ポップオーバー、ダイアログ、文字の送り",
	],
	[
		"sway",
		"揺れる",
		"炎が横へ寄る動き。行き過ぎない。この曲線は計算モデルから取っていない",
		"選択インジケーター、位置や幅の移動、高さの開閉",
	],
] as const;

const easings = [
	["standard", "標準。色の変化"],
	["ember", "終わりがゆっくり。hover と focus"],
	["out-expo", "閉じる、押し込む"],
	["breath", "呼吸。処理中のループと、ゆらぎ"],
	["cool", "冷える。光が消えるとき。火の粉の明るさと同じ形で、最初に大きく落ちて、暗い光が長く残る"],
	["rise", "昇る。消える要素の位置と大きさ。煙と同じく、出だしが遅く、あとで速くなる"],
	["settle", "着地。わずかに行き過ぎて戻る"],
] as const;

const loops = [
	["flicker-a", "ゆらぎの明るさ。この間に山が 4 つ（平均 0.85Hz）"],
	["flicker-b", "ゆらぎの大きさ"],
	["flicker-c", "ゆらぎの位置"],
	["breath", "呼吸するループ"],
] as const;

const amplitudes = [
	["--press-scale", "ボタンの押下"],
	["--press-scale-surface", "カード、一覧の行など大きな面の押下"],
	["--press-scale-icon", "チェックボックス、アイコンだけのボタン"],
	["--press-scale-glyph", "入力欄の枠の中のボタン。面ではなく中の svg だけを縮める"],
	["--hover-scale", "hover で膨らむ"],
	["--swap-from-scale", "中身を入れ替えるときの最初の大きさ（--swap-blur と組で使う）"],
	["--swap-blur", "中身を入れ替えるときのぼかし"],
	["--stagger", "並んだ要素を順に出す間隔"],
] as const;

/** CSS 変数の今の値を、そのまま文字で出す */
function Value({ name }: { name: string }) {
	return <>{useCssVar(name)}</>;
}

function Track({ duration, easing, run }: { duration: string; easing: string; run: boolean }) {
	return (
		<div className="relative h-8 flex-1 rounded-full bg-surface-sunken">
			<span
				className="absolute top-1 left-1 size-6 rounded-full bg-brand shadow-glow"
				style={{
					transform: run ? "translateX(calc(var(--track) - 2rem))" : "translateX(0)",
					transitionProperty: "transform",
					transitionDuration: `var(--duration-${duration})`,
					transitionTimingFunction: `var(--ease-${easing})`,
				}}
			/>
		</div>
	);
}

/** cubic-bezier() か linear() の値を、時間と進み具合（どちらも 0〜1）の点の列にする */
function curvePoints(value: string): [number, number][] {
	const body = value.replace(/\s+/g, " ").trim();
	const bezier = body.match(/^cubic-bezier\((.+)\)$/)?.[1];
	if (bezier) {
		const [x1 = 0, y1 = 0, x2 = 1, y2 = 1] = bezier.split(",").map(Number);
		return Array.from({ length: 33 }, (_, i) => {
			const t = i / 32;
			const u = 1 - t;
			return [
				3 * u * u * t * x1 + 3 * u * t * t * x2 + t ** 3,
				3 * u * u * t * y1 + 3 * u * t * t * y2 + t ** 3,
			];
		});
	}
	const linear = body.match(/^linear\((.+)\)$/)?.[1];
	if (!linear) return [];
	const stops = linear.split(",").map((stop) => {
		const [v = "0", p] = stop.trim().split(" ");
		return { y: Number(v), x: p ? Number.parseFloat(p) / 100 : undefined };
	});
	// 位置を省いた点は、前後の位置の間に等間隔で並ぶ
	const xs = stops.map((s) => s.x);
	xs[0] ??= 0;
	xs[xs.length - 1] ??= 1;
	for (let i = 1; i < xs.length; i++) {
		if (xs[i] !== undefined) continue;
		let j = i;
		while (xs[j] === undefined) j++;
		const from = xs[i - 1] ?? 0;
		const to = xs[j] ?? 1;
		for (let k = i; k < j; k++) xs[k] = from + ((to - from) * (k - i + 1)) / (j - i + 1);
	}
	return stops.map((s, i) => [xs[i] ?? 0, s.y]);
}

/** 曲線の形。横が時間、縦が進み具合。上の横線が行き先（1）で、線を越えた分が行き過ぎ */
function Curve({ name }: { name: string }) {
	const points = curvePoints(useCssVar(`--ease-${name}`));
	const s = 64;
	return (
		<svg viewBox={`-4 -12 ${s + 8} ${s + 24}`} className="h-16 w-16 shrink-0 overflow-visible" aria-hidden>
			<path d={`M0 ${s} H${s} M0 ${s} V0`} className="stroke-line" fill="none" />
			<path d={`M0 0 H${s}`} className="stroke-line-subtle" strokeDasharray="2 3" fill="none" />
			{points.length > 0 && (
				<path
					d={`M${points.map(([x, y]) => `${(x * s).toFixed(1)} ${(s - y * s).toFixed(1)}`).join(" L")}`}
					className="stroke-brand"
					strokeWidth={2}
					strokeLinejoin="round"
					fill="none"
				/>
			)}
		</svg>
	);
}

function useMeasuredTrack() {
	const ref = useRef<HTMLDivElement>(null);
	useEffect(() => {
		const el = ref.current;
		if (!el) return;
		const set = () =>
			el.style.setProperty("--track", `${el.querySelector("[data-track]")?.clientWidth ?? 300}px`);
		set();
		const ro = new ResizeObserver(set);
		ro.observe(el);
		return () => ro.disconnect();
	}, []);
	return ref;
}

/** 時間、曲線、振れ幅のトークン。「再生」で丸を同時に動かし、長さと曲線の違いを見比べる */
export const Tokens: Story = {
	render: function Render() {
		const [run, setRun] = useState(false);
		const ref = useMeasuredTrack();
		return (
			<Page>
				<Section
					title="原則"
					description="動きは、触ったときの手応えと、ある状態から次の状態へのつながりを伝える。長さと曲線は、焚き火の計算モデル（labs/fire3d）で測った値から決めている。詳しくは「基本要素 / モーション」にある。"
				>
					<ol className="flex list-decimal flex-col gap-1 pl-5 text-sm text-fg">
						<li>
							開く動きは焚き火から取った 4
							つの曲線（はぜる、載る、着火、揺れる）で、閉じる動きは同じ形のまま少し速く
						</li>
						<li>動きは原因の位置（押した点、トリガー）から始める</li>
						<li>途中で逆の操作をしたら、今の位置から戻す</li>
						<li>止まっているべきものは動かさない。ポップアップが付いて出る要素は大きさを変えない</li>
						<li>動きを減らす設定では、位置と大きさの動きを消し、色と影の変化は残す</li>
					</ol>
				</Section>
				<div ref={ref} className="flex flex-col gap-12">
					<Section
						title="焚き火から取った 4 つの曲線"
						description="開く動き、戻る動き、移る動きに使う。CSS では同じ名前の ease-* と --duration-* を組で、Motion では src/lib/motion.ts の springs.pop / land / ignite / sway を使う。"
					>
						<div className="flex flex-col gap-4">
							{fireCurves.map(([name, title, source, use]) => (
								<div key={name} className="grid grid-cols-[18rem_4rem_1fr] items-center gap-4">
									<div className="flex flex-col gap-0.5">
										<span className="text-sm font-semibold text-fg-strong">
											{title} <code className="font-mono font-normal">ease-{name}</code>
										</span>
										<span className="font-mono text-xs text-fg-muted">
											--duration-{name}: <Value name={`--duration-${name}`} />
										</span>
										<span className="text-xs text-fg-muted">{source}</span>
										<span className="text-xs text-fg-muted">使う所: {use}</span>
									</div>
									<Curve name={name} />
									<div data-track className="flex">
										<Track duration={name} easing={name} run={run} />
									</div>
								</div>
							))}
						</div>
					</Section>
					<Section
						title="時間"
						description="短いものは押下や hover の反応に、長いものは大きな移動に使う。比べやすいよう、曲線はすべて ease-standard。"
					>
						<div className="flex flex-col gap-3">
							{durations.map(([name, use]) => (
								<div key={name} className="grid grid-cols-[18rem_4rem_1fr] items-center gap-4">
									<div className="flex flex-col">
										<code className="font-mono text-sm text-fg-strong">--duration-{name}</code>
										<span className="text-xs text-fg-muted">
											<Value name={`--duration-${name}`} /> ・ {use}
										</span>
									</div>
									<span />
									<div className="flex">
										<Track duration={name} easing="standard" run={run} />
									</div>
								</div>
							))}
						</div>
					</Section>
					<Section
						title="曲線"
						description="閉じる動き、消える動き、色の変化に使う。比べやすいよう、時間はすべて --duration-relax。"
					>
						<div className="flex flex-col gap-3">
							{easings.map(([name, use]) => (
								<div key={name} className="grid grid-cols-[18rem_4rem_1fr] items-center gap-4">
									<div className="flex flex-col">
										<code className="font-mono text-sm text-fg-strong">ease-{name}</code>
										<span className="text-xs text-fg-muted">{use}</span>
									</div>
									<Curve name={name} />
									<div className="flex">
										<Track duration="relax" easing={name} run={run} />
									</div>
								</div>
							))}
						</div>
					</Section>
					<Section
						title="続く動きの周期"
						description="ゆらぎは、計算モデルの炎を測って決めた 3 つの周期を重ねる。互いに割り切れないので、同じ形は約 30 分繰り返さない。"
					>
						<table className="w-full border-collapse text-left text-sm">
							<tbody>
								{loops.map(([name, use]) => (
									<tr key={name} className="border-b border-line-subtle">
										<td className="py-2 pr-4 font-mono text-fg-strong">--duration-{name}</td>
										<td className="py-2 pr-4 font-mono text-fg">
											<Value name={`--duration-${name}`} />
										</td>
										<td className="py-2 text-fg-muted">{use}</td>
									</tr>
								))}
							</tbody>
						</table>
					</Section>
					<Section title="振れ幅" description="どれだけ動かすか。小さすぎると、動いたことに気づかない。">
						<table className="w-full border-collapse text-left text-sm">
							<tbody>
								{amplitudes.map(([name, use]) => (
									<tr key={name} className="border-b border-line-subtle">
										<td className="py-2 pr-4 font-mono text-fg-strong">{name}</td>
										<td className="py-2 pr-4 font-mono text-fg">
											<Value name={name} />
										</td>
										<td className="py-2 text-fg-muted">{use}</td>
									</tr>
								))}
							</tbody>
						</table>
					</Section>
				</div>
				<div>
					<Button onClick={() => setRun((r) => !r)}>{run ? "戻す" : "再生"}</Button>
				</div>
			</Page>
		);
	},
};

/** Base UI と同じ data-starting-style / data-ending-style の段階を再現して、語彙を単体で見せる */
function Presence({
	show,
	className,
	style,
	children,
}: {
	show: boolean;
	className: string;
	style?: React.CSSProperties;
	children: React.ReactNode;
}) {
	const [mounted, setMounted] = useState(show);
	const [phase, setPhase] = useState<"starting" | "open" | "ending">(show ? "open" : "starting");
	const ref = useRef<HTMLDivElement>(null);
	useEffect(() => {
		if (show) {
			setMounted(true);
			setPhase("starting");
			const id = requestAnimationFrame(() => requestAnimationFrame(() => setPhase("open")));
			return () => cancelAnimationFrame(id);
		}
		setPhase("ending");
		const el = ref.current;
		const done = () => setMounted(false);
		const t = window.setTimeout(done, 800);
		el?.addEventListener("transitionend", done, { once: true });
		return () => window.clearTimeout(t);
	}, [show]);
	if (!mounted) return null;
	return (
		<div
			ref={ref}
			className={className}
			style={style}
			data-starting-style={phase === "starting" ? "" : undefined}
			data-ending-style={phase === "ending" ? "" : undefined}
		>
			{children}
		</div>
	);
}

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

function Toggleable({ cls, label, children }: { cls: string; label: string; children: React.ReactNode }) {
	const [show, setShow] = useState(false);
	return (
		<>
			<Button variant="secondary" size="sm" onClick={() => setShow((s) => !s)}>
				{show ? "閉じる" : label}
			</Button>
			<Presence show={show} className={cls}>
				{children}
			</Presence>
		</>
	);
}

function FoldDemo() {
	const [open, setOpen] = useState(false);
	return (
		<>
			<Button variant="secondary" size="sm" onClick={() => setOpen((o) => !o)}>
				{open ? "たたむ" : "広げる"}
			</Button>
			<Presence
				show={open}
				className="motion-fold w-full"
				style={{ ["--accordion-panel-height" as string]: "4.5rem" }}
			>
				<p className="rounded-md bg-surface-sunken p-3 text-sm text-fg">
					中身の高さまで伸びて開く。閉じるときも同じ曲線で縮む。
				</p>
			</Presence>
		</>
	);
}

/** 動きの語彙。コンポーネントはこれらのクラスで動く。ボタンを押して確かめる */
export const Vocabulary: Story = {
	render: () => (
		<Page>
			<div className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-4">
				<Demo
					name="motion-press"
					title="押下"
					use="押すと 150ms で 0.97 倍に沈み、離すと載る曲線（240ms、12% 跳ね返る）で戻る。独自の押せる要素に使う"
				>
					<Button>押してみる</Button>
				</Demo>
				<Demo
					name="motion-glow"
					title="グロー"
					use="hover で、要素の周りに淡い光が 220ms で出て、離れると 560ms かけて消える"
				>
					<div className="motion-glow rounded-lg border border-line bg-surface-overlay px-5 py-4 text-sm text-fg">
						ここに乗せる
					</div>
				</Demo>
				<Demo
					name="motion-rise"
					title="浮上"
					use="ツールチップ、ポップオーバー、メニューが、トリガーの側を起点に 0.94 倍からはぜる曲線（360ms、行き過ぎない）で大きくなる"
				>
					<Toggleable
						cls="motion-rise rounded-md border border-line bg-surface-overlay px-3 py-2 text-sm text-fg-strong shadow-pop"
						label="出す"
					>
						トリガーから出る
					</Toggleable>
				</Demo>
				<Demo
					name="motion-dialog"
					title="ダイアログ"
					use="ダイアログ。ぼけた状態から 12px 上がりながら着火の曲線で開き、180ms で閉じる"
				>
					<Toggleable
						cls="motion-dialog rounded-xl border border-line bg-surface-overlay p-4 text-sm text-fg shadow-pop"
						label="開く"
					>
						ぼけた状態から現れる
					</Toggleable>
				</Demo>
				<Demo
					name="motion-settle"
					title="下から出て上へ消える"
					use="新しく足した要素が 12px 下から着火の曲線で現れ、消えるときは 10px 上がりながら 1.03 倍に広がって薄れる"
				>
					<Toggleable
						cls="motion-settle rounded-lg border border-line bg-surface-overlay px-4 py-3 text-sm text-fg-strong shadow-pop"
						label="知らせる"
					>
						保存しました
					</Toggleable>
				</Demo>
				<Demo
					name="motion-fold"
					title="高さの開閉"
					use="アコーディオンの中身が、揺れる曲線（330ms、行き過ぎない）で高さを伸ばして開く。閉じるときも同じ曲線"
				>
					<FoldDemo />
				</Demo>
				<Demo
					name="motion-fade"
					title="薄く出す"
					use="入力欄の下のエラー文など、小さなものを動かさずに薄く出す"
				>
					<Toggleable cls="motion-fade text-sm text-danger" label="エラーを出す">
						メールアドレスの形で入れてください
					</Toggleable>
				</Demo>
				<Demo name="animate-breath" title="呼吸" use="処理中だけ。1 画面に 1 つまで">
					<span className="size-4 animate-breath rounded-full bg-brand" />
				</Demo>
				<Demo
					name="motion-ember-pulse"
					title="読み込み中の面"
					use="ブランドカラーを薄く混ぜた 2 本の帯が、2.9 秒と 4.7 秒の周期で逆向きに流れる。スケルトンに使う"
				>
					<div className="flex w-full flex-col gap-2">
						<div className={cn("motion-ember-pulse h-4 w-3/4 rounded-sm")} />
						<div className="motion-ember-pulse h-4 w-full rounded-sm" />
						<div className="motion-ember-pulse h-4 w-1/2 rounded-sm" />
					</div>
				</Demo>
			</div>
		</Page>
	),
};

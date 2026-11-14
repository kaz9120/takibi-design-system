import type { Meta, StoryObj } from "@storybook/react-vite";
import { useEffect, useRef, useState } from "react";
import { Button, cn } from "takibi-design-system";
import { Page, Section } from "./catalog";

const meta = {
	title: "基礎/モーション",
	tags: ["!autodocs"],
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

const durations = [
	["instant", "75ms", "押下、focus の表示開始"],
	["fast", "120ms", "hover の色、ツールチップ"],
	["base", "200ms", "状態の切り替え（標準）"],
	["slow", "360ms", "ダイアログ、パネルの開閉"],
	["relax", "560ms", "レイアウトの移動、ページ遷移"],
] as const;

const easings = [
	["standard", [0.2, 0.8, 0.2, 1], "標準。色の変化"],
	["ember", [0.16, 0.84, 0.24, 1], "終わりがゆっくり。hover と focus"],
	["out-expo", [0.16, 1, 0.3, 1], "閉じる、押し込む"],
	["breath", [0.45, 0.05, 0.55, 0.95], "呼吸。処理中のループ"],
] as const;

const springs = [
	["snappy", "500ms", "行き過ぎ 11%。アイコンの入れ替え、小さな飾り"],
	["press", "460ms", "行き過ぎ 8%。押下から戻る、ハンドル"],
	["soft", "510ms", "行き過ぎ 4.5%。ポップオーバー、ダイアログ"],
	["glide", "330ms", "行き過ぎなし。選択インジケーター、位置の移動、高さの展開"],
] as const;

const amplitudes = [
	["--press-scale", "0.97", "ボタンの押下"],
	["--press-scale-surface", "0.98", "カード、一覧の行など大きな面の押下"],
	["--press-scale-icon", "0.92", "チェックボックス、アイコンだけのボタン"],
	["--hover-scale", "1.02", "hover で膨らむ"],
	["--swap-from-scale", "0.5", "中身を入れ替えるときの出発の大きさ（ぼかし 4px と組で使う）"],
	["--stagger", "40ms", "並んだ要素を順に出す間隔"],
] as const;

function Track({ duration, easing, run }: { duration: string; easing: string; run: boolean }) {
	return (
		<div className="relative h-8 flex-1 rounded-full bg-surface-sunken">
			<span
				className="absolute top-1 left-1 size-6 rounded-full bg-brand shadow-glow"
				style={{
					transform: run ? "translateX(calc(var(--track) - 2rem))" : "translateX(0)",
					transitionProperty: "transform",
					transitionDuration: `var(--duration-${duration}, ${duration})`,
					transitionTimingFunction: `var(--ease-${easing})`,
				}}
			/>
		</div>
	);
}

function Curve({ points }: { points: readonly number[] }) {
	const [x1, y1, x2, y2] = points as [number, number, number, number];
	const s = 64;
	return (
		<svg viewBox={`-4 -12 ${s + 8} ${s + 24}`} className="h-16 w-16 shrink-0 overflow-visible" aria-hidden>
			<path d={`M0 ${s} H${s} M0 ${s} V0`} className="stroke-line" fill="none" />
			<path
				d={`M0 ${s} C${x1 * s} ${s - y1 * s} ${x2 * s} ${s - y2 * s} ${s} 0`}
				className="stroke-brand"
				strokeWidth={2}
				fill="none"
			/>
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

/** 時間と曲線。「再生」で同時に動かし、違いを見比べる */
export const Tokens: Story = {
	render: function Render() {
		const [run, setRun] = useState(false);
		const ref = useMeasuredTrack();
		return (
			<Page>
				<Section
					title="原則"
					description="動きは、触ったときの手応えと、ある状態から次の状態へのつながりを伝える。詳しくは「ガイドライン / 動き」にある。"
				>
					<ol className="flex list-decimal flex-col gap-1 pl-5 text-sm text-fg">
						<li>開く動きはばねで、閉じる動きは同じ形のまま少し速く</li>
						<li>動きは原因の位置（押した点、トリガー）から始める</li>
						<li>途中で逆の操作をしたら、今の位置から戻す</li>
						<li>止まっているべきものは動かさない。ポップアップが付いて出る要素は大きさを変えない</li>
						<li>動きを減らす設定では、位置と大きさの動きを消し、色と影の変化は残す</li>
					</ol>
				</Section>
				<div ref={ref} className="flex flex-col gap-12">
					<Section
						title="時間"
						description="短いものは押下や hover の反応に、長いものは大きな移動に使う。比べやすいよう、曲線はすべて ease-standard。"
					>
						<div className="flex flex-col gap-3">
							{durations.map(([name, ms, use]) => (
								<div key={name} className="grid grid-cols-[10rem_1fr] items-center gap-4">
									<div className="flex flex-col">
										<code className="font-mono text-sm text-fg-strong">--duration-{name}</code>
										<span className="text-xs text-fg-subtle">
											{ms} ・ {use}
										</span>
									</div>
									<div data-track className="flex">
										<Track duration={name} easing="standard" run={run} />
									</div>
								</div>
							))}
						</div>
					</Section>
					<Section
						title="ばね"
						description="開く動きに使う。CSS では ease-spring-* と --duration-spring-* を組で、Motion では src/lib/motion.ts の springs を使う。"
					>
						<div className="flex flex-col gap-3">
							{springs.map(([name, ms, use]) => (
								<div key={name} className="grid grid-cols-[10rem_1fr] items-center gap-4">
									<div className="flex flex-col">
										<code className="font-mono text-sm text-fg-strong">ease-spring-{name}</code>
										<span className="text-xs text-fg-subtle">
											{ms} ・ {use}
										</span>
									</div>
									<div className="flex">
										<Track duration={`spring-${name}`} easing={`spring-${name}`} run={run} />
									</div>
								</div>
							))}
						</div>
					</Section>
					<Section
						title="曲線"
						description="ばね以外の動きと、色の変化に使う。比べやすいよう、時間はすべて --duration-relax。"
					>
						<div className="flex flex-col gap-3">
							{easings.map(([name, pts, use]) => (
								<div key={name} className="grid grid-cols-[10rem_4rem_1fr] items-center gap-4">
									<div className="flex flex-col">
										<code className="font-mono text-sm text-fg-strong">ease-{name}</code>
										<span className="text-xs text-fg-subtle">{use}</span>
									</div>
									<Curve points={pts} />
									<div className="flex">
										<Track duration="relax" easing={name} run={run} />
									</div>
								</div>
							))}
						</div>
					</Section>
					<Section title="振れ幅" description="どれだけ動かすか。小さすぎると、動いたことに気づかない。">
						<table className="w-full border-collapse text-left text-sm">
							<tbody>
								{amplitudes.map(([name, value, use]) => (
									<tr key={name} className="border-b border-line-subtle">
										<td className="py-2 pr-4 font-mono text-fg-strong">{name}</td>
										<td className="py-2 pr-4 font-mono text-fg">{value}</td>
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
					use="押すと速く沈み、離すとばねで弾んで戻る。独自の押せる要素に使う"
				>
					<Button>押してみる</Button>
				</Demo>
				<Demo name="motion-glow" title="グロー" use="hover で、要素の周りにブランドカラーの淡い光が出る">
					<div className="motion-glow rounded-lg border border-line bg-surface-overlay px-5 py-4 text-sm text-fg">
						ここに乗せる
					</div>
				</Demo>
				<Demo
					name="motion-rise"
					title="浮上"
					use="ツールチップ、ポップオーバー、メニューがトリガーからばねで膨らむ"
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
					use="ダイアログ。ぼけた姿から浮かび、閉じるときは同じ形のまま速く引く"
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
					use="新しく足した要素が下から現れ、消えるときは上へ薄れる"
				>
					<Toggleable
						cls="motion-settle rounded-lg border border-line bg-surface-overlay px-4 py-3 text-sm text-fg-strong shadow-pop"
						label="知らせる"
					>
						保存しました
					</Toggleable>
				</Demo>
				<Demo name="motion-fold" title="高さの開閉" use="アコーディオンの中身が、高さを伸ばして開く">
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
					use="ブランドカラーを薄く混ぜた帯が、左から右へ流れる。スケルトンに使う"
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

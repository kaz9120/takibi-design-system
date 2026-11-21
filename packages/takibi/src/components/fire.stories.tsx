import type { Meta, StoryObj } from "@storybook/react-vite";
import { useEffect, useRef, useState } from "react";
import "../fire";
import type { TakibiFireElement } from "../fire";
import { Button } from "./button";
import { Slider } from "./slider";

const meta = {
	title: "コンポーネント/ブランドの演出/takibi-fire",
	tags: ["!autodocs"],
	parameters: {
		takibi: {
			summary:
				"焚き火を描くカスタム要素。薪は時間とともに折れて熾になり、折れていない薪が 3 本を切ると新しい薪が落ちてくる。",
			import: 'import "takibi-design-system/fire";',
			use: [
				"トップページの見出しの背景",
				"記録が 1 件もない画面など、空の状態の飾り",
				"待ち時間や完了の画面で、操作の邪魔にならない場所",
			],
			avoid: [
				{ case: "一覧の行やカードの中に、いくつも並べる" },
				{ case: "読み込み中を知らせる" },
				{ case: "完了の瞬間を知らせる", instead: "フィードバック/Sparks" },
			],
			dos: [
				"親を position: relative にし、高さを決める",
				'小さく添えるだけの所では render="video" か render="still" にする',
				"くべる操作を見せたい所だけ interactive を付ける",
			],
			donts: [
				"1 画面に 2 つ置かない。GPU で流れを解くので、数だけ重くなる",
				"火の粉の背景（takibi-embers）と同じ画面に置かない",
				"文字やボタンの真後ろに炎を重ねない",
			],
			api: [
				{
					title: "属性",
					rows: [
						["intensity", "火の強さ。0〜1、既定 0.8"],
						[
							"speed",
							"薪の燃え進みの速さ。0〜60、既定 1。1 のとき、四つ割りの薪は約 13 分で折れ、約 22 分で熾になる。炎の動きの速さは変わらない",
						],
						["feed", '薪のくべ方。"auto"（既定）は減ると自動でくべる。"manual" は stoke() を呼んだときだけ'],
						["wind", "薪の向きに沿った風。-1〜1、既定 0。1 で毎秒 1.5m"],
						["sparks", '火の粉。"on"（既定）か "off"'],
						[
							"azimuth / elevation / distance",
							"視点。薪の向きから横へ回った角度（度、既定 28）、見下ろす角度（2〜80 度、既定 12）、中心からの距離（0.8〜3m、既定 1.5）",
						],
						["exposure", "明るさ。-2〜2 段、既定 0"],
						["interactive", "付けると、クリックで薪をくべ、ドラッグで視点を回せる"],
						["render", '描き方。"auto"（既定）、"video"（書き出した動画）、"still"（止まった 1 枚）'],
						["glow-target", '炎の明るさを書く先。CSS セレクターか "parent"。省くと要素自身'],
					],
				},
				{
					title: "メソッド",
					rows: [
						[
							"stoke()",
							"薪を 1 本くべる。置けたら true、置く場所がないか計算モデルが動いていなければ false を返す",
						],
						["tend()", "折れた薪を中央へ寄せる。約 5 秒のあいだ火が強くなる"],
						[
							"blow(power)",
							"息を吹く（power は 0〜1、既定 0.5）。約 5 秒のあいだ火が強くなり、熾から火の粉が飛ぶ",
						],
					],
				},
				{
					title: "イベント",
					rows: [
						[
							"ready",
							"描き方が決まった（detail.renderer は webgl、video、still のどれか）。イベントはどれも親へ伝わらないので、この要素に addEventListener する",
						],
						["stoke", "薪をくべた（detail.auto が true なら自動）"],
						["break", "薪が折れた"],
						["ember", "薪が熾になった"],
						["low", "くべた薪がすべて熾になった"],
						["pop", "はぜて火の粉が飛んだ（detail.count は飛んだ数）"],
					],
				},
				{
					title: "CSS 変数",
					rows: [["--takibi-fire-glow", "炎の明るさ。平均が 1 で、0〜2.5。0.1 秒おきに書く"]],
				},
			],
			a11y: [
				"飾りとして置く。中の絵は aria-hidden で、スクリーンリーダーは読まない",
				"動きを減らす設定では、止まった 1 枚になる",
				"interactive の操作はポインターだけなので、同じ操作をするボタンを別に置く",
			],
			motion: [
				"毎秒 30 コマで描く。画面の外にある間と、タブが隠れている間は止まる",
				"始めに GPU の速さを測って 3 段の細かさから選び、いちばん軽い段でも追いつかなければ動画に替わる",
				"WebGL2 が使えないときと、コンテキストが失われたときは動画に替わる",
				"夜と昼の切り替えは 0.7 秒で入れ替わる",
			],
			related: ["ブランドの演出/takibi-embers", "ブランドの演出/takibi-stars", "フィードバック/Sparks"],
		},
	},
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

const eventNames = {
	stoke: "薪をくべた",
	break: "薪が折れた",
	ember: "薪が熾になった",
	low: "薪がすべて熾になった",
} as const;

/**
 * 焚き火をその場で描く。「速さ」を 60 にすると、薪 1 本が約 13 秒で折れる。ボタンは `stoke()`、`tend()`、`blow()` を呼ぶ。
 * 炎をクリックしても薪をくべられ、ドラッグすると視点が回る。下には、要素が出したイベントが新しい順に 4 件並ぶ。
 */
export const Default: Story = {
	name: "基本",
	render: function Render() {
		const ref = useRef<TakibiFireElement>(null);
		const [speed, setSpeed] = useState(1);
		const [wind, setWind] = useState(0);
		const [log, setLog] = useState<string[]>([]);
		useEffect(() => {
			const el = ref.current;
			if (!el) return;
			const names = Object.keys(eventNames) as (keyof typeof eventNames)[];
			const handlers = names.map((name) => {
				const handler = (event: Event) => {
					const detail = (event as CustomEvent<{ auto?: boolean }>).detail;
					const note = name === "stoke" ? (detail?.auto ? "（自動）" : "（手で）") : "";
					setLog((prev) => [`${eventNames[name]}${note}`, ...prev].slice(0, 4));
				};
				el.addEventListener(name, handler);
				return [name, handler] as const;
			});
			return () => {
				for (const [name, handler] of handlers) el.removeEventListener(name, handler);
			};
		}, []);
		return (
			<div className="flex flex-col gap-5">
				<div className="relative h-[26rem] overflow-hidden rounded-xl border border-line-subtle bg-surface">
					<takibi-fire ref={ref} interactive speed={speed} wind={wind} />
				</div>
				<div className="flex flex-wrap items-center gap-x-6 gap-y-4">
					<div className="flex gap-2">
						<Button variant="secondary" onClick={() => ref.current?.stoke()}>
							薪をくべる
						</Button>
						<Button variant="secondary" onClick={() => ref.current?.tend()}>
							熾を寄せる
						</Button>
						<Button variant="secondary" onClick={() => ref.current?.blow()}>
							息を吹く
						</Button>
					</div>
					<div className="flex w-48 items-center gap-3 text-sm text-fg-muted">
						<span className="shrink-0">速さ</span>
						<Slider
							aria-label="薪の燃える速さ"
							min={1}
							max={60}
							step={1}
							value={speed}
							onValueChange={(v) => setSpeed(v as number)}
						/>
						<span className="w-8 font-mono text-fg tabular-nums">{speed}</span>
					</div>
					<div className="flex w-48 items-center gap-3 text-sm text-fg-muted">
						<span className="shrink-0">風</span>
						<Slider
							aria-label="風"
							min={-1}
							max={1}
							step={0.05}
							value={wind}
							onValueChange={(v) => setWind(v as number)}
						/>
						<span className="w-8 font-mono text-fg tabular-nums">{wind.toFixed(1)}</span>
					</div>
				</div>
				<ul className="flex min-h-6 flex-wrap gap-x-4 gap-y-1 font-mono text-sm text-fg-muted">
					{log.map((line, i) => (
						// biome-ignore lint/suspicious/noArrayIndexKey: 同じ文が続くことがある
						<li key={i}>{line}</li>
					))}
				</ul>
			</div>
		);
	},
};

/**
 * 計算モデルを使わない描き方。`render="video"` は書き出しておいた 6 秒の動画、`render="still"` は止まった 1 枚を出す。
 * 小さく添えるだけの所や一覧の中では、こちらを使う。
 */
export const Fallbacks: Story = {
	name: "動画と止まった絵",
	render: () => (
		<div className="grid gap-4 sm:grid-cols-2">
			{(["video", "still"] as const).map((mode) => (
				<figure key={mode} className="flex flex-col gap-2">
					<div className="relative h-64 overflow-hidden rounded-xl border border-line-subtle bg-surface">
						<takibi-fire render={mode} />
					</div>
					<figcaption className="font-mono text-sm text-fg-muted">render="{mode}"</figcaption>
				</figure>
			))}
		</div>
	),
};

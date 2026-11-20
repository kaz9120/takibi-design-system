import type { Meta, StoryObj } from "@storybook/react-vite";
import { useEffect, useState } from "react";
import { ContrastBadge, contrast, Page, Section } from "./catalog";

const meta = {
	title: "基礎/色",
	tags: ["!autodocs"],
	parameters: { layout: "padded" },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

type Token = {
	name: string;
	usage: string;
	/** 文字や線として使うとき、どの面に載せて比べるか */
	on?: string;
	/** 求めるコントラスト比 */
	min?: number;
};

const groups: { title: string; description: string; kind: "surface" | "ink"; tokens: Token[] }[] = [
	{
		title: "サーフェス",
		description:
			"空の色から取る。夜は夜の空（--ink-*）、昼は昼の空（--day-*）で、時刻と天気で色相と彩度が動く。画面の奥行きを 4 段の面で表し、夜は上に重なるものほど明るい。",
		kind: "surface",
		tokens: [
			{ name: "surface", usage: "ページの背景" },
			{ name: "surface-raised", usage: "カード" },
			{ name: "surface-overlay", usage: "ポップオーバー、メニュー、ダイアログ" },
			{ name: "surface-sunken", usage: "入力欄、コード、キー表示" },
			{ name: "surface-hover", usage: "行やメニュー項目のホバー" },
		],
	},
	{
		title: "文字",
		description:
			"空の色から取る。本文は fg、補足は fg-muted。fg-subtle は 4.5:1 に届かないので、プレースホルダーと無効だけに使う。時刻と天気で動くのは色相と彩度で、面との明るさの比はほぼ変わらない。",
		kind: "ink",
		tokens: [
			{ name: "fg", usage: "本文", on: "surface" },
			{ name: "fg-strong", usage: "見出し、強調", on: "surface" },
			{ name: "fg-muted", usage: "補足、ラベル", on: "surface" },
			{ name: "fg-subtle", usage: "プレースホルダー、無効", on: "surface", min: 3 },
			{ name: "fg-on-brand", usage: "brand の面に載せる文字", on: "brand" },
			{ name: "fg-on-danger", usage: "danger-solid の面に載せる文字", on: "danger-solid" },
		],
	},
	{
		title: "線",
		description: "空の色から取る。操作できる要素の枠は line-strong にして、周りの面と 3:1 以上の差をつける。",
		kind: "ink",
		tokens: [
			{ name: "line-subtle", usage: "目立たせない区切り", on: "surface", min: 1 },
			{ name: "line", usage: "標準の区切り線、カードの枠", on: "surface", min: 1 },
			{ name: "line-strong", usage: "入力欄など操作できる要素の枠", on: "surface", min: 3 },
		],
	},
	{
		title: "ブランド",
		description:
			"焚き火の色（--ember-*）から取る。時刻と天気では変わらない。CTA、リンク、フォーカス、ロゴだけに使う。目立たせたいという理由で、ほかに広げない。",
		kind: "ink",
		tokens: [
			{ name: "brand", usage: "主要な操作、リンク", on: "surface" },
			{ name: "brand-hover", usage: "brand の hover", on: "surface" },
			{ name: "brand-active", usage: "brand の押下", on: "surface", min: 3 },
			{ name: "brand-soft", usage: "選択中の面、文字選択", on: "surface", min: 1 },
			{ name: "focus", usage: "フォーカスリング", on: "surface", min: 3 },
		],
	},
	{
		title: "温度",
		description:
			"焚き火の色（--heat-*）から取る。熱い順に 5 段で、光、火の粉、炎が時間と距離でこの順に色を変える。文字、面、枠線には使わない。時刻と天気では変わらない。昼は、明るい背景でも見えるよう 5 段とも暗い側の色に差し替える。",
		kind: "surface",
		tokens: [
			{ name: "heat-core", usage: "生まれた瞬間の火の粉、光の最も内側" },
			{ name: "heat-flame", usage: "光の内側" },
			{ name: "heat-ember", usage: "ブランドカラーと同じ" },
			{ name: "heat-coal", usage: "光の外側、冷め始めた火の粉" },
			{ name: "heat-ash", usage: "消える直前の火の粉" },
		],
	},
	{
		title: "状態",
		description: "彩度を抑えた自然の色で状態を伝える。色だけに頼らず、アイコンか文言を添える。",
		kind: "ink",
		tokens: [
			{ name: "success", usage: "成功（苔）", on: "surface" },
			{ name: "warning", usage: "注意", on: "surface" },
			{ name: "danger", usage: "失敗、破壊的な操作（鉄錆）", on: "surface" },
			{ name: "info", usage: "情報（月）", on: "surface" },
			{ name: "danger-solid", usage: "破壊的な操作のボタンの面", on: "surface", min: 1 },
		],
	},
];

/**
 * CSS 変数の色を、今のテーマ、時刻、天気で解決した値で返す。
 * 空の色は color-mix() の式なので、変数の文字列のままでは読めず、コントラスト比も計算できない。
 * 不透明な色は 16 進、半透明の色はブラウザが返す表記になる。
 */
function useResolvedColor(name: string) {
	const [value, setValue] = useState("");
	useEffect(() => {
		const read = () => {
			const probe = document.createElement("span");
			probe.style.color = `var(${name})`;
			document.body.append(probe);
			const resolved = getComputedStyle(probe).color;
			probe.remove();
			const canvas = document.createElement("canvas");
			canvas.width = canvas.height = 1;
			const ctx = canvas.getContext("2d");
			if (!ctx) return setValue(resolved);
			ctx.fillStyle = resolved;
			ctx.fillRect(0, 0, 1, 1);
			const [r = 0, g = 0, b = 0, a = 255] = ctx.getImageData(0, 0, 1, 1).data;
			setValue(a < 255 ? resolved : `#${[r, g, b].map((c) => c.toString(16).padStart(2, "0")).join("")}`);
		};
		read();
		// テーマ（data-theme）、天気（data-weather）、時刻（style の --sky-phase）が変わったら読み直す
		const observer = new MutationObserver(read);
		observer.observe(document.documentElement, {
			attributes: true,
			attributeFilter: ["data-theme", "data-weather", "style"],
		});
		return () => observer.disconnect();
	}, [name]);
	return value;
}

function Swatch({ token, kind }: { token: Token; kind: "surface" | "ink" }) {
	const value = useResolvedColor(`--color-${token.name}`);
	const bg = useResolvedColor(`--color-${token.on ?? "surface"}`);
	const ratio = token.on ? contrast(value, bg) : null;
	return (
		<div className="flex flex-col overflow-hidden rounded-lg border border-line-subtle bg-surface-raised">
			{kind === "surface" ? (
				<div
					className="h-16 border-b border-line-subtle"
					style={{ background: `var(--color-${token.name})` }}
				/>
			) : (
				<div
					className="flex h-16 items-center gap-3 border-b border-line-subtle px-4"
					style={{ background: `var(--color-${token.on ?? "surface"})` }}
				>
					<span
						className="size-6 shrink-0 rounded-full"
						style={{ background: `var(--color-${token.name})` }}
					/>
					<span className="text-base font-semibold" style={{ color: `var(--color-${token.name})` }}>
						焚き火 Aa
					</span>
				</div>
			)}
			<div className="flex flex-col gap-1 p-3">
				<code className="font-mono text-sm text-fg-strong">{token.name}</code>
				<span className="text-sm text-fg-muted">{token.usage}</span>
				<div className="flex flex-wrap items-center gap-2">
					<code className="font-mono text-xs text-fg-subtle">{value}</code>
					{token.on && (token.min ?? 4.5) > 1 && <ContrastBadge ratio={ratio} min={token.min ?? 4.5} />}
				</div>
			</div>
		</div>
	);
}

/**
 * 役割の色。アプリはこれだけを使う。面、文字、線は空の色から、ブランドと温度は焚き火の色から取る。
 * 右上のツールバーで夜と昼を切り替えると、値とコントラスト比が変わる
 */
export const Roles: Story = {
	render: () => (
		<Page>
			{groups.map((g) => (
				<Section key={g.title} title={g.title} description={g.description}>
					<div className="grid grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-3">
						{g.tokens.map((t) => (
							<Swatch key={t.name} token={t} kind={g.kind} />
						))}
					</div>
				</Section>
			))}
		</Page>
	),
};

type Ramp = { name: string; label: string; description: string; steps: string[] };

const sky: Ramp = {
	name: "ink",
	label: "夜の空",
	description:
		"夜のテーマの面、文字、枠線のもとになる 11 段。色相 255 の青みの黒。薄明に近づくと色相 264 の青が濃くなり、曇りでは彩度が 0.004 まで下がる。明るさはほぼ変わらない。",
	steps: ["0", "50", "100", "200", "300", "400", "500", "600", "700", "800", "900"],
};

const ember: Ramp = {
	name: "ember",
	label: "ブランドカラー",
	description: "焚き火の色。基準は 400。時刻と天気では変わらない。",
	steps: ["50", "100", "200", "300", "400", "500", "600", "700", "800", "900"],
};

type Named = { name: string; label: string; description: string; tokens: [string, string][] };

const day: Named = {
	name: "day",
	label: "昼の空",
	description:
		"昼のテーマの面、文字、枠線のもとになる色。段ではなく役割の名前で持つ。色相は日中の空（238）。日の出・日の入りに近づくと低い日の光の色（色相 78）に寄り、曇りでは彩度が 0.003 まで下がる。",
	tokens: [
		["surface", "ページの背景"],
		["surface-raised", "カード、重なる面"],
		["surface-sunken", "入力欄、コード"],
		["fg", "本文"],
		["fg-strong", "見出し、強調"],
		["fg-muted", "補足、ラベル"],
		["fg-subtle", "プレースホルダー、無効"],
		["line", "標準の区切り線"],
		["line-subtle", "目立たせない区切り"],
		["line-strong", "操作できる要素の枠"],
		["line-hover", "操作できる要素の枠の hover"],
	],
};

const heat: Named = {
	name: "heat",
	label: "温度",
	description:
		"焚き火の色。熱い所ほど白く、冷めるほど赤く暗い順の 5 段。時刻と天気では変わらない。夜のテーマでは、役割のトークン heat-core、heat-flame、heat-ember、heat-coal、heat-ash がこの順に対応する。",
	tokens: [
		["white", "白熱。炎の芯、はぜた瞬間の火の粉"],
		["yellow", "炎"],
		["orange", "熾火。ember-400 と同じ値"],
		["red", "冷め始め。ember-600 と同じ値"],
		["ash", "灰"],
	],
};

function RampSection({ ramp }: { ramp: Ramp }) {
	return (
		<Section title={`${ramp.label}（--${ramp.name}-*）`} description={ramp.description}>
			<div className="flex overflow-hidden rounded-lg border border-line-subtle">
				{ramp.steps.map((s) => (
					<div key={s} className="flex flex-1 flex-col">
						<div className="h-14" style={{ background: `var(--${ramp.name}-${s})` }} />
						<code className="bg-surface-raised px-1 py-1.5 text-center font-mono text-xs text-fg-muted">
							{s}
						</code>
					</div>
				))}
			</div>
		</Section>
	);
}

function NamedColor({ name, usage }: { name: string; usage: string }) {
	const value = useResolvedColor(`--${name}`);
	return (
		<div className="flex flex-col overflow-hidden rounded-lg border border-line-subtle bg-surface-raised">
			<div className="h-14 border-b border-line-subtle" style={{ background: `var(--${name})` }} />
			<div className="flex flex-col gap-1 p-3">
				<code className="font-mono text-sm text-fg-strong">--{name}</code>
				<span className="text-sm text-fg-muted">{usage}</span>
				<code className="font-mono text-xs text-fg-muted">{value}</code>
			</div>
		</div>
	);
}

function NamedSection({ group }: { group: Named }) {
	return (
		<Section title={`${group.label}（--${group.name}-*）`} description={group.description}>
			<div className="grid grid-cols-[repeat(auto-fill,minmax(180px,1fr))] gap-3">
				{group.tokens.map(([token, usage]) => (
					<NamedColor key={token} name={`${group.name}-${token}`} usage={usage} />
				))}
			</div>
		</Section>
	);
}

/**
 * 基本の色。役割の色を定義するときだけ使い、アプリから直接は使わない。
 * 空の色（夜の空、昼の空）は時刻と天気で色相と彩度が動き、焚き火の色（ブランドカラー、温度）は動かない。
 * 時刻と天気を動かした見本は「ブランドの演出 / 時刻と天気」にある
 */
export const Primitives: Story = {
	render: () => (
		<Page>
			<RampSection ramp={sky} />
			<NamedSection group={day} />
			<RampSection ramp={ember} />
			<NamedSection group={heat} />
			<Section title="補助色" description="彩度を抑えた自然の色。状態の色のもとになる。">
				<div className="flex flex-wrap gap-3">
					{[
						["smoke", "煙"],
						["moss", "苔"],
						["moon", "月"],
						["rust", "鉄錆"],
					].map(([name, label]) => (
						<div
							key={name}
							className="flex items-center gap-2 rounded-md border border-line-subtle bg-surface-raised p-2 pr-4"
						>
							<span className="size-8 rounded-sm" style={{ background: `var(--${name})` }} />
							<code className="font-mono text-sm text-fg">--{name}</code>
							<span className="text-sm text-fg-muted">{label}</span>
						</div>
					))}
				</div>
			</Section>
		</Page>
	),
};

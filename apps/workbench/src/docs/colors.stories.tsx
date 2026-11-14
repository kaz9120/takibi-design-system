import type { Meta, StoryObj } from "@storybook/react-vite";
import { ContrastBadge, contrast, Page, Section, useCssVar } from "./catalog";

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
		description: "画面の奥行きを 4 段の面で表す。上に重なるものほど明るい（ダーク）。",
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
			"本文は fg、補足は fg-muted。fg-subtle は 4.5:1 に届かないので、プレースホルダーと無効だけに使う。",
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
		description: "操作できる要素の枠は line-strong にして、周りの面と 3:1 以上の差をつける。",
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
			"ブランドカラーは、CTA、リンク、フォーカス、ロゴだけに使う。目立たせたいという理由で、ほかに広げない。",
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

function Swatch({ token, kind }: { token: Token; kind: "surface" | "ink" }) {
	const value = useCssVar(`--color-${token.name}`);
	const bg = useCssVar(`--color-${token.on ?? "surface"}`);
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

/** 役割の色。アプリはこれだけを使う。右上のツールバーで夜と昼を切り替えると、値とコントラスト比が変わる */
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

const ramps = [
	{
		name: "ink",
		label: "炭・夜",
		steps: ["0", "50", "100", "200", "300", "400", "500", "600", "700", "800", "900"],
	},
	{
		name: "ember",
		label: "ブランドカラー（ember）",
		steps: ["50", "100", "200", "300", "400", "500", "600", "700", "800", "900"],
	},
];

/** 基本の色。色のパレットで、役割の色を定義するときだけ使う。アプリから直接は使わない */
export const Primitives: Story = {
	render: () => (
		<Page>
			{ramps.map((r) => (
				<Section key={r.name} title={`${r.label}（--${r.name}-*）`}>
					<div className="flex overflow-hidden rounded-lg border border-line-subtle">
						{r.steps.map((s) => (
							<div key={s} className="flex flex-1 flex-col">
								<div className="h-14" style={{ background: `var(--${r.name}-${s})` }} />
								<code className="bg-surface-raised px-1 py-1.5 text-center font-mono text-xs text-fg-muted">
									{s}
								</code>
							</div>
						))}
					</div>
				</Section>
			))}
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

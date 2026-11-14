import type { Meta, StoryObj } from "@storybook/react-vite";
import { Page, Section } from "./catalog";

const meta = {
	title: "基礎/文字",
	tags: ["!autodocs"],
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

const scale = [
	{ cls: "text-6xl", px: 88, role: "表示用の大見出し（トップページだけ）" },
	{ cls: "text-5xl", px: 64, role: "ヒーロー" },
	{ cls: "text-4xl", px: 48, role: "ページのタイトル" },
	{ cls: "text-3xl", px: 36, role: "大見出し" },
	{ cls: "text-2xl", px: 28, role: "中見出し" },
	{ cls: "text-xl", px: 22, role: "小見出し、ダイアログのタイトル" },
	{ cls: "text-lg", px: 18, role: "リード文" },
	{ cls: "text-base", px: 16, role: "本文" },
	{ cls: "text-sm", px: 14, role: "UI の文字、補足。UI の最小" },
	{ cls: "text-xs", px: 12, role: "装飾ラベル、タイムスタンプだけ" },
];

/** 文字の大きさの段。1.25 倍（長三度）で 12px から 88px まで 10 段 */
export const Scale: Story = {
	render: () => (
		<Page>
			<Section
				title="大きさ"
				description="見出しは font-semibold（600）か font-bold（700）。太く重い display 書体は使わない。"
			>
				<div className="flex flex-col divide-y divide-line-subtle">
					{scale.map((s) => (
						<div key={s.cls} className="grid grid-cols-[9rem_1fr] items-baseline gap-6 py-4">
							<div className="flex flex-col">
								<code className="font-mono text-sm text-fg-strong">{s.cls}</code>
								<span className="text-xs text-fg-subtle">
									{s.px}px ・ {s.role}
								</span>
							</div>
							<p
								className={`${s.cls} truncate text-fg-strong ${s.px >= 22 ? "font-semibold tracking-snug" : ""}`}
							>
								静かに燃える、手元の道具 Bonfire
							</p>
						</div>
					))}
				</div>
			</Section>
		</Page>
	),
};

/** 書体の組み合わせ。和文は LINE Seed JP、欧文は Inter、等幅は JetBrains Mono */
export const Families: Story = {
	render: () => (
		<Page>
			<Section
				title="書体"
				description="Inter を先頭に LINE Seed JP へつなぐ 1 本の font-sans で、和欧混植の見た目をそろえる。palt（約物詰め）と Inter の字形 cv11・ss01 を本文に当てている。"
			>
				<div className="grid gap-4 md:grid-cols-2">
					<div className="flex flex-col gap-2 rounded-lg border border-line-subtle bg-surface-raised p-6">
						<code className="font-mono text-xs text-fg-subtle">font-sans</code>
						<p className="text-2xl font-semibold tracking-snug text-fg-strong">夜の焚き火と、Quiet code.</p>
						<p className="text-base text-fg">
							開発者の手元に置く道具。長く使える、薄い体験を作る。（括弧）「かぎ括弧」も詰めて組む。
						</p>
					</div>
					<div className="flex flex-col gap-2 rounded-lg border border-line-subtle bg-surface-raised p-6">
						<code className="font-mono text-xs text-fg-subtle">font-mono</code>
						<pre className="font-mono text-sm text-fg">{`const fire = kindle({ wood: 3 });
fire.watch(() => breathe());`}</pre>
					</div>
				</div>
			</Section>
			<Section title="本文の組み方" description="1 行は 68ch（和文でおよそ 32 字）まで。行間は 1.7。">
				<div className="max-w-prose rounded-lg border border-line-subtle bg-surface-raised p-6">
					<h3 className="text-xl font-semibold tracking-snug text-fg-strong">火床に薪をくべる</h3>
					<p className="mt-2 text-base text-fg">
						派手な炎ではなく、長く、深く、静かに熱を保ち続けるもの。UI
						もそうあってほしい。ダークを基調に、深い夜のような落ち着きと、焚き火の暖かさを共存させる。過剰な装飾はせず、コードのように引き算で整える。
					</p>
					<p className="mt-3 text-sm text-fg-muted">補足の文は text-sm と fg-muted で一段下げる。</p>
				</div>
			</Section>
			<Section title="アイブロウ" description="大文字と記号の小見出しは、等幅・字間 0.18em で添える。">
				<span className="font-mono text-xs tracking-mark text-fg-subtle uppercase">Section 01 — Embers</span>
			</Section>
		</Page>
	),
};

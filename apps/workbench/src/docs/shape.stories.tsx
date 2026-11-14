import type { Meta, StoryObj } from "@storybook/react-vite";
import { Page, Section } from "./catalog";

const meta = {
	title: "基礎/形と奥行き",
	tags: ["!autodocs"],
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

/** 余白は 4px を 1 単位にする（Tailwind の p-1 = 4px） */
export const Spacing: Story = {
	render: () => (
		<Page>
			<Section
				title="余白"
				description="要素の間は gap で取る。行内は 1〜2（4〜8px）、要素の間は 4〜6（16〜24px）、セクションの間は 24（96px）以上。"
			>
				<div className="flex flex-col gap-2">
					{[
						[1, "4px", "アイコンと文字"],
						[2, "8px", "行内の要素"],
						[3, "12px", "小さなコンポーネントの内側"],
						[4, "16px", "要素の間（基準）"],
						[6, "24px", "カードの内側"],
						[8, "32px", "まとまりの間"],
						[12, "48px", "セクションの内側"],
						[24, "96px", "セクションの間"],
					].map(([n, px, use]) => (
						<div key={n} className="grid grid-cols-[4rem_4rem_1fr_12rem] items-center gap-4">
							<code className="font-mono text-sm text-fg-strong">{n}</code>
							<span className="font-mono text-xs text-fg-subtle">{px}</span>
							<div className="h-3 rounded-sm bg-brand" style={{ width: px }} />
							<span className="text-sm text-fg-muted">{use}</span>
						</div>
					))}
				</div>
			</Section>
		</Page>
	),
};

/** 角丸は小さめにする。標準は 6px（rounded-md） */
export const Radius: Story = {
	render: () => (
		<Page>
			<Section title="角丸" description="ボタンを rounded-full で丸めない。円形はアバターとスイッチだけ。">
				<div className="flex flex-wrap gap-6">
					{[
						["sm", "4px", "小さなバッジ、キー表示"],
						["md", "6px", "ボタン、入力欄（標準）"],
						["lg", "10px", "カード"],
						["xl", "16px", "ダイアログ、大きなパネル"],
						["full", "9999px", "アバター、スイッチ"],
					].map(([name, px, use]) => (
						<div key={name} className="flex w-36 flex-col gap-2">
							<div
								className="size-24 border border-line bg-surface-raised"
								style={{ borderRadius: `var(--radius-${name})` }}
							/>
							<code className="font-mono text-sm text-fg-strong">rounded-{name}</code>
							<span className="text-xs text-fg-subtle">
								{px} ・ {use}
							</span>
						</div>
					))}
				</div>
			</Section>
		</Page>
	),
};

/** ダークでは黒い影が見えにくいので、上の縁の明るい線（rim）とブランドカラーの光（glow）で奥行きを出す */
export const Elevation: Story = {
	render: () => (
		<Page>
			<Section title="影と光">
				<div className="grid grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-8 p-4">
					{[
						["shadow-rim", "bg-surface-raised", "上端の 1px の光"],
						["shadow-card", "bg-surface-raised", "カード"],
						["shadow-pop", "bg-surface-overlay", "ポップオーバー、メニュー、ダイアログ"],
						["shadow-glow-soft", "bg-surface-raised", "hover で照らす"],
						["shadow-glow", "bg-surface-raised", "主要な行動の hover"],
						["shadow-glow-strong", "bg-surface-raised", "主要な行動のフォーカス"],
					].map(([shadow, bg, use]) => (
						<div key={shadow} className="flex flex-col gap-3">
							<div
								className={`h-24 rounded-lg border border-line-subtle ${bg}`}
								style={{ boxShadow: `var(--${shadow})` }}
							/>
							<code className="font-mono text-sm text-fg-strong">{shadow}</code>
							<span className="text-xs text-fg-subtle">{use}</span>
						</div>
					))}
				</div>
			</Section>
		</Page>
	),
};

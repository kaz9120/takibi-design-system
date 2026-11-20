import type { Meta, StoryObj } from "@storybook/react-vite";
import { Flame } from "lucide-react";
import "takibi-design-system/embers";
import { Button } from "takibi-design-system";
import { Page, Section } from "./catalog";

const meta = {
	title: "ブランドの演出/火の粉とロゴ",
	tags: ["!autodocs"],
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * 火の粉。`import "takibi-design-system/embers"` で `<takibi-embers>` が使えるようになる。
 * 動き方は焚き火の計算モデルの火の粉と同じ式で、要素の高さを 1.8m として計算する。飛び出した粒は 0.12 秒ほどで気流に乗り、
 * 冷えるにつれて黄から赤へ変わり、小さい粒は 0.8 秒、大きい粒は 2.4 秒ほどで消える。1/30 秒ぶんの軌跡を線で描く。
 * 親に position: relative が要る。炎（`<takibi-fire>`）と合わせて 1 画面に 1 つまで。
 * 動きを減らす設定では、火の粉を描かずに下からのグローだけを残す。
 */
export const Embers: Story = {
	render: () => (
		<div className="relative flex h-[28rem] flex-col items-center justify-center gap-4 overflow-hidden rounded-xl border border-line-subtle bg-surface">
			<takibi-embers density={45} wind={0.15} />
			<span className="relative font-mono text-xs tracking-mark text-fg-subtle uppercase">Takibi</span>
			<h1 className="relative text-4xl font-semibold tracking-tight text-fg-strong">
				静かに燃える、手元の道具
			</h1>
			<p className="relative text-base text-fg-muted">長く使える、薄い体験を作る</p>
			<Button className="relative" size="lg">
				<Flame />
				火を入れる
			</Button>
		</div>
	),
};

/** ロゴマーク。暗い面には cream、明るい面には dark を使う */
export const Logo: Story = {
	render: () => (
		<Page>
			<Section title="ロゴ" description="`takibi-design-system/assets/logo/*.svg` から読み込む。">
				<div className="flex flex-wrap gap-4">
					<div className="flex size-40 flex-col items-center justify-center gap-3 rounded-lg bg-[#13110e]">
						<img src="./mark-cream.svg" alt="" className="size-16" />
						<code className="font-mono text-xs text-[#a8a094]">mark-cream.svg</code>
					</div>
					<div className="flex size-40 flex-col items-center justify-center gap-3 rounded-lg bg-[#fbf8f0]">
						<img src="./mark-dark.svg" alt="" className="size-16" />
						<code className="font-mono text-xs text-[#5f5647]">mark-dark.svg</code>
					</div>
				</div>
			</Section>
		</Page>
	),
};

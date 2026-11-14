import type { Meta, StoryObj } from "@storybook/react-vite";
import * as React from "react";
import { expect, waitFor } from "storybook/test";
import type { ComponentDocs } from "../spec";
import { Button } from "./button";
import { Image } from "./image";

/** 見本の画像。通信なしで描ける SVG の焚き火の景色 */
function campfireScene(hue = 24) {
	const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 400">
<defs>
<radialGradient id="g" cx="50%" cy="78%" r="60%"><stop offset="0" stop-color="hsl(${hue} 95% 62%)"/><stop offset=".35" stop-color="hsl(${hue - 6} 80% 32%)"/><stop offset="1" stop-color="hsl(30 20% 6%)"/></radialGradient>
<linearGradient id="f" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="hsl(${hue + 16} 100% 70%)"/><stop offset="1" stop-color="hsl(${hue} 95% 50%)" stop-opacity="0"/></linearGradient>
</defs>
<rect width="640" height="400" fill="url(#g)"/>
<path d="M320 330c-40-30-30-80 0-130 10 40 40 50 40 90 0 25-15 40-40 40z" fill="url(#f)"/>
<path d="M300 336c-14-18-8-44 10-62 2 24 22 30 22 48 0 10-8 18-32 14z" fill="hsl(${hue + 24} 100% 78%)" opacity=".8"/>
<rect x="230" y="332" width="180" height="14" rx="7" fill="hsl(25 30% 14%)" transform="rotate(-8 320 339)"/>
<rect x="230" y="332" width="180" height="14" rx="7" fill="hsl(25 30% 18%)" transform="rotate(8 320 339)"/>
</svg>`;
	return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

const tinyPlaceholder = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(
	'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 4 3"><rect width="4" height="3" fill="#2a1a10"/><circle cx="2" cy="2.4" r="1.2" fill="#c64414"/></svg>',
)}`;

const meta = {
	title: "コンポーネント/データ表示/Image",
	component: Image,
	args: { src: campfireScene(), alt: "夜の焚き火", ratio: "16/9" },
	argTypes: {
		rounded: { control: "inline-radio", options: ["none", "sm", "md", "lg", "xl", "full"] },
		fit: { control: "inline-radio", options: ["cover", "contain"] },
	},
	parameters: {
		takibi: {
			use: ["記録の写真や見出しの画像など、縦横の比が決まった画像を置く"],
			avoid: [
				{ case: "人やチームの顔写真", instead: "データ表示/Avatar" },
				{ case: "複数の画像を送りながら見せる", instead: "データ表示/Carousel" },
				{ case: "画像の代わりに、読み込み中の面だけを見せる", instead: "データ表示/Skeleton" },
			],
			dos: [
				"ratio を渡し、読み込む前から場所を確保する。届いても周りがずれない",
				"意味のある画像には、何が写っているかを alt に書く",
				'飾りの画像は alt="" にする',
				"小さな画像を用意できるときは placeholder に渡し、ぼかして待たせる",
			],
			donts: ['rounded="full" を人の写真以外に使わない', "alt に「画像」「写真」とだけ書かない"],
			copy: {
				rules: ["alt は、写っているものを短い名詞句で書く"],
				examples: [{ good: "夜の焚き火", bad: "画像", note: "何が写っているかが分かる" }],
			},
			a11y: [
				"読み込めなかったときも、alt の文が画像の名前として読み上げられ、画面にも出る",
				"待つ面とぼかした小さな画像は、読み上げない",
			],
			motion: [
				"待つ間は、ブランドカラーを薄く混ぜた帯が 1.8 秒で左から右へ流れる（motion-ember-pulse）",
				"届くと、画像は 1.04 倍でぼけた透明の状態から、560ms で等倍のくっきりした姿になる（ease-ember）",
				"読み込めなかったときの代わりの表示は、200ms で薄く現れる",
			],
			related: ["データ表示/Avatar", "データ表示/Carousel", "データ表示/Skeleton"],
		} satisfies ComponentDocs,
	},
} satisfies Meta<typeof Image>;

export default meta;
type Story = StoryObj<typeof meta>;

/** 16:9 の画像。読み込み終わると、ぼけた状態からくっきり現れる */
export const Basic: Story = {
	name: "基本",
	render: (args) => (
		<div className="max-w-md">
			<Image {...args} />
		</div>
	),
};

/** 縦横の比の一覧。読み込む前から場所を確保するので、届いても周りがずれない */
export const Ratios: Story = {
	name: "縦横の比",
	render: () => (
		<div className="grid max-w-2xl grid-cols-2 gap-4 sm:grid-cols-4">
			{([1, "4/3", "3/2", "16/9"] as const).map((r) => (
				<figure key={r} className="flex flex-col gap-1.5">
					<Image src={campfireScene()} alt="" ratio={r} />
					<figcaption className="text-sm text-fg-muted">{r}</figcaption>
				</figure>
			))}
		</div>
	),
};

/** 角丸の一覧。円形は人の写真だけに使う */
export const Rounded: Story = {
	name: "角丸",
	render: () => (
		<div className="flex flex-wrap items-end gap-4">
			{(["none", "sm", "md", "lg", "xl", "full"] as const).map((r) => (
				<figure key={r} className="flex w-24 flex-col gap-1.5">
					<Image src={campfireScene(18)} alt="" ratio={1} rounded={r} />
					<figcaption className="text-sm text-fg-muted">{r}</figcaption>
				</figure>
			))}
		</div>
	),
};

/**
 * 読み込みの流れ。待つ間は帯が流れる面か、小さな画像をぼかしたものを出し、
 * 届くとぼけた状態からくっきり現れる。「読み込み直す」で何度でも見られる。
 */
export const Loading: Story = {
	name: "読み込み",
	render: () => <LoadingDemo />,
};

function LoadingDemo() {
	const [round, setRound] = React.useState(0);
	return (
		<div className="flex max-w-2xl flex-col gap-4">
			<SlowPair key={round} hue={20 + (round % 3) * 6} />
			<div>
				<Button variant="secondary" size="sm" onClick={() => setRound((n) => n + 1)}>
					読み込み直す
				</Button>
			</div>
		</div>
	);
}

/** 1.4 秒たってから src を渡し、遅い通信を真似る */
function SlowPair({ hue }: { hue: number }) {
	const [ready, setReady] = React.useState(false);
	React.useEffect(() => {
		const t = setTimeout(() => setReady(true), 1400);
		return () => clearTimeout(t);
	}, []);
	const src = ready ? campfireScene(hue) : undefined;
	return (
		<div className="grid grid-cols-2 gap-4">
			<figure className="flex flex-col gap-1.5">
				<Wait src={src} />
				<figcaption className="text-sm text-fg-muted">待つ面だけ</figcaption>
			</figure>
			<figure className="flex flex-col gap-1.5">
				<Wait src={src} placeholder={tinyPlaceholder} />
				<figcaption className="text-sm text-fg-muted">小さな画像をぼかす</figcaption>
			</figure>
		</div>
	);
}

/** src が届くまでは img を置かず、待つ面だけを見せる */
function Wait({ src, placeholder }: { src?: string; placeholder?: string }) {
	if (!src) {
		return (
			<div className="relative aspect-[4/3] overflow-hidden rounded-lg bg-surface-sunken">
				{placeholder ? (
					<img
						src={placeholder}
						alt=""
						className="absolute inset-0 size-full scale-110 object-cover blur-xl"
					/>
				) : (
					<span className="motion-ember-pulse absolute inset-0" />
				)}
			</div>
		);
	}
	return <Image key={src} src={src} alt="夜の焚き火" ratio="4/3" placeholder={placeholder} />;
}

/** 読み込めなかったとき。アイコンと alt の文に置き換わり、場所の大きさは変わらない */
export const LoadError: Story = {
	name: "読み込めないとき",
	args: { src: "/missing-image.png", alt: "河原の焚き火（読み込めない）" },
	render: (args) => (
		<div className="max-w-md">
			<Image {...args} />
		</div>
	),
	play: async ({ canvas }) => {
		await waitFor(() =>
			expect(canvas.getByRole("img", { name: "河原の焚き火（読み込めない）" })).toBeVisible(),
		);
	},
};

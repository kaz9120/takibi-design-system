import type { Meta, StoryObj } from "@storybook/react-vite";
import * as React from "react";
import { expect } from "storybook/test";
import type { ComponentDocs } from "../spec";
import { Avatar, AvatarFallback, AvatarGroup, AvatarImage, AvatarStatus } from "./avatar";
import { Button } from "./button";

/** 写真の代わりに使う、横顔の影の絵。背景の色だけを変えて人を見分ける */
function portrait(from: string, to: string) {
	const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${from}"/><stop offset="1" stop-color="${to}"/></linearGradient></defs><rect width="64" height="64" fill="url(#g)"/><circle cx="32" cy="26" r="11" fill="#1a1814" fill-opacity=".55"/><path d="M12 64c2-14 10-21 20-21s18 7 20 21z" fill="#1a1814" fill-opacity=".55"/></svg>`;
	return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

const people = [
	{ name: "山本 一真", initials: "山", src: portrait("#f8a05c", "#9a3210") },
	{ name: "Aoi Sato", initials: "AS", src: portrait("#c8d4e0", "#5a5247") },
	{ name: "Ren Kato", initials: "RK", src: portrait("#7a8c5e", "#26221c") },
	{ name: "Mio Ito", initials: "MI", src: undefined },
	{ name: "Sora Ueda", initials: "SU", src: portrait("#b8503a", "#3a342b") },
	{ name: "Haru Mori", initials: "HM", src: undefined },
	{ name: "Yui Abe", initials: "YA", src: portrait("#fbc189", "#7d7468") },
];

function person(i: number) {
	return people[i % people.length] as (typeof people)[number];
}

const meta = {
	title: "コンポーネント/データ表示/Avatar",
	component: Avatar,
	argTypes: {
		size: { control: "inline-radio", options: ["sm", "md", "lg", "xl"] },
	},
	args: { size: "lg" },
	parameters: {
		takibi: {
			use: [
				"記録の書き手、コメントの投稿者など、誰のものかを示す",
				"参加者や共同編集者を、AvatarGroup で重ねて並べる",
			],
			dos: [
				"AvatarFallback を必ず置く。写真がないときや、読み込めなかったときに頭文字を出す",
				"AvatarImage の alt には名前を入れる",
				"頭文字は 2 文字までにする",
			],
			donts: [
				"名前を添えずに、アバターだけで人を見分けさせない",
				"人やチーム以外のもの（ファイルの種類など）に使わない",
			],
			a11y: [
				"AvatarStatus は、色の点に加えて「オンライン」「離席中」などの文言を読み上げる",
				"まとめた「+3」は「ほか3人」と読み上げる。文言は overflowLabel で変えられる",
			],
			motion: [
				"写真は読み込み終わると、4px のぼかしと透明の状態から 360ms で現れる（ease-standard）",
				"AvatarGroup の中では、hover した人だけが 2px 浮く（ease-land）",
				"状態の点の色は 200ms で切り替わる",
			],
			related: ["データ表示/Badge", "データ表示/Image"],
		} satisfies ComponentDocs,
	},
	render: (args) => (
		<Avatar {...args}>
			<AvatarFallback>山</AvatarFallback>
			<AvatarImage src={person(0).src} alt="山本 一真" />
		</Avatar>
	),
} satisfies Meta<typeof Avatar>;

export default meta;
type Story = StoryObj<typeof meta>;

/** 顔写真。読み込み終わると、頭文字の上にフェードインする */
export const Basic: Story = { name: "基本" };

/** 写真がないとき、読み込めなかったときは頭文字を出す */
export const Fallback: Story = {
	name: "頭文字",
	render: (args) => (
		<div className="flex items-center gap-3">
			<Avatar {...args}>
				<AvatarFallback>AS</AvatarFallback>
			</Avatar>
			<Avatar {...args}>
				<AvatarFallback>山</AvatarFallback>
				<AvatarImage src="data:image/png;base64,AAAA" alt="山本 一真" />
			</Avatar>
		</div>
	),
};

/** sm（24px）、md（32px）、lg（40px）、xl（56px）。写真と頭文字を並べる */
export const Sizes: Story = {
	name: "サイズ",
	render: () => (
		<div className="flex items-end gap-3">
			{(["sm", "md", "lg", "xl"] as const).map((size) => (
				<Avatar key={size} size={size}>
					<AvatarFallback>AS</AvatarFallback>
					<AvatarImage src={person(1).src} alt="Aoi Sato" />
				</Avatar>
			))}
			{(["sm", "md", "lg", "xl"] as const).map((size) => (
				<Avatar key={`f-${size}`} size={size}>
					<AvatarFallback>RK</AvatarFallback>
				</Avatar>
			))}
		</div>
	),
};

/** 右下の点で状態を示す。色だけに頼らず、スクリーンリーダーでは状態の名前を伝える */
export const Status: Story = {
	name: "状態の点",
	render: (args) => (
		<div className="flex items-center gap-4">
			{(["online", "away", "busy", "offline"] as const).map((status, i) => (
				<Avatar key={status} {...args}>
					<AvatarFallback>{person(i).initials}</AvatarFallback>
					{person(i).src && <AvatarImage src={person(i).src} alt={person(i).name} />}
					<AvatarStatus status={status} />
				</Avatar>
			))}
		</div>
	),
};

/** 少し重ねて並べ、超えた分は「+3」にまとめる。hover した人だけが 2px 浮く */
export const Group: Story = {
	name: "グループ",
	render: () => (
		<div className="flex flex-col gap-5">
			{(["sm", "md", "lg"] as const).map((size) => (
				<AvatarGroup key={size} size={size} max={4}>
					{people.map((p) => (
						<Avatar key={p.name}>
							<AvatarFallback>{p.initials}</AvatarFallback>
							{p.src && <AvatarImage src={p.src} alt={p.name} />}
						</Avatar>
					))}
				</AvatarGroup>
			))}
		</div>
	),
	play: async ({ canvas }) => {
		const overflow = canvas.getAllByRole("img", { name: "ほか3人" });
		await expect(overflow).toHaveLength(3);
	},
};

function LoadingDemo() {
	const [src, setSrc] = React.useState<string>();
	const [round, setRound] = React.useState(0);
	React.useEffect(() => {
		setSrc(undefined);
		const t = setTimeout(() => setSrc(person((round % 3) + 1).src), 700);
		return () => clearTimeout(t);
	}, [round]);
	return (
		<div className="flex items-center gap-4">
			<Avatar size="xl">
				<AvatarFallback>{person((round % 3) + 1).initials}</AvatarFallback>
				{src && <AvatarImage src={src} alt={person((round % 3) + 1).name} />}
			</Avatar>
			<Button variant="secondary" size="sm" onClick={() => setRound((r) => r + 1)}>
				読み込み直す
			</Button>
		</div>
	);
}

/** 写真が届くまでは頭文字を出し、届いたら写真がぼけた状態からフェードインする */
export const Loading: Story = { name: "読み込み", render: () => <LoadingDemo /> };

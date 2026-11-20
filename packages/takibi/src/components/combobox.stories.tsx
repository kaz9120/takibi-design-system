import type { Meta, StoryObj } from "@storybook/react-vite";
import { MapPin } from "lucide-react";
import { expect, screen, userEvent, waitFor } from "storybook/test";
import type { ComponentDocs } from "../spec";
import {
	Combobox,
	ComboboxChips,
	ComboboxCollection,
	ComboboxContent,
	ComboboxGroup,
	ComboboxGroupLabel,
	ComboboxInput,
	ComboboxItem,
	ComboboxSeparator,
} from "./combobox";
import { Field, FieldDescription, FieldError, FieldLabel } from "./field";

type Site = { value: string; label: string; region: string };

const sites: Site[] = [
	{ value: "fumoto", label: "ふもとっぱら", region: "静岡" },
	{ value: "asagiri", label: "朝霧ジャンボリー", region: "静岡" },
	{ value: "honsu", label: "本栖湖", region: "山梨" },
	{ value: "shiga", label: "志賀高原", region: "長野" },
	{ value: "kirigamine", label: "霧ヶ峰", region: "長野" },
	{ value: "nasu", label: "那須高原", region: "栃木" },
	{ value: "michinoku", label: "みちのく公園", region: "宮城" },
	{ value: "tomamu", label: "トマム", region: "北海道" },
	{ value: "shikotsu", label: "支笏湖", region: "北海道" },
];

const tags = ["焚き火", "ソロ", "川沿い", "林間", "湖畔", "犬可", "直火可", "電源", "温泉"];

const meta = {
	title: "コンポーネント/フォーム/Combobox",
	component: ComboboxContent,
	parameters: {
		takibi: {
			use: [
				"10 個を超える候補から、文字で絞り込んで 1 つ（multiple で複数）を選ぶ",
				"複数の値を選び、タグにして入力欄に並べる",
			],
			avoid: [
				{ case: "候補が 10 個以下", instead: "フォーム/Select" },
				{ case: "候補にない自由な文字も受け付けたい", instead: "フォーム/Autocomplete" },
				{ case: "選択肢が 5 個以下で見比べさせたい", instead: "フォーム/RadioGroup" },
			],
			dos: [
				"プレースホルダーに、何で探せるかを書く（名前で探す）",
				"候補が多いときは、見出し（ComboboxGroupLabel）でまとめる",
				"1 件もないときの文言（empty）は、次にできることが分かるようにする",
			],
			donts: ["候補にない文字を、選んだ値として残さない。自由な文字を受け付けるなら Autocomplete を使う"],
			copy: {
				rules: ["プレースホルダーは「〜で探す」と書く", "候補がないときは、何がないかを書く"],
				examples: [{ good: "名前で探す", bad: "入力してください", note: "何で絞り込めるかが分かる" }],
			},
			keyboard: [
				["文字キー", "候補を開いて絞り込む"],
				["↑ / ↓", "候補の間を移る"],
				["Enter", "選ぶ"],
				["Esc", "候補を閉じる"],
				["← / Backspace", "複数の選択で、入力欄の先頭にいるとき、← でタグへ移り、Backspace で外す"],
			],
			a11y: [
				"入力欄は combobox、候補の一覧は listbox として読み上げられる",
				"タグの外すボタンは「ソロを外す」のように、どの値かを含めて読み上げられる",
			],
			motion: [
				"候補の一覧は、入力欄から 4px 離れた 0.94 倍の大きさから、はぜる曲線（ease-pop）で現れる（motion-rise）",
				"候補の間を移ると、背景の帯が揺れる曲線（ease-sway）で滑って付いてくる",
				"消去ボタンは値があるときだけ、0.5 倍の大きさのぼけた状態から現れる（motion-swap）",
				"タグは 0.8 倍からはぜる曲線（ease-pop）で現れ、外すと 120ms で縮んで消え、残りのタグが詰める",
			],
			related: ["フォーム/Select", "フォーム/Autocomplete", "フォーム/Tag", "フォーム/InputGroup"],
		} satisfies ComponentDocs,
	},
	decorators: [
		(Story) => (
			<div className="w-72">
				<Story />
			</div>
		),
	],
} satisfies Meta<typeof ComboboxContent>;

export default meta;
type Story = StoryObj<typeof meta>;

/** 打つと、絞り込まれた候補が入力欄の下に現れる。選んでいる候補の背景は、候補から候補へ滑って移る */
export const Basic: Story = {
	name: "基本",
	render: () => (
		<Combobox items={sites}>
			<Field>
				<FieldLabel>キャンプ場</FieldLabel>
				<ComboboxInput placeholder="名前で探す" />
			</Field>
			<ComboboxContent>
				{(site: Site) => (
					<ComboboxItem key={site.value} value={site}>
						{site.label}
					</ComboboxItem>
				)}
			</ComboboxContent>
		</Combobox>
	),
};

/** 選んだ値を消すボタンと、先頭のアイコン。消すボタンは値があるときだけ現れる */
export const WithClear: Story = {
	name: "消去ボタンとアイコン",
	render: () => (
		<Combobox items={sites} defaultValue={sites[2]}>
			<ComboboxInput aria-label="キャンプ場" placeholder="名前で探す" showClear icon={<MapPin />} />
			<ComboboxContent>
				{(site: Site) => (
					<ComboboxItem key={site.value} value={site}>
						{site.label}
					</ComboboxItem>
				)}
			</ComboboxContent>
		</Combobox>
	),
};

/** 複数を選ぶ。選んだ値はタグになって弾んで現れ、外すと縮んで消え、残りのタグが詰める */
export const Multiple: Story = {
	name: "複数の選択",
	render: () => (
		<Combobox items={tags} multiple defaultValue={["焚き火", "湖畔"]}>
			<Field>
				<FieldLabel>こだわり</FieldLabel>
				<ComboboxChips placeholder="追加する" />
			</Field>
			<ComboboxContent>
				{(tag: string) => (
					<ComboboxItem key={tag} value={tag}>
						{tag}
					</ComboboxItem>
				)}
			</ComboboxContent>
		</Combobox>
	),
};

/** 地域ごとの見出しと区切り線で、候補をまとめる */
export const Grouped: Story = {
	name: "見出しでまとめる",
	render: () => {
		const groups = Object.entries(
			sites.reduce<Record<string, Site[]>>((acc, site) => {
				acc[site.region] = [...(acc[site.region] ?? []), site];
				return acc;
			}, {}),
		).map(([region, items]) => ({ value: region, items }));
		return (
			<Combobox items={groups}>
				<ComboboxInput aria-label="キャンプ場" placeholder="名前で探す" />
				<ComboboxContent>
					{(group: { value: string; items: Site[] }, index: number) => (
						<ComboboxGroup key={group.value} items={group.items}>
							{index > 0 && <ComboboxSeparator />}
							<ComboboxGroupLabel>{group.value}</ComboboxGroupLabel>
							<ComboboxCollection>
								{(site: Site) => (
									<ComboboxItem key={site.value} value={site}>
										{site.label}
									</ComboboxItem>
								)}
							</ComboboxCollection>
						</ComboboxGroup>
					)}
				</ComboboxContent>
			</Combobox>
		);
	},
};

export const Sizes: Story = {
	name: "サイズ",
	render: () => (
		<div className="flex flex-col gap-3">
			{(["sm", "md", "lg"] as const).map((size) => (
				<Combobox key={size} items={sites}>
					<ComboboxInput size={size} aria-label={`キャンプ場（${size}）`} placeholder="名前で探す" />
					<ComboboxContent>
						{(site: Site) => (
							<ComboboxItem key={site.value} value={site}>
								{site.label}
							</ComboboxItem>
						)}
					</ComboboxContent>
				</Combobox>
			))}
		</div>
	),
};

/** 状態ごとの見た目。エラーは danger の色の枠、無効は不透明度 50% */
export const States: Story = {
	name: "状態",
	render: () => (
		<div className="flex flex-col gap-3">
			<Combobox items={sites}>
				<ComboboxInput aria-label="未選択" placeholder="名前で探す" />
			</Combobox>
			<Combobox items={sites} defaultValue={sites[0]}>
				<ComboboxInput aria-label="選択済み" />
			</Combobox>
			<Combobox items={sites}>
				<ComboboxInput aria-label="エラー" aria-invalid placeholder="名前で探す" />
			</Combobox>
			<Combobox items={sites} defaultValue={sites[0]} disabled>
				<ComboboxInput aria-label="無効" />
			</Combobox>
		</div>
	),
};

/** Field の中に置くと、ラベル・補足・必須の検証が Input と同じように効く */
export const WithField: Story = {
	name: "ラベルと検証",
	render: () => (
		<Field validationMode="onBlur">
			<FieldLabel required>キャンプ場</FieldLabel>
			<Combobox items={sites} required>
				<ComboboxInput placeholder="名前で探す" />
				<ComboboxContent>
					{(site: Site) => (
						<ComboboxItem key={site.value} value={site}>
							{site.label}
						</ComboboxItem>
					)}
				</ComboboxContent>
			</Combobox>
			<FieldDescription>予約できる場所だけが出ます</FieldDescription>
			<FieldError match="valueMissing">キャンプ場を選んでください</FieldError>
		</Field>
	),
};

/** 打つと候補が開いて絞り込まれ、↓ で移って Enter で選ぶ。Esc で閉じる */
export const KeyboardInteraction: Story = {
	name: "キーボード操作",
	render: Basic.render,
	play: async ({ canvas }) => {
		const input = canvas.getByRole("combobox", { name: "キャンプ場" });
		await userEvent.click(input);
		await userEvent.keyboard("高原");
		await screen.findByRole("listbox");
		await waitFor(() => expect(screen.getAllByRole("option")).toHaveLength(2));
		await userEvent.keyboard("{ArrowDown}");
		await waitFor(() =>
			expect(screen.getByRole("option", { name: "志賀高原" })).toHaveAttribute("data-highlighted"),
		);
		await userEvent.keyboard("{ArrowDown}");
		await waitFor(() =>
			expect(screen.getByRole("option", { name: "那須高原" })).toHaveAttribute("data-highlighted"),
		);
		await userEvent.keyboard("{Enter}");
		await expect(input).toHaveValue("那須高原");
		await waitFor(() => expect(input).toHaveAttribute("aria-expanded", "false"));
	},
};

/** 複数の選択では、入力欄の先頭で ← を押すとタグへ移り、Backspace で外れる */
export const MultipleKeyboard: Story = {
	name: "複数の選択のキーボード操作",
	render: Multiple.render,
	play: async ({ canvas }) => {
		const input = canvas.getByRole("combobox", { name: "こだわり" });
		await userEvent.click(input);
		await userEvent.keyboard("ソロ");
		await waitFor(() => expect(screen.getByRole("option", { name: "ソロ" })).toBeVisible());
		await userEvent.keyboard("{ArrowDown}{Enter}");
		await waitFor(() => expect(canvas.getByRole("button", { name: "ソロを外す" })).toBeInTheDocument());
		await userEvent.keyboard("{Escape}");
		await userEvent.keyboard("{ArrowLeft}");
		await userEvent.keyboard("{Backspace}");
		await waitFor(() => expect(canvas.queryByRole("button", { name: "ソロを外す" })).not.toBeInTheDocument());
	},
};

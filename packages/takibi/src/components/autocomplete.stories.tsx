import type { Meta, StoryObj } from "@storybook/react-vite";
import { Clock, Search, Tag } from "lucide-react";
import { expect, screen, userEvent, waitFor } from "storybook/test";
import type { ComponentDocs } from "../spec";
import {
	Autocomplete,
	AutocompleteCollection,
	AutocompleteContent,
	AutocompleteGroup,
	AutocompleteGroupLabel,
	AutocompleteInput,
	AutocompleteItem,
} from "./autocomplete";
import { Field, FieldDescription, FieldLabel } from "./field";

const words = [
	"焚き火台",
	"焚き付け",
	"薪割り",
	"薪ストーブ",
	"火吹き棒",
	"火ばさみ",
	"耐火グローブ",
	"着火剤",
];

const meta = {
	title: "コンポーネント/フォーム/Autocomplete",
	component: AutocompleteContent,
	parameters: {
		takibi: {
			use: [
				"検索欄で、打った文字に合う言葉を候補に出す",
				"自由な文字を受け付けつつ、よく使う言葉を候補で手助けする",
			],
			avoid: [
				{ case: "候補の中から必ず選ばせる", instead: "フォーム/Combobox" },
				{ case: "決まった少ない選択肢から選ぶ", instead: "フォーム/Select" },
				{ case: "候補を出さない検索欄", instead: "フォーム/InputGroup" },
			],
			dos: [
				"候補は打った文字に合うものだけにし、多くても 10 件ほどに絞る",
				"最近の検索などは、見出し（AutocompleteGroupLabel）でまとめる",
			],
			donts: ["候補にない文字を、エラーにしない。自由に入れられるのがこのコンポーネントの役割"],
			copy: {
				rules: ["候補がないときの文言（empty）は、何がないかを書く"],
				examples: [{ good: "合う道具がありません", bad: "No results", note: "何がないかが分かる" }],
			},
			keyboard: [
				["文字キー", "合う候補を開く"],
				["↑ / ↓", "候補の間を移る"],
				["Enter", "選んでいる候補を入力欄に入れる"],
				["Esc", "候補を閉じる。打った文字は残る"],
			],
			a11y: [
				"入力欄は combobox、候補の一覧は listbox として読み上げられる",
				"先頭のアイコンは飾りなので、入力欄に aria-label か Field のラベルで名前を付ける",
			],
			motion: [
				"候補の一覧は、入力欄から 4px 離れた 0.94 倍の大きさから、ばね（spring-soft）で現れる（motion-rise）",
				"候補の間を移ると、背景の帯がばね（spring-glide）で滑って付いてくる",
				"消去ボタンは文字があるときだけ、0.5 倍の大きさのぼけた状態から現れる（motion-swap）",
			],
			related: ["フォーム/Combobox", "フォーム/InputGroup", "フォーム/Select"],
		} satisfies ComponentDocs,
	},
	decorators: [
		(Story) => (
			<div className="w-72">
				<Story />
			</div>
		),
	],
} satisfies Meta<typeof AutocompleteContent>;

export default meta;
type Story = StoryObj<typeof meta>;

/** 打つと、合う候補が入力欄の下に出る。候補にない言葉もそのまま入れられる */
export const Basic: Story = {
	name: "基本",
	render: () => (
		<Autocomplete items={words}>
			<AutocompleteInput aria-label="道具を探す" placeholder="道具を探す" icon={<Search />} showClear />
			<AutocompleteContent>
				{(word: string) => (
					<AutocompleteItem key={word} value={word}>
						{word}
					</AutocompleteItem>
				)}
			</AutocompleteContent>
		</Autocomplete>
	),
};

/** 合う候補がないときの文言。省くと、候補がないときは一覧ごと閉じる */
export const WithEmpty: Story = {
	name: "候補がないとき",
	render: () => (
		<Autocomplete items={words}>
			<AutocompleteInput aria-label="道具を探す" placeholder="道具を探す" icon={<Search />} />
			<AutocompleteContent empty="合う道具がありません">
				{(word: string) => (
					<AutocompleteItem key={word} value={word}>
						{word}
					</AutocompleteItem>
				)}
			</AutocompleteContent>
		</Autocomplete>
	),
};

/** 見出しで候補をまとめる。最近の検索と、よく使う言葉 */
export const Grouped: Story = {
	name: "見出しでまとめる",
	render: () => {
		const groups = [
			{ value: "最近の検索", icon: Clock, items: ["焚き火台", "火吹き棒"] },
			{ value: "よく使う言葉", icon: Tag, items: ["薪割り", "着火剤", "耐火グローブ"] },
		];
		return (
			<Autocomplete items={groups}>
				<AutocompleteInput aria-label="道具を探す" placeholder="道具を探す" icon={<Search />} />
				<AutocompleteContent>
					{(group: (typeof groups)[number]) => (
						<AutocompleteGroup key={group.value} items={group.items}>
							<AutocompleteGroupLabel>{group.value}</AutocompleteGroupLabel>
							<AutocompleteCollection>
								{(word: string) => (
									<AutocompleteItem key={word} value={word}>
										<group.icon aria-hidden />
										{word}
									</AutocompleteItem>
								)}
							</AutocompleteCollection>
						</AutocompleteGroup>
					)}
				</AutocompleteContent>
			</Autocomplete>
		);
	},
};

export const Sizes: Story = {
	name: "サイズ",
	render: () => (
		<div className="flex flex-col gap-3">
			{(["sm", "md", "lg"] as const).map((size) => (
				<Autocomplete key={size} items={words}>
					<AutocompleteInput size={size} aria-label={`道具を探す（${size}）`} placeholder="道具を探す" />
					<AutocompleteContent>
						{(word: string) => (
							<AutocompleteItem key={word} value={word}>
								{word}
							</AutocompleteItem>
						)}
					</AutocompleteContent>
				</Autocomplete>
			))}
		</div>
	),
};

/** 状態ごとの見た目。エラーは danger の色の枠、無効は不透明度 50% */
export const States: Story = {
	name: "状態",
	render: () => (
		<div className="flex flex-col gap-3">
			<Autocomplete items={words}>
				<AutocompleteInput aria-label="通常" placeholder="道具を探す" />
			</Autocomplete>
			<Autocomplete items={words} defaultValue="薪割り">
				<AutocompleteInput aria-label="入力済み" />
			</Autocomplete>
			<Autocomplete items={words}>
				<AutocompleteInput aria-label="エラー" aria-invalid placeholder="道具を探す" />
			</Autocomplete>
			<Autocomplete items={words} defaultValue="薪割り" disabled>
				<AutocompleteInput aria-label="無効" />
			</Autocomplete>
		</div>
	),
};

/** Field の中に置くと、FieldLabel が名前になる */
export const WithField: Story = {
	name: "Field の中",
	render: () => (
		<Field>
			<FieldLabel>持ち物</FieldLabel>
			<Autocomplete items={words}>
				<AutocompleteInput placeholder="道具の名前" />
				<AutocompleteContent>
					{(word: string) => (
						<AutocompleteItem key={word} value={word}>
							{word}
						</AutocompleteItem>
					)}
				</AutocompleteContent>
			</Autocomplete>
			<FieldDescription>候補にない道具も入れられます</FieldDescription>
		</Field>
	),
};

/** 打つと候補が開き、↓ で移って Enter で入る。Esc で候補を閉じても、打った文字は残る */
export const KeyboardInteraction: Story = {
	name: "キーボード操作",
	render: Basic.render,
	play: async ({ canvas }) => {
		const input = canvas.getByRole("combobox", { name: "道具を探す" });
		await userEvent.click(input);
		await userEvent.keyboard("薪");
		await screen.findByRole("listbox");
		await waitFor(() => expect(screen.getAllByRole("option")).toHaveLength(2));
		await userEvent.keyboard("{ArrowDown}");
		await waitFor(() =>
			expect(screen.getByRole("option", { name: "薪割り" })).toHaveAttribute("data-highlighted"),
		);
		await userEvent.keyboard("{Enter}");
		await expect(input).toHaveValue("薪割り");
		await userEvent.keyboard("と斧");
		await userEvent.keyboard("{Escape}");
		await expect(input).toHaveValue("薪割りと斧");
	},
};

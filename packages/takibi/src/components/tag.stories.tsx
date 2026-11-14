import type { Meta, StoryObj } from "@storybook/react-vite";
import { Hash } from "lucide-react";
import * as React from "react";
import { expect, userEvent, waitFor } from "storybook/test";
import type { ComponentDocs } from "../spec";
import { Button } from "./button";
import { Input } from "./input";
import { SelectableTag, Tag, TagGroup } from "./tag";

const meta = {
	title: "コンポーネント/フォーム/Tag",
	component: Tag,
	args: { children: "焚き火" },
	argTypes: {
		size: { control: "inline-radio", options: ["sm", "md"] },
	},
	parameters: {
		takibi: {
			use: [
				"利用者が付けた分類や、絞り込みの条件を並べ、外せるようにする（Tag）",
				"絞り込みの条件や興味のある分類を、押して複数選ぶ（SelectableTag）",
			],
			avoid: [
				{ case: "状態を示すだけで、操作しない", instead: "データ表示/Badge" },
				{ case: "並んだ選択肢から 1 つだけ選ぶ", instead: "アクション/ToggleGroup" },
				{ case: "多くの候補から探して、複数選ぶ", instead: "フォーム/Combobox" },
			],
			dos: [
				"外せるタグは TagGroup で囲み、aria-label で何の一覧かを書く",
				"タグの文字は 1〜2 語の名詞にする",
			],
			donts: ["タグの中に長い文を入れない。折り返さないため、はみ出す"],
			copy: {
				rules: ["タグの文字は名詞で短く書く", "外すボタンのアクセシブルネームは「<タグの文字>を外す」にする"],
				examples: [{ good: "冬", bad: "冬のキャンプに関する記録", note: "タグは短い名詞にする" }],
			},
			keyboard: [
				["Tab", "外すボタンや選べるタグへ順に移る"],
				[
					"Backspace / Delete",
					"外すボタンにフォーカスがあるとき、タグを外す。フォーカスは隣のタグの外すボタンへ移る",
				],
				["Enter / Space", "外すボタンならタグを外す。選べるタグなら、選択と解除を切り替える"],
			],
			a11y: [
				"外すボタンは「焚き火を外す」のように、どのタグかを含めて読み上げられる",
				"選べるタグは、選んでいるかが aria-pressed で伝わる",
			],
			motion: [
				"煙: 外したタグは 10px 上へ昇りながら、ぼけて 220ms で消え、残りのタグが隙間を詰める",
				"足したタグは、0.85 倍の大きさのぼけた状態から、ばね（spring-snappy）で現れる",
				"選べるタグは、選ぶと左のチェックマークが幅 0 から伸びて現れる（spring-glide）",
				"動きを減らす設定では、タグは 120ms で薄れて消え、隙間を詰める動きもなくなる",
			],
			related: ["データ表示/Badge", "アクション/ToggleGroup", "フォーム/Combobox", "アクション/Toggle"],
		} satisfies ComponentDocs,
	},
} satisfies Meta<typeof Tag>;

export default meta;
type Story = StoryObj<typeof meta>;

/** 外せないタグ。分類を見せるだけのときに使う */
export const Basic: Story = { name: "基本" };

function RemovableDemo() {
	const initial = ["焚き火", "キャンプ", "ソロ", "冬", "道具"];
	const [tags, setTags] = React.useState(initial);
	const [draft, setDraft] = React.useState("");
	const add = (event: React.FormEvent) => {
		event.preventDefault();
		const name = draft.trim();
		if (name && !tags.includes(name)) setTags((t) => [...t, name]);
		setDraft("");
	};
	return (
		<div className="flex w-96 flex-col gap-3">
			<TagGroup aria-label="ノートのタグ">
				{tags.map((tag) => (
					<Tag
						key={tag}
						removeLabel={`${tag}を外す`}
						onRemove={() => setTags((t) => t.filter((x) => x !== tag))}
					>
						<Hash className="text-fg-subtle" aria-hidden />
						{tag}
					</Tag>
				))}
			</TagGroup>
			<form onSubmit={add} className="flex gap-2">
				<Input
					value={draft}
					onChange={(e) => setDraft(e.target.value)}
					placeholder="タグを足す"
					aria-label="タグを足す"
				/>
				<Button type="submit" variant="secondary">
					足す
				</Button>
			</form>
			<Button variant="ghost" size="sm" className="self-start" onClick={() => setTags(initial)}>
				元に戻す
			</Button>
		</div>
	);
}

/** 外せるタグ。外すと上へ薄れて消え（煙）、残りのタグが隙間を詰める。足したタグは小さい状態から拡大して現れる */
export const Removable: Story = { name: "外せるタグ", render: () => <RemovableDemo /> };

function SelectableDemo() {
	const topics = ["焚き火台", "テント", "寝袋", "ランタン", "調理器具", "薪"];
	const [selected, setSelected] = React.useState(new Set(["焚き火台", "薪"]));
	return (
		<div className="flex w-96 flex-col gap-3">
			<fieldset aria-label="興味のある道具" className="m-0 flex min-w-0 flex-wrap gap-1.5 border-0 p-0">
				{topics.map((t) => (
					<SelectableTag
						key={t}
						pressed={selected.has(t)}
						onPressedChange={(pressed) =>
							setSelected((prev) => {
								const next = new Set(prev);
								if (pressed) next.add(t);
								else next.delete(t);
								return next;
							})
						}
					>
						{t}
					</SelectableTag>
				))}
			</fieldset>
			<p className="text-sm text-fg-muted">{selected.size}件を選択中</p>
		</div>
	);
}

/** 選べるタグ。押すと沈み、選ぶと左にチェックマークが伸びて現れる。複数を同時に選べる */
export const Selectable: Story = { name: "選べるタグ", render: () => <SelectableDemo /> };

export const Sizes: Story = {
	name: "サイズ",
	render: () => (
		<div className="flex flex-col items-start gap-3">
			<div className="flex gap-1.5">
				<Tag size="sm">小</Tag>
				<Tag size="md">中（標準）</Tag>
			</div>
			<div className="flex gap-1.5">
				<SelectableTag size="sm" defaultPressed>
					小
				</SelectableTag>
				<SelectableTag size="md" defaultPressed>
					中（標準）
				</SelectableTag>
			</div>
		</div>
	),
};

/** 状態ごとの見た目。外せるタグ、選んでいないタグ、選んだタグ、無効なタグ */
export const States: Story = {
	name: "状態",
	render: () => (
		<div className="flex flex-wrap items-center gap-1.5">
			<TagGroup aria-label="例">
				<Tag onRemove={() => {}}>外せる</Tag>
			</TagGroup>
			<SelectableTag>選んでいない</SelectableTag>
			<SelectableTag defaultPressed>選んだ</SelectableTag>
			<SelectableTag disabled>無効</SelectableTag>
			<SelectableTag disabled defaultPressed>
				無効（選んだ）
			</SelectableTag>
		</div>
	),
};

/** 外すボタンで Backspace を押すとタグが外れ、隣のタグの外すボタンへフォーカスが移る。選べるタグは Space で切り替わる */
export const KeyboardInteraction: Story = {
	name: "キーボード操作",
	render: () => (
		<div className="flex flex-col gap-6">
			<RemovableDemo />
			<SelectableDemo />
		</div>
	),
	play: async ({ canvas }) => {
		const remove = canvas.getByRole("button", { name: "キャンプを外す" });
		remove.focus();
		await userEvent.keyboard("{Backspace}");
		await waitFor(() => expect(canvas.getByRole("button", { name: "ソロを外す" })).toHaveFocus());
		await waitFor(() => expect(canvas.queryByRole("button", { name: "キャンプを外す" })).toBeNull());
		const tent = canvas.getByRole("button", { name: "テント" });
		tent.focus();
		await userEvent.keyboard(" ");
		await expect(tent).toHaveAttribute("aria-pressed", "true");
		await expect(canvas.getByText("3件を選択中")).toBeInTheDocument();
	},
};

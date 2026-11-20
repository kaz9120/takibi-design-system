import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, screen, userEvent, waitFor } from "storybook/test";
import type { ComponentDocs } from "../spec";
import { Field, FieldDescription, FieldError, FieldLabel } from "./field";
import {
	Select,
	SelectContent,
	SelectGroup,
	SelectGroupLabel,
	SelectItem,
	SelectLabel,
	SelectSeparator,
	SelectTrigger,
	SelectValue,
} from "./select";

const woods = {
	oak: "ナラ",
	cherry: "サクラ",
	cedar: "スギ",
	cypress: "ヒノキ",
	birch: "シラカバ",
};

const meta = {
	title: "コンポーネント/フォーム/Select",
	component: SelectContent,
	parameters: {
		takibi: {
			use: ["6 個以上の決まった選択肢から、1 つ（multiple で複数）を選ぶ"],
			avoid: [
				{ case: "選択肢が 5 個以下で、見比べて選ばせたい", instead: "フォーム/RadioGroup" },
				{ case: "選択肢が多く、文字を打って絞り込みたい", instead: "フォーム/Combobox" },
				{ case: "選ぶと何かを実行するボタンの一覧", instead: "オーバーレイ/Menu" },
			],
			dos: [
				"未選択のときは、プレースホルダーに「選ぶ」と書く",
				"選択肢が多いときは、見出し（SelectGroupLabel）でまとめる",
				"選べない選択肢は消さずに無効にし、理由を添える（在庫なし）",
			],
			donts: ["選択肢が 2 つだけのときに使わない。Switch か RadioGroup で足りる"],
			keyboard: [
				["Enter / Space / ↓", "閉じているときに、選択肢の一覧を開く"],
				["↑ / ↓", "選択肢の間を移る"],
				["Enter", "選んで閉じる"],
				["Esc", "選ばずに閉じる。フォーカスはトリガーに戻る"],
				["文字キー", "その文字で始まる選択肢へ移る"],
			],
			a11y: [
				"トリガーは combobox、一覧は listbox として読み上げられる",
				"閉じると、トリガーにフォーカスが戻る",
			],
			motion: [
				"一覧は、トリガーから 4px 離れた 0.94 倍の大きさから、はぜる曲線（ease-pop）で現れる（motion-rise）",
				"選択肢の間を移ると、背景の帯が揺れる曲線（ease-sway）で滑って付いてくる",
				"開くと、トリガーの矢印が 180° 回る",
			],
			related: ["フォーム/Combobox", "フォーム/RadioGroup", "フォーム/Autocomplete", "オーバーレイ/Menu"],
		} satisfies ComponentDocs,
	},
	decorators: [
		(Story) => (
			<div className="w-64">
				<Story />
			</div>
		),
	],
} satisfies Meta<typeof SelectContent>;

export default meta;
type Story = StoryObj<typeof meta>;

/** 押すと、選択肢の一覧がトリガーの下に現れる。選んだ項目にはチェックマークが付く */
export const Basic: Story = {
	name: "基本",
	render: () => (
		<Select items={woods}>
			<div className="flex flex-col gap-1.5">
				<SelectLabel>薪の種類</SelectLabel>
				<SelectTrigger>
					<SelectValue placeholder="選ぶ" />
				</SelectTrigger>
			</div>
			<SelectContent>
				{Object.entries(woods).map(([value, label]) => (
					<SelectItem key={value} value={value}>
						{label}
					</SelectItem>
				))}
			</SelectContent>
		</Select>
	),
};

/** 見出しと区切り線で選択肢をまとめる */
export const Grouped: Story = {
	name: "見出しでまとめる",
	render: () => (
		<Select items={woods} defaultValue="cherry">
			<SelectTrigger aria-label="薪の種類">
				<SelectValue />
			</SelectTrigger>
			<SelectContent>
				<SelectGroup>
					<SelectGroupLabel>広葉樹（火持ちがよい）</SelectGroupLabel>
					<SelectItem value="oak">ナラ</SelectItem>
					<SelectItem value="cherry">サクラ</SelectItem>
				</SelectGroup>
				<SelectSeparator />
				<SelectGroup>
					<SelectGroupLabel>針葉樹（火付きがよい）</SelectGroupLabel>
					<SelectItem value="cedar">スギ</SelectItem>
					<SelectItem value="cypress">ヒノキ</SelectItem>
					<SelectItem value="birch" disabled>
						シラカバ（在庫なし）
					</SelectItem>
				</SelectGroup>
			</SelectContent>
		</Select>
	),
};

export const Sizes: Story = {
	name: "サイズ",
	render: () => (
		<div className="flex flex-col gap-3">
			{(["sm", "md", "lg"] as const).map((size) => (
				<Select key={size} items={woods} defaultValue="oak">
					<SelectTrigger size={size} aria-label={`薪の種類（${size}）`}>
						<SelectValue />
					</SelectTrigger>
					<SelectContent>
						{Object.entries(woods).map(([value, label]) => (
							<SelectItem key={value} value={value}>
								{label}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
			))}
		</div>
	),
};

/** 状態ごとの見た目。未選択は薄い文字、エラーは danger の色の枠、無効は不透明度 50% */
export const States: Story = {
	name: "状態",
	render: () => (
		<div className="flex flex-col gap-3">
			<Select items={woods}>
				<SelectTrigger aria-label="未選択">
					<SelectValue placeholder="選ぶ" />
				</SelectTrigger>
			</Select>
			<Select items={woods} defaultValue="oak">
				<SelectTrigger aria-label="選択済み">
					<SelectValue />
				</SelectTrigger>
			</Select>
			<Select items={woods}>
				<SelectTrigger aria-label="エラー" aria-invalid>
					<SelectValue placeholder="選ぶ" />
				</SelectTrigger>
			</Select>
			<Select items={woods} defaultValue="oak" disabled>
				<SelectTrigger aria-label="無効">
					<SelectValue />
				</SelectTrigger>
			</Select>
		</div>
	),
};

/** Field の中に置くと、ラベル・補足・必須の検証が Input と同じように効く */
export const WithField: Story = {
	name: "ラベルと検証",
	render: () => (
		<Field validationMode="onBlur">
			<FieldLabel required>薪の種類</FieldLabel>
			<Select items={woods} required>
				<SelectTrigger>
					<SelectValue placeholder="選ぶ" />
				</SelectTrigger>
				<SelectContent>
					{Object.entries(woods).map(([value, label]) => (
						<SelectItem key={value} value={value}>
							{label}
						</SelectItem>
					))}
				</SelectContent>
			</Select>
			<FieldDescription>薪棚の在庫から選びます</FieldDescription>
			<FieldError match="valueMissing">薪の種類を選んでください</FieldError>
		</Field>
	),
};

/** Tab でフォーカスし、Enter で開き、矢印キーで移って Enter で選ぶ。閉じるとトリガーにフォーカスが戻る */
export const KeyboardInteraction: Story = {
	name: "キーボード操作",
	render: () => (
		<Select items={woods} defaultValue="oak">
			<SelectTrigger aria-label="薪の種類">
				<SelectValue />
			</SelectTrigger>
			<SelectContent>
				{Object.entries(woods).map(([value, label]) => (
					<SelectItem key={value} value={value}>
						{label}
					</SelectItem>
				))}
			</SelectContent>
		</Select>
	),
	play: async ({ canvas }) => {
		const trigger = canvas.getByRole("combobox", { name: "薪の種類" });
		await userEvent.tab();
		await expect(trigger).toHaveFocus();
		await userEvent.keyboard("{Enter}");
		await screen.findByRole("listbox");
		await waitFor(() =>
			expect(screen.getByRole("option", { name: "ナラ" })).toHaveAttribute("data-highlighted"),
		);
		await userEvent.keyboard("{ArrowDown}");
		await waitFor(() =>
			expect(screen.getByRole("option", { name: "サクラ" })).toHaveAttribute("data-highlighted"),
		);
		await userEvent.keyboard("{Enter}");
		await waitFor(() => expect(trigger).toHaveAttribute("aria-expanded", "false"));
		await expect(trigger).toHaveTextContent("サクラ");
		await waitFor(() => expect(trigger).toHaveFocus());
	},
};

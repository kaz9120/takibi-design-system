import type { Meta, StoryObj } from "@storybook/react-vite";
import { AtSign, Copy, Link2 } from "lucide-react";
import { expect, userEvent, waitFor } from "storybook/test";
import type { ComponentDocs } from "../spec";
import { Field, FieldDescription, FieldError, FieldLabel } from "./field";
import {
	InputGroup,
	InputGroupAddon,
	InputGroupButton,
	InputGroupInput,
	InputGroupText,
	SearchInput,
} from "./input-group";

const meta = {
	title: "コンポーネント/フォーム/InputGroup",
	component: InputGroup,
	parameters: {
		takibi: {
			use: [
				"入力欄の前後に、アイコン、単位、URL の先頭などを添える",
				"入力欄の中に、コピーや消去などの小さなボタンを置く",
				"一覧を絞り込む検索欄（SearchInput）",
			],
			avoid: [
				{ case: "何も添えない 1 行の入力欄", instead: "フォーム/Input" },
				{ case: "パスワードを入れる", instead: "フォーム/PasswordInput" },
				{ case: "候補から選ばせる検索", instead: "フォーム/Combobox" },
			],
			dos: [
				"添え物は短くする。単位や URL の先頭など、値の一部に見えるものにする",
				"アイコンだけのボタンには aria-label を付ける",
			],
			donts: [
				"前後に 2 つ以上のボタンを並べない。入力欄が狭くなる",
				"ショートカットを、ほかのコンポーネントと同じキーにしない",
			],
			keyboard: [
				["Tab", "入力欄から、枠の中のボタンへ移る"],
				["Esc", "検索欄に文字があると、消す"],
				["/ や ⌘K", "shortcut を渡した検索欄に、どこからでもフォーカスを移す"],
			],
			a11y: [
				"添え物のアイコンは aria-hidden にし、入力欄には aria-label か Field のラベルで名前を付ける",
				"枠の中のボタンをマウスで押しても、入力欄のフォーカスは外れない",
			],
			motion: [
				"フォーカスは枠の側に付く。枠がブランドカラーになり、薄い輪が付く（120ms、ease-standard）",
				"検索欄の消去ボタンは、0.5 倍の大きさのぼけた状態から、ばね（spring-snappy）で現れる",
				"ショートカットの案内は、200ms で薄く現れ、100ms で消える",
			],
			related: ["フォーム/Input", "フォーム/PasswordInput", "フォーム/Combobox", "データ表示/Kbd"],
		} satisfies ComponentDocs,
	},
	decorators: [
		(Story) => (
			<div className="w-80">
				<Story />
			</div>
		),
	],
} satisfies Meta<typeof InputGroup>;

export default meta;
type Story = StoryObj<typeof meta>;

/** 前にアイコン、後ろに文字を添える。アイコンを押しても入力欄にフォーカスが移り、フォーカス中はアイコンの色も濃くなる */
export const Basic: Story = {
	name: "基本",
	render: (args) => (
		<InputGroup {...args}>
			<InputGroupAddon>
				<AtSign aria-hidden />
			</InputGroupAddon>
			<InputGroupInput aria-label="ユーザー名" placeholder="takibi" />
			<InputGroupAddon align="end">
				<InputGroupText>.hidoko.dev</InputGroupText>
			</InputGroupAddon>
		</InputGroup>
	),
};

/** 添え物の種類。文字、単位、ボタンを前後に置ける */
export const Addons: Story = {
	name: "添え物",
	render: () => (
		<div className="flex flex-col gap-3">
			<InputGroup>
				<InputGroupAddon>
					<InputGroupText>https://</InputGroupText>
				</InputGroupAddon>
				<InputGroupInput aria-label="サイトの URL" placeholder="example.com" />
			</InputGroup>
			<InputGroup>
				<InputGroupInput aria-label="薪の予算" placeholder="3000" inputMode="numeric" />
				<InputGroupAddon align="end">
					<InputGroupText>円</InputGroupText>
				</InputGroupAddon>
			</InputGroup>
			<InputGroup>
				<InputGroupAddon>
					<Link2 aria-hidden />
				</InputGroupAddon>
				<InputGroupInput aria-label="共有リンク" defaultValue="https://hidoko.dev/s/ember" readOnly />
				<InputGroupAddon align="end">
					<InputGroupButton aria-label="リンクをコピーする">
						<Copy />
					</InputGroupButton>
				</InputGroupAddon>
			</InputGroup>
		</div>
	),
};

/** 検索欄。文字が入ると消去ボタンが現れる。空でフォーカスがないときは `/` の案内が出る */
export const Search: Story = {
	name: "検索欄",
	render: () => <SearchInput aria-label="薪を探す" placeholder="薪を探す" shortcut="/" />,
};

/** `mod+k` は、Mac では ⌘K、ほかでは Ctrl K と出る。ほかの欄に打っている間も効く */
export const SearchWithModKey: Story = {
	name: "⌘K のショートカット",
	render: () => <SearchInput aria-label="コマンドを探す" placeholder="コマンドを探す" shortcut="mod+k" />,
};

export const Sizes: Story = {
	name: "サイズ",
	render: () => (
		<div className="flex flex-col gap-3">
			<SearchInput size="sm" aria-label="小" placeholder="小" />
			<SearchInput size="md" aria-label="中" placeholder="中（標準）" />
			<SearchInput size="lg" aria-label="大" placeholder="大" />
		</div>
	),
};

/** 状態ごとの見た目。エラーは枠が danger の色になり、無効は不透明度 50%、読み取り専用はページと同じ面になる */
export const States: Story = {
	name: "状態",
	render: () => (
		<div className="grid grid-cols-[6rem_1fr] items-center gap-x-4 gap-y-3 text-sm text-fg-muted">
			<span>通常</span>
			<SearchInput aria-label="通常" />
			<span>入力済み</span>
			<SearchInput aria-label="入力済み" defaultValue="ナラ" />
			<span>エラー</span>
			<InputGroup>
				<InputGroupAddon>
					<AtSign aria-hidden />
				</InputGroupAddon>
				<InputGroupInput aria-label="エラー" defaultValue="taki bi" aria-invalid />
			</InputGroup>
			<span>無効</span>
			<SearchInput aria-label="無効" defaultValue="ナラ" disabled />
			<span>読み取り専用</span>
			<InputGroup>
				<InputGroupAddon>
					<InputGroupText>https://</InputGroupText>
				</InputGroupAddon>
				<InputGroupInput aria-label="読み取り専用" defaultValue="hidoko.dev" readOnly />
			</InputGroup>
		</div>
	),
};

/** Field の中に置くと、ラベルと検証が中の入力欄に結び付き、枠の色が変わる */
export const WithField: Story = {
	name: "ラベルと検証",
	render: () => (
		<Field validationMode="onBlur">
			<FieldLabel required>ユーザー名</FieldLabel>
			<InputGroup>
				<InputGroupAddon>
					<AtSign aria-hidden />
				</InputGroupAddon>
				<InputGroupInput required placeholder="takibi" />
			</InputGroup>
			<FieldDescription>半角英数とハイフンだけ使えます</FieldDescription>
			<FieldError match="valueMissing">ユーザー名を入れてください</FieldError>
		</Field>
	),
};

/** `/` でフォーカスが移り、打つと消去ボタンが出て、Esc で文字が消える。消去ボタンを押してもフォーカスは欄に残る */
export const KeyboardInteraction: Story = {
	name: "キーボード操作",
	render: () => <SearchInput aria-label="薪を探す" placeholder="薪を探す" shortcut="/" />,
	play: async ({ canvas }) => {
		const input = canvas.getByRole("searchbox", { name: "薪を探す" });
		await userEvent.keyboard("/");
		await expect(input).toHaveFocus();
		await userEvent.keyboard("ナラ");
		await expect(input).toHaveValue("ナラ");
		const clear = await canvas.findByRole("button", { name: "検索語を消す" });
		await userEvent.keyboard("{Escape}");
		await expect(input).toHaveValue("");
		await waitFor(() => expect(clear).not.toBeInTheDocument());
		await userEvent.keyboard("スギ");
		await userEvent.click(await canvas.findByRole("button", { name: "検索語を消す" }));
		await expect(input).toHaveValue("");
		await expect(input).toHaveFocus();
	},
};

import type { Meta, StoryObj } from "@storybook/react-vite";
import * as React from "react";
import { expect, userEvent } from "storybook/test";
import type { ComponentDocs } from "../spec";
import { Badge } from "./badge";
import { Checkbox } from "./checkbox";
import {
	Table,
	TableBody,
	TableCaption,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
	type TableSortDirection,
} from "./table";

const meta = {
	title: "コンポーネント/データ表示/Table",
	component: Table,
	argTypes: {
		density: { control: "inline-radio", options: ["comfortable", "dense"] },
	},
	parameters: {
		takibi: {
			use: [
				"ログイン中の端末やプランの比較のように、行と列で比べて読むデータ",
				"並べ替えや、行を選んでまとめて操作する一覧",
			],
			avoid: [
				{ case: "列で比べる必要のない一覧", instead: "データ表示/List" },
				{ case: "1 件の項目名と値の組", instead: "データ表示/DescriptionList" },
				{ case: "画像を主にしたカードの格子", instead: "データ表示/Card" },
			],
			dos: [
				"数値の列は右に寄せ、tabular-nums で桁をそろえる",
				"並べ替えられる列にだけ sort を渡す",
				"TableCaption で、何の表かを書く",
				'一覧を多く見せたいときは density="dense" にする',
			],
			donts: [
				"レイアウトのために表を使わない",
				"行を選べるのに、選んだ状態をチェックボックスと別々に持たない。selected とそろえる",
			],
			copy: {
				rules: ["列の見出しは名詞で短く書く（端末、最後の利用）"],
			},
			keyboard: [
				["Tab", "並べ替えのボタンや、行のチェックボックスへ移る"],
				["Enter", "並べ替える"],
				["Space", "並べ替える。チェックボックスでは選ぶ"],
			],
			a11y: [
				"並べ替えている列の見出しに aria-sort が付き、昇順か降順かが読み上げられる",
				'列の見出しには scope="col" が付く',
				"行のチェックボックスには、どの行かが分かる aria-label を付ける",
			],
			motion: [
				"行は hover で背景の色が付き、選ぶと背景がブランドカラーの薄い色になる（120ms）",
				"並べ替えの矢印は、向きが変わると 180 度回る（ease-sway の 330ms）",
				"並べ替えのボタンは、押すと 0.97 倍に縮む（motion-press）",
			],
			related: [
				"データ表示/List",
				"データ表示/DescriptionList",
				"アクション/BulkSelect",
				"フォーム/Checkbox",
			],
		} satisfies ComponentDocs,
	},
} satisfies Meta<typeof Table>;

export default meta;
type Story = StoryObj<typeof meta>;

type Session = { id: string; device: string; place: string; lastSeen: number; current?: boolean };

const sessions: Session[] = [
	{ id: "s1", device: "MacBook Pro · Safari", place: "東京", lastSeen: 0, current: true },
	{ id: "s2", device: "iPhone 16 · アプリ", place: "東京", lastSeen: 12 },
	{ id: "s3", device: "Windows · Chrome", place: "大阪", lastSeen: 180 },
	{ id: "s4", device: "iPad · Safari", place: "タグ幌", lastSeen: 2880 },
	{ id: "s5", device: "Linux · Firefox", place: "福岡", lastSeen: 10080 },
];

function formatAgo(minutes: number) {
	if (minutes === 0) return "使用中";
	if (minutes < 60) return `${minutes}分前`;
	if (minutes < 1440) return `${Math.round(minutes / 60)}時間前`;
	return `${Math.round(minutes / 1440)}日前`;
}

function SessionTable({ density }: { density?: "dense" | "comfortable" }) {
	const [sort, setSort] = React.useState<{ key: "device" | "lastSeen"; dir: TableSortDirection }>({
		key: "lastSeen",
		dir: "ascending",
	});
	const [selected, setSelected] = React.useState<Set<string>>(new Set(["s3"]));

	const rows = React.useMemo(() => {
		const list = [...sessions];
		if (sort.dir === "none") return list;
		list.sort((a, b) => {
			const v = sort.key === "device" ? a.device.localeCompare(b.device, "ja") : a.lastSeen - b.lastSeen;
			return sort.dir === "ascending" ? v : -v;
		});
		return list;
	}, [sort]);

	const toggleSort = (key: "device" | "lastSeen") =>
		setSort((prev) => ({
			key,
			dir: prev.key !== key ? "ascending" : prev.dir === "ascending" ? "descending" : "ascending",
		}));

	const toggleRow = (id: string, checked: boolean) =>
		setSelected((prev) => {
			const next = new Set(prev);
			if (checked) next.add(id);
			else next.delete(id);
			return next;
		});

	return (
		<Table density={density} className="w-[640px]">
			<TableCaption>ログイン中の端末 {sessions.length}件</TableCaption>
			<TableHeader>
				<TableRow>
					<TableHead>
						<Checkbox
							aria-label="すべて選ぶ"
							checked={selected.size === sessions.length}
							indeterminate={selected.size > 0 && selected.size < sessions.length}
							onCheckedChange={(checked) =>
								setSelected(checked ? new Set(sessions.map((s) => s.id)) : new Set())
							}
						/>
					</TableHead>
					<TableHead sort={sort.key === "device" ? sort.dir : "none"} onSort={() => toggleSort("device")}>
						端末
					</TableHead>
					<TableHead>場所</TableHead>
					<TableHead sort={sort.key === "lastSeen" ? sort.dir : "none"} onSort={() => toggleSort("lastSeen")}>
						最後の利用
					</TableHead>
				</TableRow>
			</TableHeader>
			<TableBody>
				{rows.map((s) => (
					<TableRow key={s.id} selected={selected.has(s.id)}>
						<TableCell>
							<Checkbox
								aria-label={`${s.device}を選ぶ`}
								checked={selected.has(s.id)}
								onCheckedChange={(checked) => toggleRow(s.id, checked)}
							/>
						</TableCell>
						<TableCell className="font-medium text-fg-strong">
							<span className="inline-flex items-center gap-2">
								{s.device}
								{s.current && <Badge variant="brand">この端末</Badge>}
							</span>
						</TableCell>
						<TableCell className="text-fg-muted">{s.place}</TableCell>
						<TableCell className="tabular-nums text-fg-muted">{formatAgo(s.lastSeen)}</TableCell>
					</TableRow>
				))}
			</TableBody>
		</Table>
	);
}

/** ログイン中の端末の一覧。見出しを押すと並べ替わり、矢印が向きを変える。選んだ行はブランドカラーの薄い色になる */
export const Sessions: Story = {
	name: "並べ替えと選択",
	render: (args) => <SessionTable density={args.density} />,
};

/** 行を詰めた dense と、標準の comfortable */
export const Density: Story = {
	name: "行の詰め具合",
	render: () => (
		<div className="flex flex-col gap-10">
			<SessionTable density="comfortable" />
			<SessionTable density="dense" />
		</div>
	),
};

/** 並べ替えも選択もない、読むだけの表 */
export const Basic: Story = {
	name: "読むだけの表",
	render: (args) => (
		<Table {...args} className="w-[480px]">
			<TableHeader>
				<TableRow>
					<TableHead>プラン</TableHead>
					<TableHead className="text-right">月額</TableHead>
					<TableHead className="text-right">保存できるノート</TableHead>
				</TableRow>
			</TableHeader>
			<TableBody>
				<TableRow>
					<TableCell>種火</TableCell>
					<TableCell className="text-right tabular-nums">0円</TableCell>
					<TableCell className="text-right tabular-nums">50件</TableCell>
				</TableRow>
				<TableRow>
					<TableCell>焚き火</TableCell>
					<TableCell className="text-right tabular-nums">480円</TableCell>
					<TableCell className="text-right tabular-nums">1,000件</TableCell>
				</TableRow>
				<TableRow>
					<TableCell>篝火</TableCell>
					<TableCell className="text-right tabular-nums">1,200円</TableCell>
					<TableCell className="text-right tabular-nums">無制限</TableCell>
				</TableRow>
			</TableBody>
		</Table>
	),
};

/** Tab で見出しのボタンに移り、Enter で並べ替える。向きは aria-sort で読み上げられる */
export const KeyboardInteraction: Story = {
	name: "キーボード操作",
	render: () => <SessionTable />,
	play: async ({ canvas }) => {
		const device = canvas.getByRole("button", { name: "端末" });
		device.focus();
		await expect(device).toHaveFocus();
		await userEvent.keyboard("{Enter}");
		await expect(device.closest("th")).toHaveAttribute("aria-sort", "ascending");
		await userEvent.keyboard("{Enter}");
		await expect(device.closest("th")).toHaveAttribute("aria-sort", "descending");
		await userEvent.tab();
		const lastSeen = canvas.getByRole("button", { name: "最後の利用" });
		await expect(lastSeen).toHaveFocus();
		await expect(lastSeen.closest("th")).not.toHaveAttribute("aria-sort");
	},
};

import type { Meta, StoryObj } from "@storybook/react-vite";
import { useReducedMotion } from "motion/react";
import * as React from "react";
import { expect, userEvent, waitFor } from "storybook/test";
import type { ComponentDocs } from "../spec";
import { Button } from "./button";
import { Checkbox } from "./checkbox";

/**
 * 火の粉の伝播: 一括で選ぶと、押したチェックボックスから近い順に、行が 25ms ずつ遅れて光り、元に戻る。
 * 遅れは行ごとの CSS 変数（--spread-delay）で持ち、背景の色、チェックマーク、光の層の 3 つが同じ遅れで動く。
 */
const meta = {
	title: "コンポーネント/アクション/BulkSelect",
	parameters: {
		layout: "padded",
		takibi: {
			summary:
				"表の行をチェックボックスで選び、まとめて操作する組み方。コンポーネントではなく、Checkbox と表を組み合わせた見本。",
			use: [
				"記録の一覧から複数の行を選び、書き出しや削除をまとめて行う",
				"見出しのチェックボックスで、すべての行を一度に選ぶ",
			],
			avoid: [
				{ case: "1 行ずつ開いて操作するだけ", instead: "データ表示/Table" },
				{ case: "選択肢の中から複数を選んでフォームで送る", instead: "フォーム/CheckboxGroup" },
			],
			dos: [
				"見出しのチェックボックスは、一部だけ選んでいるときに indeterminate にする",
				"選んだ件数と、まとめてできる操作を表の上に出す",
				"行のチェックボックスには、どの行かが分かる aria-label を付ける（11 月 3 日 奥多摩を選ぶ）",
			],
			donts: [
				"選んでいないときに、まとめて操作するボタンを出したままにしない",
				"色だけで選んだ行を示さない。チェックマークを必ず添える",
			],
			copy: {
				rules: [
					"件数は「3 件を選んでいます」のように数字で書く",
					"何も選んでいないときは、選び方のヒントを出す",
				],
				examples: [{ good: "3 件を選んでいます", bad: "3 件選択済み", note: "漢語を詰めず、文で書く" }],
			},
			keyboard: [
				["Tab", "チェックボックスを順に移る"],
				["Space", "フォーカスのあるチェックボックスを切り替える"],
			],
			a11y: [
				"選んだ件数は aria-live の欄で読み上げられる",
				"見出しのチェックボックスは、一部を選んでいるときに「混在」として読み上げられる",
				"表には見えない caption を付け、何の表かを伝える",
			],
			motion: [
				"火の粉の伝播: 押したチェックボックスから近い順に、行が 25ms ずつ遅れて、ブランドカラーを薄く混ぜた層が 720ms で現れて消える",
				"選んだ行の背景は、同じ遅れでブランドカラーの薄い色に変わる（200ms）",
				"Shift を押しながら行を押すと、前に押した行からその行までをまとめて変え、押した行から上下へ広がる",
				"動きを減らす設定では、遅れをなくし、すべての行を同時に変える",
			],
			related: ["フォーム/Checkbox", "データ表示/Table", "フォーム/CheckboxGroup"],
		} satisfies ComponentDocs,
	},
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

const STEP_MS = 25;

const records = [
	{ id: "r1", date: "11 月 3 日", place: "奥多摩", minutes: 130 },
	{ id: "r2", date: "10 月 27 日", place: "道志", minutes: 95 },
	{ id: "r3", date: "10 月 20 日", place: "丹沢", minutes: 70 },
	{ id: "r4", date: "10 月 13 日", place: "秩父", minutes: 160 },
	{ id: "r5", date: "10 月 6 日", place: "富士見", minutes: 85 },
	{ id: "r6", date: "9 月 29 日", place: "八ヶ岳", minutes: 120 },
	{ id: "r7", date: "9 月 22 日", place: "房総", minutes: 60 },
	{ id: "r8", date: "9 月 15 日", place: "奥多摩", minutes: 140 },
];

/** 一度の一括操作。origin は押した場所（見出しのチェックボックスは -1）、changed は状態が変わった行 */
type Wave = { n: number; origin: number; changed: Set<number> };

/* 行の上に重ねた薄い層。不透明度だけを 0 → 1 → 0 と動かす */
const keyframes = `
@keyframes spread-warm-0 {
	0% { opacity: 0; }
	30% { opacity: 1; }
	100% { opacity: 0; }
}
@keyframes spread-warm-1 {
	0% { opacity: 0; }
	30% { opacity: 1; }
	100% { opacity: 0; }
}`;

function BulkSelectTable() {
	const reduce = useReducedMotion();
	const [selected, setSelected] = React.useState<Set<number>>(() => new Set());
	const [wave, setWave] = React.useState<Wave | null>(null);
	const anchor = React.useRef<number | null>(null);
	const shift = React.useRef(false);

	const all = selected.size === records.length;
	const some = selected.size > 0 && !all;

	const fire = (origin: number, next: Set<number>) => {
		const changed = new Set<number>();
		records.forEach((_, i) => {
			if (selected.has(i) !== next.has(i)) changed.add(i);
		});
		setSelected(next);
		setWave((w) => ({ n: (w?.n ?? 0) + 1, origin, changed }));
	};

	const toggleAll = (checked: boolean) => {
		fire(-1, checked ? new Set(records.map((_, i) => i)) : new Set());
		anchor.current = null;
	};

	const toggleRow = (i: number, checked: boolean) => {
		const next = new Set(selected);
		// Shift を押しながらなら、前に押した行からこの行までをまとめて変える
		if (shift.current && anchor.current !== null) {
			const [from, to] = [Math.min(anchor.current, i), Math.max(anchor.current, i)];
			for (let k = from; k <= to; k++) checked ? next.add(k) : next.delete(k);
		} else {
			checked ? next.add(i) : next.delete(i);
		}
		anchor.current = i;
		fire(i, next);
	};

	const delayOf = (i: number) => {
		if (!wave?.changed.has(i) || reduce) return 0;
		return Math.abs(i - wave.origin) * STEP_MS;
	};

	return (
		<div className="flex max-w-xl flex-col gap-3">
			<style>{keyframes}</style>
			<div className="flex h-9 items-center justify-between">
				<span className="text-sm text-fg-muted" aria-live="polite">
					{selected.size > 0
						? `${selected.size} 件を選んでいます`
						: "Shift を押しながら選ぶと、間の行もまとめて選べます"}
				</span>
				{selected.size > 0 && (
					<Button variant="secondary" size="sm">
						書き出す
					</Button>
				)}
			</div>
			<div className="overflow-hidden rounded-lg border border-line bg-surface-raised">
				<table className="w-full border-collapse text-left text-sm">
					<caption className="sr-only">焚き火の記録</caption>
					<thead className="text-fg-muted">
						<tr className="border-b border-line">
							<th scope="col" className="h-11 w-11 pl-1">
								<span className="flex justify-center">
									<Checkbox
										aria-label="すべて選ぶ"
										checked={all}
										indeterminate={some}
										onCheckedChange={(checked) => toggleAll(checked)}
									/>
								</span>
							</th>
							<th scope="col" className="font-medium">
								日付
							</th>
							<th scope="col" className="font-medium">
								場所
							</th>
							<th scope="col" className="pr-4 text-right font-medium">
								時間
							</th>
						</tr>
					</thead>
					<tbody>
						{records.map((r, i) => {
							const isSelected = selected.has(i);
							// 光の層は、変わった行のセルごとに ::before で重ねる。名前を交互に替えて、毎回始めから流す
							const warm = wave?.changed.has(i)
								? `spread-warm-${wave.n % 2} 720ms var(--ease-standard) var(--spread-delay) both`
								: "none";
							return (
								<tr
									key={r.id}
									data-selected={isSelected || undefined}
									style={
										{ "--spread-delay": `${delayOf(i)}ms`, "--spread-anim": warm } as React.CSSProperties
									}
									className={[
										"border-b border-line-subtle last:border-b-0",
										"transition-[background-color] duration-(--duration-base) ease-standard [transition-delay:var(--spread-delay)]",
										"hover:bg-surface-hover data-selected:bg-brand-soft",
										"[&>td]:relative [&>td]:isolate",
										"[&>td]:before:pointer-events-none [&>td]:before:absolute [&>td]:before:inset-0 [&>td]:before:-z-10 [&>td]:before:content-['']",
										"[&>td]:before:bg-[color-mix(in_oklab,var(--color-brand)_18%,transparent)] [&>td]:before:opacity-0 [&>td]:before:[animation:var(--spread-anim)]",
										// チェックマークと枠の色も、同じ遅れで変わる
										"[&_[data-slot=checkbox]]:[transition-delay:var(--spread-delay)] [&_path]:[transition-delay:var(--spread-delay)]",
									].join(" ")}
								>
									<td className="h-11 pl-1">
										<span className="flex justify-center">
											<Checkbox
												aria-label={`${r.date} ${r.place}を選ぶ`}
												checked={isSelected}
												onClick={(e) => {
													shift.current = e.shiftKey;
												}}
												onCheckedChange={(checked) => toggleRow(i, checked)}
											/>
										</span>
									</td>
									<td className="text-fg">{r.date}</td>
									<td className="text-fg">{r.place}</td>
									<td className="pr-4 text-right tabular-nums text-fg-muted">{r.minutes} 分</td>
								</tr>
							);
						})}
					</tbody>
				</table>
			</div>
		</div>
	);
}

/**
 * 見出しのチェックボックスで全部を選ぶと、上の行から順に光って元に戻る。
 * 行のチェックボックスを Shift を押しながら押すと、押した行から近い順に広がる。
 */
export const SpreadingEmbers: Story = {
	name: "火の粉の伝播",
	render: () => <BulkSelectTable />,
};

/** Tab で「すべて選ぶ」に移り、Space で全部を選び、もう一度 Space で全部を外す */
export const KeyboardInteraction: Story = {
	name: "キーボード操作",
	render: () => <BulkSelectTable />,
	play: async ({ canvas }) => {
		const selectAll = canvas.getByRole("checkbox", { name: "すべて選ぶ" });
		await userEvent.tab();
		await expect(selectAll).toHaveFocus();
		await userEvent.keyboard(" ");
		await waitFor(() => expect(canvas.getByText("8 件を選んでいます")).toBeInTheDocument());
		for (const box of canvas.getAllByRole("checkbox", { name: /を選ぶ$/ })) {
			await expect(box).toBeChecked();
		}
		await userEvent.keyboard(" ");
		await expect(selectAll).not.toBeChecked();
		await expect(canvas.queryByText("8 件を選んでいます")).not.toBeInTheDocument();
	},
};

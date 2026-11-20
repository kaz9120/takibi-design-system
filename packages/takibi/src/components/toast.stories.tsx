import type { Meta, StoryObj } from "@storybook/react-vite";
import type { ComponentDocs } from "../spec";
import { Button } from "./button";
import { toast } from "./toast";

const meta = {
	title: "コンポーネント/フィードバック/Toast",
	parameters: {
		docs: {
			description: {
				component:
					"操作の結果を短く知らせる。`<Toaster />` をアプリの最上位に置き、どこからでも `toast.add()` で呼ぶ。",
			},
		},
		takibi: {
			summary: "操作の結果を短く知らせ、5 秒で自然に消える。",
			use: ["保存、公開、削除など、操作の結果を短く知らせる", "消したものを元に戻す操作を、しばらく残す"],
			avoid: [
				{
					case: "読み終わるまで残したい知らせや、直すまで消えては困るエラー",
					instead: "フィードバック/Alert",
				},
				{ case: "サービス全体に関わる知らせ", instead: "フィードバック/Banner" },
				{ case: "続ける前に確かめてもらう", instead: "オーバーレイ/AlertDialog" },
			],
			dos: [
				"<Toaster /> はアプリの最上位に 1 つだけ置く",
				"取り消せる操作には、元に戻す操作（actionProps）を付ける",
				'失敗は type: "danger" にし、どうすればよいかを description に書く',
			],
			donts: [
				"見落とすと困ることをトーストだけで伝えない。5 秒で消える",
				"画面を見れば分かる結果（入力した文字が出た、など）に出さない",
				"一度に何件も出さない。見えるのは 3 件までで、古いものから隠れる",
			],
			copy: {
				rules: [
					"タイトルは過去形で短く書く。句点を付けない",
					"説明は、次にできることがあるときだけ 1 文で書く",
					"失敗は、何ができなかったかをタイトルに、どうすればよいかを説明に書く",
					"操作のボタンは動詞にする（元に戻す）",
				],
				examples: [
					{ good: "保存しました", bad: "保存が完了しました！", note: "短く、感嘆符を付けない" },
					{
						good: "保存できませんでした / 通信を確かめてください",
						bad: "エラーが発生しました",
						note: "何が起きて、どうすればよいかが分かる",
					},
					{ good: "元に戻す", bad: "取り消しはこちら", note: "押すと何が起きるかを動詞で書く" },
				],
			},
			keyboard: [
				["F6", "トーストの並ぶ場所へフォーカスを移す"],
				["Tab", "トーストの中の操作と閉じるボタンへ、順にフォーカスを移す"],
				["Enter", "フォーカスしている操作か閉じるボタンを押す"],
			],
			a11y: [
				'出たトーストは、今の読み上げが終わってから読まれる。急ぎのものは priority: "high" で割り込ませる',
				"hover かフォーカスしている間は、消えるまでの時間が止まる",
				"閉じるボタンには「閉じる」という名前が付いている。アイコンはスクリーンリーダーから隠す",
			],
			motion: [
				"現れるときは、自分の高さ + 24px 下から、0.96 倍の大きさで上がってくる（ease-ignite、510ms）",
				"新しいものが手前に重なり、奥のものは 1 件ごとに 6% ずつ小さくなって 10px ずつ上にのぞく。hover かフォーカスで、8px の間を空けて縦に広がる",
				"煙: 時間切れや閉じるボタンで消えるときは、12px 上がりながら 1.02 倍に広がり、3px ぼけて薄れる（200ms で透明に、360ms で移動、ease-out-expo）",
				"右か下へスワイプすると、その向きへ画面の外まで動いて消える",
			],
			related: ["フィードバック/Alert", "フィードバック/Banner", "オーバーレイ/AlertDialog"],
		} satisfies ComponentDocs,
	},
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

/** 種類ごとのアイコン。通常はアイコンを出さない */
export const Types: Story = {
	name: "種類",
	render: () => (
		<div className="flex flex-wrap gap-3">
			<Button variant="secondary" onClick={() => toast.add({ title: "下書きを保存しました" })}>
				通常
			</Button>
			<Button
				variant="secondary"
				onClick={() =>
					toast.add({ title: "公開しました", description: "URL をコピーできます", type: "success" })
				}
			>
				成功
			</Button>
			<Button
				variant="secondary"
				onClick={() =>
					toast.add({ title: "保存できませんでした", description: "通信を確かめてください", type: "danger" })
				}
			>
				失敗
			</Button>
			<Button
				variant="secondary"
				onClick={() =>
					toast.add({ title: "新しい版があります", description: "再読み込みで反映します", type: "info" })
				}
			>
				情報
			</Button>
		</div>
	),
};

/** 続けて呼ぶと、古いものが奥で小さくなって重なる。hover で縦に広がる */
export const Stack: Story = {
	name: "重なり",
	render: () => {
		let n = 0;
		return (
			<Button
				variant="secondary"
				onClick={() => {
					n += 1;
					toast.add({ title: `${n} 件目の記録を足しました`, description: "きょうの焚き火に追加" });
				}}
			>
				続けて足す
			</Button>
		);
	},
};

/** 元に戻す操作を持つトースト */
export const WithAction: Story = {
	name: "操作付き",
	render: () => (
		<Button
			variant="secondary"
			onClick={() => {
				const id = toast.add({
					title: "記録を消しました",
					actionProps: { children: "元に戻す", onClick: () => toast.close(id) },
				});
			}}
		>
			消す
		</Button>
	),
};

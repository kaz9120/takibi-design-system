import type { Meta, StoryObj } from "@storybook/react-vite";
import { ImagePlus } from "lucide-react";
import * as React from "react";
import { expect, fn, userEvent, waitFor } from "storybook/test";
import type { ComponentDocs } from "../spec";
import { Field, FieldDescription, FieldLabel } from "./field";
import { FileDrop } from "./file-drop";

const meta = {
	title: "コンポーネント/フォーム/FileDrop",
	component: FileDrop,
	args: { onValueChange: fn(), onReject: fn() },
	argTypes: {
		size: { control: "inline-radio", options: ["sm", "md"] },
	},
	parameters: {
		takibi: {
			use: [
				"画像や書類などのファイルを、落とすか押して選んでもらう",
				"キャンバスのような作業の面そのものを、ファイルの落とし先にする",
			],
			avoid: [{ case: "ファイルではなく、文字や URL を入れる", instead: "フォーム/Input" }],
			dos: [
				"受け付ける形式と大きさの上限を、hint に書く",
				"accept と maxSize を渡す。合わないファイルは加えず、件数を知らせる",
				"フォームの中で場所を取りたくないときは sm を使う",
			],
			donts: ["形式や上限を書かずに、選んだ後で初めてはじかない"],
			copy: {
				rules: [
					"案内の文は、何をすればよいかを書く（ファイルを落とすか、押して選ぶ）",
					"補足には、形式と大きさの上限だけを書く",
				],
				examples: [
					{ good: "PNG、JPEG、WebP。5 MB まで", bad: "対応形式をご確認ください", note: "形式と上限が分かる" },
				],
			},
			keyboard: [
				["Tab", "面にフォーカスを移す。続けて押すと、選んだファイルの外すボタンへ移る"],
				["Enter / Space", "面ではファイルを選ぶ画面を開き、外すボタンではそのファイルを外す"],
			],
			a11y: [
				"面の中に本物の input（type=file）があるので、キーボードとスクリーンリーダーでも選べる",
				"はじいたファイルの件数は role=alert で読み上げられる",
				"ファイルを外すと、次のファイルの外すボタンへフォーカスが移る。なければ面へ戻る",
			],
			motion: [
				"ファイルを重ねると、枠が実線になってブランドカラーになり、面がブランドカラーの薄い色になる（200ms、ease-ember）",
				"重ねている間、矢印のアイコンが 4px 上がって 1.08 倍になる（spring-press）",
				"一覧に加わったファイルは 8px 下から現れ（spring-soft）、外すと 8px 上へぼけて 200ms で消える（煙）",
			],
			related: ["フォーム/Field", "フォーム/Form", "データ表示/Image"],
		} satisfies ComponentDocs,
	},
	decorators: [
		(Story) => (
			<div className="w-96">
				<Story />
			</div>
		),
	],
} satisfies Meta<typeof FileDrop>;

export default meta;
type Story = StoryObj<typeof meta>;

/** ファイルを重ねると、枠と面がブランドカラーになり、矢印が持ち上がる。落とすか押して選ぶと、下の一覧に加わる */
export const Basic: Story = {
	name: "基本",
	args: { multiple: true, hint: "1 ファイル 10 MB まで" },
};

/** 画像の欄。形式と大きさを絞り、選んだ画像は一覧に小さく出る */
export const ImageField: Story = {
	name: "画像の欄",
	args: {
		accept: "image/png,image/jpeg,image/webp",
		maxSize: 5 * 1024 * 1024,
		label: "OGP の画像を落とすか、押して選ぶ",
		hint: "PNG、JPEG、WebP。5 MB まで",
	},
	render: (args) => (
		<Field>
			<FieldLabel>OGP の画像</FieldLabel>
			<FileDrop {...args} />
			<FieldDescription>1200 × 630 px がきれいに出ます</FieldDescription>
		</Field>
	),
};

/** 1 行の細い面。フォームの中で場所を取らない */
export const Small: Story = {
	name: "1 行の面",
	args: { size: "sm", multiple: true, hint: "PDF、10 MB まで", accept: ".pdf" },
};

/** 中身を差し替えて、作業の面そのものを落とし先にする。例は、キャンバスのアプリで画像を受ける形 */
export const CanvasDropTarget: Story = {
	name: "作業の面を落とし先にする",
	args: { accept: "image/*", showList: false },
	render: (args) => {
		const [file, setFile] = React.useState<File>();
		const url = React.useMemo(() => (file ? URL.createObjectURL(file) : undefined), [file]);
		return (
			<FileDrop
				{...args}
				className="aspect-video min-h-0 items-center justify-center overflow-hidden p-0"
				onValueChange={(files) => setFile(files[0])}
			>
				{url ? (
					<img src={url} alt={file?.name ?? ""} className="size-full object-contain" />
				) : (
					<span className="flex flex-col items-center gap-2 text-sm">
						<ImagePlus className="size-6" aria-hidden />
						切り抜く画像を落とす
					</span>
				)}
			</FileDrop>
		);
	},
};

/** 状態ごとの見た目。エラーは枠が danger の色になり、無効は不透明度 50% */
export const States: Story = {
	name: "状態",
	render: (args) => (
		<div className="flex flex-col gap-4">
			<FileDrop {...args} size="sm" label="通常" />
			<FileDrop {...args} size="sm" label="エラー" aria-invalid />
			<FileDrop {...args} size="sm" label="無効" disabled />
			<FileDrop
				{...args}
				size="sm"
				label="選んだ後"
				multiple
				defaultValue={[
					new File(["a".repeat(2400)], "campsite-map.pdf", { type: "application/pdf" }),
					new File(["b".repeat(320000)], "night-fire.jpg", { type: "image/jpeg" }),
				]}
			/>
		</div>
	),
};

/** Tab で面にフォーカスすると、枠に輪が付く。選んだファイルの外すボタンを押すと、フォーカスは次の外すボタンへ移る */
export const KeyboardInteraction: Story = {
	name: "キーボード操作",
	args: { multiple: true },
	play: async ({ args, canvas }) => {
		const input = canvas.getByLabelText(/ファイルを落とす/);
		await userEvent.tab();
		await expect(input).toHaveFocus();
		await userEvent.upload(input, [
			new File(["ember"], "ember.txt", { type: "text/plain" }),
			new File(["ash"], "ash.txt", { type: "text/plain" }),
		]);
		await expect(args.onValueChange).toHaveBeenCalled();
		const remove = await canvas.findByRole("button", { name: "ember.txt を外す" });
		await userEvent.tab();
		await expect(remove).toHaveFocus();
		await userEvent.keyboard("{Enter}");
		await waitFor(() => expect(canvas.getByRole("button", { name: "ash.txt を外す" })).toHaveFocus());
		await userEvent.keyboard("{Enter}");
		await waitFor(() => expect(input).toHaveFocus());
	},
};

/** 形式の合わないファイルは加えず、何件はじいたかを知らせる */
export const RejectsWrongType: Story = {
	name: "形式の合わないファイル",
	args: { accept: "image/*" },
	play: async ({ args, canvas }) => {
		const input = canvas.getByLabelText(/ファイルを落とす/);
		const drop = input.closest("label") as HTMLElement;
		const data = new DataTransfer();
		data.items.add(new File(["x"], "notes.txt", { type: "text/plain" }));
		drop.dispatchEvent(new DragEvent("drop", { dataTransfer: data, bubbles: true, cancelable: true }));
		await waitFor(() => expect(canvas.getByRole("alert")).toHaveTextContent("1 件は追加できません"));
		await expect(args.onReject).toHaveBeenCalled();
	},
};

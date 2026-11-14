import { Field as BaseField } from "@base-ui/react/field";
import type * as React from "react";
import { cn } from "../lib/cn";

/**
 * 入力欄に、ラベル・補足・エラーを結び付ける。ラベルは上、補足とエラーは下に置く。
 * 中の Input や Checkbox は自動でラベルと補足に関連付き、検証の結果で見た目が変わる。
 */
export function Field({ className, ...props }: React.ComponentProps<typeof BaseField.Root>) {
	return (
		<BaseField.Root
			data-slot="field"
			className={cn("group/field flex w-full flex-col gap-1.5", className)}
			{...props}
		/>
	);
}

export type FieldLabelProps = React.ComponentProps<typeof BaseField.Label> & {
	/** 必須マークを付ける。入力欄にも `required` を付けること */
	required?: boolean;
};

export function FieldLabel({ className, required = false, children, ...props }: FieldLabelProps) {
	return (
		<BaseField.Label
			data-slot="field-label"
			className={cn(
				"flex items-center gap-1 text-sm font-medium text-fg-strong select-none",
				"group-data-disabled/field:cursor-not-allowed group-data-disabled/field:opacity-50",
				className,
			)}
			{...props}
		>
			{children}
			{required && (
				<>
					<span aria-hidden className="text-danger">
						*
					</span>
					<span className="sr-only">（必須）</span>
				</>
			)}
		</BaseField.Label>
	);
}

export function FieldDescription({
	className,
	...props
}: React.ComponentProps<typeof BaseField.Description>) {
	return (
		<BaseField.Description
			data-slot="field-description"
			className={cn("text-sm text-fg-muted", className)}
			{...props}
		/>
	);
}

/** 検証に通らなかったときだけ出る。`match` で、どの検証に対する文かを選べる */
export function FieldError({ className, ...props }: React.ComponentProps<typeof BaseField.Error>) {
	return (
		<BaseField.Error
			data-slot="field-error"
			className={cn("motion-fade text-sm text-danger", className)}
			{...props}
		/>
	);
}

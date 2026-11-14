import { Field as BaseField } from "@base-ui/react/field";
import type * as React from "react";
import { cn } from "../lib/cn";
import { fieldControlClass } from "./input";

export type TextareaProps = React.ComponentProps<"textarea">;

/**
 * 複数行の文字を入れる欄。説明文やメモなど、改行を含む長めの文に使う。
 * Field で囲むと、ラベルと検証が Input と同じように効く。
 */
export function Textarea({ className, rows = 3, ...props }: TextareaProps) {
	// Base UI に textarea 専用のコンポーネントはないため、Field.Control を textarea として描く。
	// Field.Control の型は input 向けなので、値やイベントの props を型だけ合わせて渡す。
	const controlProps = props as unknown as React.ComponentProps<typeof BaseField.Control>;
	return (
		<BaseField.Control
			data-slot="textarea"
			render={<textarea rows={rows} />}
			className={cn(fieldControlClass, "field-sizing-content min-h-20 resize-y px-3 py-2 text-sm", className)}
			{...controlProps}
		/>
	);
}

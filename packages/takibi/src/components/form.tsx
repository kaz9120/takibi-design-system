import { Form as BaseForm } from "@base-ui/react/form";
import * as React from "react";
import { cn } from "../lib/cn";

export type FormProps = React.ComponentProps<typeof BaseForm>;

/**
 * 入力欄をまとめて送る。中の Field は `name` で結び付き、送信時にまとめて検証される。
 * サーバーが返したエラーは `errors` に `{ 欄の name: 文 }` で渡すと、その欄の FieldError（`match` なし）に出る。
 * エラーが届くと、最初のエラーの欄にフォーカスが移る。
 */
export function Form({ className, errors, ref: refProp, ...props }: FormProps) {
	const ref = React.useRef<HTMLFormElement>(null);
	const setRef = React.useCallback(
		(node: HTMLFormElement | null) => {
			ref.current = node;
			if (typeof refProp === "function") refProp(node);
			else if (refProp) refProp.current = node;
		},
		[refProp],
	);

	React.useEffect(() => {
		if (!errors || Object.keys(errors).length === 0) return;
		// aria-invalid が付くのを待ってから移す
		const frame = requestAnimationFrame(() => {
			const first = ref.current?.querySelector<HTMLElement>(
				"[aria-invalid='true']:not([type='hidden']), [data-invalid] input:not([type='hidden'])",
			);
			first?.focus();
		});
		return () => cancelAnimationFrame(frame);
	}, [errors]);

	return (
		<BaseForm
			ref={setRef}
			data-slot="form"
			errors={errors}
			className={cn("flex w-full flex-col gap-5", className)}
			{...props}
		/>
	);
}

/** 送信ボタンなどを並べる行。フォームの最後に置く */
export function FormActions({ className, ...props }: React.ComponentProps<"div">) {
	return (
		<div
			data-slot="form-actions"
			className={cn("flex flex-wrap items-center gap-3 pt-1", className)}
			{...props}
		/>
	);
}

import { AlertDialog as BaseAlertDialog } from "@base-ui/react/alert-dialog";
import type * as React from "react";
import { cn } from "../lib/cn";

export const AlertDialog = BaseAlertDialog.Root;

export function AlertDialogTrigger(props: React.ComponentProps<typeof BaseAlertDialog.Trigger>) {
	return <BaseAlertDialog.Trigger data-slot="alert-dialog-trigger" {...props} />;
}

/** 選んだら閉じるボタン。取り消しにも、確定にも使う */
export function AlertDialogClose(props: React.ComponentProps<typeof BaseAlertDialog.Close>) {
	return <BaseAlertDialog.Close data-slot="alert-dialog-close" {...props} />;
}

/** バックドロップ。押しても閉じない */
export function AlertDialogBackdrop({
	className,
	...props
}: React.ComponentProps<typeof BaseAlertDialog.Backdrop>) {
	return (
		<BaseAlertDialog.Backdrop
			data-slot="alert-dialog-backdrop"
			className={cn("motion-backdrop fixed inset-0 z-50 bg-backdrop backdrop-blur-[2px]", className)}
			{...props}
		/>
	);
}

/**
 * 取り消せない操作の前に、本当に進めるかを確かめる。
 * バックドロップを押しても閉じず、選ぶまで先へ進めない。閉じると開いたボタンにフォーカスが戻る。
 * 取り消しで済む操作には使わない（トーストで「元に戻す」を出す）。
 */
export function AlertDialogContent({
	className,
	children,
	...props
}: React.ComponentProps<typeof BaseAlertDialog.Popup>) {
	return (
		<BaseAlertDialog.Portal>
			<AlertDialogBackdrop />
			<BaseAlertDialog.Popup
				data-slot="alert-dialog-content"
				className={cn(
					"motion-dialog fixed top-1/2 left-1/2 z-50 flex w-[calc(100vw-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 flex-col gap-4",
					"rounded-xl border border-line bg-surface-overlay p-6 text-fg shadow-pop outline-none",
					className,
				)}
				{...props}
			>
				{children}
			</BaseAlertDialog.Popup>
		</BaseAlertDialog.Portal>
	);
}

export function AlertDialogHeader({ className, ...props }: React.ComponentProps<"div">) {
	return (
		<div data-slot="alert-dialog-header" className={cn("flex flex-col gap-1.5", className)} {...props} />
	);
}

export function AlertDialogFooter({ className, ...props }: React.ComponentProps<"div">) {
	return (
		<div
			data-slot="alert-dialog-footer"
			className={cn("mt-2 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end", className)}
			{...props}
		/>
	);
}

export function AlertDialogTitle({
	className,
	...props
}: React.ComponentProps<typeof BaseAlertDialog.Title>) {
	return (
		<BaseAlertDialog.Title
			data-slot="alert-dialog-title"
			className={cn("text-lg font-semibold tracking-snug text-fg-strong", className)}
			{...props}
		/>
	);
}

export function AlertDialogDescription({
	className,
	...props
}: React.ComponentProps<typeof BaseAlertDialog.Description>) {
	return (
		<BaseAlertDialog.Description
			data-slot="alert-dialog-description"
			className={cn("text-sm text-fg-muted", className)}
			{...props}
		/>
	);
}

import { Dialog as BaseDialog } from "@base-ui/react/dialog";
import { X } from "lucide-react";
import type * as React from "react";
import { cn } from "../lib/cn";

export const Dialog = BaseDialog.Root;

export function DialogTrigger(props: React.ComponentProps<typeof BaseDialog.Trigger>) {
	return <BaseDialog.Trigger data-slot="dialog-trigger" {...props} />;
}

export function DialogClose(props: React.ComponentProps<typeof BaseDialog.Close>) {
	return <BaseDialog.Close data-slot="dialog-close" {...props} />;
}

/** バックドロップ。ダイアログの後ろの画面を暗くする */
export function DialogBackdrop({ className, ...props }: React.ComponentProps<typeof BaseDialog.Backdrop>) {
	return (
		<BaseDialog.Backdrop
			data-slot="dialog-backdrop"
			className={cn("motion-backdrop fixed inset-0 z-50 bg-backdrop backdrop-blur-[2px]", className)}
			{...props}
		/>
	);
}

export type DialogContentProps = React.ComponentProps<typeof BaseDialog.Popup> & {
	/** 右上の閉じるボタンを出すか */
	showClose?: boolean;
};

/**
 * 今の作業を止めて、画面の中央に 1 つの用件を出す。
 * 開くと中にフォーカスが移り、Esc かバックドロップのクリックで閉じ、閉じると開いたボタンにフォーカスが戻る。
 */
export function DialogContent({ className, children, showClose = true, ...props }: DialogContentProps) {
	return (
		<BaseDialog.Portal>
			<DialogBackdrop />
			<BaseDialog.Popup
				data-slot="dialog-content"
				className={cn(
					"motion-dialog fixed top-1/2 left-1/2 z-50 flex w-[calc(100vw-2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 flex-col gap-4",
					"rounded-xl border border-line bg-surface-overlay p-6 text-fg shadow-pop outline-none",
					className,
				)}
				{...props}
			>
				{children}
				{showClose && (
					<BaseDialog.Close
						aria-label="閉じる"
						className="absolute top-4 right-4 flex size-8 items-center justify-center rounded-md text-fg-subtle transition-colors hover:bg-surface-hover hover:text-fg focus-visible:outline-2 focus-visible:outline-focus"
					>
						<X className="size-4" />
					</BaseDialog.Close>
				)}
			</BaseDialog.Popup>
		</BaseDialog.Portal>
	);
}

export function DialogHeader({ className, ...props }: React.ComponentProps<"div">) {
	return <div data-slot="dialog-header" className={cn("flex flex-col gap-1.5 pr-8", className)} {...props} />;
}

export function DialogFooter({ className, ...props }: React.ComponentProps<"div">) {
	return (
		<div
			data-slot="dialog-footer"
			className={cn("mt-2 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end", className)}
			{...props}
		/>
	);
}

export function DialogTitle({ className, ...props }: React.ComponentProps<typeof BaseDialog.Title>) {
	return (
		<BaseDialog.Title
			data-slot="dialog-title"
			className={cn("text-lg font-semibold tracking-snug text-fg-strong", className)}
			{...props}
		/>
	);
}

export function DialogDescription({
	className,
	...props
}: React.ComponentProps<typeof BaseDialog.Description>) {
	return (
		<BaseDialog.Description
			data-slot="dialog-description"
			className={cn("text-sm text-fg-muted", className)}
			{...props}
		/>
	);
}

import { Toast as BaseToast } from "@base-ui/react/toast";
import { CircleAlert, CircleCheck, Info, X } from "lucide-react";
import type * as React from "react";
import { cn } from "../lib/cn";

/**
 * アプリのどこからでも呼べるトーストの管理役。
 *
 *   toast.add({ title: "保存しました" })
 *   toast.add({ title: "保存できませんでした", description: "通信を確かめてください", type: "danger" })
 */
export const toast = BaseToast.createToastManager();

export type ToastType = "default" | "success" | "danger" | "info";

const icons: Record<ToastType, React.ReactNode> = {
	default: null,
	success: <CircleCheck className="size-4 text-success" aria-hidden />,
	danger: <CircleAlert className="size-4 text-danger" aria-hidden />,
	info: <Info className="size-4 text-info" aria-hidden />,
};

function ToastList() {
	const { toasts } = BaseToast.useToastManager();
	return toasts.map((t) => {
		const type = (t.type as ToastType | undefined) ?? "default";
		return (
			<BaseToast.Root
				key={t.id}
				toast={t}
				data-slot="toast"
				className={cn(
					"motion-toast pointer-events-auto w-full rounded-lg border border-line bg-surface-overlay shadow-pop select-none",
					"outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus",
				)}
			>
				<BaseToast.Content
					className={cn(
						"flex h-full items-start gap-3 overflow-hidden p-4 pr-10",
						"transition-opacity duration-(--duration-base) ease-standard data-behind:opacity-0 data-expanded:opacity-100",
					)}
				>
					{icons[type] && <span className="mt-0.5 flex">{icons[type]}</span>}
					<div className="flex min-w-0 flex-1 flex-col gap-0.5">
						<BaseToast.Title className="text-sm font-semibold text-fg-strong" />
						<BaseToast.Description className="text-sm text-fg-muted" />
						{t.actionProps && (
							<BaseToast.Action className="mt-2 inline-flex h-7 w-fit items-center rounded-md border border-line bg-surface-raised px-2.5 text-sm font-medium text-fg motion-press hover:border-line-strong hover:bg-surface-hover" />
						)}
					</div>
					<BaseToast.Close
						aria-label="閉じる"
						className="absolute top-3 right-3 flex size-7 items-center justify-center rounded-md text-fg-subtle transition-colors hover:bg-surface-hover hover:text-fg"
					>
						<X className="size-4" />
					</BaseToast.Close>
				</BaseToast.Content>
			</BaseToast.Root>
		);
	});
}

/**
 * トーストの表示場所。アプリの最上位に 1 つ置く。
 * 新しいものが手前に重なり、古いものは奥へ縮む。重なりに hover するかフォーカスすると広がる。
 * 右か下へスワイプすると消える。一度に見せるのは 3 件まで。
 */
export function Toaster({ limit = 3, timeout = 5000 }: { limit?: number; timeout?: number }) {
	return (
		<BaseToast.Provider toastManager={toast} limit={limit} timeout={timeout}>
			<BaseToast.Portal>
				<BaseToast.Viewport className="fixed right-4 bottom-4 z-[100] w-[calc(100vw-2rem)] outline-none sm:right-6 sm:bottom-6 sm:w-90">
					<ToastList />
				</BaseToast.Viewport>
			</BaseToast.Portal>
		</BaseToast.Provider>
	);
}

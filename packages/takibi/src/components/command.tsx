import { Autocomplete } from "@base-ui/react/autocomplete";
import { Dialog as BaseDialog } from "@base-ui/react/dialog";
import { Search } from "lucide-react";
import type * as React from "react";
import { cn } from "../lib/cn";
import { GlideGroup, glideRender } from "../lib/glide";

export type CommandDialogProps = Omit<React.ComponentProps<typeof BaseDialog.Root>, "children"> & {
	children?: React.ReactNode;
	/** アクセシブルネーム用の名前 */
	label?: string;
	className?: string;
};

/**
 * Command パレットを入れるダイアログ。画面の上寄りに、ブランドカラーの点が横へ伸びて入力欄になり、下へ広がって開く（着火）。
 * 閉じるときは 8px 上へ上がりながら薄れて消える。中に Command を置く。⌘K などのショートカットはアプリ側で open を切り替える。
 */
export function CommandDialog({ label = "コマンド", className, children, ...props }: CommandDialogProps) {
	return (
		<BaseDialog.Root {...props}>
			<BaseDialog.Portal>
				<BaseDialog.Backdrop className="motion-backdrop fixed inset-0 z-50 bg-backdrop backdrop-blur-[2px]" />
				<BaseDialog.Viewport className="fixed inset-0 z-50 flex items-start justify-center px-4 pt-[min(18vh,9rem)]">
					<BaseDialog.Popup
						data-slot="command-dialog"
						aria-label={label}
						className={cn(
							"motion-ignite flex max-h-[min(30rem,calc(100dvh-8rem))] w-full max-w-xl flex-col overflow-hidden rounded-xl border border-line bg-surface-overlay text-fg shadow-pop outline-none",
							className,
						)}
					>
						{children}
						<BaseDialog.Close className="sr-only">閉じる</BaseDialog.Close>
					</BaseDialog.Popup>
				</BaseDialog.Viewport>
			</BaseDialog.Portal>
		</BaseDialog.Root>
	);
}

export type CommandProps = Omit<React.ComponentProps<typeof Autocomplete.Root>, "open" | "inline">;

/**
 * 入力で絞り込める、コマンドの一覧。CommandDialog の中に置くほか、画面に直接置いてもよい。
 * 選んでいる項目の背景は、項目から項目へ滑って移る。
 */
export function Command({ children, ...props }: CommandProps) {
	return (
		<Autocomplete.Root open inline autoHighlight="always" keepHighlight {...props}>
			<GlideGroup>{children}</GlideGroup>
		</Autocomplete.Root>
	);
}

export function CommandInput({ className, ...props }: React.ComponentProps<typeof Autocomplete.Input>) {
	return (
		<Autocomplete.InputGroup
			data-slot="command-input"
			className="motion-ignite-input flex h-13 shrink-0 items-center gap-3 border-b border-line-subtle px-4"
		>
			<Search className="size-4 shrink-0 text-fg-subtle" aria-hidden />
			<Autocomplete.Input
				className={cn(
					"h-full w-full bg-transparent text-base text-fg-strong outline-none placeholder:text-fg-subtle",
					className,
				)}
				{...props}
			/>
		</Autocomplete.InputGroup>
	);
}

/** 一覧。高さを超えるとスクロールする */
export function CommandList({ className, ...props }: React.ComponentProps<typeof Autocomplete.List>) {
	return (
		<div className="motion-ignite-list min-h-0 flex-1 overflow-y-auto overscroll-contain p-1.5 [scroll-padding-block:0.375rem]">
			<Autocomplete.List data-slot="command-list" className={cn("outline-none", className)} {...props} />
		</div>
	);
}

/** 絞り込んで 1 件もないときの文言 */
export function CommandEmpty({ className, ...props }: React.ComponentProps<typeof Autocomplete.Empty>) {
	return (
		<Autocomplete.Empty
			data-slot="command-empty"
			className={cn("px-3 py-8 text-center text-sm text-fg-muted empty:hidden", className)}
			{...props}
		/>
	);
}

export function CommandGroup({ className, ...props }: React.ComponentProps<typeof Autocomplete.Group>) {
	return (
		<Autocomplete.Group data-slot="command-group" className={cn("not-last:mb-2", className)} {...props} />
	);
}

export function CommandGroupLabel({
	className,
	...props
}: React.ComponentProps<typeof Autocomplete.GroupLabel>) {
	return (
		<Autocomplete.GroupLabel
			data-slot="command-group-label"
			className={cn("px-2.5 pt-2 pb-1 text-xs font-medium text-fg-subtle select-none", className)}
			{...props}
		/>
	);
}

export const CommandCollection = Autocomplete.Collection;

/** 項目。選んでいる間は、背景が滑ってきて重なる */
export function CommandItem({
	className,
	children,
	...props
}: React.ComponentProps<typeof Autocomplete.Item>) {
	return (
		<Autocomplete.Item
			data-slot="command-item"
			className={cn(
				"relative isolate flex min-h-10 cursor-default items-center gap-3 rounded-md px-2.5 text-sm text-fg-muted outline-none select-none [scroll-margin-block:0.375rem]",
				"transition-colors duration-(--duration-fast) ease-standard data-highlighted:text-fg-strong",
				"data-disabled:pointer-events-none data-disabled:text-fg-subtle",
				"[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
				className,
			)}
			render={glideRender()}
			{...props}
		>
			{children}
		</Autocomplete.Item>
	);
}

/** 項目の右端に置くショートカット */
export function CommandShortcut({ className, ...props }: React.ComponentProps<"span">) {
	return (
		<span
			data-slot="command-shortcut"
			className={cn("ml-auto flex items-center gap-1 text-xs text-fg-subtle", className)}
			{...props}
		/>
	);
}

/** 下端の操作の案内 */
export function CommandFooter({ className, ...props }: React.ComponentProps<"div">) {
	return (
		<div
			data-slot="command-footer"
			className={cn(
				"motion-ignite-list flex shrink-0 items-center justify-end gap-4 border-t border-line-subtle px-4 py-2.5 text-xs text-fg-subtle",
				className,
			)}
			{...props}
		/>
	);
}

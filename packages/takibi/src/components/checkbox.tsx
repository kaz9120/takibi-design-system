import { Checkbox as BaseCheckbox } from "@base-ui/react/checkbox";
import type * as React from "react";
import { cn } from "../lib/cn";

/**
 * 1 つの項目を入れるか外すかを選ぶ。押してすぐ効く設定には Switch を使う。
 * `<label>` で囲むか Field の中に置いて、名前を付ける。
 * 押すと沈み、入れるとチェックマークの線が描かれ、外すと線が戻って消える。
 */
export function Checkbox({ className, ...props }: React.ComponentProps<typeof BaseCheckbox.Root>) {
	return (
		<BaseCheckbox.Root
			data-slot="checkbox"
			className={cn(
				"peer inline-flex size-4 shrink-0 items-center justify-center rounded-sm border border-line-strong bg-surface-sunken text-fg-on-brand",
				"motion-press-icon outline-none hover:not-data-disabled:border-line-hover",
				"focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus",
				"data-checked:border-brand data-checked:bg-brand data-indeterminate:border-brand data-indeterminate:bg-brand",
				"hover:not-data-disabled:data-checked:border-brand-hover hover:not-data-disabled:data-checked:bg-brand-hover",
				"data-invalid:border-danger aria-invalid:border-danger",
				"data-disabled:cursor-not-allowed data-disabled:opacity-50",
				className,
			)}
			{...props}
		>
			<BaseCheckbox.Indicator
				data-slot="checkbox-indicator"
				keepMounted
				className="flex items-center justify-center"
				render={(indicatorProps, state) => (
					<span {...indicatorProps}>
						<svg
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							strokeWidth={3.25}
							aria-hidden
							className="size-3.5"
						>
							{state.indeterminate ? (
								<path d="M6 12h12" pathLength={1} strokeLinecap="round" className="motion-draw" />
							) : (
								<path
									d="M20 6 9 17l-5-5"
									pathLength={1}
									strokeLinecap="round"
									strokeLinejoin="round"
									className="motion-draw"
								/>
							)}
						</svg>
					</span>
				)}
			/>
		</BaseCheckbox.Root>
	);
}

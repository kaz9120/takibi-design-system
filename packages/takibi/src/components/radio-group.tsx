import { Radio as BaseRadio } from "@base-ui/react/radio";
import { RadioGroup as BaseRadioGroup } from "@base-ui/react/radio-group";
import type * as React from "react";
import { cn } from "../lib/cn";

/**
 * 並んだ選択肢から 1 つだけ選ぶ。選択肢が 2〜5 個で、全部を見比べて選ばせたいときに使う。
 * 多いときは Select を使う。Tab でグループに入り、矢印キーで選択が移る。
 */
export function RadioGroup({ className, ...props }: React.ComponentProps<typeof BaseRadioGroup>) {
	return (
		<BaseRadioGroup data-slot="radio-group" className={cn("flex flex-col gap-2.5", className)} {...props} />
	);
}

export function Radio({ className, ...props }: React.ComponentProps<typeof BaseRadio.Root>) {
	return (
		<BaseRadio.Root
			data-slot="radio"
			className={cn(
				"inline-flex size-4 shrink-0 items-center justify-center rounded-full border border-line-strong bg-surface-sunken",
				"motion-press-icon outline-none hover:not-data-disabled:border-line-hover",
				"focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus",
				"data-checked:border-brand",
				"data-invalid:border-danger aria-invalid:border-danger",
				"data-disabled:cursor-not-allowed data-disabled:opacity-50",
				className,
			)}
			{...props}
		>
			<BaseRadio.Indicator
				data-slot="radio-indicator"
				className={cn(
					"size-2 rounded-full bg-brand",
					"transition-[scale,opacity] duration-(--duration-pop) ease-pop",
					"data-starting-style:scale-0 data-starting-style:opacity-0",
					"data-ending-style:scale-0 data-ending-style:opacity-0 data-ending-style:duration-(--duration-fast) data-ending-style:ease-out-expo",
				)}
			/>
		</BaseRadio.Root>
	);
}

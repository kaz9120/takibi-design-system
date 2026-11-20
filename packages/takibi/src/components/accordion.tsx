import { Accordion as BaseAccordion } from "@base-ui/react/accordion";
import { ChevronDown } from "lucide-react";
import type * as React from "react";
import { cn } from "../lib/cn";

/**
 * 見出しを押して中身を広げる。よくある質問や、詳しい設定のように、
 * 全部を一度に見せると長すぎる内容をたたむ。最初から読ませたい内容はたたまない。
 */
export function Accordion({ className, ...props }: React.ComponentProps<typeof BaseAccordion.Root>) {
	return (
		<BaseAccordion.Root data-slot="accordion" className={cn("flex w-full flex-col", className)} {...props} />
	);
}

export function AccordionItem({ className, ...props }: React.ComponentProps<typeof BaseAccordion.Item>) {
	return (
		<BaseAccordion.Item
			data-slot="accordion-item"
			className={cn("border-b border-line-subtle last:border-b-0", className)}
			{...props}
		/>
	);
}

/** 見出し。h3 で包むので、ページの見出しの階層に合わないときは render で変える */
export function AccordionTrigger({
	className,
	children,
	...props
}: React.ComponentProps<typeof BaseAccordion.Trigger>) {
	return (
		<BaseAccordion.Header data-slot="accordion-header" className="flex">
			<BaseAccordion.Trigger
				data-slot="accordion-trigger"
				className={cn(
					"group flex flex-1 items-center justify-between gap-4 rounded-md py-4 text-left text-sm font-medium text-fg",
					"outline-none transition-colors duration-(--duration-fast) ease-ember hover:text-fg-strong",
					"focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus",
					"data-disabled:cursor-not-allowed data-disabled:text-fg-subtle data-disabled:hover:text-fg-subtle",
					className,
				)}
				{...props}
			>
				{children}
				<ChevronDown
					aria-hidden
					className="size-4 shrink-0 text-fg-muted [transition:rotate_var(--duration-sway)_var(--ease-sway),color_var(--duration-fast)_var(--ease-standard)] group-hover:text-fg group-data-panel-open:rotate-180"
				/>
			</BaseAccordion.Trigger>
		</BaseAccordion.Header>
	);
}

export function AccordionContent({
	className,
	children,
	...props
}: React.ComponentProps<typeof BaseAccordion.Panel>) {
	return (
		<BaseAccordion.Panel
			data-slot="accordion-content"
			className="motion-fold text-sm text-fg-muted"
			{...props}
		>
			<div className={cn("pb-4", className)}>{children}</div>
		</BaseAccordion.Panel>
	);
}

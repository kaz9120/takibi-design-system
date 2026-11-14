import { CheckboxGroup as BaseCheckboxGroup } from "@base-ui/react/checkbox-group";
import * as React from "react";
import { cn } from "../lib/cn";
import { Checkbox } from "./checkbox";

export type CheckboxGroupProps = Omit<
	React.ComponentProps<typeof BaseCheckboxGroup>,
	"value" | "defaultValue" | "onValueChange"
> & {
	value?: string[];
	defaultValue?: string[];
	onValueChange?: (value: string[]) => void;
};

/**
 * 関係する複数の Checkbox をまとめる。値は選んだ項目の value の配列になる。
 * 「すべて選ぶ」を置くときは `allValues` に全項目の value を渡し、CheckboxGroupItem に `parent` を付ける。
 * 親でまとめて切り替えると、子のチェックマークが上から 40ms ずつ遅れて切り替わる（火の粉の伝播）。
 */
export function CheckboxGroup({
	className,
	value: valueProp,
	defaultValue = [],
	onValueChange,
	ref: refProp,
	...props
}: CheckboxGroupProps) {
	const [uncontrolled, setUncontrolled] = React.useState(defaultValue);
	const value = valueProp ?? uncontrolled;
	const ref = React.useRef<HTMLDivElement>(null);
	const setRef = React.useCallback(
		(node: HTMLDivElement | null) => {
			ref.current = node;
			if (typeof refProp === "function") refProp(node);
			else if (refProp) refProp.current = node;
		},
		[refProp],
	);

	return (
		<BaseCheckboxGroup
			ref={setRef}
			data-slot="checkbox-group"
			className={cn("flex flex-col gap-2.5", className)}
			value={value}
			onValueChange={(next) => {
				const changed = new Set([
					...next.filter((v) => !value.includes(v)),
					...value.filter((v) => !next.includes(v)),
				]);
				if (changed.size > 1 && ref.current) cascade(ref.current, changed);
				if (valueProp === undefined) setUncontrolled(next);
				onValueChange?.(next);
			}}
			{...props}
		/>
	);
}

/** 変わった子のチェックマークを、上から順に少しずつ遅らせて切り替える */
function cascade(group: HTMLElement, changed: Set<string>) {
	if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
	const items = group.querySelectorAll<HTMLElement>("[data-slot='checkbox-group-item']:not([data-parent])");
	let order = 0;
	for (const item of items) {
		if (!changed.has(item.dataset.value ?? "")) continue;
		const delay = `${(order + 1) * 40}ms`;
		order += 1;
		const targets = item.querySelectorAll<HTMLElement | SVGElement>("[data-slot='checkbox'], path");
		for (const el of targets) el.style.transitionDelay = delay;
		window.setTimeout(
			() => {
				for (const el of targets) el.style.transitionDelay = "";
			},
			(order + 1) * 40 + 300,
		);
	}
}

export type CheckboxGroupItemProps = Omit<React.ComponentProps<typeof Checkbox>, "value"> & {
	/** グループの中で項目を見分ける値。`parent` のときは省く */
	value?: string;
	/** 「すべて選ぶ」の親の項目。子の一部だけが入っていると、チェックマークが横線になる */
	parent?: boolean;
	/** 項目の補足 */
	description?: React.ReactNode;
	labelClassName?: string;
};

/** グループの中の 1 項目。チェックボックスと名前を 1 つのラベルにまとめる */
export function CheckboxGroupItem({
	value,
	parent,
	description,
	labelClassName,
	children,
	disabled,
	...props
}: CheckboxGroupItemProps) {
	return (
		<label
			data-slot="checkbox-group-item"
			data-value={value}
			data-parent={parent || undefined}
			data-disabled={disabled || undefined}
			className={cn(
				"flex items-start gap-2 text-sm text-fg select-none",
				"data-disabled:cursor-not-allowed data-disabled:text-fg-subtle",
				parent && "font-medium text-fg-strong",
				labelClassName,
			)}
		>
			<Checkbox value={value} parent={parent} disabled={disabled} className="mt-[0.1875rem]" {...props} />
			<span className="flex flex-col gap-0.5">
				{children}
				{description && <span className="text-fg-muted">{description}</span>}
			</span>
		</label>
	);
}

/** 親の項目の下に、子の項目を字下げして並べる。左の細い線で親子の関係を示す */
export function CheckboxGroupList({ className, ...props }: React.ComponentProps<"div">) {
	return (
		<div
			data-slot="checkbox-group-list"
			className={cn("ml-2 flex flex-col gap-2.5 border-l border-line-subtle pl-4", className)}
			{...props}
		/>
	);
}

import { Toggle as BaseToggle } from "@base-ui/react/toggle";
import { ToggleGroup as BaseToggleGroup } from "@base-ui/react/toggle-group";
import * as React from "react";
import { cn } from "../lib/cn";
import { toggleVariants } from "./toggle";

type Size = "sm" | "md" | "lg";
type Variant = "ghost" | "outline" | "segmented";

const ToggleGroupContext = React.createContext<{ size: Size; glides: boolean; variant: Variant }>({
	size: "md",
	glides: false,
	variant: "ghost",
});

export type ToggleGroupProps = React.ComponentProps<typeof BaseToggleGroup> & {
	/**
	 * ghost は枠なし、outline は枠あり。segmented は溝の中のインジケーターで選択を示す型で、
	 * 表示の切り替え（リストとグリッドなど）に使う
	 */
	variant?: Variant;
	size?: Size;
};

/**
 * 関連するトグルを 1 つのグループにまとめる。既定は 1 つだけ選べ、`multiple` で複数選べる。
 * Tab でグループに入り、矢印キーで項目を移動する。1 つだけ選ぶグループでは、選択インジケーターが進む側の辺から伸びて移動する（炎の舌）。
 */
export function ToggleGroup({
	className,
	variant = "ghost",
	size = "md",
	multiple,
	children,
	...props
}: ToggleGroupProps) {
	const glides = !multiple;
	const ref = React.useRef<HTMLDivElement>(null);
	const indicator = useIndicator(ref, glides);
	const context = React.useMemo(() => ({ size, glides, variant }), [size, glides, variant]);
	return (
		<BaseToggleGroup
			ref={ref}
			data-slot="toggle-group"
			data-variant={variant}
			multiple={multiple}
			className={cn(
				"relative isolate inline-flex w-fit items-center gap-0.5 rounded-md data-[orientation=vertical]:flex-col",
				variant === "outline" && "border border-line-strong bg-surface-sunken p-0.5",
				variant === "segmented" && "rounded-lg border border-line-subtle bg-surface-sunken p-0.5",
				className,
			)}
			{...props}
		>
			{glides && indicator && (
				<span
					aria-hidden
					data-slot="toggle-group-indicator"
					data-activation-direction={indicator.direction}
					className={cn(
						"motion-tongue pointer-events-none absolute -z-10 rounded-md",
						"data-hidden:opacity-0",
						variant === "segmented"
							? "rounded-[calc(var(--radius-lg)-3px)] border border-line bg-surface-raised shadow-rim"
							: "bg-brand-soft",
					)}
					data-hidden={indicator.hidden || undefined}
					style={{
						left: indicator.left,
						right: indicator.right,
						top: indicator.top,
						bottom: indicator.bottom,
					}}
				/>
			)}
			<ToggleGroupContext.Provider value={context}>{children}</ToggleGroupContext.Provider>
		</BaseToggleGroup>
	);
}

export type ToggleGroupItemProps = React.ComponentProps<typeof BaseToggle> & {
	/** グループ内で項目を識別する値 */
	value: string;
};

export function ToggleGroupItem({ className, ...props }: ToggleGroupItemProps) {
	const { size, glides, variant } = React.useContext(ToggleGroupContext);
	// 枠はグループ側に付けるので、項目は枠なしにする。インジケーターが移動するグループでは、選んだ項目の背景はインジケーターに任せる
	return (
		<BaseToggle
			data-slot="toggle-group-item"
			className={cn(
				toggleVariants({ variant: "ghost", size }),
				"focus-visible:z-10",
				glides && "data-pressed:bg-transparent hover:not-data-disabled:data-pressed:bg-transparent",
				variant === "segmented" &&
					"data-pressed:text-fg-strong hover:not-data-disabled:data-pressed:text-fg-strong hover:not-data-disabled:bg-transparent",
				className,
			)}
			{...props}
		/>
	);
}

type Indicator = {
	left: number;
	right: number;
	top: number;
	bottom: number;
	direction: "left" | "right" | "up" | "down" | "none";
	hidden: boolean;
};

/** 押されている項目の位置を監視し、インジケーターの位置と移動方向を返す */
function useIndicator(group: React.RefObject<HTMLDivElement | null>, enabled: boolean) {
	const [state, setState] = React.useState<Indicator | null>(null);
	React.useLayoutEffect(() => {
		const el = group.current;
		if (!enabled || !el) return;
		const measure = () => {
			const pressed = el.querySelector<HTMLElement>('[data-slot="toggle-group-item"][data-pressed]');
			setState((prev) => {
				if (!pressed) return prev ? { ...prev, hidden: true, direction: "none" } : null;
				const g = el.getBoundingClientRect();
				const r = pressed.getBoundingClientRect();
				const next = {
					left: r.left - g.left - el.clientLeft,
					right: g.right - r.right - el.clientLeft,
					top: r.top - g.top - el.clientTop,
					bottom: g.bottom - r.bottom - el.clientTop,
				};
				let direction: Indicator["direction"] = "none";
				if (prev && !prev.hidden) {
					if (next.left > prev.left + 0.5) direction = "right";
					else if (next.left < prev.left - 0.5) direction = "left";
					else if (next.top > prev.top + 0.5) direction = "down";
					else if (next.top < prev.top - 0.5) direction = "up";
					else direction = prev.direction;
				}
				return { ...next, direction, hidden: false };
			});
		};
		measure();
		const mo = new MutationObserver(measure);
		mo.observe(el, { attributes: true, subtree: true, attributeFilter: ["data-pressed"] });
		const ro = new ResizeObserver(measure);
		ro.observe(el);
		return () => {
			mo.disconnect();
			ro.disconnect();
		};
	}, [group, enabled]);
	return state;
}

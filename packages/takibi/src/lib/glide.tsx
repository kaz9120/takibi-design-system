import { LayoutGroup, motion, useReducedMotion } from "motion/react";
import * as React from "react";
import { cn } from "./cn";
import { springs } from "./motion";

/**
 * 一覧の中で、選んでいる項目の背景を滑らせて移す。
 * 一覧（メニューやリストの本体）を GlideGroup で包み、各項目の中で <Glide active={highlighted} /> を描く。
 * 項目は relative isolate にしておく。
 */
export function GlideGroup({ children }: { children: React.ReactNode }) {
	const id = React.useId();
	return <LayoutGroup id={id}>{children}</LayoutGroup>;
}

export function Glide({
	active,
	className,
	layoutId = "glide",
	"data-slot": slot,
}: {
	active: boolean;
	className?: string;
	/** 同じ GlideGroup の中に、別々に滑るインジケーターを 2 つ以上置くときに分ける */
	layoutId?: string;
	"data-slot"?: string;
}) {
	const reduce = useReducedMotion();
	if (!active) return null;
	return (
		<motion.span
			layoutId={reduce ? undefined : layoutId}
			aria-hidden
			data-slot={slot}
			className={cn(
				"pointer-events-none absolute inset-0 -z-10 rounded-[inherit] bg-surface-hover",
				className,
			)}
			transition={springs.sway}
		/>
	);
}

/** Base UI の項目の render に渡す。選んでいる間だけ、滑ってくる背景を中に描く */
export function glideRender(className?: string) {
	return (props: React.ComponentProps<"div">, state: { highlighted: boolean }) => (
		<div {...props}>
			<Glide active={state.highlighted} className={className} />
			{props.children}
		</div>
	);
}

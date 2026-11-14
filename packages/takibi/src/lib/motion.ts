import type { Transition } from "motion/react";

/**
 * Motion で使うばね。CSS の --ease-spring-* と同じ値で、名前もそろえてある。
 * 減衰を 28 前後に固定し、硬さだけを変えているので、どれも 300ms ほどで落ち着く。
 */
export const springs = {
	/** 行き過ぎ 11%。アイコンの入れ替え、小さな飾り */
	snappy: { type: "spring", stiffness: 600, damping: 28 },
	/** 行き過ぎ 8%。押下、hover の拡大、ハンドル */
	press: { type: "spring", stiffness: 500, damping: 28 },
	/** 行き過ぎ 4.5%。ポップオーバー、ダイアログ、文字の送り */
	soft: { type: "spring", stiffness: 400, damping: 28 },
	/** 行き過ぎなし。選択インジケーター、位置や幅の移動 */
	glide: { type: "spring", stiffness: 480, damping: 34, mass: 0.6 },
} as const satisfies Record<string, Transition>;

/** 振れ幅。CSS の --press-scale などと同じ値 */
export const amplitude = {
	press: 0.97,
	pressSurface: 0.98,
	pressIcon: 0.92,
	hover: 1.02,
	swapFromScale: 0.5,
	swapBlur: "blur(4px)",
	stagger: 0.04,
} as const;

/** 速い減速。CSS の --ease-out-expo と同じ値。閉じる、消える */
export const easeOutExpo = [0.16, 1, 0.3, 1] as const;

/** 煙。消えるときに上へ 10px 昇り、ぼけて薄れる。exit にそのまま渡す */
export const smoke = {
	opacity: 0,
	y: -10,
	scale: 0.96,
	filter: "blur(4px)",
	transition: { duration: 0.22, ease: easeOutExpo },
} as const;

/** 中身を入れ替えるときの出入り。小さく、ぼけた状態から現れ、同じ姿へ消える */
export const swap = {
	initial: { opacity: 0, scale: amplitude.swapFromScale, filter: amplitude.swapBlur },
	animate: { opacity: 1, scale: 1, filter: "blur(0px)" },
	exit: { opacity: 0, scale: amplitude.swapFromScale, filter: amplitude.swapBlur },
	transition: springs.snappy,
} as const;

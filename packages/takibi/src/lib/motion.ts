import type { Transition } from "motion/react";

/**
 * 焚き火から取った 4 つの動き。CSS の --ease-pop / land / ignite / sway と同じ名前で、行き過ぎの量もそろえてある。
 * Motion では type: "spring" の硬さと減衰で同じ動きを書く。
 */
export const springs = {
	/** はぜる。行き過ぎない。火の粉が飛び出して空気の抵抗で止まる動き。アイコンの入れ替え、小さな飾り */
	pop: { type: "spring", stiffness: 600, damping: 49 },
	/** 載る。行き過ぎ 12%。薪が落ちて載り、小さく跳ねて止まる動き。押下、hover の拡大、ハンドル */
	land: { type: "spring", stiffness: 960, damping: 35 },
	/** 着火。行き過ぎ 8%。火が移って炎が立ち上がる動き（計算モデルで測った行き過ぎと同じ）。ポップオーバー、ダイアログ、文字の送り */
	ignite: { type: "spring", stiffness: 145, damping: 15 },
	/** 揺れる。行き過ぎなし。炎が横へ寄る動き。選択インジケーター、位置や幅の移動 */
	sway: { type: "spring", stiffness: 480, damping: 34, mass: 0.6 },
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
	/** 月と太陽が入れ替わるときに回る角度（度）と、回る中心（要素の下の端から、高さ 1 つ分だけ下） */
	orbitAngle: 75,
	orbitOrigin: "50% 200%",
} as const;

/** 速い減速。CSS の --ease-out-expo と同じ値。閉じる、消える */
export const easeOutExpo = [0.16, 1, 0.3, 1] as const;

/** 余熱。光が消えるときの長さと曲線。CSS の --duration-cool と --ease-cool と同じ値。火の粉が冷えるときの明るさの落ち方に合わせた */
export const cool = { duration: 0.56, ease: [0.1, 0.4, 0.15, 1] } as const;

/** 煙。消えるときに上へ 10px 昇りながら 1.03 倍に広がり、ぼけて薄れる。exit にそのまま渡す */
export const smoke = {
	opacity: 0,
	y: -10,
	scale: 1.03,
	filter: "blur(4px)",
	// 煙は浮力で加速しながら昇る。CSS の --ease-rise と同じ値
	transition: { duration: 0.22, ease: [0.4, 0, 0.9, 0.5] },
} as const;

/** 中身を入れ替えるときの出入り。小さく、ぼけた状態から現れ、同じ姿へ消える */
export const swap = {
	initial: { opacity: 0, scale: amplitude.swapFromScale, filter: amplitude.swapBlur },
	animate: { opacity: 1, scale: 1, filter: "blur(0px)" },
	exit: { opacity: 0, scale: amplitude.swapFromScale, filter: amplitude.swapBlur },
	transition: springs.pop,
} as const;

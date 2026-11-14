import { type ClassValue, clsx } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

/**
 * クラス名を結合し、Tailwind のクラスの衝突を後勝ちで解決する。
 * 独自に定義した文字サイズ（text-xs〜text-6xl）を色と取り違えないよう登録する。
 */
const twMerge = extendTailwindMerge({
	extend: {
		theme: {
			text: ["xs", "sm", "base", "lg", "xl", "2xl", "3xl", "4xl", "5xl", "6xl"],
		},
	},
});

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

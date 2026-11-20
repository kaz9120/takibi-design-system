import type * as React from "react";

/**
 * motion-warmth の光の中心を、ポインターの位置に合わせる。onPointerMove にそのまま渡す。
 * 位置は要素の CSS 変数（--warmth-x、--warmth-y）に書くので、再描画は起きない。
 */
export function trackWarmth(event: React.PointerEvent<HTMLElement>) {
	const el = event.currentTarget;
	const rect = el.getBoundingClientRect();
	el.style.setProperty("--warmth-x", `${event.clientX - rect.left}px`);
	el.style.setProperty("--warmth-y", `${event.clientY - rect.top}px`);
}

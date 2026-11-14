import * as React from "react";

type Point = { x: number; y: number };

/** サブメニューへ向かう途中で、どれだけ近づかずに止まっていてよいか */
const GRACE_MS = 300;
/** 三角形の底辺を、サブメニューの上下にどれだけ広げるか */
const EDGE_PAD = 8;

/**
 * サブメニューへ斜めに向かう動きを見分ける（セーフトライアングル）。
 *
 * Base UI（floating-ui）の判定は、三角形の中でもマウスが 40ms 止まるか、ゆっくり動くと閉じる。
 * 人の手は向かう途中で減速したり迷ったりするので、それでは開いたサブメニューが逃げてしまう。
 * ここでは、項目を出た点とサブメニューの手前の辺で三角形を作り、その中にいる間は閉じるのを止める。
 * ただし GRACE_MS の間サブメニューへ近づかなければ閉じる。
 */
export function useMenuAim(close: () => void) {
	const trigger = React.useRef<HTMLElement | null>(null);
	const popup = React.useRef<HTMLElement | null>(null);
	const anchor = React.useRef<Point | null>(null);
	const pointer = React.useRef<Point | null>(null);
	const best = React.useRef(Number.POSITIVE_INFINITY);
	const timer = React.useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
	const closeRef = React.useRef(close);
	closeRef.current = close;

	/** 向かっている間は、親メニューのほかの項目を hover に反応させない。背景が下の項目へ滑らないように */
	const setAiming = React.useCallback((on: boolean) => {
		const menu = trigger.current?.closest<HTMLElement>('[data-slot="menu-content"]');
		if (!menu) return;
		if (on) menu.dataset.menuAiming = "";
		else delete menu.dataset.menuAiming;
	}, []);

	const stop = React.useCallback(() => {
		clearTimeout(timer.current);
		timer.current = undefined;
		best.current = Number.POSITIVE_INFINITY;
		setAiming(false);
	}, [setAiming]);

	const arm = React.useCallback(() => {
		setAiming(true);
		clearTimeout(timer.current);
		timer.current = setTimeout(() => {
			timer.current = undefined;
			const p = pointer.current;
			if (p && (inside(p, popup.current) || inside(p, trigger.current))) return;
			stop();
			closeRef.current();
		}, GRACE_MS);
	}, [stop, setAiming]);

	const track = React.useCallback(
		(open: boolean) => {
			if (!open) {
				stop();
				return;
			}
			const onMove = (e: MouseEvent) => {
				const p = { x: e.clientX, y: e.clientY };
				pointer.current = p;
				if (inside(p, trigger.current)) anchor.current = p;
				// サブメニューに着いたら、親メニューの項目を元どおり反応させる
				if (inside(p, popup.current)) stop();
				// 待っている間も、サブメニューへ近づき続けていれば待ち時間を延ばす
				if (timer.current !== undefined) {
					const d = distance(p, popup.current);
					if (d < best.current - 1) {
						best.current = d;
						arm();
					}
				}
			};
			document.addEventListener("mousemove", onMove, true);
			return () => {
				document.removeEventListener("mousemove", onMove, true);
				stop();
			};
		},
		[arm, stop],
	);

	/** Base UI が閉じようとしたときに呼ぶ。向かっている途中なら true を返し、閉じるのを止める */
	const isAiming = React.useCallback(() => {
		const p = pointer.current;
		const t = trigger.current;
		const m = popup.current;
		if (!p || !t || !m) return false;
		if (inside(p, m)) return true;
		const tr = t.getBoundingClientRect();
		const mr = m.getBoundingClientRect();
		const a = anchor.current ?? p;
		const toRight = mr.left >= tr.left + tr.width / 2;
		const edgeX = toRight ? mr.left : mr.right;
		// 手前の辺を越えたあとは、サブメニューの上下の範囲にいれば向かっていると見なす
		if (toRight ? p.x >= edgeX : p.x <= edgeX) return p.y >= mr.top - EDGE_PAD && p.y <= mr.bottom + EDGE_PAD;
		const aiming = inTriangle(
			p,
			a,
			{ x: edgeX, y: mr.top - EDGE_PAD },
			{ x: edgeX, y: mr.bottom + EDGE_PAD },
		);
		if (aiming) {
			const d = distance(p, m);
			if (timer.current === undefined || d < best.current - 1) {
				best.current = d;
				arm();
			}
		}
		return aiming;
	}, [arm]);

	return { trigger, popup, track, isAiming, stop };
}

function inside(p: Point, el: HTMLElement | null) {
	if (!el) return false;
	const r = el.getBoundingClientRect();
	return p.x >= r.left && p.x <= r.right && p.y >= r.top && p.y <= r.bottom;
}

function distance(p: Point, el: HTMLElement | null) {
	if (!el) return Number.POSITIVE_INFINITY;
	const r = el.getBoundingClientRect();
	const dx = Math.max(r.left - p.x, 0, p.x - r.right);
	const dy = Math.max(r.top - p.y, 0, p.y - r.bottom);
	return Math.hypot(dx, dy);
}

function inTriangle(p: Point, a: Point, b: Point, c: Point) {
	const s = (p1: Point, p2: Point, p3: Point) =>
		(p1.x - p3.x) * (p2.y - p3.y) - (p2.x - p3.x) * (p1.y - p3.y);
	const d1 = s(p, a, b);
	const d2 = s(p, b, c);
	const d3 = s(p, c, a);
	const neg = d1 < 0 || d2 < 0 || d3 < 0;
	const pos = d1 > 0 || d2 > 0 || d3 > 0;
	return !(neg && pos);
}

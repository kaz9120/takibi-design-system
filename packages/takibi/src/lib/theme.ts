export type Theme = "dark" | "light";

/** 夜明けと日暮れの長さ（ms）と、境目の動きの曲線。motion.css の ::view-transition-new(root) と同じ値にする */
const WIPE_MS = 720;
const WIPE_EASE = [0.3, 0.1, 0.3, 1] as const;
/** 境目のぼかしの幅と、境目が動く距離。どちらも画面の高さを 1 とする。motion.css の mask-size と dawn / dusk から決まる */
const WIPE_BAND = 0.4;
const WIPE_TRAVEL = 1.4;

/** 境目が progress（0〜1）まで進む時刻を ms で返す。曲線を逆にたどる */
function wipeTime(progress: number) {
	const [x1, y1, x2, y2] = WIPE_EASE;
	const bezier = (a: number, b: number, s: number) =>
		3 * a * s * (1 - s) ** 2 + 3 * b * s ** 2 * (1 - s) + s ** 3;
	const p = Math.min(1, Math.max(0, progress));
	let lo = 0;
	let hi = 1;
	for (let i = 0; i < 24; i++) {
		const mid = (lo + hi) / 2;
		if (bezier(y1, y2, mid) < p) lo = mid;
		else hi = mid;
	}
	return bezier(x1, x2, (lo + hi) / 2) * WIPE_MS;
}

let run = 0;
/** 今、切り替えの上に出しているボタン */
let lifted: HTMLElement | null = null;

/**
 * 夜と昼を切り替える。昼へは 0 時から 12 時、夜へは 12 時から 24 時の空の移り変わりを、720ms に縮めて通す（夜明けと日暮れ）。
 * 昼へは、夜の画面が薄明の青に明るみ、日の出の光の色をした新しい画面が下の端から上へ広がって、日中の色に落ち着く。
 * 夜へは、昼の画面が夕日の色に寄り、薄明の青をした新しい画面が上の端から下へ広がって、夜の色に沈む。
 *
 * コンポーネントはそれぞれ色の transition を持つので、ただ data-theme を変えると、コンポーネントごとに
 * 違う時刻で色が変わり、段になって見える。切り替えの間だけ transition を止めて一度に変え、
 * 対応するブラウザでは View Transitions で前の画面の上に新しい画面を広げる。向きは data-theme-to で CSS（motion.css）に伝える。
 *
 * origin には、切り替えを起こしたボタンを渡す。前の画面は止まった絵なので、渡さないと、境目が届くまでボタンの中の動きが見えない。
 * 渡すと、そのボタンだけを画面の切り替えの上に出して動かし続け、境目がボタンを通る間に色を新しいテーマへ移す。
 */
export function setTheme(
	theme: Theme,
	root: HTMLElement = document.documentElement,
	origin?: HTMLElement | null,
) {
	if (root.dataset.theme === theme) return;
	const first = root.dataset.theme === undefined;
	const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
	if (first || reduce || typeof document.startViewTransition !== "function") {
		root.dataset.themeSwitching = "";
		root.dataset.theme = theme;
		// 新しい色を一度描かせてから transition を戻す
		void root.offsetHeight;
		requestAnimationFrame(() => {
			delete root.dataset.themeSwitching;
		});
		return;
	}
	const mine = ++run;
	root.dataset.themeTo = theme;
	// 名前は 1 画面に 1 つしか付けられない。重なると切り替えの動きがすべて飛ぶので、前のボタンから外す
	if (lifted && lifted !== origin) lifted.style.viewTransitionName = "";
	lifted = origin ?? null;
	if (origin) {
		// 境目がボタンの中心に届く時刻と、通り過ぎる時刻。昼へは下から、夜へは上から来る
		const rect = origin.getBoundingClientRect();
		const at = (rect.top + rect.height / 2) / window.innerHeight;
		const enter = theme === "light" ? 1 - at : at;
		const from = wipeTime(enter / WIPE_TRAVEL);
		const to = wipeTime((enter + WIPE_BAND) / WIPE_TRAVEL);
		root.style.setProperty("--theme-origin-delay", `${Math.round(from)}ms`);
		root.style.setProperty("--theme-origin-duration", `${Math.max(1, Math.round(to - from))}ms`);
		origin.style.viewTransitionName = "theme-origin";
	}
	const transition = document.startViewTransition(() => {
		// 色の transition は、テーマと同時に止め、切り替えが終わるまで戻さない。属性を 1 つ変えるたびに全要素のスタイルを計算し直すので
		// （743 要素のページで約 13ms）、別々に変えたり、途中で戻したりすると、そのぶん画面が長く止まる
		root.dataset.themeSwitching = "";
		root.dataset.theme = theme;
	});
	const clear = () => {
		// 続けて切り替えたときは、あとの切り替えが付けたものを消さない
		if (run !== mine) return;
		delete root.dataset.themeTo;
		delete root.dataset.themeSwitching;
		root.style.removeProperty("--theme-origin-delay");
		root.style.removeProperty("--theme-origin-duration");
		if (lifted) lifted.style.viewTransitionName = "";
		lifted = null;
	};
	// 素早く続けて切り替えると、前の切り替えは打ち切られる。それは想定どおりなので、失敗として扱わない
	transition.ready.catch(() => {});
	transition.finished.then(clear, clear);
}

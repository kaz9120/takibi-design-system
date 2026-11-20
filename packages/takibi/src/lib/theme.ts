export type Theme = "dark" | "light";

/**
 * 夜と昼を切り替える。昼へは 0 時から 12 時、夜へは 12 時から 24 時の空の移り変わりを、720ms に縮めて通す（夜明けと日暮れ）。
 * 昼へは、夜の画面が薄明の青に明るみ、日の出の光の色をした新しい画面が下の端から上へ広がって、日中の色に落ち着く。
 * 夜へは、昼の画面が夕日の色に寄り、薄明の青をした新しい画面が上の端から下へ広がって、夜の色に沈む。
 *
 * コンポーネントはそれぞれ色の transition を持つので、ただ data-theme を変えると、コンポーネントごとに
 * 違う時刻で色が変わり、段になって見える。切り替えの間だけ transition を止めて一度に変え、
 * 対応するブラウザでは View Transitions で前の画面の上に新しい画面を広げる。向きは data-theme-to で CSS（motion.css）に伝える。
 */
export function setTheme(theme: Theme, root: HTMLElement = document.documentElement) {
	if (root.dataset.theme === theme) return;
	const apply = () => {
		root.dataset.themeSwitching = "";
		root.dataset.theme = theme;
		// 新しい色を一度描かせてから transition を戻す
		void root.offsetHeight;
		requestAnimationFrame(() => {
			delete root.dataset.themeSwitching;
		});
	};
	const first = root.dataset.theme === undefined;
	const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
	if (first || reduce || typeof document.startViewTransition !== "function") {
		apply();
		return;
	}
	root.dataset.themeTo = theme;
	const transition = document.startViewTransition(apply);
	const clear = () => {
		// 続けて切り替えたときは、あとの切り替えが付けた向きを消さない
		if (root.dataset.themeTo === theme) delete root.dataset.themeTo;
	};
	// 素早く続けて切り替えると、前の切り替えは打ち切られる。それは想定どおりなので、失敗として扱わない
	transition.ready.catch(() => {});
	transition.finished.then(clear, clear);
}

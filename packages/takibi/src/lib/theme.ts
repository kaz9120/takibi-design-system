export type Theme = "dark" | "light";

/**
 * 夜と昼を切り替える。画面全体を 1 回のクロスフェードで切り替える。
 *
 * コンポーネントはそれぞれ色の transition を持つので、ただ data-theme を変えると、コンポーネントごとに
 * 違う時刻で色が変わり、段になって見える。切り替えの間だけ transition を止めて一度に変え、
 * 対応するブラウザでは View Transitions で前後の画面を 360ms でクロスフェードさせる。
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
	const transition = document.startViewTransition(apply);
	// 素早く続けて切り替えると、前のクロスフェードは打ち切られる。それは想定どおりなので、失敗として扱わない
	transition.ready.catch(() => {});
	transition.finished.catch(() => {});
}

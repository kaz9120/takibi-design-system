/* ============================================================
   <takibi-fire> — 焚き火
   ------------------------------------------------------------
   使い方:
     import "takibi-design-system/fire";
     <takibi-fire></takibi-fire>

   属性:
     intensity  火の強さ（0〜1、既定 0.8）。炎と、炎が薪と地面を照らす光の濃さが変わる。薪と熾は変わらない

   親要素は position: relative にしておくこと。焚き火は正方形で、要素の下の中央に置かれる。

   何を映しているか:
   - 太い丸太 2 本を平行に置き、その間に割った薪を 2 段でくべたロングファイヤー型の焚き火を、
     薪の向きから 28 度横、12 度見下ろした位置から見たもの
   - 絵と動きは、焚き火の計算モデル（labs/fire3d）から書き出した。モデルは、気体の流れ、燃料のガス、酸素、温度、
     すすを 3 次元の格子で解き、炎の色をすすの温度から決める。薪と熾は立体の形として持つ
   - 実行時は計算しない。書き出した 4 つの層を重ねるだけにしている
     1. 下地: 熾の光だけで見た薪と地面（夜）。昼は、日中の光で見た薪と地面に替える
     2. 炎の光: 炎が薪と地面を照らした分だけの絵。炎の明るさに合わせて、濃さを毎コマ変える
     3. 炎と火の粉: 6 秒の動画。最後の 0.8 秒を先頭へ混ぜてあり、切れ目なく繰り返す
   - 2 は、黒い所を透明にした画像。3 の動画は、黒い所を透明に変えるフィルターを通して重ねる
   - 画面の外にある間は動画を止める。動きを減らす設定では、動画の代わりに止まった 1 枚を出す
   ============================================================ */

/** 動画の各コマでの炎の明るさ（30 コマ/秒、180 コマ、平均が 1）。炎の光の濃さを、これに合わせて変える */
const LUM = [
	1.084, 1.127, 1.077, 1.096, 1.136, 1.152, 1.123, 1.034, 0.984, 0.983, 1.041, 1.094, 1.115, 1.126, 1.097,
	1.052, 1.052, 1.047, 1.043, 1.051, 1.074, 1.088, 1.122, 1.113, 1.033, 0.944, 0.938, 0.956, 1.027, 1.04,
	1.077, 1.166, 1.23, 1.202, 1.143, 0.993, 0.814, 0.748, 0.687, 0.646, 0.557, 0.426, 0.364, 0.3, 0.26, 0.221,
	0.211, 0.229, 0.237, 0.229, 0.204, 0.179, 0.167, 0.168, 0.18, 0.196, 0.207, 0.214, 0.224, 0.238, 0.258,
	0.276, 0.285, 0.283, 0.296, 0.31, 0.351, 0.41, 0.501, 0.616, 0.747, 0.832, 0.896, 0.916, 0.864, 0.776,
	0.658, 0.538, 0.415, 0.383, 0.377, 0.396, 0.44, 0.453, 0.472, 0.52, 0.559, 0.605, 0.646, 0.661, 0.68, 0.697,
	0.71, 0.723, 0.748, 0.795, 0.847, 0.929, 1.055, 1.187, 1.357, 1.66, 2.058, 2.582, 2.95, 2.973, 2.661, 2.016,
	1.537, 1.148, 1.039, 0.993, 0.85, 0.785, 0.816, 0.884, 0.901, 0.95, 0.973, 1.006, 1.061, 1.071, 1.088,
	1.155, 1.192, 1.236, 1.321, 1.406, 1.439, 1.488, 1.524, 1.619, 1.856, 2.02, 2.193, 2.356, 2.626, 2.758,
	2.478, 2.21, 2.081, 2.074, 2.053, 1.918, 1.723, 1.341, 1.068, 0.879, 0.833, 0.799, 0.809, 0.828, 0.841,
	0.858, 0.913, 1.049, 1.201, 1.297, 1.345, 1.415, 1.461, 1.412, 1.253, 1.105, 1.013, 0.987, 0.92, 0.931,
	0.915, 0.87, 0.835, 0.772, 0.781, 0.776, 0.817, 0.875, 0.937, 0.984, 1.042, 1.079,
];
const FPS = 30;
const asset = (name) => new URL(`./fire/${name}`, import.meta.url).href;

class TakibiFire extends HTMLElement {
	static get observedAttributes() {
		return ["intensity"];
	}

	connectedCallback() {
		const root = this.shadowRoot ?? this.attachShadow({ mode: "open" });
		this._reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
		root.innerHTML = `
      <style>
        :host { position: absolute; inset: 0; display: block; pointer-events: none; }
        .scene { position: absolute; inset: 0; }
        .scene > img, .scene > video { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: contain; object-position: 50% 100%; }
        .day { opacity: 0; }
        .lit { opacity: calc(var(--lum, 1) * var(--level, 1) * 0.85); }
        .flame { opacity: var(--level, 1); }
        /* 動画は黒い所を透明にする。フィルターが効かないブラウザでも黒が残らないよう、明るい所だけを足す重ね方も指定する */
        video.flame { filter: url(#takibi-fire-alpha); mix-blend-mode: screen; }
        svg { position: absolute; width: 0; height: 0; }
        :host([data-day]) .night { opacity: 0; }
        :host([data-day]) .day { opacity: 1; }
        /* 昼は日の光のほうが強いので、炎が照らす分はほとんど見えない */
        :host([data-day]) .lit { opacity: calc(var(--lum, 1) * var(--level, 1) * 0.12); }
      </style>
      <svg aria-hidden="true"><filter id="takibi-fire-alpha" color-interpolation-filters="sRGB">
        <feColorMatrix type="matrix" values="1.25 0 0 0 0  0 1.25 0 0 0  0 0 1.25 0 0  1.5 1.2 0.6 0 0"/>
      </filter></svg>
      <div class="scene" aria-hidden="true">
        <img class="night" alt="" src="${asset("base-night.webp")}">
        <img class="day" alt="" src="${asset("base-day.webp")}">
        <img class="lit" alt="" src="${asset("lit.webp")}">
        ${
					this._reduce
						? `<img class="flame" alt="" src="${asset("flame-still.webp")}">`
						: `<video class="flame" muted loop playsinline preload="auto" poster="${asset("flame-still.webp")}" src="${asset("flame.mp4")}"></video>`
				}
      </div>
    `;
		this._scene = root.querySelector(".scene");
		this._video = root.querySelector("video");
		this._tick = this._tick.bind(this);
		this._level();
		// 昼と夜は、祖先の data-theme を見て決める
		this._theme = () =>
			this.toggleAttribute("data-day", this.closest("[data-theme]")?.getAttribute("data-theme") === "light");
		this._mo = new MutationObserver(this._theme);
		this._mo.observe(document.documentElement, {
			attributes: true,
			attributeFilter: ["data-theme"],
			subtree: true,
		});
		this._theme();
		if (!this._video) return;
		// 自動再生には muted を属性ではなくプロパティで立てる必要がある
		this._video.muted = true;
		this._io = new IntersectionObserver(([entry]) => {
			if (entry?.isIntersecting) {
				this._video.play().catch(() => {});
				if (!this._raf) this._raf = requestAnimationFrame(this._tick);
			} else {
				this._video.pause();
				cancelAnimationFrame(this._raf);
				this._raf = 0;
			}
		});
		this._io.observe(this);
	}

	disconnectedCallback() {
		cancelAnimationFrame(this._raf);
		this._raf = 0;
		this._io?.disconnect();
		this._mo?.disconnect();
		this._video?.pause();
	}

	attributeChangedCallback() {
		if (this._scene) this._level();
	}

	_level() {
		const v = parseFloat(this.getAttribute("intensity"));
		const intensity = Math.min(1, Math.max(0, Number.isFinite(v) ? v : 0.8));
		this._scene.style.setProperty("--level", String(Math.min(1, intensity / 0.8)));
	}

	/** 動画の今のコマの明るさを、炎の光の濃さに写す */
	_tick() {
		const i = Math.floor(this._video.currentTime * FPS) % LUM.length;
		// 明るさの振れ幅は 0.5〜1.4 倍に収める。実測のままだと、暗いコマで光がほぼ消える
		this._scene.style.setProperty("--lum", String(Math.min(1.4, Math.max(0.5, LUM[i] ?? 1))));
		this._raf = requestAnimationFrame(this._tick);
	}
}

if (!customElements.get("takibi-fire")) customElements.define("takibi-fire", TakibiFire);

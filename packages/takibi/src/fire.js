/* ============================================================
   <takibi-fire> — 焚き火
   ------------------------------------------------------------
   使い方:
     import "takibi-design-system/fire";
     <takibi-fire></takibi-fire>

   親要素は position: relative にしておくこと。焚き火は正方形で、要素の下の中央に置かれる。

   何を映しているか:
   - 太い丸太 2 本を平行に置き、その間に割った薪を 2 段でくべたロングファイヤー型の焚き火
   - 焚き火の計算モデル（src/fire/engine.js）を、その場で動かして描く。モデルは、気体の流れ、燃料のガス、酸素、温度、
     すすを 3 次元の格子で解き、炎の色をすすの温度から決める。薪と熾は立体の形として持つ
   - 時間が進むと薪が燃える。四つ割りの薪は、等倍（speed="1"）で約 13 分たつと中ほどで折れ、約 22 分で熾になる。
     薪が減ると、空いた場所へ新しい薪が 25cm 上から 0.3 秒で落ちてくる（feed="auto"）

   属性:
     intensity    火の強さ（0〜1、既定 0.8）。薪から出る燃料のガスの量が変わり、炎の高さと明るさが変わる
     speed        薪の燃え進みの速さ（0〜60、既定 1）。0 で薪が減らなくなる。炎の動きの速さは変わらない
     feed         "auto"（既定）で、折れていない薪が 3 本を切ると 1 本くべる。"manual" では stoke() を呼んだときだけくべる。
                  属性の名前を stoke にしないのは、React が同じ名前のメソッドを属性の値で上書きするため
     wind         薪の向きに沿った風（-1〜1、既定 0）。1 で毎秒 1.5m
     sparks       火の粉（"on" / "off"、既定 "on"）
     azimuth      薪の向きから横へ回った角度（度、既定 28）
     elevation    見下ろす角度（2〜80 度、既定 12）
     distance     焚き火の中心からの距離（0.8〜3 m、既定 1.5）
     exposure     明るさ（-2〜2 段、既定 0）
     interactive  付けると、クリックで薪をくべ、ドラッグで視点を回せる。付けないと、ポインターの操作を受けない
     render       "auto"（既定）は計算モデルで描く。"video" は書き出しておいた 6 秒の動画、"still" は止まった 1 枚を出す

   メソッド:
     stoke()      薪を 1 本くべる。置けたら true、置く場所がないか計算モデルが動いていなければ false
     tend()       折れた薪を中央へ寄せる。空気が入り、約 5 秒のあいだ火が強くなる
     blow(power)  息を吹く（power は 0〜1、既定 0.5）。約 5 秒のあいだ火が強くなり、熾から火の粉が飛ぶ

   プロパティ（読み取りだけ）:
     renderer     今の描き方。"webgl"（計算モデル）、"video"、"still"
     state        { logs: 折れていない薪の数, pieces: 折れた薪の数, embers: 熾の量（0〜1）, brightness: 炎の明るさ }

   イベント（親へは伝わらない。この要素に addEventListener する）:
     ready        描き方が決まった。detail.renderer
     stoke        薪をくべた。detail.auto が true なら、自動でくべた
     break        薪が折れた
     ember        薪が 1 本、熾になった
     low          くべた薪がすべて熾になった
     pop          はぜて火の粉が飛んだ。detail.count は飛んだ数（1〜4）

   周りの見た目に使える値:
     --takibi-fire-glow  炎の明るさ（平均が 1、0〜2.5）を、CSS 変数として 0.1 秒おきに書く。
                         書く先はこの要素。glow-target 属性に CSS セレクターを書くと、その要素に書く（"parent" なら親要素）。
                         書いた要素の中は 0.1 秒おきにスタイルが計算し直されるので、光らせたい範囲だけを囲む要素を選ぶ

   負荷:
   - 計算と描画は GPU（WebGL2）で行い、毎秒 30 コマで描く。描く大きさは 1 辺 640 画素まで
   - 画面の外にある間と、タブが隠れている間は、計算ごと止める
   - 始めに 1 回、流れの計算 1 回にかかる GPU の時間を測る。そこから見積もった 1 コマの時間が 14ms（1 コマ 33ms の 4 割）に
     収まるよう、画素数と炎の刻みを 2 段まで下げて始める。いちばん下の段でも収まらなければ、動画にする
   - 動かしている間に描くのが追いつかなくなったとき（描く間隔の平均が 3 秒続けて 45ms を超える）も、1 段ずつ下げ、
     下げきっていたら動画に替える
   - WebGL2 が使えない、準備に失敗した、コンテキストが失われた、のときも動画に替える
   - 動きを減らす設定では、止まった 1 枚を出す。計算モデルは動かさない
   ============================================================ */

/** 動画の各コマでの炎の明るさ（30 コマ/秒、180 コマ、平均が 1）。動画で出すときに、炎の光の濃さをこれに合わせて変える */
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
/** 描く大きさの上限（1 辺の画素数） */
const MAX_PX = 640;
/** 炎の明るさ（計算モデルの値）の、ふつうに燃えているときの平均。--takibi-fire-glow を 1 前後にするために割る */
const MEAN_LUM = 0.13;
/**
 * 重さの段。px は画素数の比、steps は炎を視線に沿って刻む数、vol は炎を描く 1 辺の上限（画素）。
 * cost は、1 コマの GPU の時間が、流れの計算 1 回の何倍かの見積もり（流れ 2 回 + 描画。Apple M4 Pro で測った比）。
 * 最初の段は、書き出した動画と同じ（刻み 64、炎は 520 画素）
 */
const LEVELS = [
	{ px: 1, steps: 64, vol: 520, cost: 5 },
	{ px: 0.8, steps: 48, vol: 384, cost: 3.8 },
	{ px: 0.62, steps: 40, vol: 256, cost: 3 },
];
/** 1 コマに使ってよい GPU の時間（ms）。毎秒 30 コマの 1 コマ（33ms）の 4 割 */
const GPU_BUDGET_MS = 14;
/** 書き出した素材と同じ収め方: 800 × 600 の画面から、中心を右へ 10、下へ 20 ずらした 520 × 520 を切り出す */
const VIEW = { zoom: 600 / 520, center: [10 / 520, -20 / 520], fit: false };
/**
 * 始めの薪の燃え進み（下の段 2 本、上の段 2 本）。書き出した絵（0.76、0.66）に近い、火が回った状態から始める。
 * 0.8 で折れるので、等倍では 1 分後、2 分 20 秒後、5 分後、8 分 20 秒後に 1 本ずつ折れる
 */
const START_BURN = [0.74, 0.66, 0.5, 0.3];
const asset = (name) => new URL(`./fire/${name}`, import.meta.url).href;
const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

class TakibiFire extends HTMLElement {
	static get observedAttributes() {
		return [
			"intensity",
			"speed",
			"feed",
			"wind",
			"sparks",
			"azimuth",
			"elevation",
			"distance",
			"exposure",
			"interactive",
			"render",
			"glow-target",
		];
	}

	constructor() {
		super();
		this._renderer = "still";
		this._engine = null;
		this._raf = 0;
		this._visible = false;
		this._level = 0;
		this._day = 0;
		this._glow = 1;
		// 視点。属性の値へ、0.15 秒ほどで近づく。ドラッグで動かした分は、属性が変わるまで残る
		this._cam = null;
		this._camGoal = null;
	}

	connectedCallback() {
		const root = this.shadowRoot ?? this.attachShadow({ mode: "open" });
		this._reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
		// 計算モデルで描くつもりなら、最初の描画の前に「準備中」にしておく。あとから付けると、書き出した炎が一度見えてから消える
		this.toggleAttribute("data-pending", !this._reduce && (this.getAttribute("render") ?? "auto") === "auto");
		root.innerHTML = `
      <style>
        :host { position: absolute; inset: 0; display: block; pointer-events: none; }
        /* 正方形の舞台を、要素の下の中央に置く。1 辺は要素の幅と高さの小さいほう（--side は JS が書く） */
        .stage { position: absolute; bottom: 0; left: calc(50% - var(--side, 0px) / 2); width: var(--side, 0px); height: var(--side, 0px); }
        .stage > *, .baked > * { position: absolute; inset: 0; width: 100%; height: 100%; }
        /* 計算モデルの絵は 600ms で現れる。書き出した絵は、その間は下に残し、現れきってから 200ms で消す（途中で地面が透けない） */
        canvas { opacity: 0; transition: opacity 600ms linear; }
        .baked { transition: opacity 200ms linear; }
        :host([data-renderer="webgl"]) canvas { opacity: 1; }
        :host([data-renderer="webgl"]) .baked { opacity: 0; transition-delay: 600ms; }
        :host([interactive][data-renderer="webgl"]) .stage { pointer-events: auto; cursor: grab; touch-action: none; }
        :host([interactive][data-renderer="webgl"]) .stage:active { cursor: grabbing; }
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
        /* 計算モデルの準備を待つ間は、炎を出さず、薪と熾だけを見せる。準備ができると、小さい炎から育つ */
        :host([data-pending]) .flame { opacity: 0; }
        :host([data-pending]) .lit { opacity: calc(var(--level, 1) * 0.25); }
        :host([data-day][data-pending]) .lit { opacity: calc(var(--level, 1) * 0.04); }
        .flame, .lit { transition: opacity 600ms linear; }
      </style>
      <svg aria-hidden="true"><filter id="takibi-fire-alpha" color-interpolation-filters="sRGB">
        <feColorMatrix type="matrix" values="1.25 0 0 0 0  0 1.25 0 0 0  0 0 1.25 0 0  1.5 1.2 0.6 0 0"/>
      </filter></svg>
      <div class="stage" aria-hidden="true">
        <div class="baked">
          <img class="night" alt="" src="${asset("base-night.webp")}">
          <img class="day" alt="" src="${asset("base-day.webp")}">
          <img class="lit" alt="" src="${asset("lit.webp")}">
          <img class="flame" alt="" src="${asset("flame-still.webp")}">
        </div>
        <canvas></canvas>
      </div>
    `;
		this._stage = root.querySelector(".stage");
		this._baked = root.querySelector(".baked");
		this._canvas = root.querySelector("canvas");
		this._frame = this._frame.bind(this);
		this._videoTick = this._videoTick.bind(this);
		this._setRenderer("still", false);
		this._applyLevel();

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
		this._day = this.hasAttribute("data-day") ? 1 : 0;

		this._ro = new ResizeObserver(() => this._resize());
		this._ro.observe(this);
		this._resize();
		this._io = new IntersectionObserver(([entry]) => {
			this._visible = entry?.isIntersecting ?? true;
			this._sync();
		});
		this._io.observe(this);
		this._onVisibility = () => this._sync();
		document.addEventListener("visibilitychange", this._onVisibility);
		this._bindPointer();

		this._connected = true;
		this._start();
	}

	disconnectedCallback() {
		this._connected = false;
		cancelAnimationFrame(this._raf);
		this._raf = 0;
		this._io?.disconnect();
		this._mo?.disconnect();
		this._ro?.disconnect();
		document.removeEventListener("visibilitychange", this._onVisibility);
		this._video?.pause();
		this._engine?.dispose();
		this._engine = null;
		this._glowEl?.style.removeProperty("--takibi-fire-glow");
		this._glowEl = null;
	}

	attributeChangedCallback(name) {
		if (!this._stage) return;
		if (name === "render") {
			if (this._connected) this._start();
			return;
		}
		if (name === "glow-target") {
			this._glowEl?.style.removeProperty("--takibi-fire-glow");
			this._glowEl = null;
			return;
		}
		if (name === "azimuth" || name === "elevation" || name === "distance") this._camGoal = this._camAttr();
		this._applyLevel();
		this._applyParams();
	}

	// ---------- 外から使うもの ----------

	get renderer() {
		return this._renderer;
	}

	get state() {
		const e = this._engine;
		if (!e || this._renderer !== "webgl") return { logs: 4, pieces: 0, embers: 0.6, brightness: this._glow };
		const split = e.logs.filter((l) => l.type !== 0);
		return {
			logs: split.filter((l) => !l.broken).length,
			pieces: split.filter((l) => l.broken).length,
			embers: e.fire.bed,
			brightness: this._glow,
		};
	}

	stoke() {
		return this._renderer === "webgl" && this._engine ? this._engine.stoke(false) : false;
	}

	tend() {
		if (this._renderer === "webgl") this._engine?.tend();
	}

	blow(power = 0.5) {
		if (this._renderer === "webgl") this._engine?.blow(power);
	}

	// ---------- 属性の読み取り ----------

	/** 炎の明るさを書く先。glow-target がなければ自分、"parent" なら親、ほかは同じ文書（か同じ shadow root）の中で探す */
	_writeGlow(value) {
		if (!this._glowEl) {
			const sel = this.getAttribute("glow-target");
			let el = this;
			if (sel === "parent") el = this.parentElement ?? this;
			else if (sel) {
				try {
					el = this.getRootNode().querySelector(sel) ?? this;
				} catch {
					el = this;
				}
			}
			this._glowEl = el;
		}
		this._glowEl.style.setProperty("--takibi-fire-glow", value.toFixed(2));
	}

	_number(name, fallback, lo, hi) {
		const v = parseFloat(this.getAttribute(name));
		return clamp(Number.isFinite(v) ? v : fallback, lo, hi);
	}

	_camAttr() {
		return {
			az: this._number("azimuth", 28, -3600, 3600),
			el: this._number("elevation", 12, 2, 80),
			dist: this._number("distance", 1.5, 0.8, 3),
		};
	}

	/** 動画と止まった絵の濃さ。計算モデルで描くときは使わない */
	_applyLevel() {
		this._stage.style.setProperty("--level", String(Math.min(1, this._number("intensity", 0.8, 0, 1) / 0.8)));
	}

	_applyParams() {
		const e = this._engine;
		if (!e) return;
		e.params.intensity = this._number("intensity", 0.8, 0, 1);
		e.params.speed = this._number("speed", 1, 0, 60);
		e.params.wind = this._number("wind", 0, -1, 1) * 1.5;
		e.params.sparks = this.getAttribute("sparks") !== "off";
		e.params.exposure = this._number("exposure", 0, -2, 2);
	}

	// ---------- 描き方を決める ----------

	_setRenderer(renderer, notify = true) {
		const changed = this._renderer !== renderer;
		this._renderer = renderer;
		this.setAttribute("data-renderer", renderer);
		if (notify && changed) this._emit("ready", { renderer });
	}

	_emit(type, detail = {}) {
		this.dispatchEvent(new CustomEvent(type, { detail }));
	}

	async _start() {
		const want = this.getAttribute("render") ?? "auto";
		// 待っている間に render が変わったり、要素が外されたりしたら、古い準備は捨てる
		this._run = (this._run ?? 0) + 1;
		const run = this._run;
		if (this._reduce || want === "still") {
			this._stopEngine();
			this._useStill();
			return;
		}
		if (want === "video") {
			this._stopEngine();
			this._useVideo();
			return;
		}
		if (this._engine) return;
		this.toggleAttribute("data-pending", true);
		try {
			const { createFireEngine } = await import("./fire/engine.js");
			if (run !== this._run || !this._connected) return;
			// エンジンを手放したキャンバスは、コンテキストが失われたままで使い回せない。始めるたびに新しい要素に替える
			const canvas = document.createElement("canvas");
			this._canvas.replaceWith(canvas);
			this._canvas = canvas;
			const engine = createFireEngine(this._canvas, {
				view: VIEW,
				params: {
					mask: true,
					steps: LEVELS[0].steps,
					rebuildFrames: 6,
					day: this._day,
				},
				onEvent: (type, detail) => this._emit(type, detail),
			});
			// コンテキストが失われたら動画に替える。自分で手放したとき（dispose）にも同じイベントが来るので、使っている最中だけ見る
			this._canvas.addEventListener("webglcontextlost", () => {
				if (this._engine === engine) this._fallback();
			});
			await engine.ready;
			if (run !== this._run || !this._connected) {
				engine.dispose();
				return;
			}
			// 始めの状態: 火が回って、下の段から順に炭になっている
			let k = 0;
			for (const l of engine.logs) l.burn = l.type === 0 ? 0.5 : (START_BURN[k++] ?? 0.1);
			engine.fire.bed = 0.6;
			engine.uploadLogs();
			this._engine = engine;
			this._cam = this._camAttr();
			this._camGoal = { ...this._cam };
			this._applyParams();
			this._resize();
			this._warm = 0;
			this._sync();
		} catch (error) {
			if (run === this._run) this._fallback(error);
		}
	}

	_stopEngine() {
		this._engine?.dispose();
		this._engine = null;
		cancelAnimationFrame(this._raf);
		this._raf = 0;
	}

	/** 計算モデルで描けないとき: 動画に替える */
	_fallback() {
		this._stopEngine();
		if (!this._connected) return;
		this._useVideo();
	}

	_useStill() {
		this.removeAttribute("data-pending");
		this._video?.pause();
		const flame = this._baked.querySelector(".flame");
		if (flame.tagName === "VIDEO") {
			const img = document.createElement("img");
			img.className = "flame";
			img.alt = "";
			img.src = asset("flame-still.webp");
			flame.replaceWith(img);
			this._video = null;
		}
		this._stage.style.setProperty("--lum", "1");
		this._renderer = "";
		this._setRenderer("still");
	}

	_useVideo() {
		this.removeAttribute("data-pending");
		if (!this._video) {
			const video = document.createElement("video");
			video.className = "flame";
			video.loop = true;
			video.playsInline = true;
			video.preload = "auto";
			video.poster = asset("flame-still.webp");
			video.src = asset("flame.mp4");
			// 自動再生には muted を属性ではなくプロパティで立てる必要がある
			video.muted = true;
			this._baked.querySelector(".flame").replaceWith(video);
			this._video = video;
		}
		this._setRenderer("video");
		this._sync();
	}

	// ---------- 動かす・止める ----------

	_resize() {
		const side = Math.min(this.clientWidth, this.clientHeight);
		this._stage.style.setProperty("--side", `${side}px`);
		if (!this._engine || !side) return;
		const px = Math.min(side * Math.min(window.devicePixelRatio || 1, 2), MAX_PX) * LEVELS[this._level].px;
		this._engine.params.steps = LEVELS[this._level].steps;
		this._engine.params.volScale = Math.min(1, LEVELS[this._level].vol / px);
		this._engine.resize(px, px);
	}

	/** 見えている間だけ動かす */
	_sync() {
		const on = this._visible && !document.hidden;
		cancelAnimationFrame(this._raf);
		this._raf = 0;
		if (this._engine) {
			if (on) {
				this._last = 0;
				this._slowSince = 0;
				this._raf = requestAnimationFrame(this._frame);
			}
			return;
		}
		if (this._video) {
			if (on) {
				this._video.play().catch(() => {});
				this._raf = requestAnimationFrame(this._videoTick);
			} else this._video.pause();
		}
	}

	_frame(t) {
		this._raf = requestAnimationFrame(this._frame);
		const e = this._engine;
		if (!e) return;
		// 毎秒 30 コマ。画面の書き換えが 60Hz でも 120Hz でも、33ms たつまでは描かない
		const gap = t - (this._last || t - 1000 / FPS);
		if (this._last && gap < 1000 / FPS - 4) return;
		this._last = t;
		const dt = Math.min(0.05, gap / 1000);

		// 始めの 1 秒: 画面には出さずに流れだけを進め、炎を育ててから見せる
		if (this._warm < 30) {
			// 10 コマ目に 1 回だけ GPU の速さを測り、1 コマが予算に収まる段から始める。収まる段がなければ動画にする
			if (this._warm === 10) {
				const ms = e.bench(5);
				const level = LEVELS.findIndex((l) => ms * l.cost <= GPU_BUDGET_MS);
				if (level < 0) {
					this._fallback();
					return;
				}
				if (level !== this._level) {
					this._level = level;
					this._resize();
				}
			} else e.warm(5);
			if (++this._warm === 30) {
				this.removeAttribute("data-pending");
				this._setRenderer("webgl");
			}
		}

		// 昼と夜は 0.7 秒で入れ替える
		const day = this.hasAttribute("data-day") ? 1 : 0;
		this._day += clamp(day - this._day, -dt / 0.7, dt / 0.7);
		e.params.day = this._day;

		// 視点は、目標へ 0.15 秒ほどで近づく。動いている間は、薪と地面を粗く描く
		const c = this._cam;
		const g = this._camGoal;
		const k = 1 - Math.exp(-dt / 0.15);
		let moving = this._dragging;
		for (const key of ["az", "el", "dist"]) {
			const d = g[key] - c[key];
			if (Math.abs(d) > (key === "dist" ? 0.001 : 0.02)) {
				c[key] += d * k;
				moving = true;
			} else c[key] = g[key];
			e.cam[key] = c[key];
		}
		e.moving = moving;

		// 薪を自動でくべる: 折れていない薪が 3 本を切ったら、4 秒以上あけて 1 本置く
		if (this.getAttribute("feed") !== "manual" && e.params.speed > 0 && t - (this._stoked ?? -1e9) > 4000) {
			const whole = e.logs.filter((l) => l.type !== 0 && !l.broken).length;
			if (whole < 3 && e.stoke(true)) this._stoked = t;
		}

		e.render(t);

		// 炎の明るさを、周りの見た目に使える値として書く（0.1 秒おき）
		this._glow += (clamp(e.light.lum / MEAN_LUM, 0, 2.5) - this._glow) * 0.35;
		if (t - (this._glowAt ?? 0) > 100) {
			this._glowAt = t;
			this._writeGlow(this._glow);
		}

		// 描くのが追いつかないとき: 描く間隔の平均が 3 秒続けて 45ms を超えたら 1 段下げ、下げきっていたら動画に替える
		this._gap = (this._gap ?? 1000 / FPS) * 0.9 + gap * 0.1;
		if (this._gap > 45 && this._warm >= 30) {
			if (!this._slowSince) this._slowSince = t;
			else if (t - this._slowSince > 3000) {
				this._slowSince = 0;
				this._gap = 1000 / FPS;
				if (this._level < LEVELS.length - 1) {
					this._level++;
					this._resize();
				} else this._fallback();
			}
		} else this._slowSince = 0;
	}

	/** 動画の今のコマの明るさを、炎の光の濃さに写す */
	_videoTick(t) {
		this._raf = requestAnimationFrame(this._videoTick);
		if (!this._video) return;
		const i = Math.floor(this._video.currentTime * FPS) % LUM.length;
		const lum = LUM[i] ?? 1;
		// 明るさの振れ幅は 0.5〜1.4 倍に収める。実測のままだと、暗いコマで光がほぼ消える
		this._stage.style.setProperty("--lum", String(clamp(lum, 0.5, 1.4)));
		this._glow = lum;
		if (t - (this._glowAt ?? 0) > 100) {
			this._glowAt = t;
			this._writeGlow(lum);
		}
	}

	// ---------- ポインターの操作（interactive のときだけ届く） ----------

	_bindPointer() {
		let start = null;
		let moved = 0;
		const stage = this._stage;
		stage.addEventListener("pointerdown", (ev) => {
			if (!this._camGoal) return;
			stage.setPointerCapture(ev.pointerId);
			start = [ev.clientX, ev.clientY];
			moved = 0;
		});
		stage.addEventListener("pointermove", (ev) => {
			if (!start || !this._camGoal) return;
			const dx = ev.clientX - start[0];
			const dy = ev.clientY - start[1];
			start = [ev.clientX, ev.clientY];
			moved += Math.abs(dx) + Math.abs(dy);
			if (moved < 6) return;
			// 6px 以上動いたらドラッグ。1px で横へ 0.35 度、縦へ 0.25 度回す
			this._dragging = true;
			this._camGoal.az -= dx * 0.35;
			this._camGoal.el = clamp(this._camGoal.el + dy * 0.25, 2, 80);
		});
		const lift = (ev) => {
			if (!start) return;
			start = null;
			this._dragging = false;
			// 動かさずに離したら、薪を 1 本くべる
			if (ev.type === "pointerup" && moved < 6) this.stoke();
		};
		stage.addEventListener("pointerup", lift);
		stage.addEventListener("pointercancel", lift);
	}
}

if (!customElements.get("takibi-fire")) customElements.define("takibi-fire", TakibiFire);

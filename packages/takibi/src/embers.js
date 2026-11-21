/* ============================================================
   <takibi-embers> — 火の粉の背景
   ------------------------------------------------------------
   使い方:
     import "takibi-design-system/embers";
     <takibi-embers density="45"></takibi-embers>

   属性:
     density  火の粉の多さ（既定 45）。はぜる回数が増える。45 のとき、平均 0.4 秒に 1 回、1〜4 個が飛び、画面には 2〜10 個が見える
     wind     横方向の風（-1〜1、既定 0）。1 で毎秒 0.6m
     glow     下の端の淡い光（"on" / "off"、既定 "on"）

   親要素は position: relative にしておくこと。背景として置く（pointer-events なし）。

   動き方は、焚き火の計算モデル（labs/fire3d）の火の粉と同じ式にしている。火は要素の下の端の外にあるとする。
   - 要素の高さを 1.8m として、実寸で計算する
   - はぜる: 次に飛ぶまでの時間は指数分布から引く。1 回に 1〜4 個が、同じ場所からばらばらの向きへ飛び出す
   - 空気の抵抗: 飛び出した速さは、0.12 秒（大きい粒は 0.18 秒）ごとに約 1/3 になり、周りの気流の速さに近づく
   - 気流: はぜた場所の真上ほど速く昇る（下の端で毎秒 1.5m）。昇るほど遅く、広くなる。細かい乱れで左右に揺れる
   - 冷える: 粒の温度は 1500K 前後から 760K へ、1.3〜3.9 秒ごとに約 1/3 ずつ近づく。色と明るさは温度から黒体放射の式で決める。
     画面の明るさは、放射の強さの平方根にする。放射の強さが 1% を切ると消える。小さい粒は 0.8 秒、大きい粒は 2.4 秒ほどで消え、その間に 0.5〜1.3m 昇る。
     計算モデルの火の粉（0.3〜0.8 秒で消える）より長いのは、背景として高い所まで見せるために、冷える速さを約 3 分の 1 にしたため
   - 軌跡: 1/30 秒ぶんの動きを線で描く。速い粒ほど長い線になる。夜は、線の 4 倍の太さのにじみを重ねる
   - 昼（祖先の data-theme="light"）は、日の光で火の粉が見えにくいので、暗く濃い色で小さく描く
   - 画面の外にある間は止める。動きを減らす設定では描かない
   ============================================================ */

const HEIGHT_M = 1.8;
/** 黒体放射（610、550、465nm）。1500K の赤を 1 とする */
function planck(T) {
	const ref = 1 / (Math.exp(0.0143877 / (610e-9 * 1500)) - 1);
	return [610e-9, 550e-9, 465e-9].map((l) => 1 / ((l / 610e-9) ** 5 * (Math.exp(0.0143877 / (l * T)) - 1)) / ref);
}
/** 気流の細かい乱れ。場所と時刻で決まる -1〜1 の値 */
const gust = (x, y, t, seed) => Math.sin(x * 5.1 + t * 1.7 + seed) * 0.6 + Math.sin(y * 7.3 - t * 2.9 + seed * 2.1) * 0.4;

// サーバー（SSR や prerender）で読み込まれても落ちないよう、HTMLElement がない所では空のクラスを継ぎ、登録もしない
const Base = typeof HTMLElement === "undefined" ? class {} : HTMLElement;

class TakibiEmbers extends Base {
	constructor() {
		super();
		this._raf = 0;
		this._sparks = [];
		this._last = 0;
		this._time = 0;
		this._next = 0.4;
		this._visible = true;
	}

	connectedCallback() {
		const root = this.shadowRoot ?? this.attachShadow({ mode: "open" });
		root.innerHTML = `
      <style>
        :host { position: absolute; inset: 0; display: block; pointer-events: none; overflow: hidden; }
        canvas { position: absolute; inset: 0; width: 100%; height: 100%; }
        .glow {
          position: absolute; left: 0; right: 0; bottom: -40%; height: 80%;
          background: radial-gradient(
            ellipse at 50% 100%,
            color-mix(in oklab, var(--color-heat-ember, #f47d3a) 22%, transparent) 0%,
            color-mix(in oklab, var(--color-heat-coal, #c64414) 12%, transparent) 30%,
            transparent 65%
          );
          filter: blur(20px);
        }
        :host([glow="off"]) .glow { display: none; }
      </style>
      <div class="glow"></div>
      <canvas></canvas>
    `;
		this._canvas = root.querySelector("canvas");
		this._ctx = this._canvas.getContext("2d");
		if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
		this._tick = this._tick.bind(this);
		this._ro = new ResizeObserver(() => this._resize());
		this._ro.observe(this);
		this._resize();
		this._io = new IntersectionObserver(([entry]) => {
			this._visible = entry?.isIntersecting ?? true;
			if (this._visible && !this._raf) {
				this._last = 0;
				this._raf = requestAnimationFrame(this._tick);
			}
		});
		this._io.observe(this);
	}

	disconnectedCallback() {
		cancelAnimationFrame(this._raf);
		this._raf = 0;
		this._ro?.disconnect();
		this._io?.disconnect();
	}

	_resize() {
		const dpr = Math.min(window.devicePixelRatio || 1, 2);
		this._w = this.clientWidth;
		this._h = this.clientHeight;
		this._canvas.width = this._w * dpr;
		this._canvas.height = this._h * dpr;
		this._ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
	}

	_number(name, fallback, min, max) {
		const v = parseFloat(this.getAttribute(name));
		return Math.min(max, Math.max(min, Number.isFinite(v) ? v : fallback));
	}

	/** 1 か所がはぜて、count 個の火の粉が飛び出す。位置と速さの単位はメートル */
	_pop(count, widthM) {
		const x = (Math.random() - 0.5) * widthM * 0.5;
		for (let i = 0; i < count; i++) {
			const angle = (Math.random() - 0.5) * 1.9;
			const speed = 0.6 + Math.random() * 1.6;
			const mass = 0.5 + Math.random();
			this._sparks.push({
				x0: x,
				x: x + (Math.random() - 0.5) * 0.05,
				y: -0.05,
				vx: Math.sin(angle) * speed,
				vy: Math.cos(angle) * speed + 0.8,
				T: 1380 + Math.random() * 240,
				mass,
				seed: Math.random() * 40,
			});
		}
	}

	_tick(t) {
		const dt = Math.min(0.05, (t - this._last) / 1000 || 0.016);
		this._last = t;
		this._time += dt;
		const ctx = this._ctx;
		const w = this._w;
		const h = this._h;
		if (w && h) {
			const scale = h / HEIGHT_M; // 1m が何 px か
			const widthM = w / scale;
			const wind = this._number("wind", 0, -1, 1) * 0.6;
			const density = this._number("density", 45, 0, 300);
			const light = this.closest("[data-theme]")?.getAttribute("data-theme") === "light";
			// はぜる: 次までの時間は指数分布
			this._next -= dt;
			if (this._next <= 0 && density > 0) {
				this._pop(1 + Math.floor(Math.random() ** 2 * 4), widthM);
				this._next = -Math.log(1 - Math.random()) * (18 / density);
			}
			ctx.clearRect(0, 0, w, h);
			ctx.globalCompositeOperation = light ? "source-over" : "lighter";
			ctx.lineCap = "round";
			for (let i = this._sparks.length - 1; i >= 0; i--) {
				const s = this._sparks[i];
				// 気流: はぜた場所の真上ほど速く、昇るほど遅く広くなる
				const spread = 0.25 + s.y * 0.35;
				const core = Math.exp(-(((s.x - s.x0) / spread) ** 2));
				const gx = wind + gust(s.x, s.y, this._time, s.seed) * 0.35;
				const gy = (1.5 * core) / (1 + s.y * 1.2) + 0.15;
				// 空気の抵抗で、気流の速さに近づく。重さの分だけ落ちる
				const k = 1 - Math.exp(-dt / (0.12 * s.mass));
				s.vx += (gx - s.vx) * k;
				s.vy += (gy - s.vy) * k - 1.2 * s.mass * dt;
				s.x += s.vx * dt;
				s.y += s.vy * dt;
				// 冷える
				s.T = 760 + (s.T - 760) * Math.exp(-dt / (2.6 * s.mass));
				const [r, g, b] = planck(s.T);
				if (r < 0.01 || s.y > HEIGHT_M + 0.1 || s.y < -0.2) {
					this._sparks.splice(i, 1);
					continue;
				}
				const px = w / 2 + s.x * scale;
				const py = h - s.y * scale;
				// 1/30 秒ぶんの軌跡
				const tx = px - (s.vx * scale) / 30;
				const ty = py + (s.vy * scale) / 30;
				// 明るさを 0〜1 に収める。強い光は白へ寄る
				// 目は暗い光ほど敏感なので、放射の強さの平方根を見た目の明るさにする
				const gain = Math.sqrt(r) / r;
				const tone = (v) => Math.round(255 * (1 - Math.exp(-v * gain * 2.4)));
				const alpha = Math.min(1, Math.sqrt(r) * 2.2);
				ctx.strokeStyle = light
					? `rgba(${Math.round(tone(r) * 0.75)},${Math.round(tone(g) * 0.45)},${Math.round(tone(b) * 0.2)},${alpha * 0.8})`
					: `rgba(${tone(r)},${tone(g)},${tone(b)},${alpha})`;
				const width = (light ? 1 : 1.3) * (0.7 + 0.5 * s.mass);
				ctx.beginPath();
				ctx.moveTo(tx, ty);
				ctx.lineTo(px, py);
				if (!light) {
					// 粒の周りのにじみ。線の 4 倍の太さで、濃さは 6 分の 1
					ctx.globalAlpha = 1 / 6;
					ctx.lineWidth = width * 4;
					ctx.stroke();
					ctx.globalAlpha = 1;
				}
				ctx.lineWidth = width;
				ctx.stroke();
			}
			ctx.globalCompositeOperation = "source-over";
		}
		this._raf = this._visible ? requestAnimationFrame(this._tick) : 0;
	}
}

if (typeof customElements !== "undefined" && !customElements.get("takibi-embers")) customElements.define("takibi-embers", TakibiEmbers);

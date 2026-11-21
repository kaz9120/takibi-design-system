/* ============================================================
   <takibi-stars> — 星空の背景
   ------------------------------------------------------------
   使い方:
     import "takibi-design-system/stars";
     <takibi-stars></takibi-stars>

   属性:
     hour      見上げる時刻（0〜24、既定 21）。"now" にすると今の時刻に合わせ、1 分ごとに描き直す
     azimuth   向く方角（度。北が 0、東が 90、既定 180 = 南）
     altitude  見上げる角度（度、既定 40）

   親要素は position: relative にしておくこと。背景として置く（pointer-events なし）。

   - 星の位置、明るさ、色は、実在の星のカタログ（5.0 等より明るい 1637 個）から計算する
   - 星のデータ（src/stars-data.js）は HYG Database v4.4（David Nash、CC BY-SA 4.0）から抜き出したもので、
     このファイル（MIT）とはライセンスが違う。出典と改変の内容は stars-data.js の先頭にある
   - 場所と日付は src/lib/daylight.ts と同じ（北緯 36.4 度、秋分の日）。秋分の日は、時刻がそのまま地方恒星時になる
   - 横の画角は 90 度（縦長の要素では縦が 90 度）。地平線より下の星は描かない。地平線に近い星は、大気の厚みの分だけ暗くする
   - 星は動かない。またたきもない。Canvas に 1 回描くだけで、描き直すのは大きさか属性が変わったときだけ
   - 夜のテーマでだけ見える。薄明（--sky-phase が 0 より大きい間）は、その分だけ薄くなる。昼のテーマでは消える
   ============================================================ */

import { STARS } from "./stars-data.js";

/**
 * 星のデータの出典とライセンス。CC BY-SA 4.0 は、データを配るときにこの表示を求める。
 * stars-data.js の先頭の注記はバンドラーが消すことがあるので、消えない文字列としても持つ。
 * アプリのクレジットに出すときは customElements.get("takibi-stars").credit で取り出す。
 */
const CREDIT =
	"Star data: adapted from the HYG Database v4.4 by David Nash (https://codeberg.org/astronexus/hyg), licensed under CC BY-SA 4.0 (https://creativecommons.org/licenses/by-sa/4.0/). Changes: filtered to 1637 stars brighter than magnitude 5.0, reduced to 4 columns, values rounded.";

const RAD = Math.PI / 180;
const LATITUDE = 36.4;
const FOV = 90;

/** 色指数 B−V から星の色（0〜255 の RGB）。青白い星から赤い星までを、白に寄せて薄く色づける */
function starColor(bv) {
	const t = Math.min(1, Math.max(0, (bv + 0.3) / 2.1));
	// 青白（-0.3）→ 白（0.6 前後）→ 橙（1.8）
	const r = 200 + 55 * Math.min(1, t * 2.2);
	const g = 215 + 30 * (1 - Math.abs(t - 0.4) * 1.6);
	const b = 255 - 110 * Math.max(0, t - 0.3) * 1.4;
	return [Math.round(r), Math.round(Math.min(255, g)), Math.round(Math.max(120, b))];
}

// サーバー（SSR や prerender）で読み込まれても落ちないよう、HTMLElement がない所では空のクラスを継ぎ、登録もしない
const Base = typeof HTMLElement === "undefined" ? class {} : HTMLElement;

class TakibiStars extends Base {
	/** 星のデータの出典とライセンスの表示 */
	static credit = CREDIT;

	static get observedAttributes() {
		return ["hour", "azimuth", "altitude"];
	}

	connectedCallback() {
		const root = this.shadowRoot ?? this.attachShadow({ mode: "open" });
		root.innerHTML = `
      <style>
        :host {
          position: absolute; inset: 0; display: block; pointer-events: none; overflow: hidden;
          opacity: calc((1 - var(--sky-phase, 0)) * var(--takibi-stars-night, 1));
          transition: opacity 720ms linear;
        }
        canvas { position: absolute; inset: 0; width: 100%; height: 100%; }
      </style>
      <canvas></canvas>
    `;
		// 配られたページからも出典をたどれるよう、要素に属性として残す
		this.setAttribute("data-credit", CREDIT);
		this._canvas = root.querySelector("canvas");
		this._ctx = this._canvas.getContext("2d");
		this._ro = new ResizeObserver(() => this._draw());
		this._ro.observe(this);
		// 夜のテーマでだけ見せる。いちばん近い data-theme を見張る
		this._themed = this.closest("[data-theme]") ?? document.documentElement;
		this._mo = new MutationObserver(() => this._syncTheme());
		this._mo.observe(this._themed, { attributes: true, attributeFilter: ["data-theme"] });
		this._syncTheme();
		this._syncTimer();
		this._draw();
	}

	disconnectedCallback() {
		this._ro?.disconnect();
		this._mo?.disconnect();
		clearInterval(this._timer);
		this._timer = 0;
	}

	attributeChangedCallback() {
		if (!this._ctx) return;
		this._syncTimer();
		this._draw();
	}

	_syncTheme() {
		const light = this._themed.getAttribute("data-theme") === "light";
		this.style.setProperty("--takibi-stars-night", light ? "0" : "1");
	}

	_syncTimer() {
		clearInterval(this._timer);
		this._timer = this.getAttribute("hour") === "now" ? setInterval(() => this._draw(), 60_000) : 0;
	}

	_number(name, fallback) {
		const v = parseFloat(this.getAttribute(name));
		return Number.isFinite(v) ? v : fallback;
	}

	_hour() {
		if (this.getAttribute("hour") === "now") {
			const now = new Date();
			return now.getHours() + now.getMinutes() / 60;
		}
		return this._number("hour", 21);
	}

	_draw() {
		const w = this.clientWidth;
		const h = this.clientHeight;
		if (!w || !h) return;
		const dpr = Math.min(window.devicePixelRatio || 1, 2);
		this._canvas.width = w * dpr;
		this._canvas.height = h * dpr;
		const ctx = this._ctx;
		ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
		ctx.clearRect(0, 0, w, h);

		// 秋分の日は、時刻がそのまま地方恒星時になる（太陽の赤経が 12 時のため）
		const lst = this._hour() * 15 * RAD;
		const sinLat = Math.sin(LATITUDE * RAD);
		const cosLat = Math.cos(LATITUDE * RAD);
		const az0 = this._number("azimuth", 180) * RAD;
		const alt0 = Math.min(89, Math.max(0, this._number("altitude", 40))) * RAD;
		// カメラの向き（東、北、上）
		const f = [Math.cos(alt0) * Math.sin(az0), Math.cos(alt0) * Math.cos(az0), Math.sin(alt0)];
		const r = [Math.cos(az0), -Math.sin(az0), 0];
		const u = [-Math.sin(alt0) * Math.sin(az0), -Math.sin(alt0) * Math.cos(az0), Math.cos(alt0)];
		const scale = Math.max(w, h) / 2 / Math.tan((FOV / 2) * RAD);

		for (let i = 0; i < STARS.length; i += 4) {
			const ra = STARS[i] * RAD;
			const dec = STARS[i + 1] * RAD;
			const ha = lst - ra;
			const sinAlt = Math.sin(dec) * sinLat + Math.cos(dec) * cosLat * Math.cos(ha);
			if (sinAlt <= 0.01) continue;
			// 地平座標の向き（東、北、上）
			const e = -Math.cos(dec) * Math.sin(ha);
			const n = Math.sin(dec) * cosLat - Math.cos(dec) * sinLat * Math.cos(ha);
			const depth = e * f[0] + n * f[1] + sinAlt * f[2];
			if (depth <= 0.15) continue;
			const x = w / 2 + ((e * r[0] + n * r[1]) / depth) * scale;
			const y = h / 2 - ((e * u[0] + n * u[1] + sinAlt * u[2]) / depth) * scale;
			if (x < -4 || x > w + 4 || y < -4 || y > h + 4) continue;
			// 大気の厚み（天頂を 1 とする）1 つにつき 0.2 等暗くする
			const mag = STARS[i + 2] + 0.2 * (1 / sinAlt - 1);
			if (mag > 5.4) continue;
			// 0 等で 1、5 等で 0.01 の光の量。画面では 4 乗根を半径と濃さに振り分ける
			const flux = 10 ** (-0.4 * mag);
			const size = flux ** 0.25;
			const radius = Math.max(0.5, 1.8 * size);
			const alpha = Math.min(1, 0.18 + 0.95 * size);
			const [cr, cg, cb] = starColor(STARS[i + 3]);
			ctx.fillStyle = `rgba(${cr},${cg},${cb},${alpha})`;
			ctx.beginPath();
			ctx.arc(x, y, radius, 0, Math.PI * 2);
			ctx.fill();
			if (mag < 1.8) {
				// 明るい星は、半径 3 倍のにじみを薄く重ねる
				ctx.fillStyle = `rgba(${cr},${cg},${cb},${alpha * 0.12})`;
				ctx.beginPath();
				ctx.arc(x, y, radius * 3, 0, Math.PI * 2);
				ctx.fill();
			}
		}
	}
}

if (typeof customElements !== "undefined" && !customElements.get("takibi-stars"))
	customElements.define("takibi-stars", TakibiStars);

// `<takibi-fire>` を customElements に登録する副作用だけのモジュール。
// 値の export はないので、import するだけで使える。
import type * as React from "react";

/** 今の描き方。webgl は焚き火の計算モデル、video は書き出しておいた動画、still は止まった 1 枚 */
export type TakibiFireRenderer = "webgl" | "video" | "still";

export type TakibiFireState = {
	/** 折れていない薪の数（丸太 2 本は数えない） */
	logs: number;
	/** 折れた薪の数 */
	pieces: number;
	/** 熾の量。0〜1 */
	embers: number;
	/** 炎の明るさ。平均が 1 で、0〜2.5 */
	brightness: number;
};

export type TakibiFireEventMap = {
	/** 描き方が決まった */
	ready: CustomEvent<{ renderer: TakibiFireRenderer }>;
	/** 薪をくべた。auto が true なら、自動でくべた */
	stoke: CustomEvent<{ auto: boolean }>;
	/** 薪が折れた */
	break: CustomEvent<Record<string, never>>;
	/** 薪が 1 本、熾になった */
	ember: CustomEvent<Record<string, never>>;
	/** くべた薪がすべて熾になった */
	low: CustomEvent<Record<string, never>>;
	/** はぜて火の粉が飛んだ。count は飛んだ数（1〜4） */
	pop: CustomEvent<{ count: number }>;
};

export interface TakibiFireElement extends HTMLElement {
	/** 今の描き方 */
	readonly renderer: TakibiFireRenderer;
	/** 薪と熾の今の状態 */
	readonly state: TakibiFireState;
	/** 薪を 1 本くべる。置けたら true。置く場所がないか、計算モデルが動いていなければ false */
	stoke(): boolean;
	/** 折れた薪を中央へ寄せる。約 5 秒のあいだ火が強くなる */
	tend(): void;
	/** 息を吹く。power は 0〜1（既定 0.5）。約 5 秒のあいだ火が強くなり、熾から火の粉が飛ぶ */
	blow(power?: number): void;
	addEventListener<K extends keyof TakibiFireEventMap>(
		type: K,
		listener: (this: TakibiFireElement, ev: TakibiFireEventMap[K]) => void,
		options?: boolean | AddEventListenerOptions,
	): void;
	addEventListener(
		type: string,
		listener: EventListenerOrEventListenerObject,
		options?: boolean | AddEventListenerOptions,
	): void;
	removeEventListener<K extends keyof TakibiFireEventMap>(
		type: K,
		listener: (this: TakibiFireElement, ev: TakibiFireEventMap[K]) => void,
		options?: boolean | EventListenerOptions,
	): void;
	removeEventListener(
		type: string,
		listener: EventListenerOrEventListenerObject,
		options?: boolean | EventListenerOptions,
	): void;
}

type FireAttributes = React.HTMLAttributes<HTMLElement> & {
	/** 火の強さ。0〜1、既定 0.8。薪から出る燃料のガスの量が変わり、炎の高さと明るさが変わる */
	intensity?: number | string;
	/** 薪の燃え進みの速さ。0〜60、既定 1。0 で薪が減らなくなる。炎の動きの速さは変わらない */
	speed?: number | string;
	/** "auto"（既定）は、折れていない薪が 3 本を切ると 1 本くべる。"manual" は stoke() を呼んだときだけ */
	feed?: "auto" | "manual";
	/** 薪の向きに沿った風。-1〜1、既定 0。1 で毎秒 1.5m */
	wind?: number | string;
	/** 火の粉。既定 "on" */
	sparks?: "on" | "off";
	/** 薪の向きから横へ回った角度（度）。既定 28 */
	azimuth?: number | string;
	/** 見下ろす角度（度）。2〜80、既定 12 */
	elevation?: number | string;
	/** 焚き火の中心からの距離（m）。0.8〜3、既定 1.5 */
	distance?: number | string;
	/** 明るさ（段）。-2〜2、既定 0 */
	exposure?: number | string;
	/** 付けると、クリックで薪をくべ、ドラッグで視点を回せる */
	interactive?: boolean | "";
	/** "auto"（既定）は計算モデルで描く。"video" は動画、"still" は止まった 1 枚 */
	render?: "auto" | "video" | "still";
	/** 炎の明るさ（--takibi-fire-glow）を書く先の CSS セレクター。"parent" なら親要素。書かなければ、この要素に書く */
	"glow-target"?: string;
	ref?: React.Ref<TakibiFireElement>;
	// イベント。React 19 は、カスタム要素の on で始まるプロパティを、その名前のイベントのリスナーとして付ける
	onready?: (event: TakibiFireEventMap["ready"]) => void;
	onstoke?: (event: TakibiFireEventMap["stoke"]) => void;
	onbreak?: (event: TakibiFireEventMap["break"]) => void;
	onember?: (event: TakibiFireEventMap["ember"]) => void;
	onlow?: (event: TakibiFireEventMap["low"]) => void;
	onpop?: (event: TakibiFireEventMap["pop"]) => void;
};

declare module "react" {
	namespace JSX {
		interface IntrinsicElements {
			"takibi-fire": FireAttributes;
		}
	}
}

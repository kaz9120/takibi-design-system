// `<takibi-embers>` を customElements に登録する副作用だけのモジュール。
// 値の export はないので、import するだけで使える。
import type * as React from "react";

type EmbersAttributes = React.HTMLAttributes<HTMLElement> & {
	/** 粒の数。既定 45 */
	density?: number | string;
	/** 横に流れる強さ。既定 0 */
	wind?: number | string;
	/** 色相をずらす角度。既定 0 */
	hue?: number | string;
	/** 背景のグロー。"off" で消す */
	glow?: "on" | "off";
};

declare module "react" {
	namespace JSX {
		interface IntrinsicElements {
			"takibi-embers": EmbersAttributes;
		}
	}
}

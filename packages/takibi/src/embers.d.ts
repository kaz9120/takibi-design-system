// `<takibi-embers>` を customElements に登録する副作用だけのモジュール。
// 値の export はないので、import するだけで使える。
import type * as React from "react";

type EmbersAttributes = React.HTMLAttributes<HTMLElement> & {
	/** 火の粉の多さ。既定 45。45 のとき、平均 0.4 秒に 1 回、1〜4 個が飛ぶ */
	density?: number | string;
	/** 横方向の風。-1〜1、既定 0。1 で毎秒 0.6m */
	wind?: number | string;
	/** 下の端の淡い光。"off" で消す */
	glow?: "on" | "off";
};

declare module "react" {
	namespace JSX {
		interface IntrinsicElements {
			"takibi-embers": EmbersAttributes;
		}
	}
}

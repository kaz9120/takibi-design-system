// `<takibi-fire>` を customElements に登録する副作用だけのモジュール。
// 値の export はないので、import するだけで使える。
import type * as React from "react";

type FireAttributes = React.HTMLAttributes<HTMLElement> & {
	/** 火の強さ。0〜1、既定 0.8。炎と、炎が薪と地面を照らす光の濃さが変わる。薪と熾は変わらない */
	intensity?: number | string;
	ref?: React.Ref<TakibiFireElement>;
};

export type TakibiFireElement = HTMLElement;

declare module "react" {
	namespace JSX {
		interface IntrinsicElements {
			"takibi-fire": FireAttributes;
		}
	}
}

// `<takibi-stars>` を customElements に登録する副作用だけのモジュール。
// 値の export はないので、import するだけで使える。
// 星のデータ（HYG Database v4.4、CC BY-SA 4.0）の出典の表示は、customElements.get("takibi-stars").credit で取り出せる。
import type * as React from "react";

type StarsAttributes = React.HTMLAttributes<HTMLElement> & {
	/** 見上げる時刻。0〜24、既定 21。"now" にすると今の時刻に合わせ、1 分ごとに描き直す */
	hour?: number | string;
	/** 向く方角（度）。北が 0、東が 90、既定 180（南） */
	azimuth?: number | string;
	/** 見上げる角度（度）。既定 40 */
	altitude?: number | string;
};

declare module "react" {
	namespace JSX {
		interface IntrinsicElements {
			"takibi-stars": StarsAttributes;
		}
	}
}

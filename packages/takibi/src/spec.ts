/**
 * コンポーネントページに載せる中身。各ストーリーファイルの meta.parameters.takibi に書く。
 * 見出しの順番と見た目は component-page.tsx が決めるので、ここには中身だけを書く。
 * 書くことのない項目は省く。省いた見出しはページに出ない。
 */
export type ComponentDocs = {
	/** 役割を 1 文で。省くとコンポーネントの JSDoc の 1 文目を使う */
	summary?: string;
	/** 読み込み方の 1 行。省くと `import { 名前 } from "takibi-design-system";` になる。カスタム要素のように読み込み方が違うものに書く */
	import?: string;
	/** 属性、メソッド、イベントなどの一覧。カスタム要素のように Props の表が作れないものに書く。rows は [名前, 説明] */
	api?: { title: string; rows: [string, string][] }[];
	/** 使う場面 */
	use?: string[];
	/** 使わない場面と、代わりに使うコンポーネント（`アクション/Toggle` のようにカタログの位置で書く） */
	avoid?: { case: string; instead?: string }[];
	/** よい使い方と、避ける使い方 */
	dos?: string[];
	donts?: string[];
	/** 文言の決まりと例 */
	copy?: {
		rules?: string[];
		examples?: { good: string; bad?: string; note?: string }[];
	};
	/** キーボード操作。[キー, 起きること] */
	keyboard?: [string, string][];
	/** スクリーンリーダーへの対応や、色に頼らない伝え方など */
	a11y?: string[];
	/** 何がどう動くか。使っている動きの語彙やトークンも書く */
	motion?: string[];
	/** 関連コンポーネント（`アクション/Toggle` のようにカタログの位置で書く） */
	related?: string[];
};

/** ストーリーをどの見出しの下に置くか。省くとストーリー名から推し量る */
export type StorySection = "種類" | "サイズ" | "状態" | "例";

export const SITE_URL = "https://design-system.y-kaz.com";
export const SITE_NAME = "Takibi Design System";

/** 節の名前と並び。サイドメニューと llms.txt がこの順に並べる */
export const SECTIONS = [
	{ path: "/basics", label: "基本要素" },
	{ path: "/product", label: "プロダクト" },
	{ path: "/communication", label: "コミュニケーション" },
] as const;

/** コンポーネントの分類の並び（ストーリーの title の 2 段目） */
export const CATEGORIES = [
	"基本",
	"アクション",
	"フォーム",
	"オーバーレイ",
	"フィードバック",
	"データ表示",
	"ナビゲーション",
] as const;

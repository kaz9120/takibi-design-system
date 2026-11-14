import { index, layout, type RouteConfig, route } from "@react-router/dev/routes";
import { contentPaths, htmlPaths, markdownPath } from "../pages";

const pages = contentPaths();

export default [
	layout("routes/layout.tsx", [
		index("routes/doc.tsx", { id: "home" }),
		...["basics", "product", "communication"].flatMap((section) => [
			route(section, "routes/doc.tsx", { id: section }),
			// 子のページがまだない節には作らない（ssr: false では、prerender しないルートに loader を置けない）
			...(pages.some((p) => p.startsWith(`/${section}/`))
				? [route(`${section}/:slug`, "routes/doc.tsx", { id: `${section}-page` })]
				: []),
		]),
		route("components", "routes/components.tsx"),
		route("components/:slug", "routes/component.tsx"),
	]),
	route("llms.txt", "routes/llms.ts", { id: "llms" }),
	route("llms-full.txt", "routes/llms.ts", { id: "llms-full" }),
	// 各ページの Markdown 版。動的な区切りに拡張子を付けられないので、ページごとにルートを作る
	...htmlPaths().map((p) => route(markdownPath(p), "routes/markdown.ts", { id: `md:${p}` })),
] satisfies RouteConfig;

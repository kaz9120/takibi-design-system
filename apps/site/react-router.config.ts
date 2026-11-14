import type { Config } from "@react-router/dev/config";
import { htmlPaths, markdownPath } from "./pages";

export default {
	// 全ページを静的に書き出し、Cloudflare Workers の静的アセットで配る
	ssr: false,
	async prerender() {
		const pages = htmlPaths();
		return [...pages, ...pages.map(markdownPath), "/llms.txt", "/llms-full.txt"];
	},
} satisfies Config;

// 各ページの Markdown 版（/basics/color.md など）。AI がページを読むときに使う
import { data } from "react-router";
import { allComponents, componentMarkdown, getComponent } from "../lib/components.server";
import { docMarkdown, getDoc } from "../lib/content.server";
import { SITE_URL } from "../lib/site";
import type { Route } from "./+types/markdown";

export async function loader({ request }: Route.LoaderArgs) {
	const pathname = new URL(request.url).pathname.replace(/\.md$/, "");
	const page = pathname === "/index" ? "/" : pathname;
	const text = await markdownFor(page);
	if (!text) throw data(null, { status: 404 });
	return new Response(text, { headers: { "Content-Type": "text/markdown; charset=utf-8" } });
}

async function markdownFor(page: string): Promise<string | undefined> {
	if (page.startsWith("/components/")) {
		const c = await getComponent(page.slice("/components/".length));
		return c ? componentMarkdown(c) : undefined;
	}
	const doc = getDoc(page);
	if (doc) return docMarkdown(doc);
	if (page === "/components") {
		const list = await allComponents();
		return `# コンポーネント\n\n${list.map((c) => `- [${c.name}](${SITE_URL}/components/${c.slug}.md)（${c.category}）: ${c.summary ?? ""}`).join("\n")}\n`;
	}
	return undefined;
}

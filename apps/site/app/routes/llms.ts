// /llms.txt（ページの目次）と /llms-full.txt（全ページの本文をつないだもの）
import { allComponents, componentMarkdown } from "../lib/components.server";
import { allDocs, docMarkdown, getDoc } from "../lib/content.server";
import { SECTIONS, SITE_NAME, SITE_URL } from "../lib/site";
import type { Route } from "./+types/llms";

const md = (p: string) => `${SITE_URL}${p === "/" ? "/index" : p}.md`;

export async function loader({ request }: Route.LoaderArgs) {
	const full = new URL(request.url).pathname === "/llms-full.txt";
	const docs = allDocs();
	const components = await allComponents();
	const home = getDoc("/");
	const text = full
		? [...docs.map(docMarkdown), ...(await Promise.all(components.map(componentMarkdown)))].join("\n---\n\n")
		: [
				`# ${SITE_NAME}`,
				"",
				`> ${home?.description ?? ""}`,
				"",
				"各ページは Markdown で読める。全ページの本文をつないだものは /llms-full.txt にある。パッケージは npm の takibi-design-system。",
				"",
				`- [はじめに](${md("/")}): アプリでの使い方と約束`,
				"",
				...SECTIONS.flatMap((s) => {
					const items = docs
						.filter((d) => d.path === s.path || d.path.startsWith(`${s.path}/`))
						.map((d) => `- [${d.title}](${md(d.path)}): ${d.description}`);
					if (s.path === "/product") {
						items.push(
							...components.map(
								(c) => `- [${c.name}](${md(`/components/${c.slug}`)}): ${c.category}。${c.summary ?? ""}`,
							),
						);
					}
					return [`## ${s.label}`, "", ...items, ""];
				}),
			].join("\n");
	return new Response(text, { headers: { "Content-Type": "text/plain; charset=utf-8" } });
}

// ストーリーのファイルから、コンポーネントページの中身を作る。ビルド（prerender）のときだけ動く
import type { ComponentDocs, StorySection } from "takibi-design-system/spec";
import { CATEGORIES } from "./site";
import { storyModuleFor, storyModules } from "./stories";

const storySources = import.meta.glob("../../../../packages/takibi/src/components/*.stories.tsx", {
	query: "?raw",
	import: "default",
	eager: true,
}) as Record<string, string>;

const componentSources = import.meta.glob(
	[
		"../../../../packages/takibi/src/components/*.tsx",
		"!../../../../packages/takibi/src/components/*.stories.tsx",
	],
	{ query: "?raw", import: "default", eager: true },
) as Record<string, string>;

export type StoryInfo = {
	exportName: string;
	name: string;
	description?: string;
	section: StorySection;
	/** play を持つストーリー（キーボード操作などのテスト）。ページには例として並べない */
	test: boolean;
};

export type ComponentInfo = {
	slug: string;
	/** Button など */
	name: string;
	/** アクション など */
	category: string;
	/** カタログでの位置（アクション/Button）。related の書き方と同じ */
	location: string;
	summary?: string;
	description?: string;
	docs: ComponentDocs;
	stories: StoryInfo[];
};

type Meta = { title?: string; component?: { name?: string }; parameters?: { takibi?: ComponentDocs } };
type Story = { name?: string; play?: unknown; parameters?: { section?: StorySection } };

/** JSDoc のコメントを、* を外した文にする */
function cleanJsDoc(block: string): string {
	return block
		.split("\n")
		.map((l) => l.replace(/^\s*\*\s?/, "").trim())
		.filter((l) => !l.startsWith("@"))
		.join("\n")
		.trim();
}

function jsDocBefore(source: string, pattern: string): string | undefined {
	const re = new RegExp(`/\\*\\*((?:(?!\\*/)[\\s\\S])*?)\\*/\\s*${pattern}`);
	const m = source.match(re);
	return m?.[1] ? cleanJsDoc(m[1]) : undefined;
}

function firstSentence(text: string | undefined) {
	if (!text) return undefined;
	const i = text.indexOf("。");
	return i === -1 ? text.trim() : text.slice(0, i + 1).trim();
}

function sectionOf(exportName: string, story: Story): StorySection {
	if (story.parameters?.section) return story.parameters.section;
	if (/^(variants?|types?|kinds?)$/i.test(exportName)) return "種類";
	if (/^sizes?$/i.test(exportName)) return "サイズ";
	if (/^(states?|disabled|invalid|readonly|loading|error)$/i.test(exportName)) return "状態";
	return "例";
}

function sourceFor(map: Record<string, string>, file: string) {
	const key = Object.keys(map).find((k) => k.endsWith(`/${file}`));
	return (key && map[key]) || "";
}

const cache = new Map<string, ComponentInfo>();

export async function getComponent(slug: string): Promise<ComponentInfo | undefined> {
	const hit = cache.get(slug);
	if (hit) return hit;
	const load = storyModuleFor(slug);
	if (!load) return undefined;
	const mod = await load();
	const meta = (mod.default ?? {}) as Meta;
	const title = (meta.title ?? slug).replace(/^コンポーネント\//, "");
	const [category = "", name = slug] = title.split("/");
	const storySource = sourceFor(storySources, `${slug}.stories.tsx`);
	const componentName = meta.component?.name ?? name;
	const componentSource = sourceFor(componentSources, `${slug}.tsx`);
	const description = jsDocBefore(componentSource, `export (?:function|const) ${componentName}\\b`);
	const docs = meta.parameters?.takibi ?? {};
	const order = (mod.__namedExportsOrder as string[] | undefined) ?? Object.keys(mod);
	const stories: StoryInfo[] = order
		.filter((k) => k !== "default" && k !== "__namedExportsOrder" && typeof mod[k] === "object")
		.map((exportName) => {
			const story = mod[exportName] as Story;
			return {
				exportName,
				name: story.name ?? exportName,
				description: jsDocBefore(storySource, `export const ${exportName}\\b`),
				section: sectionOf(exportName, story),
				test: Boolean(story.play),
			};
		});
	const info: ComponentInfo = {
		slug,
		name,
		category,
		location: title,
		summary: docs.summary ?? firstSentence(description),
		description,
		docs,
		stories,
	};
	cache.set(slug, info);
	return info;
}

export async function allComponents(): Promise<ComponentInfo[]> {
	const slugs = Object.keys(storyModules).map((k) => k.replace(/^.*\//, "").replace(/\.stories\.tsx$/, ""));
	const list = (await Promise.all(slugs.map(getComponent))).filter((c): c is ComponentInfo => Boolean(c));
	const rank = (c: string) => {
		const i = CATEGORIES.indexOf(c as (typeof CATEGORIES)[number]);
		return i === -1 ? CATEGORIES.length : i;
	};
	return list.sort((a, b) => rank(a.category) - rank(b.category) || a.name.localeCompare(b.name));
}

/** related の `アクション/Toggle` を、そのコンポーネントのパスにする */
export async function locationToPath(location: string): Promise<string | undefined> {
	const list = await allComponents();
	const c = list.find((x) => x.location === location);
	return c ? `/components/${c.slug}` : undefined;
}

/** コンポーネントページの Markdown 版 */
export async function componentMarkdown(c: ComponentInfo): Promise<string> {
	const d = c.docs;
	const out: string[] = [`# ${c.name}`, "", `> ${c.summary ?? ""}`, "", `分類: ${c.category}`, ""];
	out.push("```tsx", d.import ?? `import { ${c.name} } from "takibi-design-system";`, "```", "");
	if (c.description && c.description !== c.summary) out.push(c.description, "");
	const list = (title: string, items?: string[]) => {
		if (!items?.length) return;
		out.push(`## ${title}`, "", ...items.map((i) => `- ${i}`), "");
	};
	list("使う場面", d.use);
	if (d.avoid?.length) {
		out.push(
			"## 使わない場面",
			"",
			...d.avoid.map((a) => `- ${a.case}${a.instead ? `（代わりに ${a.instead}）` : ""}`),
			"",
		);
	}
	list("すること", d.dos);
	list("しないこと", d.donts);
	if (d.copy) {
		list("ライティング", d.copy.rules);
		for (const e of d.copy.examples ?? []) {
			out.push(`- よい例: ${e.good}${e.bad ? ` / 避ける例: ${e.bad}` : ""}${e.note ? `（${e.note}）` : ""}`);
		}
		if (d.copy.examples?.length) out.push("");
	}
	if (d.keyboard?.length) {
		out.push("## キーボード操作", "", "| キー | 起きること |", "|---|---|");
		for (const [k, v] of d.keyboard) out.push(`| ${k} | ${v} |`);
		out.push("");
	}
	for (const t of d.api ?? []) {
		out.push(`## ${t.title}`, "", "| 名前 | 説明 |", "|---|---|");
		for (const [k, v] of t.rows) out.push(`| \`${k}\` | ${v} |`);
		out.push("");
	}
	list("アクセシビリティ", d.a11y);
	list("モーション", d.motion);
	const examples = c.stories.filter((s) => !s.test);
	if (examples.length) {
		out.push(
			"## 例",
			"",
			...examples.map((s) => `- ${s.name}${s.description ? `: ${s.description}` : ""}`),
			"",
		);
	}
	const tests = c.stories.filter((s) => s.test);
	if (tests.length) out.push("## テスト", "", ...tests.map((s) => `- ${s.name}`), "");
	if (d.related?.length) {
		const links = await Promise.all(
			d.related.map(async (r) => {
				const p = await locationToPath(r);
				return p ? `- [${r}](${p}.md)` : `- ${r}`;
			}),
		);
		out.push("## 関連コンポーネント", "", ...links, "");
	}
	return out.join("\n");
}

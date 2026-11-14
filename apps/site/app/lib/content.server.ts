// content/ の Markdown を読む。ページの本文の正はここ
import { marked } from "marked";

const files = import.meta.glob("../../../../content/**/*.md", {
	query: "?raw",
	import: "default",
	eager: true,
}) as Record<string, string>;

export type Doc = {
	/** サイトのパス（/basics/color） */
	path: string;
	title: string;
	description: string;
	order: number;
	/** 本文の Markdown（front matter を除く） */
	body: string;
};

function parse(file: string, raw: string): Doc {
	const rel = file.replace(/^.*\/content\//, "").replace(/\.md$/, "");
	const docPath = `/${rel}`.replace(/\/?index$/, "") || "/";
	const m = raw.match(/^---\n([\s\S]*?)\n---\n?/);
	const meta: Record<string, string> = {};
	for (const line of m?.[1]?.split("\n") ?? []) {
		const i = line.indexOf(":");
		if (i > 0) meta[line.slice(0, i).trim()] = line.slice(i + 1).trim();
	}
	return {
		path: docPath,
		title: meta.title ?? rel,
		description: meta.description ?? "",
		order: Number(meta.order ?? 99),
		body: m ? raw.slice(m[0].length).trim() : raw.trim(),
	};
}

const docs = Object.entries(files)
	.map(([file, raw]) => parse(file, raw))
	.sort((a, b) => a.order - b.order || a.path.localeCompare(b.path));

export function allDocs(): Doc[] {
	return docs;
}

export function getDoc(docPath: string): Doc | undefined {
	return docs.find((d) => d.path === docPath);
}

/** ある節の直下のページ（/basics なら /basics/color など。節の index は含めない） */
export function childrenOf(section: string): Doc[] {
	return docs.filter((d) => d.path.startsWith(`${section}/`));
}

export function renderMarkdown(md: string): string {
	return marked.parse(md, { gfm: true, async: false }) as string;
}

/** ページの Markdown 版。見出しと説明を先頭に付ける */
export function docMarkdown(doc: Doc): string {
	return `# ${doc.title}\n\n> ${doc.description}\n\n${doc.body}\n`;
}

// サイトのページの一覧。routes.ts（.md のルート）と react-router.config.ts（prerender）が使う。
// ビルドの前に Node で読まれるので、Vite の機能（import.meta.glob）は使わない。
import fs from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "../..");
const contentDir = path.join(root, "content");
const componentsDir = path.join(root, "packages/takibi/src/components");

/** content/ の Markdown のパス。content/brand/core.md → /brand/core、index.md → / */
export function contentPaths(): string[] {
	const out: string[] = [];
	const walk = (dir: string) => {
		for (const name of fs.readdirSync(dir).sort()) {
			const p = path.join(dir, name);
			if (fs.statSync(p).isDirectory()) walk(p);
			else if (name.endsWith(".md")) {
				const rel = path.relative(contentDir, p).replace(/\.md$/, "");
				out.push(`/${rel}`.replace(/\/?index$/, "") || "/");
			}
		}
	};
	walk(contentDir);
	return out;
}

/** ストーリーのあるコンポーネントのパス。button.stories.tsx → /components/button */
export function componentPaths(): string[] {
	return fs
		.readdirSync(componentsDir)
		.filter((n) => n.endsWith(".stories.tsx"))
		.sort()
		.map((n) => `/components/${n.replace(/\.stories\.tsx$/, "")}`);
}

/** content/ にない一覧のページ */
export const sectionPaths = ["/components"];

/** HTML で出すページ */
export function htmlPaths(): string[] {
	return [...new Set([...contentPaths(), ...sectionPaths, ...componentPaths()])];
}

/** ページの Markdown 版のパス。/ は /index.md にする */
export function markdownPath(p: string): string {
	return p === "/" ? "/index.md" : `${p}.md`;
}

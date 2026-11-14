import { data } from "react-router";
import { PageCards, PageHeader } from "../components/page-header";
import { BasicsTokens } from "../components/tokens";
import { childrenOf, getDoc, renderMarkdown } from "../lib/content.server";
import { SECTIONS, SITE_NAME } from "../lib/site";
import type { Route } from "./+types/doc";

export async function loader({ request }: Route.LoaderArgs) {
	const pathname = new URL(request.url).pathname.replace(/\/$/, "") || "/";
	const doc = getDoc(pathname);
	if (!doc) throw data(null, { status: 404 });
	const section = SECTIONS.find((s) => pathname.startsWith(s.path));
	// 節の概要のページ（/basics）には、子のページを並べる
	const children = section && pathname === section.path ? childrenOf(section.path) : [];
	return {
		path: doc.path,
		title: doc.title,
		description: doc.description,
		// 節の概要のページは題が節の名前なので、小見出しを出さない
		eyebrow: pathname === "/" || pathname === section?.path ? undefined : section?.label,
		html: renderMarkdown(doc.body),
		children: children.map((c) => ({ path: c.path, title: c.title, description: c.description })),
	};
}

export function meta({ loaderData }: Route.MetaArgs) {
	if (!loaderData) return [];
	const title = loaderData.path === "/" ? SITE_NAME : `${loaderData.title} | ${SITE_NAME}`;
	return [{ title }, { name: "description", content: loaderData.description }];
}

export default function Doc({ loaderData }: Route.ComponentProps) {
	const { path, title, description, eyebrow, html, children } = loaderData;
	const basics = path.startsWith("/basics/") ? path.split("/").at(-1) : undefined;
	return (
		<article>
			<PageHeader eyebrow={eyebrow} title={title} description={description} />
			{/* biome-ignore lint/security/noDangerouslySetInnerHtml: content/ の Markdown をビルドのときに HTML にしたもの */}
			<div className="prose" dangerouslySetInnerHTML={{ __html: html }} />
			{children.length > 0 && (
				<div className="mt-12">
					<PageCards items={children} />
				</div>
			)}
			{basics && <BasicsTokens slug={basics} />}
		</article>
	);
}

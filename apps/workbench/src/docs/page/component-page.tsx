import { ArgTypes, Canvas, DocsContext, Unstyled, useOf } from "@storybook/addon-docs/blocks";
import { Check, X } from "lucide-react";
import * as React from "react";
import type { ComponentDocs, StorySection } from "takibi-design-system/spec";

type PreparedStory = ReturnType<React.ContextType<typeof DocsContext>["componentStories"]>[number];

/**
 * コンポーネントページのひな形。すべてのコンポーネントで、見出しを同じ名前・同じ順に並べる。
 * 冒頭 → 種類 → サイズ → 状態 → 使い方 → ライティング → 仕様 → Props → 関連
 * 中身は各ストーリーファイルの meta.parameters.takibi（spec.ts の ComponentDocs）に書く。
 * play 関数を持つストーリーは確かめるためのものなので、ページには並べず「テスト」に名前だけ出す。
 */
export function ComponentPage() {
	const context = React.useContext(DocsContext);
	const { preparedMeta } = useOf("meta", ["meta"]);
	const docs = (preparedMeta.parameters.takibi ?? {}) as ComponentDocs;
	const stories = context.componentStories();
	const checks = stories.filter((s) => s.playFunction);
	const shown = stories.filter((s) => !s.playFunction);
	const [primary, ...rest] = shown;

	const grouped: Record<StorySection, PreparedStory[]> = { 種類: [], サイズ: [], 状態: [], 例: [] };
	for (const s of rest) grouped[sectionOf(s)].push(s);

	const [category, name] = splitTitle(preparedMeta.title);
	const summary = docs.summary ?? firstSentence(componentDescription(preparedMeta.component));
	const usage = Boolean(docs.use?.length || docs.avoid?.length || docs.dos?.length || docs.donts?.length);
	const spec = Boolean(docs.keyboard?.length || docs.a11y?.length || docs.motion?.length || checks.length);

	const sections: { id: string; label: string; show: boolean }[] = [
		{ id: "kinds", label: "種類", show: grouped.種類.length > 0 },
		{ id: "sizes", label: "サイズ", show: grouped.サイズ.length > 0 },
		{ id: "states", label: "状態", show: grouped.状態.length > 0 },
		{ id: "usage", label: "使い方", show: usage || grouped.例.length > 0 },
		{ id: "copy", label: "ライティング", show: Boolean(docs.copy) },
		{ id: "spec", label: "仕様", show: spec },
		{ id: "props", label: "Props", show: Boolean(preparedMeta.component) },
		{ id: "related", label: "関連コンポーネント", show: Boolean(docs.related?.length) },
	];

	return (
		<Unstyled>
			<article className="mx-auto flex max-w-(--container-narrow) flex-col gap-14 px-2 pt-6 pb-24 text-fg">
				<header className="flex flex-col gap-4">
					<p className="text-sm text-fg-subtle">{category}</p>
					<h1 className="text-4xl font-semibold tracking-tight text-fg-strong">{name}</h1>
					{summary && <p className="text-lg leading-relaxed text-fg-muted">{summary}</p>}
					<nav aria-label="このページの見出し" className="flex flex-wrap gap-1.5 pt-2">
						{sections
							.filter((s) => s.show)
							.map((s) => (
								<a
									key={s.id}
									href={`#${s.id}`}
									className="rounded-md border border-line-subtle px-2.5 py-1 text-sm text-fg-muted transition-colors duration-(--duration-fast) hover:border-line-strong hover:text-fg"
								>
									{s.label}
								</a>
							))}
					</nav>
				</header>

				{primary && <Canvas of={primary.moduleExport} />}

				{sections[0]?.show && <StoryGroup id="kinds" title="種類" stories={grouped.種類} />}
				{sections[1]?.show && <StoryGroup id="sizes" title="サイズ" stories={grouped.サイズ} />}
				{sections[2]?.show && <StoryGroup id="states" title="状態" stories={grouped.状態} />}

				{sections[3]?.show && (
					<Section id="usage" title="使い方">
						{docs.use?.length ? (
							<Block title="使う場面">
								<Bullets items={docs.use} />
							</Block>
						) : null}
						{docs.avoid?.length ? (
							<Block title="使わない場面">
								<ul className="flex flex-col gap-2">
									{docs.avoid.map((a) => (
										<li key={a.case} className="flex flex-wrap items-baseline gap-x-2 text-base text-fg">
											<span>{a.case}</span>
											{a.instead && (
												<span className="text-sm text-fg-muted">
													→ <RelatedLink path={a.instead} />
												</span>
											)}
										</li>
									))}
								</ul>
							</Block>
						) : null}
						{docs.dos?.length || docs.donts?.length ? (
							<div className="grid gap-4 sm:grid-cols-2">
								{docs.dos?.length ? <DoDont kind="do" items={docs.dos} /> : null}
								{docs.donts?.length ? <DoDont kind="dont" items={docs.donts} /> : null}
							</div>
						) : null}
						{grouped.例.length > 0 && (
							<Block title="例">
								<div className="flex flex-col gap-8">
									{grouped.例.map((s) => (
										<StoryBlock key={s.id} story={s} />
									))}
								</div>
							</Block>
						)}
					</Section>
				)}

				{docs.copy && (
					<Section id="copy" title="ライティング">
						{docs.copy.rules?.length ? <Bullets items={docs.copy.rules} /> : null}
						{docs.copy.examples?.length ? (
							<table className="w-full border-collapse text-left text-sm">
								<thead>
									<tr className="border-b border-line text-fg-subtle">
										<th className="py-2 pr-4 font-medium">使う</th>
										<th className="py-2 pr-4 font-medium">使わない</th>
										<th className="py-2 font-medium">理由</th>
									</tr>
								</thead>
								<tbody>
									{docs.copy.examples.map((e) => (
										<tr key={e.good} className="border-b border-line-subtle align-top">
											<td className="py-2.5 pr-4 text-fg-strong">{e.good}</td>
											<td className="py-2.5 pr-4 text-fg-muted line-through decoration-danger/60">{e.bad}</td>
											<td className="py-2.5 text-fg-muted">{e.note}</td>
										</tr>
									))}
								</tbody>
							</table>
						) : null}
					</Section>
				)}

				{spec && (
					<Section id="spec" title="仕様">
						{docs.keyboard?.length ? (
							<Block title="キーボード操作">
								<table className="w-full border-collapse text-left text-sm">
									<tbody>
										{docs.keyboard.map(([key, action]) => (
											<tr key={key} className="border-b border-line-subtle align-top">
												<td className="w-40 py-2.5 pr-4">
													<span className="flex flex-wrap gap-1">
														{key.split(" + ").map((k) => (
															<kbd
																key={k}
																className="inline-flex h-6 min-w-6 items-center justify-center rounded-sm border border-line-subtle bg-surface-sunken px-1.5 font-mono text-xs text-fg-muted"
															>
																{k}
															</kbd>
														))}
													</span>
												</td>
												<td className="py-2.5 text-fg">{action}</td>
											</tr>
										))}
									</tbody>
								</table>
							</Block>
						) : null}
						{docs.a11y?.length ? (
							<Block title="アクセシビリティ">
								<Bullets items={docs.a11y} />
							</Block>
						) : null}
						{docs.motion?.length ? (
							<Block title="モーション">
								<Bullets items={docs.motion} />
							</Block>
						) : null}
						{checks.length > 0 && (
							<Block title="テスト">
								<p className="text-sm text-fg-muted">
									次のストーリーが、操作を自動で確かめています。サイドバーから開くと、手順が再生されます。
								</p>
								<ul className="flex flex-wrap gap-2">
									{checks.map((s) => (
										<li key={s.id}>
											<a
												href={`/?path=/story/${s.id}`}
												target="_top"
												className="inline-flex rounded-md bg-surface-sunken px-2.5 py-1 font-mono text-xs text-fg-muted hover:text-fg"
											>
												{s.name}
											</a>
										</li>
									))}
								</ul>
							</Block>
						)}
					</Section>
				)}

				{preparedMeta.component && (
					<Section id="props" title="Props">
						<ArgTypes of={primary?.moduleExport ?? "meta"} />
					</Section>
				)}

				{docs.related?.length ? (
					<Section id="related" title="関連コンポーネント">
						<ul className="flex flex-wrap gap-2">
							{docs.related.map((r) => (
								<li key={r}>
									<RelatedLink path={r} chip />
								</li>
							))}
						</ul>
					</Section>
				) : null}
			</article>
		</Unstyled>
	);
}

function Section({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
	return (
		<section id={id} className="flex scroll-mt-6 flex-col gap-6">
			<h2 className="border-b border-line-subtle pb-3 text-2xl font-semibold text-fg-strong">{title}</h2>
			{children}
		</section>
	);
}

function Block({ title, children }: { title: string; children: React.ReactNode }) {
	return (
		<div className="flex flex-col gap-3">
			<h3 className="text-base font-semibold text-fg-strong">{title}</h3>
			{children}
		</div>
	);
}

function Bullets({ items }: { items: string[] }) {
	return (
		<ul className="flex list-disc flex-col gap-1.5 pl-5 text-base leading-relaxed text-fg marker:text-fg-subtle">
			{items.map((i) => (
				<li key={i}>{i}</li>
			))}
		</ul>
	);
}

function DoDont({ kind, items }: { kind: "do" | "dont"; items: string[] }) {
	const ok = kind === "do";
	return (
		<div className="flex flex-col gap-3 rounded-lg border border-line-subtle bg-surface-raised p-4">
			<p className={`flex items-center gap-2 text-sm font-semibold ${ok ? "text-success" : "text-danger"}`}>
				{ok ? <Check className="size-4" aria-hidden /> : <X className="size-4" aria-hidden />}
				{ok ? "こうする" : "こうしない"}
			</p>
			<ul className="flex flex-col gap-2 text-sm leading-relaxed text-fg">
				{items.map((i) => (
					<li key={i}>{i}</li>
				))}
			</ul>
		</div>
	);
}

function StoryGroup({ id, title, stories }: { id: string; title: string; stories: PreparedStory[] }) {
	return (
		<Section id={id} title={title}>
			{stories.map((s) => (
				<StoryBlock key={s.id} story={s} showName={stories.length > 1} />
			))}
		</Section>
	);
}

function StoryBlock({ story, showName = true }: { story: PreparedStory; showName?: boolean }) {
	const description = story.parameters.docs?.description?.story as string | undefined;
	return (
		<div className="flex flex-col gap-2">
			{showName && <h3 className="text-base font-semibold text-fg-strong">{story.name}</h3>}
			{description && <p className="text-sm leading-relaxed text-fg-muted">{description}</p>}
			<Canvas of={story.moduleExport} />
		</div>
	);
}

/** `アクション/Toggle` を、そのコンポーネントのページへのリンクにする */
function RelatedLink({ path, chip = false }: { path: string; chip?: boolean }) {
	const id = `${sanitize(`コンポーネント/${path}`)}--docs`;
	const label = path.split("/").at(-1);
	return (
		<a
			href={`/?path=/docs/${id}`}
			target="_top"
			className={
				chip
					? "inline-flex rounded-md border border-line-subtle bg-surface-raised px-3 py-1.5 text-sm text-fg transition-colors duration-(--duration-fast) hover:border-brand hover:text-brand"
					: "text-brand underline-offset-4 hover:underline"
			}
		>
			{label}
		</a>
	);
}

function sectionOf(story: PreparedStory): StorySection {
	const explicit = story.parameters.section as StorySection | undefined;
	if (explicit) return explicit;
	const n = story.id.split("--").at(-1)?.replace(/-/g, "") ?? story.name;
	if (/^(variants?|types?|kinds?)$/i.test(n)) return "種類";
	if (/^sizes?$/i.test(n)) return "サイズ";
	if (/^(states?|disabled|invalid|readonly|loading|error)$/i.test(n)) return "状態";
	return "例";
}

function splitTitle(title: string): [string, string] {
	const parts = title.split("/");
	return [parts.slice(0, -1).join(" / "), parts.at(-1) ?? title];
}

function componentDescription(component: unknown): string | undefined {
	return (component as { __docgenInfo?: { description?: string } } | undefined)?.__docgenInfo?.description;
}

function firstSentence(text: string | undefined) {
	if (!text) return undefined;
	const i = text.indexOf("。");
	return i === -1 ? text.trim() : text.slice(0, i + 1).trim();
}

/** Storybook がタイトルから id を作るときと同じ規則 */
function sanitize(s: string) {
	return s
		.toLowerCase()
		.replace(/[ ’–—―′¿'`~!@#$%^&*()_|+\-=?;:'",.<>{}[\]\\/]/gi, "-")
		.replace(/-+/g, "-")
		.replace(/^[-]+/, "")
		.replace(/[-]+$/, "");
}

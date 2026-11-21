import { data, Link } from "react-router";
import { Kbd } from "takibi-design-system";
import { PageHeader } from "../components/page-header";
import { StoryExample, useStories } from "../components/story-example";
import { getComponent, locationToPath } from "../lib/components.server";
import { SITE_NAME } from "../lib/site";
import type { Route } from "./+types/component";

export async function loader({ params }: Route.LoaderArgs) {
	const c = await getComponent(params.slug);
	if (!c) throw data(null, { status: 404 });
	const link = async (location: string) => ({ location, path: await locationToPath(location) });
	return {
		component: c,
		related: await Promise.all((c.docs.related ?? []).map(link)),
		avoid: await Promise.all(
			(c.docs.avoid ?? []).map(async (a) => ({
				...a,
				insteadLink: a.instead ? await link(a.instead) : undefined,
			})),
		),
	};
}

export function meta({ loaderData }: Route.MetaArgs) {
	if (!loaderData) return [];
	const c = loaderData.component;
	return [{ title: `${c.name} | ${SITE_NAME}` }, { name: "description", content: c.summary ?? "" }];
}

function Section({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
	return (
		<section id={id} className="mt-16 flex scroll-mt-20 flex-col gap-6">
			<h2 className="text-2xl font-semibold text-fg-strong">{title}</h2>
			{children}
		</section>
	);
}

function Block({ title, children }: { title: string; children: React.ReactNode }) {
	return (
		<div className="flex flex-col gap-2">
			<h3 className="text-base font-semibold text-fg-strong">{title}</h3>
			{children}
		</div>
	);
}

function Bullets({ items }: { items: React.ReactNode[] }) {
	return (
		<ul className="flex max-w-(--container-prose) list-disc flex-col gap-1.5 pl-5 text-fg marker:text-fg-subtle">
			{items.map((item, i) => (
				// biome-ignore lint/suspicious/noArrayIndexKey: 文の並びは変わらない
				<li key={i}>{item}</li>
			))}
		</ul>
	);
}

function LocationLink({ location, path }: { location: string; path?: string }) {
	const label = location.split("/").at(-1);
	return path ? (
		<Link to={path} className="text-brand underline-offset-4 hover:underline">
			{label}
		</Link>
	) : (
		<span>{label}</span>
	);
}

export default function ComponentPage({ loaderData }: Route.ComponentProps) {
	const { component: c, related, avoid } = loaderData;
	const d = c.docs;
	const stories = useStories(c.slug);
	const examples = c.stories.filter((s) => !s.test);
	const bySection = (section: string) => examples.filter((s) => s.section === section);
	const tests = c.stories.filter((s) => s.test);
	const hasUsage =
		d.use?.length || avoid.length || d.dos?.length || d.donts?.length || bySection("例").length;
	const hasSpec = d.api?.length || d.keyboard?.length || d.a11y?.length || d.motion?.length || tests.length;

	return (
		<article>
			<PageHeader eyebrow={c.category} title={c.name} description={c.summary} />
			<pre className="max-w-(--container-prose) overflow-x-auto rounded-lg border border-line-subtle bg-surface-sunken px-4 py-3 font-mono text-sm text-fg">
				{d.import ?? `import { ${c.name} } from "takibi-design-system";`}
			</pre>
			{c.description && c.description !== c.summary && (
				<p className="mt-6 max-w-(--container-prose) leading-relaxed whitespace-pre-line text-fg">
					{c.description}
				</p>
			)}

			{(["種類", "サイズ", "状態"] as const).map((section) =>
				bySection(section).length ? (
					<Section key={section} id={section} title={section}>
						{bySection(section).map((s) => (
							<StoryExample
								key={s.exportName}
								stories={stories}
								showName={bySection(section).length > 1}
								{...s}
							/>
						))}
					</Section>
				) : null,
			)}

			{hasUsage ? (
				<Section id="usage" title="使い方">
					{d.use?.length ? (
						<Block title="使う場面">
							<Bullets items={d.use} />
						</Block>
					) : null}
					{avoid.length ? (
						<Block title="使わない場面">
							<Bullets
								items={avoid.map((a) => (
									<>
										{a.case}
										{a.insteadLink && (
											<>
												（代わりに <LocationLink {...a.insteadLink} />）
											</>
										)}
									</>
								))}
							/>
						</Block>
					) : null}
					{d.dos?.length || d.donts?.length ? (
						<div className="grid gap-4 md:grid-cols-2">
							{d.dos?.length ? (
								<div className="rounded-lg border border-line-subtle bg-surface-raised p-4">
									<p className="mb-2 text-sm font-semibold text-success">こうする</p>
									<Bullets items={d.dos} />
								</div>
							) : null}
							{d.donts?.length ? (
								<div className="rounded-lg border border-line-subtle bg-surface-raised p-4">
									<p className="mb-2 text-sm font-semibold text-danger">こうしない</p>
									<Bullets items={d.donts} />
								</div>
							) : null}
						</div>
					) : null}
					{bySection("例").map((s) => (
						<StoryExample key={s.exportName} stories={stories} {...s} />
					))}
				</Section>
			) : null}

			{d.copy ? (
				<Section id="writing" title="ライティング">
					{d.copy.rules?.length ? <Bullets items={d.copy.rules} /> : null}
					{d.copy.examples?.length ? (
						<div className="flex flex-col gap-2">
							{d.copy.examples.map((e) => (
								<div
									key={e.good}
									className="flex flex-col gap-1 rounded-lg border border-line-subtle p-3 text-sm"
								>
									<span className="text-fg-strong">○ {e.good}</span>
									{e.bad && <span className="text-fg-muted">× {e.bad}</span>}
									{e.note && <span className="text-fg-subtle">{e.note}</span>}
								</div>
							))}
						</div>
					) : null}
				</Section>
			) : null}

			{hasSpec ? (
				<Section id="spec" title="仕様">
					{d.api?.map((t) => (
						<Block key={t.title} title={t.title}>
							<table className="w-full max-w-(--container-prose) border-collapse text-sm">
								<tbody>
									{t.rows.map(([name, what]) => (
										<tr key={name} className="border-t border-line-subtle">
											<td className="w-48 py-2 pr-4 align-top font-mono text-fg-strong">{name}</td>
											<td className="py-2 leading-relaxed text-fg">{what}</td>
										</tr>
									))}
								</tbody>
							</table>
						</Block>
					))}
					{d.keyboard?.length ? (
						<Block title="キーボード操作">
							<table className="w-full max-w-(--container-prose) border-collapse text-sm">
								<tbody>
									{d.keyboard.map(([key, what]) => (
										<tr key={key} className="border-t border-line-subtle">
											<td className="w-40 py-2 pr-4 align-top">
												<Kbd>{key}</Kbd>
											</td>
											<td className="py-2 text-fg">{what}</td>
										</tr>
									))}
								</tbody>
							</table>
						</Block>
					) : null}
					{d.a11y?.length ? (
						<Block title="アクセシビリティ">
							<Bullets items={d.a11y} />
						</Block>
					) : null}
					{d.motion?.length ? (
						<Block title="モーション">
							<Bullets items={d.motion} />
						</Block>
					) : null}
					{tests.length ? (
						<Block title="テスト">
							<p className="text-sm text-fg-muted">作業台（Storybook）で、次の操作を自動で確かめている。</p>
							<Bullets items={tests.map((t) => t.name)} />
						</Block>
					) : null}
				</Section>
			) : null}

			{related.length ? (
				<Section id="related" title="関連コンポーネント">
					<ul className="flex flex-wrap gap-2">
						{related.map((r) => (
							<li key={r.location}>
								{r.path ? (
									<Link
										to={r.path}
										className="inline-flex rounded-md border border-line-subtle bg-surface-raised px-3 py-1.5 text-sm text-fg transition-colors duration-(--duration-fast) hover:border-brand hover:text-brand"
									>
										{r.location.split("/").at(-1)}
									</Link>
								) : (
									<span className="text-sm text-fg-muted">{r.location}</span>
								)}
							</li>
						))}
					</ul>
				</Section>
			) : null}
		</article>
	);
}

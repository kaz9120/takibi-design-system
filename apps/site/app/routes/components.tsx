import { PageHeader } from "../components/page-header";
import { allComponents } from "../lib/components.server";
import { CATEGORIES, SITE_NAME } from "../lib/site";
import type { Route } from "./+types/components";

export async function loader() {
	const list = await allComponents();
	return {
		groups: CATEGORIES.map((cat) => ({
			category: cat,
			items: list
				.filter((c) => c.category === cat)
				.map((c) => ({ path: `/components/${c.slug}`, name: c.name, summary: c.summary })),
		})).filter((g) => g.items.length),
		count: list.length,
	};
}

export function meta() {
	return [{ title: `コンポーネント | ${SITE_NAME}` }];
}

export default function Components({ loaderData }: Route.ComponentProps) {
	return (
		<div>
			<PageHeader
				title="コンポーネント"
				description={`React のコンポーネント ${loaderData.count} 種。振る舞いは Base UI に任せ、見た目と動きをこのパッケージで決めている。`}
			/>
			<div className="flex flex-col gap-12">
				{loaderData.groups.map((g) => (
					<section key={g.category} className="flex flex-col gap-3">
						<h2 className="text-lg font-semibold text-fg-strong">{g.category}</h2>
						<ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
							{g.items.map((c) => (
								<li key={c.path}>
									<a
										href={c.path}
										className="motion-press-surface flex h-full flex-col gap-1 rounded-lg border border-line-subtle bg-surface-raised p-4 transition-colors duration-(--duration-fast) hover:border-line-strong"
									>
										<span className="font-medium text-fg-strong">{c.name}</span>
										{c.summary && <span className="text-sm leading-relaxed text-fg-muted">{c.summary}</span>}
									</a>
								</li>
							))}
						</ul>
					</section>
				))}
			</div>
		</div>
	);
}

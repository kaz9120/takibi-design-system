import { Link, Outlet, useLocation } from "react-router";
import { NavList, NavListGroup, NavListItem, NavListLabel, ThemeToggle } from "takibi-design-system";
import markUrl from "takibi-design-system/assets/logo/mark-cream.svg?url";
import { allComponents } from "../lib/components.server";
import { allDocs } from "../lib/content.server";
import { CATEGORIES, SECTIONS, SITE_NAME } from "../lib/site";
import type { Route } from "./+types/layout";

type NavItem = { path: string; label: string };
type NavGroup = { label: string; items: NavItem[] };

export async function loader() {
	const docs = allDocs();
	const components = await allComponents();
	const groups: NavGroup[] = [{ label: "はじめに", items: [{ path: "/", label: "Takibi Design System" }] }];
	for (const s of SECTIONS) {
		const index = docs.find((d) => d.path === s.path);
		const items = [
			...(index ? [{ path: s.path, label: "概要" }] : []),
			...docs.filter((d) => d.path.startsWith(`${s.path}/`)).map((d) => ({ path: d.path, label: d.title })),
		];
		groups.push({ label: s.label, items });
		// コンポーネントはプロダクトの節の下に、分類ごとに並べる
		if (s.path === "/product") {
			items.push({ path: "/components", label: "コンポーネント" });
			for (const cat of CATEGORIES) {
				const list = components
					.filter((c) => c.category === cat)
					.map((c) => ({ path: `/components/${c.slug}`, label: c.name }));
				if (list.length) groups.push({ label: cat, items: list });
			}
		}
	}
	return { groups };
}

function Nav({ groups, current }: { groups: NavGroup[]; current: string }) {
	return (
		<NavList aria-label="サイトのメニュー">
			{groups.map((g) => (
				<NavListGroup key={g.label}>
					<NavListLabel>{g.label}</NavListLabel>
					{g.items.map((item) => (
						<NavListItem
							key={item.path}
							active={item.path === current}
							render={<Link to={item.path} prefetch="intent" />}
						>
							{item.label}
						</NavListItem>
					))}
				</NavListGroup>
			))}
		</NavList>
	);
}

/** ページの下に置く、メニューの順で前と次のページへのリンク */
function Pager({ groups, current }: { groups: NavGroup[]; current: string }) {
	const pages = groups.flatMap((g) => g.items.map((item) => ({ ...item, group: g.label })));
	const i = pages.findIndex((p) => p.path === current);
	if (i < 0) return null;
	const prev = pages[i - 1];
	const next = pages[i + 1];
	const link = (p: (typeof pages)[number], dir: "prev" | "next") => (
		<Link
			to={p.path}
			prefetch="intent"
			className={`motion-press-surface flex flex-1 flex-col gap-1 rounded-lg border border-line-subtle bg-surface-raised p-4 transition-colors duration-(--duration-fast) hover:border-line-strong ${dir === "next" ? "items-end text-right" : ""}`}
		>
			<span className="text-sm text-fg-muted">{dir === "prev" ? "前へ" : "次へ"}</span>
			<span className="font-medium text-fg-strong">{p.label === "概要" ? `${p.group}の概要` : p.label}</span>
		</Link>
	);
	return (
		<nav
			aria-label="前後のページ"
			className="mt-16 flex flex-col gap-3 border-t border-line-subtle pt-8 sm:flex-row"
		>
			{prev ? link(prev, "prev") : <span className="hidden flex-1 sm:block" />}
			{next ? link(next, "next") : <span className="hidden flex-1 sm:block" />}
		</nav>
	);
}

export default function Layout({ loaderData }: Route.ComponentProps) {
	const { pathname } = useLocation();
	const current = pathname.replace(/\/$/, "") || "/";
	return (
		<div className="min-h-dvh">
			<header className="sticky top-0 z-30 border-b border-line-subtle bg-surface/90 backdrop-blur">
				<div className="mx-auto flex h-14 max-w-(--container-app) items-center gap-3 px-4 md:px-6">
					<Link to="/" className="flex items-center gap-2.5 text-fg-strong">
						<img src={markUrl} alt="" className="size-6" />
						<span className="font-semibold tracking-snug">{SITE_NAME}</span>
					</Link>
					<div className="ml-auto flex items-center gap-1">
						<a
							href={current === "/" ? "/index.md" : `${current}.md`}
							className="rounded-md px-2.5 py-1.5 font-mono text-xs text-fg-muted hover:bg-surface-hover hover:text-fg"
						>
							.md
						</a>
						<ThemeToggle />
					</div>
				</div>
			</header>
			<div className="mx-auto flex max-w-(--container-app) gap-10 px-4 md:px-6">
				<aside className="sticky top-14 hidden h-[calc(100dvh-3.5rem)] w-60 shrink-0 overflow-y-auto py-8 md:block">
					<Nav groups={loaderData.groups} current={current} />
				</aside>
				<main className="min-w-0 flex-1 py-10 md:py-14">
					<details className="mb-8 rounded-lg border border-line-subtle bg-surface-raised p-3 md:hidden">
						<summary className="cursor-pointer text-sm font-medium text-fg">メニュー</summary>
						<div className="mt-3">
							<Nav groups={loaderData.groups} current={current} />
						</div>
					</details>
					<Outlet />
					<Pager groups={loaderData.groups} current={current} />
				</main>
			</div>
		</div>
	);
}

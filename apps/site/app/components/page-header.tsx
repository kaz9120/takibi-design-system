/** ページの冒頭。小見出し、題、説明 */
export function PageHeader({
	eyebrow,
	title,
	description,
}: {
	eyebrow?: string;
	title: string;
	description?: string;
}) {
	return (
		<header className="mb-10 flex max-w-(--container-prose) flex-col gap-3">
			{eyebrow && <p className="font-mono text-xs tracking-mark text-fg-subtle uppercase">{eyebrow}</p>}
			<h1 className="text-3xl font-semibold tracking-tight text-fg-strong md:text-4xl">{title}</h1>
			{description && <p className="text-lg leading-relaxed text-fg-muted">{description}</p>}
		</header>
	);
}

/** 子のページへのリンクを並べる */
export function PageCards({ items }: { items: { path: string; title: string; description?: string }[] }) {
	return (
		<ul className="grid gap-3 sm:grid-cols-2">
			{items.map((item) => (
				<li key={item.path}>
					<a
						href={item.path}
						className="motion-press-surface flex h-full flex-col gap-1.5 rounded-lg border border-line-subtle bg-surface-raised p-4 transition-colors duration-(--duration-fast) hover:border-line-strong"
					>
						<span className="font-medium text-fg-strong">{item.title}</span>
						{item.description && (
							<span className="text-sm leading-relaxed text-fg-muted">{item.description}</span>
						)}
					</a>
				</li>
			))}
		</ul>
	);
}

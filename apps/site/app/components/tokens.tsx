import tokens from "takibi-design-system/tokens.json";

type Token = { value: string; light?: string; description?: string; css: string };

const isToken = (x: unknown): x is Token => typeof x === "object" && x !== null && "css" in x;
const flat = (group: unknown): [string, Token][] =>
	Object.entries(group as Record<string, unknown>).flatMap(([k, v]) =>
		isToken(v)
			? [[k, v] as [string, Token]]
			: flat(v).map(([kk, vv]) => [`${k}-${kk}`, vv] as [string, Token]),
	);

function Section({
	title,
	description,
	children,
}: {
	title: string;
	description?: string;
	children: React.ReactNode;
}) {
	return (
		<section className="mt-14 flex flex-col gap-4">
			<div className="flex flex-col gap-1">
				<h2 className="text-xl font-semibold text-fg-strong">{title}</h2>
				{description && <p className="text-sm text-fg-muted">{description}</p>}
			</div>
			{children}
		</section>
	);
}

function Rows({ rows, preview }: { rows: [string, Token][]; preview: (t: Token) => React.ReactNode }) {
	return (
		<div className="overflow-x-auto">
			<table className="w-full border-collapse text-sm">
				<thead>
					<tr className="text-left text-fg-muted">
						<th className="w-24 py-2 pr-4 font-medium">見本</th>
						<th className="py-2 pr-4 font-medium">トークン</th>
						<th className="py-2 pr-4 font-medium">夜</th>
						<th className="py-2 pr-4 font-medium">昼</th>
						<th className="py-2 font-medium">使い方</th>
					</tr>
				</thead>
				<tbody>
					{rows.map(([name, t]) => (
						<tr key={name} className="border-t border-line-subtle align-middle">
							<td className="py-2.5 pr-4">{preview(t)}</td>
							<td className="py-2.5 pr-4 font-mono text-xs text-fg-strong whitespace-nowrap">{t.css}</td>
							<td className="max-w-48 py-2.5 pr-4 font-mono text-xs break-all text-fg-muted">{t.value}</td>
							<td className="max-w-48 py-2.5 pr-4 font-mono text-xs break-all text-fg-muted">
								{t.light ?? "—"}
							</td>
							<td className="py-2.5 text-fg-muted">{t.description}</td>
						</tr>
					))}
				</tbody>
			</table>
		</div>
	);
}

const swatch = (t: Token) => (
	<span
		className="block h-8 w-16 rounded-md border border-line-subtle"
		style={{ background: `var(${t.css})` }}
	/>
);

function ColorTokens() {
	const roles = flat(tokens.color);
	const pick = (prefix: string) => roles.filter(([n]) => n.startsWith(prefix));
	return (
		<>
			<Section title="サーフェス" description="画面の奥行きを 4 段の面で表す。">
				<Rows rows={pick("surface")} preview={swatch} />
			</Section>
			<Section title="文字">
				<Rows rows={pick("fg")} preview={swatch} />
			</Section>
			<Section title="線">
				<Rows rows={pick("line")} preview={swatch} />
			</Section>
			<Section title="ブランド" description="CTA、リンク、フォーカス、ロゴだけに使う。">
				<Rows rows={[...pick("brand"), ...pick("focus"), ...pick("thumb")]} preview={swatch} />
			</Section>
			<Section title="状態" description="色だけに頼らず、アイコンか文言を添える。">
				<Rows rows={roles.filter(([n]) => /^(success|warning|danger|info)/.test(n))} preview={swatch} />
			</Section>
			<Section title="系列（グラフ）">
				<Rows rows={pick("chart")} preview={swatch} />
			</Section>
			<Section title="基本の色" description="値の一覧。画面からは直接使わず、役割のトークンを通して使う。">
				<Rows rows={flat(tokens.palette)} preview={swatch} />
			</Section>
		</>
	);
}

function TypographyTokens() {
	const sizes = flat(tokens.text).filter(([n]) => !n.endsWith("line-height"));
	return (
		<>
			<Section title="大きさ">
				<Rows
					rows={sizes}
					preview={(t) => (
						<span className="text-fg-strong" style={{ fontSize: `var(${t.css})`, lineHeight: 1.2 }}>
							火
						</span>
					)}
				/>
			</Section>
			<Section title="書体">
				<Rows
					rows={flat(tokens.font)}
					preview={(t) => <span style={{ fontFamily: `var(${t.css})` }}>Aa あ</span>}
				/>
			</Section>
			<Section title="字間">
				<Rows
					rows={flat(tokens.tracking)}
					preview={(t) => <span style={{ letterSpacing: `var(${t.css})` }}>TAKIBI</span>}
				/>
			</Section>
		</>
	);
}

function ShapeTokens() {
	return (
		<>
			<Section title="角丸">
				<Rows
					rows={flat(tokens.radius)}
					preview={(t) => (
						<span
							className="block size-10 border border-line-strong bg-surface-raised"
							style={{ borderRadius: `var(${t.css})` }}
						/>
					)}
				/>
			</Section>
			<Section
				title="影と光"
				description="夜は黒い影が見えにくいので、上の縁の明るい線とブランドの色の光で奥行きを出す。"
			>
				<Rows
					rows={flat(tokens.shadow)}
					preview={(t) => (
						<span
							className="block h-10 w-16 rounded-lg bg-surface-raised"
							style={{ boxShadow: `var(${t.css})` }}
						/>
					)}
				/>
			</Section>
		</>
	);
}

function MotionTokens() {
	return (
		<>
			<Section title="時間">
				<Rows rows={flat(tokens.duration)} preview={() => null} />
			</Section>
			<Section title="曲線">
				<Rows rows={flat(tokens.ease)} preview={() => null} />
			</Section>
			<Section title="振れ幅">
				<Rows rows={flat(tokens.motion)} preview={() => null} />
			</Section>
		</>
	);
}

function LayoutTokens() {
	return (
		<>
			<Section title="幅">
				<Rows rows={flat(tokens.container)} preview={() => null} />
			</Section>
			<Section title="大きさ">
				<Rows rows={flat(tokens.size)} preview={() => null} />
			</Section>
		</>
	);
}

/** 基本要素のページの下に出すトークンの表。slug は content/basics/ のファイル名 */
export function BasicsTokens({ slug }: { slug: string }) {
	if (slug === "color") return <ColorTokens />;
	if (slug === "typography") return <TypographyTokens />;
	if (slug === "shape") return <ShapeTokens />;
	if (slug === "layout") return <LayoutTokens />;
	if (slug === "motion") return <MotionTokens />;
	return null;
}

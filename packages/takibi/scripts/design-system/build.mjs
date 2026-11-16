// Claude の「Design System」に載せるファイルを build/design-system/ に書き出す。
// 正はこのリポジトリ。Claude 側へは、書き出したファイルを Claude Code から公開して一方向に流す（README.md を参照）。
//
//   bun scripts/design-system/build.mjs                       すべてのコンポーネント
//   bun scripts/design-system/build.mjs --only button,dialog  一部だけ
//
// 先に `bun run build:site` を通しておく。コンポーネントのガイドラインは、サイトが書き出す Markdown を使う。
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import * as esbuild from "esbuild";

const here = import.meta.dirname;
const pkgDir = path.resolve(here, "../..");
const repoDir = path.resolve(pkgDir, "../..");
const outDir = path.join(pkgDir, "build/design-system");
const projectDir = path.join(outDir, "project");
const uploadsDir = path.join(outDir, "uploads");
const componentsSrc = path.join(pkgDir, "src/components");
const siteComponents = path.join(repoDir, "apps/site/build/client/components");
const contentDir = path.join(repoDir, "content");
const SITE_URL = "https://design-system.y-kaz.com";
const TITLE = "Takibi Design System";
const NAMESPACE = "Takibi";

const pkg = JSON.parse(fs.readFileSync(path.join(pkgDir, "package.json"), "utf8"));
const published = JSON.parse(fs.readFileSync(path.join(here, "published.json"), "utf8"));
const onlyArg = process.argv.find((a) => a.startsWith("--only"));
const only = onlyArg
	? (onlyArg.includes("=") ? onlyArg.split("=")[1] : process.argv[process.argv.indexOf(onlyArg) + 1]).split(
			",",
		)
	: null;

const run = (cmd, args, opts = {}) => execFileSync(cmd, args, { stdio: "inherit", ...opts });
const git = (...args) => execFileSync("git", args, { cwd: repoDir, encoding: "utf8" }).trim();
const write = (rel, text) => {
	const p = path.join(projectDir, rel);
	fs.mkdirSync(path.dirname(p), { recursive: true });
	fs.writeFileSync(p, text);
};

fs.rmSync(outDir, { recursive: true, force: true });
fs.mkdirSync(projectDir, { recursive: true });

// ---- コンポーネントの一覧（ストーリーのファイルから） ----
const components = fs
	.readdirSync(componentsSrc)
	.filter((n) => n.endsWith(".stories.tsx"))
	.sort()
	.map((file) => {
		const slug = file.replace(/\.stories\.tsx$/, "");
		const source = fs.readFileSync(path.join(componentsSrc, file), "utf8");
		const title = source.match(/title:\s*"([^"]+)"/)?.[1];
		if (!title) throw new Error(`${file} に title がありません`);
		const [, group, name] = title.split("/");
		const order = [...source.matchAll(/^export const (\w+)/gm)].map((m) => m[1]);
		// 同じ名前の部品を export しているか。していなければ（BulkSelect、Toast など）見本のカードにする
		const compPath = path.join(componentsSrc, `${slug}.tsx`);
		const compSource = fs.existsSync(compPath) ? fs.readFileSync(compPath, "utf8") : "";
		const exported = new RegExp(`export\\s+(?:function|const|class)\\s+${name}\\b`).test(compSource);
		return { slug, name, group, order, exported };
	})
	.filter((c) => !only || only.includes(c.slug));
if (only && components.length !== only.length)
	throw new Error(`見つからないコンポーネントがあります: ${only.join(",")}`);

// ---- tokens.json ----
run("bun", ["scripts/tokens.mjs"], { cwd: pkgDir });
const src = JSON.parse(fs.readFileSync(path.join(pkgDir, "dist/tokens.json"), "utf8"));

/** rgb(1 2 3 / 0.5) を rgba(1, 2, 3, 0.5) にする。Design System が確実に読める書き方にそろえる */
const plainColor = (v) =>
	v
		.replace(/rgb\((\d+)\s+(\d+)\s+(\d+)\s*\/\s*([\d.]+)\)/g, "rgba($1, $2, $3, $4)")
		.replace(/^#[0-9A-F]+$/i, (h) => h.toLowerCase());
const nameOf = (t) => t.css.replace(/^--/, "");
const leaves = (node) =>
	node && typeof node === "object" && "css" in node ? [node] : Object.values(node ?? {}).flatMap(leaves);

const PALETTE_USAGE = "基本の色。画面からは直接使わず、役割のトークンを通して使う";
// tokens.css で行末のコメントがなく、まとまりの上のコメントで決まりを書いている役割の色
const ROLE_USAGE = {
	"color-brand": "ブランドカラー。CTA、リンク、フォーカス、ロゴだけに使う",
	"color-brand-soft": "選択中の項目の背景",
	"color-focus": "フォーカスの輪郭",
	"color-thumb": "スライダーのハンドル。夜は明るい文字色、昼は浮いている面の色",
	"color-success": "成功の文字・アイコン。面に載せて 4.5:1 以上",
	"color-warning": "注意の文字・アイコン。面に載せて 4.5:1 以上",
	"color-danger": "エラーと取り消せない操作の文字・アイコン。面に載せて 4.5:1 以上",
	"color-info": "お知らせの文字・アイコン。面に載せて 4.5:1 以上",
};
function roleUsage(name) {
	if (ROLE_USAGE[name]) return ROLE_USAGE[name];
	if (name.endsWith("-hover")) return `${name.replace(/^color-|-hover$/g, "")} の hover のとき`;
	if (name.endsWith("-active")) return `${name.replace(/^color-|-active$/g, "")} を押している間`;
	if (name.endsWith("-soft")) return `${name.replace(/^color-|-soft$/g, "")} の状態を知らせる面の背景`;
	if (name.startsWith("color-chart-")) return "グラフの系列の色。番号の順に使い、暖色が隣り合わないよう寒色を挟んである";
	return name.replace(/^color-/, "");
}

const colorToken = (t, palette) => {
	const name = nameOf(t);
	const value = t.light ? { dark: plainColor(t.value), light: plainColor(t.light) } : plainColor(t.value);
	const usage = t.description ?? (palette ? PALETTE_USAGE : roleUsage(name));
	return { name, value, usage };
};

const tokens = {
	name: TITLE,
	version: 1,
	color: {
		themes: [
			{ id: "dark", name: "夜（既定）" },
			{ id: "light", name: "昼" },
		],
		tokens: [
			...leaves(src.color).map((t) => colorToken(t, false)),
			...leaves(src.palette).map((t) => colorToken(t, true)),
		],
	},
	type: {
		fonts: [],
		families: {
			sans: src.font.sans.value,
			mono: src.font.mono.value,
		},
		groups: [
			{
				name: "文字の大きさ",
				family: "sans",
				styles: Object.entries(src.text)
					.filter(([k]) => !k.endsWith("-line-height"))
					.map(([k, t]) => ({
						name: `type-${k}`,
						fontSize: t.value,
						lineHeight: src.text[`${k}-line-height`]?.value,
						fontWeight: 400,
						usage: `Tailwind のクラスは text-${k}。${t.description ?? ""}`.replace(/。$/, ""),
					})),
			},
		],
	},
	spacing: {
		note: "Tailwind の既定の間隔をそのまま使う。p-4 は 4 × 4px = 16px",
		tokens: [
			{ name: "spacing", value: "0.25rem", usage: "間隔の単位（4px）。p-*、gap-* などの数字に掛ける" },
		],
	},
	radius: {
		tokens: leaves(src.radius).map((t) => ({
			name: nameOf(t),
			value: t.value,
			usage: t.description ?? nameOf(t),
		})),
	},
	shadow: {
		note: "夜は黒い影が見えにくいので、上の縁の明るい線（rim）とブランドカラーの光（glow）で奥行きを出す",
		tokens: leaves(src.shadow).map((t) => ({
			name: nameOf(t),
			value: t.light ? { dark: plainColor(t.value), light: plainColor(t.light) } : plainColor(t.value),
			usage: t.description ?? `Tailwind のクラスは ${nameOf(t)}`,
		})),
	},
	tracking: {
		tokens: leaves(src.tracking).map((t) => ({
			name: nameOf(t),
			value: t.value,
			usage: t.description ?? `字間。Tailwind のクラスは ${nameOf(t)}`,
		})),
	},
	container: {
		tokens: leaves(src.container).map((t) => ({
			name: nameOf(t),
			value: t.value,
			usage: `内容の最大幅。Tailwind のクラスは max-w-(--${nameOf(t)})`,
		})),
	},
	meta: {
		source: "github",
		repo: "kaz9120/takibi-design-system",
		ref: `main@${git("rev-parse", "--short", "HEAD")}`,
		package: "packages/takibi",
		version: pkg.version,
		paths: { tokens: ["packages/takibi/src/tokens.css"], docs: ["content/"] },
		synced: new Date().toISOString().slice(0, 10),
	},
};
write("tokens.json", `${JSON.stringify(tokens, null, "\t")}\n`);

// ---- bundle.js / bundle.css ----
const bundleTmp = path.join(outDir, "bundle-tmp");
run("bunx", ["--bun", "vite", "build", "-c", path.join(here, "vite.config.mjs")], {
	cwd: pkgDir,
	env: { ...process.env, DS_OUT_DIR: bundleTmp },
});
{
	let js = fs.readFileSync(path.join(bundleTmp, "bundle.js"), "utf8");
	// プレビューはスクリプトを HTML に埋め込むので、HTML のコメントの始まりを文字列の中でだけ書き換える
	js = js.replaceAll("<!--", "\\x3C!--");
	// 公開の窓口は U+FFFD をそのまま受け付けないので、文字列の中のエスケープに置き換える
	js = js.replaceAll("�", "\\uFFFD");
	if (/<\/script/i.test(js)) throw new Error("bundle.js に </script があります");
	const header = { format: 4, namespace: NAMESPACE, components: components.filter((c) => c.exported).map((c) => ({ name: c.name })),
	};
	js = `/* @ds-bundle: ${JSON.stringify(header)} */\n${js}`;
	if (Buffer.byteLength(js) > 6 * 1024 * 1024) throw new Error("bundle.js が 6 MB を超えました");
	write("components/bundle.js", js);
	const css = fs.readFileSync(path.join(bundleTmp, "bundle.css"), "utf8");
	if (/<\/style/i.test(css)) throw new Error("bundle.css に </style があります");
	write("components/bundle.css", css);
	fs.rmSync(bundleTmp, { recursive: true });
}

// ---- React 19（プレビューが読む。Design System の既定は React 18 なので自前で持つ） ----
const reactShim = {
	name: "window-react",
	setup(build) {
		build.onResolve({ filter: /^react$/ }, () => ({ path: "react", namespace: "window-react" }));
		build.onLoad({ filter: /.*/, namespace: "window-react" }, () => ({
			contents: "module.exports = window.React;",
		}));
	},
};
const libs = [
	{
		name: "react",
		global: "React",
		file: "components/lib/react.js",
		code: 'import * as R from "react"; window.React = R;',
	},
	{
		name: "react-dom",
		global: "ReactDOM",
		file: "components/lib/react-dom.js",
		code: 'import * as D from "react-dom"; import * as C from "react-dom/client"; window.ReactDOM = Object.assign({}, D, C);',
		plugins: [reactShim],
	},
];
for (const lib of libs) {
	await esbuild.build({
		stdin: { contents: lib.code, resolveDir: pkgDir },
		bundle: true,
		format: "iife",
		minify: true,
		define: { "process.env.NODE_ENV": '"production"' },
		plugins: lib.plugins ?? [],
		outfile: path.join(projectDir, lib.file),
		logLevel: "warning",
	});
}
const reactVersion = JSON.parse(
	fs.readFileSync(path.join(repoDir, "node_modules/react/package.json"), "utf8"),
).version;

// ---- 型（ドキュメントとして載せる） ----
const dtsDir = path.join(outDir, "dts");
run(
	"bunx",
	["tsc", "-p", ".", "--noEmit", "false", "--declaration", "--emitDeclarationOnly", "--outDir", dtsDir],
	{
		cwd: pkgDir,
	},
);
{
	const parts = [];
	for (const c of components) {
		const p = path.join(dtsDir, "src/components", `${c.slug}.d.ts`);
		if (!fs.existsSync(p)) continue;
		const text = fs.readFileSync(p, "utf8");
		write(`components/${c.name}/${c.name}.d.ts`, text);
		parts.push(`// ---- ${c.name} ----\n${text}`);
	}
	write("components/index.d.ts", parts.join("\n"));
	fs.rmSync(dtsDir, { recursive: true });
}

// ---- コンポーネントのガイドラインとプレビュー ----
const OVERLAY = new Set(["オーバーレイ"]);
for (const c of components) {
	const mdPath = path.join(siteComponents, `${c.slug}.md`);
	if (!fs.existsSync(mdPath))
		throw new Error(`${mdPath} がありません。先に bun run build:site を通してください`);
	// 1 文目が要約になるので、サイトの引用の形（> 要約）を地の文に戻す
	const md = fs.readFileSync(mdPath, "utf8").replace(/^(# .+\n\n)> (.+)\n/, "$1$2\n");
	write(`components/${c.name}/README.md`, md);
	const height = OVERLAY.has(c.group) ? 480 : 320;
	write(
		`components/${c.name}/preview.html`,
		`<!-- @dsCard group="${c.group}" height=${height}${c.exported ? "" : " page"} -->
<!doctype html>
<html lang="ja">
<head><meta charset="utf-8"><title>${c.name}</title>
<style>html, body { margin: 0; background: var(--color-surface); color: var(--color-fg); font-family: var(--font-sans); }</style>
</head>
<body>
<div id="root" class="min-h-screen bg-surface font-sans text-fg"></div>
<script>window.${NAMESPACE}.__renderStories(${JSON.stringify(c.slug)}, document.getElementById("root"), ${JSON.stringify(c.order)});</script>
</body>
</html>
`,
	);
}
write("components/Cover/preview.html", fs.readFileSync(path.join(here, "cover.html"), "utf8"));

// ---- README と読み物（content/ から） ----
function readDoc(file) {
	const raw = fs.readFileSync(file, "utf8");
	const m = raw.match(/^---\n([\s\S]*?)\n---\n/);
	const fm = Object.fromEntries(
		(m?.[1] ?? "")
			.split("\n")
			.map((l) => [l.slice(0, l.indexOf(":")).trim(), l.slice(l.indexOf(":") + 1).trim()]),
	);
	const body = raw
		.slice(m ? m[0].length : 0)
		.trim()
		// サイト内のリンクは、Claude 側からも開けるように絶対 URL にする
		.replace(/\]\(\/(?!\/)/g, `](${SITE_URL}/`);
	return { title: fm.title, order: Number(fm.order ?? 99), body };
}
write("README.md", `${readDoc(path.join(contentDir, "index.md")).body}\n`);
{
	let n = 1;
	for (const section of ["basics", "product", "communication"]) {
		const docs = fs
			.readdirSync(path.join(contentDir, section))
			.filter((f) => f.endsWith(".md"))
			.map((f) => ({ f, ...readDoc(path.join(contentDir, section, f)) }))
			.sort((a, b) => a.order - b.order);
		for (const d of docs) {
			const name = d.f === "index.md" ? "index" : d.f.replace(/\.md$/, "");
			write(
				`guidelines/${String(n++).padStart(2, "0")}-${section}-${name}.md`,
				`# ${d.title}\n\n${d.body}\n`,
			);
		}
	}
}

// ---- ロゴ（アセットとしてアップロードする。ここではアップロード用に写すだけ） ----
const logoSrc = path.join(pkgDir, "assets/logo");
fs.mkdirSync(path.join(uploadsDir, "Logos"), { recursive: true });
for (const f of fs
	.readdirSync(logoSrc)
	.filter((f) => f.endsWith(".svg"))
	.sort())
	fs.copyFileSync(path.join(logoSrc, f), path.join(uploadsDir, "Logos", f));
write(
	"assets/Logos/README.md",
	`# Logos

- \`mark-cream.svg\`: 夜（暗い背景）に置くマーク。色は生成り、薄い茶、茶の 3 色で、色の指定はファイルに含まれる
- \`mark-dark.svg\`: 昼（明るい背景）に置くマーク。色は濃い茶系で、色の指定はファイルに含まれる
- どちらも 142 × 142 の正方形。CSS の color では色が変わらない
`,
);

// ---- 目次（design-system.json） ----
const logoRecords = published.assets?.Logos ?? {};
const index = {
	v: 3,
	layout: "files",
	createdOnFiles: { v: 1, at: published.createdAt ?? new Date().toISOString() },
	title: TITLE,
	namespace: NAMESPACE,
	libraries: libs.map((l) => ({ name: l.name, version: reactVersion, global: l.global, file: l.file })),
	sections: {},
	groups: ["Logos"],
	assetGroups: {
		Logos: {
			name: "Logos",
			tile: "m",
			order: Object.keys(logoRecords),
			files: logoRecords,
		},
	},
	blobs: {},
	docs: { readme: "project/README.md", sections: [] },
	lastChange: {
		by: git("config", "user.name") || "Claude",
		at: new Date().toISOString(),
		via: `GitHub · kaz9120/takibi-design-system@${git("rev-parse", "--short", "HEAD")}`,
		note: `takibi-design-system ${pkg.version} から同期（コンポーネント ${components.length} 個）`,
	},
};
write("design-system.json", `${JSON.stringify(index, null, "\t")}\n`);

// ---- 公開に使うファイルの一覧 ----
const files = [];
const walk = (dir) => {
	for (const n of fs.readdirSync(dir).sort()) {
		const p = path.join(dir, n);
		if (fs.statSync(p).isDirectory()) walk(p);
		else files.push(path.relative(outDir, p));
	}
};
walk(projectDir);
fs.writeFileSync(path.join(outDir, "files.json"), `${JSON.stringify(files, null, "\t")}\n`);
console.log(`build/design-system: ${files.length} ファイル（コンポーネント ${components.length} 個）`);

// src/tokens.css から、Tailwind を使わない場所向けのトークンを書き出す。
//   dist/tokens.css  : 素の CSS 変数。夜が既定で、[data-theme="light"] で昼に切り替わる
//   dist/tokens.json : 値の一覧。var() を解いた実際の値（夜）と、昼で違えばその値、説明、CSS 変数名を持つ
//                      プロンプトや CSS を読まない道具から使う。W3C Design Tokens 形式は、Figma などとつなぐときに足す
// 正は src/tokens.css で、このスクリプトはそれを読むだけにする。
import fs from "node:fs";
import path from "node:path";

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const src = fs.readFileSync(path.join(root, "src/tokens.css"), "utf8");
const outDir = path.join(root, "dist");
const pkg = JSON.parse(fs.readFileSync(path.join(root, "package.json"), "utf8"));

/** ブロック（:root / @theme / [data-theme="light"]）ごとに、宣言と行末のコメントを取り出す */
function parse(css) {
	const blocks = { root: [], theme: [], light: [] };
	let current = null;
	let depth = 0;
	let buf = "";
	for (const raw of css.split("\n")) {
		const line = raw.trim();
		if (depth === 0) {
			if (line.startsWith(":root")) current = "root";
			else if (line.startsWith("@theme")) current = "theme";
			else if (line.startsWith('[data-theme="light"]')) current = "light";
			else continue;
			depth = 1;
			continue;
		}
		// @keyframes など、宣言でない入れ子は読み飛ばす
		if (depth > 1 || line.startsWith("@keyframes")) {
			depth += (line.match(/{/g) ?? []).length - (line.match(/}/g) ?? []).length;
			continue;
		}
		if (line === "}" && !buf) {
			depth = 0;
			current = null;
			continue;
		}
		if (!buf && !line.startsWith("--") && !line.startsWith("color-scheme")) continue;
		buf += (buf ? " " : "") + line;
		const end = buf.match(/^(.*?);\s*(?:\/\*\s*(.*?)\s*\*\/)?\s*$/);
		if (!end) continue;
		const decl = end[1];
		const comment = end[2] ?? "";
		buf = "";
		const i = decl.indexOf(":");
		const name = decl.slice(0, i).trim();
		const value = decl
			.slice(i + 1)
			.trim()
			.replace(/\(\s+/g, "(")
			.replace(/\s+\)/g, ")")
			.replace(/\s*,\s*/g, ", ");
		if (name.endsWith("*") || value === "initial") continue;
		blocks[current].push({ name, value, comment });
	}
	return blocks;
}

const { root: rootDecls, theme, light } = parse(src);
// @theme の --animate-* は keyframes と組なので、素の CSS には出さない
const themeDecls = theme.filter((d) => !d.name.startsWith("--animate-"));
const dark = [...rootDecls, ...themeDecls];

// 昼で値が変わる変数を var() で参照している宣言は、昼のブロックにも同じ文で出す。
// カスタムプロパティの var() は宣言した要素で解かれるので、:root のままだと夜の値が受け継がれてしまう
const lightNames = new Set(light.map((d) => d.name));
const refs = (d) => [...d.value.matchAll(/var\((--[\w-]+)\)/g)].map((m) => m[1]);
let changed = true;
const relight = [];
while (changed) {
	changed = false;
	for (const d of dark) {
		if (lightNames.has(d.name) || !refs(d).some((r) => lightNames.has(r))) continue;
		lightNames.add(d.name);
		relight.push(d);
		changed = true;
	}
}
const lightBlock = [...light, ...relight];

// ---- dist/tokens.css ----
const header = `/* takibi-design-system ${pkg.version} のトークン。src/tokens.css から scripts/tokens.mjs で生成。手で直さない */`;
const line = (d) => `\t${d.name}: ${d.value};${d.comment ? ` /* ${d.comment} */` : ""}`;
const css = `${header}
:root {
${dark.map(line).join("\n")}
}

[data-theme="light"] {
${lightBlock.map(line).join("\n")}
}
`;

// ---- dist/tokens.json ----
const lookup = (decls) => new Map(decls.map((d) => [d.name, d.value]));
const darkMap = lookup(dark);
const lightMap = new Map([...darkMap, ...lookup(light)]);
const resolve = (value, map, seen = new Set()) =>
	value.replace(/var\((--[\w-]+)\)/g, (_, ref) => {
		if (seen.has(ref) || !map.has(ref)) return `var(${ref})`;
		return resolve(map.get(ref), map, new Set([...seen, ref]));
	});

// [変数名の頭, JSON の置き場]。どれにも当たらないものは motion（振れ幅、間隔）か size に置く
const groups = [
	["--color-", "color"],
	["--font-", "font"],
	["--text-", "text"],
	["--tracking-", "tracking"],
	["--radius-", "radius"],
	["--shadow-", "shadow"],
	["--ease-", "ease"],
	["--duration-", "duration"],
	["--container-", "container"],
	["--ink-", "palette.ink"],
	["--ember-", "palette.ember"],
	["--smoke", "palette"],
	["--moss", "palette"],
	["--moon", "palette"],
	["--rust", "palette"],
	["--target-", "size.target"],
	["--", "motion"],
];

const tree = {};
const put = (keys, token) => {
	let node = tree;
	for (const k of keys.slice(0, -1)) node = node[k] ??= {};
	node[keys.at(-1)] = token;
};

const done = new Set();
for (const d of dark) {
	if (done.has(d.name) || d.name.startsWith("--elevation-") || d.name === "color-scheme") continue;
	done.add(d.name);
	const [prefix, at] = groups.find(([p]) => d.name.startsWith(p));
	// --text-sm--line-height は text.sm の子にせず、text.sm-line-height にする
	const rest = d.name.slice(prefix.length).replace("--", "-");
	const keys = [...at.split("."), rest || d.name.slice(2)].filter(Boolean);
	const value = resolve(d.value, darkMap);
	const lightValue = resolve(lightMap.get(d.name), lightMap);
	const token = { value };
	if (lightValue !== value) token.light = lightValue;
	if (d.comment) token.description = d.comment;
	token.css = d.name;
	put(keys, token);
}

const json = {
	$description: `takibi-design-system ${pkg.version} のトークン。value は夜（既定）の値、light は昼で違うときの値、css は CSS 変数名。src/tokens.css から生成`,
	...tree,
};

fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(path.join(outDir, "tokens.css"), css);
fs.writeFileSync(path.join(outDir, "tokens.json"), `${JSON.stringify(json, null, "\t")}\n`);
console.log(
	`dist/tokens.css: ${dark.length + lightBlock.length} 宣言 / dist/tokens.json: ${done.size} トークン`,
);

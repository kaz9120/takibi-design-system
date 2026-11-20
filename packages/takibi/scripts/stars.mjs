// 星のカタログ（HYG Database）から、<takibi-stars> と labs/sky が使う星を抜き出す。
//
// 使い方:
//   1. https://codeberg.org/astronexus/hyg の data/hyg/CURRENT/hyg_v44.csv.gz を取得して展開する
//   2. bun scripts/stars.mjs <展開した hyg_v44.csv のパス>
//
// HYG Database は v4.0 以降が CC BY-SA 4.0 で、v3.x は CC BY-SA 2.5。v4.0 より前の版は使わない。
// 書き出すファイルは元のデータを改変したものなので、同じ CC BY-SA 4.0 で配る。先頭の注記は消さない。

import { readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const VERSION = "v4.4";
const here = dirname(fileURLToPath(import.meta.url));
const csvPath = process.argv[2];
if (!csvPath) {
	console.error("使い方: bun scripts/stars.mjs <hyg_v44.csv のパス>");
	process.exit(1);
}

/** 引用符つきの項目を含む CSV の 1 行を分ける */
function split(line) {
	const out = [];
	let cur = "";
	let quoted = false;
	for (const ch of line) {
		if (ch === '"') quoted = !quoted;
		else if (ch === "," && !quoted) {
			out.push(cur);
			cur = "";
		} else cur += ch;
	}
	out.push(cur);
	return out;
}

const lines = readFileSync(csvPath, "utf8").split("\n").filter(Boolean);
const head = split(lines[0]);
const col = Object.fromEntries(["proper", "ra", "dec", "mag", "ci"].map((n) => [n, head.indexOf(n)]));

const stars = [];
for (const line of lines.slice(1)) {
	const f = split(line);
	if (f[col.proper] === "Sol") continue;
	const mag = Number.parseFloat(f[col.mag]);
	if (!Number.isFinite(mag)) continue;
	// 赤経は時で入っているので、度に直す。色指数が空の星は 0.6（太陽に近い白）とする
	const ci = Number.parseFloat(f[col.ci]);
	stars.push({
		ra: Number.parseFloat(f[col.ra]) * 15,
		dec: Number.parseFloat(f[col.dec]),
		mag,
		ci: Number.isFinite(ci) ? ci : 0.6,
	});
}
stars.sort((a, b) => a.ra - b.ra);

/** 小数 digits 桁に丸め、-0 を 0 にする */
const round = (v, digits) => {
	const r = Number(v.toFixed(digits));
	return r === 0 ? 0 : r;
};

function notice(count, limit, rounding) {
	return `/*!
 * @license CC-BY-SA-4.0
 * 星のデータ: HYG Database ${VERSION}（David Nash、https://codeberg.org/astronexus/hyg ）から抜き出して改変したもの。
 * 元のデータのライセンス: Creative Commons Attribution-ShareAlike 4.0 International（https://creativecommons.org/licenses/by-sa/4.0/ ）。
 * 改変の内容: ${limit} 等より明るい ${count} 個に絞り、赤経（時から度に換算）、赤緯、実視等級、色指数 B−V の 4 列だけを残し、${rounding}。色指数が空の星は 0.6 とした。
 * このファイルのデータも CC BY-SA 4.0 で配る。配り直すときは、この注記を残すこと。
 * Star data: adapted from the HYG Database ${VERSION} by David Nash (https://codeberg.org/astronexus/hyg),
 * licensed under CC BY-SA 4.0 (https://creativecommons.org/licenses/by-sa/4.0/). Changes: filtered to ${count} stars
 * brighter than magnitude ${limit}, reduced to 4 columns, values rounded. This data is distributed under CC BY-SA 4.0.
 */`;
}

function write(path, limit, digits, rounding, open, close) {
	const picked = stars.filter((s) => s.mag <= limit);
	const flat = picked.flatMap((s) => [
		round(s.ra, digits),
		round(s.dec, digits),
		round(s.mag, digits === 1 ? 1 : 2),
		round(s.ci, digits === 1 ? 1 : 2),
	]);
	const body = `${notice(picked.length, limit.toFixed(1), rounding)}
// 1 個につき 4 つの数値: 赤経（度、J2000）、赤緯（度）、実視等級、色指数 B−V。
// このファイルは scripts/stars.mjs が書き出す。手で直さない。
${open}[${flat.join(",")}]${close}
`;
	writeFileSync(path, body);
	console.log(`${path}: ${picked.length} 個（${(body.length / 1024).toFixed(1)}KB）`);
}

write(
	resolve(here, "../src/stars-data.js"),
	5.0,
	1,
	"0.1 刻みに丸めた",
	"// biome-ignore format: データ\nexport const STARS = ",
	";",
);
write(
	resolve(here, "../../../labs/sky/stars.js"),
	6.5,
	3,
	"位置は 0.001 度、等級と色指数は 0.01 刻みに丸めた",
	"window.TAKIBI_STARS = ",
	";",
);

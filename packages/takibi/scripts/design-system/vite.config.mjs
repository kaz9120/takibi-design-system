// bundle.js と bundle.css を作る。React はページの window.React / window.ReactDOM を使う
import path from "node:path";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";

const here = import.meta.dirname;
const outDir = process.env.DS_OUT_DIR;
if (!outDir) throw new Error("DS_OUT_DIR がありません");

export default defineConfig({
	root: here,
	logLevel: "warn",
	plugins: [tailwindcss()],
	esbuild: { jsx: "automatic" },
	resolve: {
		alias: [{ find: /^react\/jsx-(dev-)?runtime$/, replacement: path.join(here, "jsx-runtime.ts") }],
	},
	define: { "process.env.NODE_ENV": JSON.stringify("production") },
	build: {
		outDir,
		emptyOutDir: true,
		minify: true,
		lib: {
			entry: path.join(here, "entry.tsx"),
			formats: ["iife"],
			name: "Takibi",
			fileName: () => "bundle.js",
			cssFileName: "bundle",
		},
		rollupOptions: {
			external: ["react", "react-dom", "react-dom/client"],
			// "use client" は 1 つのファイルにまとめると意味を持たないので、その警告だけ黙らせる
			onwarn(warning, warn) {
				if (warning.code === "MODULE_LEVEL_DIRECTIVE") return;
				warn(warning);
			},
			output: {
				globals: { react: "React", "react-dom": "ReactDOM", "react-dom/client": "ReactDOM" },
				inlineDynamicImports: true,
			},
		},
	},
});

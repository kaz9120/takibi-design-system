import { reactRouter } from "@react-router/dev/vite";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";

export default defineConfig({
	plugins: [tailwindcss(), reactRouter()],
	// ルートより上の content/ と packages/ を読むので、開発サーバーに見せる範囲を広げる
	server: { fs: { allow: ["../.."] } },
});

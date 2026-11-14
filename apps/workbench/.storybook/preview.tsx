import type { Preview } from "@storybook/react-vite";
import { useEffect } from "react";
import { setTheme, Toaster, TooltipProvider } from "takibi-design-system";
import { ComponentPage } from "../src/docs/page/component-page";
import { takibiTheme } from "./theme";
import "./preview.css";

const preview: Preview = {
	// すべてのコンポーネントに、決まった見出しで並ぶコンポーネントページを付ける。基礎の章のストーリーは、各ファイルで外す
	tags: ["autodocs"],
	globalTypes: {
		theme: {
			description: "テーマ",
			toolbar: {
				title: "テーマ",
				icon: "mirror",
				items: [
					{ value: "dark", title: "夜（ダーク）", icon: "moon" },
					{ value: "light", title: "昼（ライト）", icon: "sun" },
				],
				dynamicTitle: true,
			},
		},
	},
	initialGlobals: { theme: "dark" },
	decorators: [
		(Story, context) => {
			const theme = context.globals.theme ?? "dark";
			useEffect(() => {
				setTheme(theme);
			}, [theme]);
			return (
				<TooltipProvider>
					<Story />
					<Toaster />
				</TooltipProvider>
			);
		},
	],
	parameters: {
		layout: "padded",
		docs: { theme: takibiTheme, page: ComponentPage },
		controls: { expanded: true },
		a11y: { test: "todo" },
		options: {
			storySort: {
				order: ["基礎", "コンポーネント", "ブランドの演出"],
			},
		},
	},
};

export default preview;

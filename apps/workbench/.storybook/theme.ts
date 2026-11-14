import { create } from "storybook/theming";

/** Storybook 自体の見た目。デザインシステムの夜の色に合わせる */
export const takibiTheme = create({
	base: "dark",
	brandTitle: "Takibi Design System",
	brandImage: "./mark-cream.svg",
	brandTarget: "_self",
	colorPrimary: "#f47d3a",
	colorSecondary: "#f47d3a",
	appBg: "#13110e",
	appContentBg: "#13110e",
	appPreviewBg: "#13110e",
	appBorderColor: "#3a342b",
	appBorderRadius: 6,
	barBg: "#1a1814",
	barTextColor: "#a8a094",
	barSelectedColor: "#f47d3a",
	textColor: "#ebe5d8",
	textMutedColor: "#a8a094",
	textInverseColor: "#13110e",
	inputBg: "#0a0907",
	inputBorder: "#5a5247",
	inputTextColor: "#ebe5d8",
	inputBorderRadius: 6,
	fontBase: '"Inter", "LINE Seed JP", system-ui, sans-serif',
	fontCode: '"JetBrains Mono", ui-monospace, monospace',
});

import type { StorybookConfig } from "@storybook/react-vite";
import tailwindcss from "@tailwindcss/vite";

const config: StorybookConfig = {
	stories: ["../src/**/*.stories.@(ts|tsx)", "../../../packages/takibi/src/**/*.stories.@(ts|tsx)"],
	addons: ["@storybook/addon-docs", "@storybook/addon-a11y"],
	framework: "@storybook/react-vite",
	staticDirs: ["../../../packages/takibi/assets/logo"],
	viteFinal: (config) => {
		config.plugins = [...(config.plugins ?? []), tailwindcss()];
		return config;
	},
};

export default config;

// ストーリーのモジュールを、コンポーネントごとに遅れて読み込む。例をブラウザで動かすときに使う
export const storyModules = import.meta.glob<Record<string, unknown>>(
	"../../../../packages/takibi/src/components/*.stories.tsx",
);

export function storyModuleFor(slug: string) {
	const key = Object.keys(storyModules).find((k) => k.endsWith(`/${slug}.stories.tsx`));
	return key ? storyModules[key] : undefined;
}

// Claude の Design System に載せる bundle.js の入口。
// コンポーネントを window.Takibi に出し、プレビューのカードはストーリーをそのまま描く。
import { composeStories } from "@storybook/react";
import * as React from "react";
import { createRoot } from "react-dom/client";
import { Toaster, TooltipProvider } from "../../src/index";
import "./entry.css";

export * from "../../src/index";

type StoryModule = Parameters<typeof composeStories>[0];
type Composed = React.ComponentType & { play?: unknown };

const modules = import.meta.glob<StoryModule>("../../src/components/*.stories.tsx", { eager: true });

function moduleFor(slug: string) {
	const key = Object.keys(modules).find((k) => k.endsWith(`/${slug}.stories.tsx`));
	return key ? modules[key] : undefined;
}

class Boundary extends React.Component<{ children: React.ReactNode }, { failed: boolean }> {
	state = { failed: false };
	static getDerivedStateFromError() {
		return { failed: true };
	}
	render() {
		return this.state.failed ? (
			<p className="text-sm text-fg-subtle">この例は表示できませんでした。</p>
		) : (
			this.props.children
		);
	}
}

/**
 * プレビューのカードから呼ぶ。コンポーネントのストーリーのうち、テスト（play を持つもの）を除いて縦に並べる。
 * TooltipProvider と Toaster は、アプリと同じく 1 回だけ外側に置く。
 */
export function __renderStories(slug: string, el: HTMLElement, order: string[] = []) {
	const mod = moduleFor(slug);
	if (!mod) throw new Error(`ストーリーがありません: ${slug}`);
	const composed = composeStories(mod) as Record<string, Composed>;
	// モジュールの export は名前順に並ぶので、ファイルに書いた順（order）に並べ直す
	const keys = [
		...order.filter((k) => k in composed),
		...Object.keys(composed).filter((k) => !order.includes(k)),
	];
	const stories = keys.flatMap((k) => {
		const s = composed[k];
		return s && !s.play ? [[k, s] as const] : [];
	});
	const nameOf = (key: string) =>
		(mod as unknown as Record<string, { name?: string } | undefined>)[key]?.name ?? key;
	createRoot(el).render(
		<TooltipProvider>
			<div className="flex flex-col gap-8 p-6">
				{stories.map(([key, Story]) => (
					<section key={key}>
						<h3 className="mb-3 text-sm text-fg-muted">{nameOf(key)}</h3>
						<Boundary>
							<Story />
						</Boundary>
					</section>
				))}
			</div>
			<Toaster />
		</TooltipProvider>,
	);
}

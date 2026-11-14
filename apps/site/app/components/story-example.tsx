import * as React from "react";
import { storyModuleFor } from "../lib/stories";

type Composed = Record<string, React.ComponentType>;

/** コンポーネントのストーリーを、ブラウザで読み込む。読み込むまでは null */
export function useStories(slug: string): Composed | null {
	const [stories, setStories] = React.useState<Composed | null>(null);
	React.useEffect(() => {
		let alive = true;
		// composeStories は Storybook の実行部を抱えて大きいので、例を描くときに遅れて読み込む
		const load = storyModuleFor(slug);
		if (load) {
			Promise.all([load(), import("@storybook/react")]).then(([mod, { composeStories }]) => {
				if (alive)
					setStories(composeStories(mod as Parameters<typeof composeStories>[0]) as unknown as Composed);
			});
		}
		return () => {
			alive = false;
		};
	}, [slug]);
	return stories;
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

/** ストーリー 1 つを、枠の中で動かす */
export function StoryExample({
	stories,
	exportName,
	name,
	description,
	showName = true,
}: {
	stories: Composed | null;
	exportName: string;
	name: string;
	description?: string;
	showName?: boolean;
}) {
	const Story = stories?.[exportName];
	return (
		<div className="flex flex-col gap-2">
			{showName && <h3 className="text-base font-semibold text-fg-strong">{name}</h3>}
			{description && (
				<p className="max-w-(--container-prose) text-sm leading-relaxed text-fg-muted">{description}</p>
			)}
			<div className="min-h-28 overflow-x-auto rounded-lg border border-line-subtle bg-surface p-6">
				{Story ? (
					<Boundary>
						<Story />
					</Boundary>
				) : (
					<div className="motion-ember-pulse h-16 rounded-md" aria-hidden />
				)}
			</div>
		</div>
	);
}

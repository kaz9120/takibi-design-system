import { ChevronRight, File, Folder, FolderOpen } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import * as React from "react";
import { cn } from "../lib/cn";
import { Glide, GlideGroup } from "../lib/glide";
import { springs } from "../lib/motion";

export type TreeNode = {
	/** ツリーの中で一意な値 */
	id: string;
	label: React.ReactNode;
	/** 文字を打って探すときに使う文字列。label が文字列なら省ける */
	textValue?: string;
	/** 省くと、親項目は開閉に合わせて変わるフォルダのアイコン、子がない項目はファイルのアイコンになる */
	icon?: React.ReactNode;
	/** 子の項目。空の配列なら、中身のないフォルダになる */
	children?: TreeNode[];
	disabled?: boolean;
};

export type TreeViewProps = Omit<React.ComponentProps<"ul">, "children" | "onSelect"> & {
	items: TreeNode[];
	/** 開いている項目の id */
	expanded?: string[];
	defaultExpanded?: string[];
	onExpandedChange?: (expanded: string[]) => void;
	/** 選んでいる項目の id */
	selected?: string | null;
	defaultSelected?: string | null;
	onSelectedChange?: (id: string) => void;
};

type Visible = { node: TreeNode; level: number; parentId: string | null };

function flatten(
	items: TreeNode[],
	expanded: Set<string>,
	level = 1,
	parentId: string | null = null,
): Visible[] {
	const out: Visible[] = [];
	for (const node of items) {
		out.push({ node, level, parentId });
		if (node.children && expanded.has(node.id))
			out.push(...flatten(node.children, expanded, level + 1, node.id));
	}
	return out;
}

function textOf(node: TreeNode) {
	return (node.textValue ?? (typeof node.label === "string" ? node.label : "")).toLowerCase();
}

function useControllable<T>(value: T | undefined, defaultValue: T, onChange?: (v: T) => void) {
	const [inner, setInner] = React.useState(defaultValue);
	const current = value !== undefined ? value : inner;
	const set = React.useCallback(
		(next: T) => {
			if (value === undefined) setInner(next);
			onChange?.(next);
		},
		[value, onChange],
	);
	return [current, set] as const;
}

type TreeContextValue = {
	expanded: Set<string>;
	selected: string | null;
	tabStop: string | null;
	toggle: (id: string) => void;
	select: (node: TreeNode) => void;
	focus: (id: string) => void;
	register: (id: string, el: HTMLLIElement | null) => void;
	reduce: boolean;
};

const TreeContext = React.createContext<TreeContextValue | null>(null);

/**
 * フォルダとファイルのように、入れ子になった項目を開閉しながらたどるツリー。
 * Tab でツリーに入り、上下の矢印で項目を移り、右で開いて子へ進み、左で閉じて親へ戻る。
 * Home と End で端へ、Enter か Space で選ぶ。文字を打つと、その文字で始まる項目へ移る。
 */
export function TreeView({
	items,
	expanded: expandedProp,
	defaultExpanded = [],
	onExpandedChange,
	selected: selectedProp,
	defaultSelected = null,
	onSelectedChange,
	className,
	onKeyDown,
	...props
}: TreeViewProps) {
	const [expandedList, setExpandedList] = useControllable(expandedProp, defaultExpanded, onExpandedChange);
	const [selected, setSelected] = useControllable<string | null>(
		selectedProp,
		defaultSelected,
		onSelectedChange as ((v: string | null) => void) | undefined,
	);
	const expanded = React.useMemo(() => new Set(expandedList), [expandedList]);
	const visible = React.useMemo(() => flatten(items, expanded), [items, expanded]);
	const [focused, setFocused] = React.useState<string | null>(null);
	const elements = React.useRef(new Map<string, HTMLLIElement>());
	const reduce = useReducedMotion() ?? false;
	const typeahead = React.useRef({ text: "", timer: 0 });

	// フォーカスが当たる場所は 1 つだけ。前に触った項目、選んでいる項目、先頭の順で選ぶ
	const isVisible = (id: string | null) => id !== null && visible.some((v) => v.node.id === id);
	const tabStop = isVisible(focused)
		? focused
		: isVisible(selected)
			? selected
			: (visible[0]?.node.id ?? null);

	const focus = React.useCallback((id: string) => {
		setFocused(id);
		elements.current.get(id)?.focus();
	}, []);

	const toggle = React.useCallback(
		(id: string) => {
			const next = new Set(expanded);
			if (next.has(id)) next.delete(id);
			else next.add(id);
			setExpandedList([...next]);
		},
		[expanded, setExpandedList],
	);

	const select = React.useCallback(
		(node: TreeNode) => {
			if (node.disabled) return;
			setSelected(node.id);
		},
		[setSelected],
	);

	const register = React.useCallback((id: string, el: HTMLLIElement | null) => {
		if (el) elements.current.set(id, el);
		else elements.current.delete(id);
	}, []);

	const handleKeyDown = (event: React.KeyboardEvent<HTMLUListElement>) => {
		onKeyDown?.(event);
		if (event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey) return;
		const index = visible.findIndex((v) => v.node.id === tabStop);
		const current = visible[index];
		if (!current) return;
		const { node, parentId } = current;
		const isParent = node.children !== undefined;
		const isOpen = expanded.has(node.id);
		let handled = true;
		switch (event.key) {
			case "ArrowDown": {
				const next = visible[index + 1];
				if (next) focus(next.node.id);
				break;
			}
			case "ArrowUp": {
				const prev = visible[index - 1];
				if (prev) focus(prev.node.id);
				break;
			}
			case "ArrowRight":
				if (isParent && !isOpen) toggle(node.id);
				else if (isParent && isOpen && node.children?.[0]) focus(node.children[0].id);
				break;
			case "ArrowLeft":
				if (isParent && isOpen) toggle(node.id);
				else if (parentId) focus(parentId);
				break;
			case "Home":
				if (visible[0]) focus(visible[0].node.id);
				break;
			case "End": {
				const last = visible[visible.length - 1];
				if (last) focus(last.node.id);
				break;
			}
			case "Enter":
			case " ":
				select(node);
				if (isParent && event.key === "Enter") toggle(node.id);
				break;
			case "*": {
				// 同じ階層の親項目をすべて開く
				const siblings = visible.filter((v) => v.parentId === parentId && v.node.children);
				setExpandedList([...new Set([...expanded, ...siblings.map((v) => v.node.id)])]);
				break;
			}
			default:
				handled = false;
				if (event.key.length === 1 && /\S/.test(event.key)) {
					const ta = typeahead.current;
					window.clearTimeout(ta.timer);
					ta.text += event.key.toLowerCase();
					ta.timer = window.setTimeout(() => {
						ta.text = "";
					}, 500);
					const ordered = [...visible.slice(index + 1), ...visible.slice(0, index + 1)];
					const match =
						ordered.find((v) => textOf(v.node).startsWith(ta.text)) ??
						ordered.find((v) => textOf(v.node).startsWith(ta.text[0] ?? ""));
					if (match) focus(match.node.id);
					handled = true;
				}
		}
		if (handled) event.preventDefault();
	};

	const context: TreeContextValue = { expanded, selected, tabStop, toggle, select, focus, register, reduce };

	return (
		<TreeContext.Provider value={context}>
			<GlideGroup>
				<ul
					data-slot="tree-view"
					// biome-ignore lint/a11y/noNoninteractiveElementToInteractiveRole: 入れ子の一覧なので ul と li で組み、役割を tree に変える
					role="tree"
					className={cn("flex flex-col text-sm text-fg outline-none", className)}
					onKeyDown={handleKeyDown}
					{...props}
				>
					<TreeLevel nodes={items} level={1} />
				</ul>
			</GlideGroup>
		</TreeContext.Provider>
	);
}

function TreeLevel({ nodes, level }: { nodes: TreeNode[]; level: number }) {
	return nodes.map((node, i) => (
		<TreeItem key={node.id} node={node} level={level} posinset={i + 1} setsize={nodes.length} />
	));
}

function TreeItem({
	node,
	level,
	posinset,
	setsize,
}: {
	node: TreeNode;
	level: number;
	posinset: number;
	setsize: number;
}) {
	const ctx = React.useContext(TreeContext);
	if (!ctx) throw new Error("TreeItem は TreeView の中で使う");
	const { expanded, selected, tabStop, toggle, select, focus, register, reduce } = ctx;
	const isParent = node.children !== undefined;
	const isOpen = isParent && expanded.has(node.id);
	const isSelected = selected === node.id;
	const indent = `calc(${level - 1} * 1.25rem + 0.5rem)`;
	const labelId = React.useId();

	const icon = node.icon ?? (isParent ? isOpen ? <FolderOpen /> : <Folder /> : <File />);

	return (
		<li
			ref={(el) => register(node.id, el)}
			data-slot="tree-view-item"
			role="treeitem"
			aria-labelledby={labelId}
			aria-level={level}
			aria-posinset={posinset}
			aria-setsize={setsize}
			aria-expanded={isParent ? isOpen : undefined}
			aria-selected={isSelected}
			aria-disabled={node.disabled || undefined}
			tabIndex={tabStop === node.id ? 0 : -1}
			className={cn(
				"outline-none",
				// フォーカスリングは、子の一覧まで囲まないよう、自分の行にだけ付ける
				"[&:focus-visible>[data-slot=tree-view-row]]:outline-2 [&:focus-visible>[data-slot=tree-view-row]]:-outline-offset-2 [&:focus-visible>[data-slot=tree-view-row]]:outline-focus",
			)}
			onFocus={(e) => {
				if (e.target === e.currentTarget) focus(node.id);
			}}
		>
			{/* biome-ignore lint/a11y/noStaticElementInteractions: キーボード操作は親の tree が受け持つ */}
			{/* biome-ignore lint/a11y/useKeyWithClickEvents: キーボード操作は親の tree が受け持つ */}
			<div
				data-slot="tree-view-row"
				data-selected={isSelected ? "" : undefined}
				data-disabled={node.disabled ? "" : undefined}
				className={cn(
					"group/row relative isolate flex h-8 cursor-default items-center gap-1.5 rounded-md pr-2 select-none",
					"text-fg-muted transition-colors duration-(--duration-fast) ease-standard",
					"hover:bg-surface-hover hover:text-fg data-selected:text-fg-strong data-selected:hover:bg-transparent",
					"data-disabled:pointer-events-none data-disabled:text-fg-subtle",
					"motion-press-surface",
				)}
				style={{ paddingLeft: indent }}
				onClick={() => {
					focus(node.id);
					select(node);
					if (isParent) toggle(node.id);
				}}
			>
				<Glide active={isSelected} layoutId="tree-view-selected" className="bg-brand-soft" />
				<span className="inline-flex size-4 shrink-0 items-center justify-center text-fg-subtle">
					{isParent && (
						<motion.span
							aria-hidden
							className="inline-flex"
							initial={false}
							animate={{ rotate: isOpen ? 90 : 0 }}
							transition={reduce ? { duration: 0 } : springs.pop}
						>
							<ChevronRight className="size-3.5" />
						</motion.span>
					)}
				</span>
				<span
					aria-hidden
					className={cn(
						"inline-flex shrink-0 transition-colors duration-(--duration-base) ease-ember [&_svg]:size-4",
						isSelected ? "text-brand" : isParent ? "text-fg-muted" : "text-fg-subtle",
					)}
				>
					{icon}
				</span>
				<span id={labelId} className="min-w-0 flex-1 truncate">
					{node.label}
				</span>
			</div>
			{isParent && (
				<AnimatePresence initial={false}>
					{isOpen && (
						<motion.ul
							key="group"
							role="group"
							data-slot="tree-view-group"
							className="relative overflow-hidden"
							initial={{ height: 0, opacity: 0 }}
							animate={{
								height: "auto",
								opacity: 1,
								transition: reduce
									? { duration: 0 }
									: { height: springs.sway, opacity: { duration: 0.2, ease: [0.2, 0.8, 0.2, 1] } },
							}}
							exit={{
								height: 0,
								opacity: 0,
								// たたむときは、開くときより速く
								transition: reduce ? { duration: 0 } : { duration: 0.18, ease: [0.16, 1, 0.3, 1] },
							}}
						>
							{/* 階層を示す縦の線 */}
							<span
								aria-hidden
								className="pointer-events-none absolute top-1 bottom-1 w-px bg-line-subtle"
								style={{ left: `calc(${level - 1} * 1.25rem + 0.5rem + 0.5rem - 0.5px)` }}
							/>
							<TreeLevel nodes={node.children ?? []} level={level + 1} />
						</motion.ul>
					)}
				</AnimatePresence>
			)}
		</li>
	);
}

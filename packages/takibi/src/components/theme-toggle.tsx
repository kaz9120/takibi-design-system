import { Monitor, Moon, Sun } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import * as React from "react";
import { cn } from "../lib/cn";
import { swap } from "../lib/motion";
import { setTheme, type Theme } from "../lib/theme";
import { Button, type ButtonProps } from "./button";
import { ToggleGroup, ToggleGroupItem } from "./toggle-group";

/** 夜、昼、端末の設定に合わせる、の 3 つ */
export type ThemePreference = Theme | "system";

const DEFAULT_STORAGE_KEY = "takibi-theme";
const LIGHT_QUERY = "(prefers-color-scheme: light)";

function readStored(key: string): ThemePreference | null {
	try {
		const value = window.localStorage.getItem(key);
		return value === "dark" || value === "light" || value === "system" ? value : null;
	} catch {
		return null;
	}
}

function writeStored(key: string, value: ThemePreference) {
	try {
		window.localStorage.setItem(key, value);
	} catch {
		// 保存できない環境（プライベートウィンドウなど）では、その場の切り替えだけ行う
	}
}

function systemTheme(): Theme {
	return window.matchMedia(LIGHT_QUERY).matches ? "light" : "dark";
}

function currentTheme(): Theme {
	return document.documentElement.dataset.theme === "light" ? "light" : "dark";
}

/**
 * 保存しておいた設定を画面に当てる。アプリの起動時に 1 回呼ぶ。
 * ThemeToggle は表示されたときに画面のテーマを変えない（今の data-theme に従う）ので、復元はこちらで行う。
 */
export function restoreTheme(storageKey = DEFAULT_STORAGE_KEY) {
	const stored = readStored(storageKey);
	if (!stored) return;
	setTheme(stored === "system" ? systemTheme() : stored);
}

/**
 * テーマの設定を読み書きする。画面の data-theme を見張るので、ほかの場所（別の ThemeToggle や
 * Storybook のツールバー）で変わっても表示がずれない。"system" の間は端末の設定の変化に追従する。
 */
export function useThemePreference(storageKey = DEFAULT_STORAGE_KEY) {
	const [preference, setPreferenceState] = React.useState<ThemePreference>(() => {
		if (typeof window === "undefined") return "dark";
		return readStored(storageKey) === "system" ? "system" : currentTheme();
	});
	const [theme, setThemeState] = React.useState<Theme>(() =>
		typeof document === "undefined" ? "dark" : currentTheme(),
	);
	const preferenceRef = React.useRef(preference);
	preferenceRef.current = preference;

	// ほかの場所でテーマが変わったら、表示を合わせる
	React.useEffect(() => {
		const root = document.documentElement;
		const sync = () => {
			const next = currentTheme();
			setThemeState(next);
			const pref = preferenceRef.current;
			if (pref === "system" ? next !== systemTheme() : next !== pref) setPreferenceState(next);
		};
		sync();
		const mo = new MutationObserver(sync);
		mo.observe(root, { attributes: true, attributeFilter: ["data-theme"] });
		return () => mo.disconnect();
	}, []);

	// 端末に合わせている間は、端末の設定の変化を追う
	React.useEffect(() => {
		if (preference !== "system") return;
		const mq = window.matchMedia(LIGHT_QUERY);
		const onChange = () => setTheme(systemTheme());
		mq.addEventListener("change", onChange);
		return () => mq.removeEventListener("change", onChange);
	}, [preference]);

	const setPreference = React.useCallback(
		(next: ThemePreference) => {
			setPreferenceState(next);
			preferenceRef.current = next;
			writeStored(storageKey, next);
			setTheme(next === "system" ? systemTheme() : next);
		},
		[storageKey],
	);

	return { preference, theme, setPreference };
}

export type ThemeToggleProps = Omit<ButtonProps, "onClick" | "children" | "status"> & {
	/** 設定を保存する localStorage のキー */
	storageKey?: string;
};

/**
 * 夜と昼を切り替えるボタン。押すと月と太陽が回りながら入れ替わり、画面全体が 1 回のクロスフェードで切り替わる。
 * 端末の設定に合わせる選択肢も見せたいときは ThemeToggleGroup を使う。
 */
export function ThemeToggle({
	storageKey,
	variant = "ghost",
	size = "icon",
	className,
	...props
}: ThemeToggleProps) {
	const { theme, setPreference } = useThemePreference(storageKey);
	const reduce = useReducedMotion();
	const next: Theme = theme === "dark" ? "light" : "dark";
	const motionProps = reduce
		? { initial: false as const, transition: { duration: 0 } }
		: {
				initial: { ...swap.initial, rotate: -90 },
				animate: { ...swap.animate, rotate: 0 },
				exit: { ...swap.exit, rotate: 90 },
				transition: swap.transition,
			};
	return (
		<Button
			data-slot="theme-toggle"
			data-theme-value={theme}
			variant={variant}
			size={size}
			aria-label={next === "light" ? "昼にする" : "夜にする"}
			className={cn("overflow-hidden", className)}
			onClick={() => setPreference(next)}
			{...props}
		>
			<AnimatePresence mode="popLayout" initial={false}>
				<motion.span key={theme} className="inline-flex" {...motionProps}>
					{theme === "dark" ? <Moon /> : <Sun />}
				</motion.span>
			</AnimatePresence>
		</Button>
	);
}

export type ThemeToggleGroupProps = {
	/** 設定を保存する localStorage のキー */
	storageKey?: string;
	/** 文字を隠してアイコンだけにする。狭い場所に置くとき */
	iconOnly?: boolean;
	size?: "sm" | "md";
	className?: string;
};

const options: { value: ThemePreference; label: string; icon: React.ReactNode }[] = [
	{ value: "dark", label: "夜", icon: <Moon /> },
	{ value: "light", label: "昼", icon: <Sun /> },
	{ value: "system", label: "端末に合わせる", icon: <Monitor /> },
];

/**
 * 夜、昼、端末に合わせる、から選ぶ。選んだ面が溝の中を滑って移る。
 * 端末に合わせる間は、OS の設定が変わると画面も追って変わる。
 */
export function ThemeToggleGroup({ storageKey, iconOnly, size = "sm", className }: ThemeToggleGroupProps) {
	const { preference, setPreference } = useThemePreference(storageKey);
	return (
		<ToggleGroup
			data-slot="theme-toggle-group"
			variant="segmented"
			size={size}
			aria-label="テーマ"
			value={[preference]}
			onValueChange={(value) => {
				const next = value[0] as ThemePreference | undefined;
				// 選んでいる項目をもう一度押しても、選択を外さない
				if (next) setPreference(next);
			}}
			className={className}
		>
			{options.map((o) => (
				<ToggleGroupItem
					key={o.value}
					value={o.value}
					aria-label={iconOnly ? o.label : undefined}
					title={iconOnly ? o.label : undefined}
				>
					{o.icon}
					{!iconOnly && <span>{o.label}</span>}
				</ToggleGroupItem>
			))}
		</ToggleGroup>
	);
}

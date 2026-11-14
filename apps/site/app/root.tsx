import { useEffect } from "react";
import { isRouteErrorResponse, Links, Meta, Outlet, Scripts, ScrollRestoration } from "react-router";
import { restoreTheme, Toaster, TooltipProvider } from "takibi-design-system";
import faviconUrl from "takibi-design-system/assets/logo/mark-cream.svg?url";
import type { Route } from "./+types/root";
import "./app.css";

export const links: Route.LinksFunction = () => [
	{ rel: "icon", type: "image/svg+xml", href: faviconUrl },
	{ rel: "preconnect", href: "https://fonts.googleapis.com" },
	{ rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
	{
		rel: "stylesheet",
		href: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&family=LINE+Seed+JP:wght@400;700&display=swap",
	},
];

// 描く前に、保存した夜と昼の設定を当てる。ThemeToggle と同じキー（takibi-theme）を読む
const restoreThemeScript = `try{var p=localStorage.getItem("takibi-theme");var l=p==="light"||(p==="system"&&matchMedia("(prefers-color-scheme: light)").matches);document.documentElement.dataset.theme=l?"light":"dark"}catch(e){}`;

export function Layout({ children }: { children: React.ReactNode }) {
	return (
		<html lang="ja" suppressHydrationWarning>
			<head>
				<meta charSet="utf-8" />
				<meta name="viewport" content="width=device-width, initial-scale=1" />
				{/* biome-ignore lint/security/noDangerouslySetInnerHtml: 描く前にテーマを当てる、固定の短いスクリプト */}
				<script dangerouslySetInnerHTML={{ __html: restoreThemeScript }} />
				<Meta />
				<Links />
			</head>
			<body className="bg-surface text-fg antialiased">
				{children}
				<ScrollRestoration />
				<Scripts />
			</body>
		</html>
	);
}

export default function App() {
	// React が prerender の HTML を引き継ぐと、描く前に当てた data-theme が外れるので、引き継いだあとに当て直す
	useEffect(() => restoreTheme(), []);
	return (
		<TooltipProvider>
			<Outlet />
			<Toaster />
		</TooltipProvider>
	);
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
	const notFound = isRouteErrorResponse(error) && error.status === 404;
	return (
		<main className="mx-auto flex min-h-dvh max-w-(--container-narrow) flex-col justify-center gap-3 p-8">
			<h1 className="text-2xl font-semibold text-fg-strong">
				{notFound ? "ページが見つかりません" : "表示できませんでした"}
			</h1>
			<p className="text-fg-muted">
				<a className="text-brand" href="/">
					トップへ戻る
				</a>
			</p>
		</main>
	);
}

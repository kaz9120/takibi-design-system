// Claude の Design System では、React はページの window.React から読む。
// react/jsx-runtime を同梱せず、window.React の createElement で同じ働きをさせる。
import * as React from "react";

type Props = Record<string, unknown> | null;

export const Fragment = React.Fragment;

export function jsx(type: React.ElementType, props: Props, key?: React.Key) {
	return React.createElement(type, key === undefined ? props : { ...props, key });
}

export const jsxs = jsx;
export const jsxDEV = jsx;

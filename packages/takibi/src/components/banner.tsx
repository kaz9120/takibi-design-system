import { Collapsible as BaseCollapsible } from "@base-ui/react/collapsible";
import { cva, type VariantProps } from "class-variance-authority";
import { CircleAlert, Info, TriangleAlert, X } from "lucide-react";
import * as React from "react";
import { cn } from "../lib/cn";

export const bannerVariants = cva(
	[
		"relative flex w-full items-center justify-center gap-3 border-b px-4 py-2.5 text-sm text-fg",
		"[&>svg]:size-4 [&>svg]:shrink-0",
	],
	{
		variants: {
			variant: {
				/** 知っておくと役に立つこと。新しい機能、予定された止まる時間 */
				info: "border-line-subtle bg-info-soft [&>svg]:text-info",
				/** 続けられるが、気をつけてほしいこと。容量、期限 */
				warning: "border-line-subtle bg-warning-soft [&>svg]:text-warning",
				/** 直さないと進めないこと。支払いの失敗、障害 */
				danger: "border-line-subtle bg-danger-soft [&>svg]:text-danger",
			},
		},
		defaultVariants: { variant: "info" },
	},
);

type BannerVariant = NonNullable<VariantProps<typeof bannerVariants>["variant"]>;

const defaultIcons: Record<BannerVariant, React.ComponentType<React.SVGProps<SVGSVGElement>>> = {
	info: Info,
	warning: TriangleAlert,
	danger: CircleAlert,
};

export type BannerProps = Omit<React.ComponentProps<"div">, "onChange"> &
	VariantProps<typeof bannerVariants> & {
		/** 左のアイコン。省くと variant に合うものを出す。null で消す */
		icon?: React.ReactNode;
		/** 右の操作。リンクや小さなボタンを置く */
		action?: React.ReactNode;
		/** 閉じるボタンを出すか */
		dismissible?: boolean;
		/** 出しているか。省くと自分で持ち、閉じるボタンで消える */
		open?: boolean;
		/** 閉じるボタンが押されたとき。open を渡したときは、ここで false にする */
		onDismiss?: () => void;
	};

/**
 * ページの上端に全幅で敷く知らせ。サービス全体に関わることだけに使い、画面の一部の知らせは Alert を使う。
 * 閉じると、中身が上へ薄れて消え、高さがたたまれて下の内容が上へ詰まる。
 */
export function Banner({
	className,
	variant,
	icon,
	action,
	dismissible = true,
	open: openProp,
	onDismiss,
	children,
	...props
}: BannerProps) {
	const resolved = variant ?? "info";
	const Icon = defaultIcons[resolved];
	const [openState, setOpenState] = React.useState(true);
	const open = openProp ?? openState;

	return (
		<BaseCollapsible.Root open={open} data-slot="banner-root">
			<BaseCollapsible.Panel
				data-slot="banner-fold"
				className={cn(
					"overflow-hidden",
					"h-(--collapsible-panel-height) transition-[height] duration-(--duration-spring-glide) ease-spring-glide",
					"data-starting-style:h-0 data-ending-style:h-0",
					// 閉じるときは開くときと同じ形のまま、少しだけ速くたたむ
					"data-ending-style:duration-[260ms]",
				)}
			>
				<div
					data-slot="banner"
					data-variant={resolved}
					role={resolved === "danger" ? "alert" : "status"}
					className={cn(
						bannerVariants({ variant }),
						"transition-[opacity,translate,filter] duration-(--duration-base) ease-standard",
						"in-data-starting-style:translate-y-[-6px] in-data-starting-style:opacity-0",
						"in-data-ending-style:translate-y-[-6px] in-data-ending-style:opacity-0 in-data-ending-style:blur-[2px] in-data-ending-style:duration-(--duration-fast)",
						dismissible && "pr-12",
						className,
					)}
					{...props}
				>
					{icon === undefined ? <Icon aria-hidden /> : icon}
					<div data-slot="banner-content" className="min-w-0 text-pretty">
						{children}
					</div>
					{action && (
						<div data-slot="banner-action" className="shrink-0">
							{action}
						</div>
					)}
					{dismissible && (
						<button
							type="button"
							aria-label="閉じる"
							onClick={() => {
								setOpenState(false);
								onDismiss?.();
							}}
							className={cn(
								"absolute top-1/2 right-2 flex size-8 -translate-y-1/2 items-center justify-center rounded-md text-fg-muted",
								"motion-press-icon outline-none hover:bg-surface-hover hover:text-fg",
								"focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-focus",
							)}
						>
							<X className="size-4" aria-hidden />
						</button>
					)}
				</div>
			</BaseCollapsible.Panel>
		</BaseCollapsible.Root>
	);
}

/** 本文の中のリンク。下線で示し、色はブランドカラーにする */
export function BannerLink({ className, ...props }: React.ComponentProps<"a">) {
	return (
		<a
			data-slot="banner-link"
			className={cn(
				"font-medium text-brand underline underline-offset-4 transition-colors duration-(--duration-fast) hover:text-brand-hover",
				"rounded-sm outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus",
				className,
			)}
			{...props}
		/>
	);
}

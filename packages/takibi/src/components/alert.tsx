import { cva, type VariantProps } from "class-variance-authority";
import { Bell, CircleAlert, CircleCheck, Info, TriangleAlert } from "lucide-react";
import type * as React from "react";
import { cn } from "../lib/cn";

export const alertVariants = cva(
	[
		"grid items-start gap-y-1 rounded-lg border p-4 text-sm",
		"has-[>svg]:grid-cols-[auto_1fr] has-[>svg]:gap-x-3 [&>svg~*]:col-start-2",
		"[&>svg]:row-span-2 [&>svg]:mt-0.5 [&>svg]:size-4 [&>svg]:shrink-0",
	],
	{
		variants: {
			variant: {
				/** 補足。色に意味を持たせない */
				neutral: "border-line bg-surface-raised text-fg [&>svg]:text-fg-muted",
				/** 終わったこと、うまくいったこと */
				success: "border-line-subtle bg-success-soft text-fg [&>svg]:text-success",
				/** 続けられるが、気をつけてほしいこと */
				warning: "border-line-subtle bg-warning-soft text-fg [&>svg]:text-warning",
				/** 失敗したこと、直さないと進めないこと */
				danger: "border-line-subtle bg-danger-soft text-fg [&>svg]:text-danger",
				/** 知っておくと役に立つこと */
				info: "border-line-subtle bg-info-soft text-fg [&>svg]:text-info",
			},
		},
		defaultVariants: { variant: "neutral" },
	},
);

type AlertVariant = NonNullable<VariantProps<typeof alertVariants>["variant"]>;

const defaultIcons: Record<AlertVariant, React.ComponentType<React.SVGProps<SVGSVGElement>>> = {
	neutral: Bell,
	success: CircleCheck,
	warning: TriangleAlert,
	danger: CircleAlert,
	info: Info,
};

export type AlertProps = React.ComponentProps<"div"> &
	VariantProps<typeof alertVariants> & {
		/** 左上のアイコン。省くと variant に合うものを出す。null で消す */
		icon?: React.ReactNode;
	};

/**
 * 画面の中に置いたままにする知らせ。操作の直後に一時的に伝えるならトーストを使う。
 * danger と warning はスクリーンリーダーで割り込んで伝える（role="alert"）。
 */
export function Alert({ className, variant, icon, children, ...props }: AlertProps) {
	const resolved = variant ?? "neutral";
	const Icon = defaultIcons[resolved];
	return (
		<div
			data-slot="alert"
			data-variant={resolved}
			role={resolved === "danger" || resolved === "warning" ? "alert" : "status"}
			className={cn(alertVariants({ variant }), className)}
			{...props}
		>
			{icon === undefined ? <Icon aria-hidden /> : icon}
			{children}
		</div>
	);
}

export function AlertTitle({ className, ...props }: React.ComponentProps<"div">) {
	return <div data-slot="alert-title" className={cn("font-semibold text-fg-strong", className)} {...props} />;
}

export function AlertDescription({ className, ...props }: React.ComponentProps<"div">) {
	return (
		<div
			data-slot="alert-description"
			className={cn("text-fg-muted [&_p]:leading-relaxed [&_a]:text-brand [&_a]:underline", className)}
			{...props}
		/>
	);
}

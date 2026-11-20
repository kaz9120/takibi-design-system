import { Avatar as BaseAvatar } from "@base-ui/react/avatar";
import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";
import { cn } from "../lib/cn";

type Size = "sm" | "md" | "lg" | "xl";

const AvatarGroupContext = React.createContext<{ size?: Size; grouped: boolean }>({ grouped: false });

export const avatarVariants = cva(
	"relative inline-flex shrink-0 items-center justify-center rounded-full align-middle font-medium select-none",
	{
		variants: {
			size: {
				sm: "size-6 text-xs",
				md: "size-8 text-xs",
				lg: "size-10 text-sm",
				xl: "size-14 text-lg",
			},
		},
		defaultVariants: { size: "md" },
	},
);

export type AvatarProps = React.ComponentProps<typeof BaseAvatar.Root> & VariantProps<typeof avatarVariants>;

/**
 * 人やチームを、顔写真か頭文字で示す。写真が読み込めるまでと、読み込めなかったときは頭文字を出す。
 * 中に AvatarImage と AvatarFallback を置き、状態を示すときは AvatarStatus を足す。
 */
export function Avatar({ className, size, ...props }: AvatarProps) {
	const group = React.useContext(AvatarGroupContext);
	return (
		<BaseAvatar.Root
			data-slot="avatar"
			className={cn(
				avatarVariants({ size: size ?? group.size }),
				group.grouped &&
					"ring-2 ring-surface transition-[translate] duration-(--duration-land) ease-land hover:z-10 hover:-translate-y-0.5",
				className,
			)}
			{...props}
		/>
	);
}

/**
 * 顔写真。読み込み終わると、頭文字の上に、ぼけた透明の状態から 360ms で現れる。
 * `alt` には名前を入れる（写真が出ないときは AvatarFallback が名前の代わりになる）。
 */
export function AvatarImage({ className, ...props }: React.ComponentProps<typeof BaseAvatar.Image>) {
	return (
		<BaseAvatar.Image
			data-slot="avatar-image"
			keepMounted
			className={cn(
				"absolute inset-0 size-full rounded-full object-cover",
				"transition-[opacity,filter] duration-(--duration-slow) ease-standard",
				"data-loading:opacity-0 data-loading:blur-[4px] data-error:invisible",
				className,
			)}
			{...props}
		/>
	);
}

/** 写真がないときの頭文字。2 文字までにする */
export function AvatarFallback({ className, ...props }: React.ComponentProps<typeof BaseAvatar.Fallback>) {
	return (
		<BaseAvatar.Fallback
			data-slot="avatar-fallback"
			className={cn(
				"absolute inset-0 flex size-full items-center justify-center rounded-full",
				"border border-line-subtle bg-surface-overlay text-fg-muted",
				className,
			)}
			{...props}
		/>
	);
}

const statusLabel = {
	online: "オンライン",
	away: "離席中",
	busy: "取り込み中",
	offline: "オフライン",
} as const;

export type AvatarStatusProps = React.ComponentProps<"span"> & {
	status: keyof typeof statusLabel;
};

/** 右下の小さな点で、今の状態を示す。色だけに頼らないよう、スクリーンリーダー用の文言を持つ */
export function AvatarStatus({ className, status, ...props }: AvatarStatusProps) {
	return (
		<span
			data-slot="avatar-status"
			data-status={status}
			className={cn(
				"absolute right-0 bottom-0 z-10 size-[30%] min-h-2 min-w-2 rounded-full ring-2 ring-surface",
				"transition-colors duration-(--duration-base) ease-standard",
				"data-[status=online]:bg-success data-[status=away]:bg-warning data-[status=busy]:bg-danger",
				"data-[status=offline]:border data-[status=offline]:border-fg-subtle data-[status=offline]:bg-surface",
				className,
			)}
			{...props}
		>
			<span className="sr-only">{statusLabel[status]}</span>
		</span>
	);
}

export type AvatarGroupProps = React.ComponentProps<"div"> & {
	size?: Size;
	/** 並べる最大の数。超えた分は「+3」のようにまとめる */
	max?: number;
	/** 「+3」のアバターに付けるスクリーンリーダー用の文言 */
	overflowLabel?: (count: number) => string;
};

/** 複数のアバターを少し重ねて並べる。参加者や共同編集者を示す */
export function AvatarGroup({
	className,
	size = "md",
	max,
	overflowLabel = (count) => `ほか${count}人`,
	children,
	...props
}: AvatarGroupProps) {
	const items = React.Children.toArray(children);
	const shown = max !== undefined && items.length > max ? items.slice(0, max) : items;
	const rest = items.length - shown.length;
	const context = React.useMemo(() => ({ size, grouped: true }), [size]);
	return (
		<AvatarGroupContext.Provider value={context}>
			<div
				data-slot="avatar-group"
				className={cn(
					"flex items-center",
					size === "sm" && "-space-x-1.5",
					size === "md" && "-space-x-2",
					size === "lg" && "-space-x-2.5",
					size === "xl" && "-space-x-3.5",
					className,
				)}
				{...props}
			>
				{shown}
				{rest > 0 && (
					<Avatar data-slot="avatar-overflow" aria-label={overflowLabel(rest)} role="img">
						<span
							aria-hidden
							className="flex size-full items-center justify-center rounded-full border border-line-subtle bg-surface-raised text-fg-muted tabular-nums"
						>
							+{rest}
						</span>
					</Avatar>
				)}
			</div>
		</AvatarGroupContext.Provider>
	);
}

import { cva, type VariantProps } from "class-variance-authority";
import { ImageOff } from "lucide-react";
import * as React from "react";
import { cn } from "../lib/cn";

export const imageVariants = cva(
	"relative isolate overflow-hidden bg-surface-sunken [&>img]:absolute [&>img]:inset-0 [&>img]:size-full",
	{
		variants: {
			rounded: {
				none: "rounded-none",
				sm: "rounded-sm",
				md: "rounded-md",
				lg: "rounded-lg",
				xl: "rounded-xl",
				/** 円形。アバターだけに使う */
				full: "rounded-full",
			},
			fit: {
				cover: "[&>img]:object-cover",
				contain: "[&>img]:object-contain",
			},
		},
		defaultVariants: { rounded: "lg", fit: "cover" },
	},
);

type ImageStatus = "loading" | "loaded" | "error";

export type ImageProps = Omit<React.ComponentProps<"img">, "placeholder"> &
	VariantProps<typeof imageVariants> & {
		/** 縦横の比。`16/9` や `1` のように書く。省くと親の大きさに従う */
		ratio?: number | `${number}/${number}`;
		/** 読み込むまでぼかして見せる、小さな画像の URL（data URL など）。省くと、ブランドカラーを薄く混ぜた帯が流れる面（motion-ember-pulse）を出す */
		placeholder?: string;
		/** 読み込めなかったときに出すもの。省くとアイコンと alt の文を出す */
		fallback?: React.ReactNode;
		/** 外側の枠のクラス。img 自体のクラスは className に渡す */
		containerClassName?: string;
	};

/**
 * 縦横の比を保って画像を置く。読み込むまでは場所を確保して待ち、届いたら
 * ぼけた状態から 560ms でくっきり現れる。読み込めなければ、アイコンと alt の文に置き換える。
 */
export function Image({
	src,
	alt,
	ratio,
	rounded,
	fit,
	placeholder,
	fallback,
	className,
	containerClassName,
	style,
	onLoad,
	onError,
	ref,
	...props
}: ImageProps) {
	const [status, setStatus] = React.useState<ImageStatus>("loading");
	const imgRef = React.useRef<HTMLImageElement | null>(null);

	// src が変わったら待ちからやり直す。すでに読み込み済み（キャッシュ）なら、すぐ出す
	React.useLayoutEffect(() => {
		const img = imgRef.current;
		if (!src) {
			setStatus("error");
			return;
		}
		if (img?.complete) setStatus(img.naturalWidth > 0 ? "loaded" : "error");
		else setStatus("loading");
	}, [src]);

	const setRef = (node: HTMLImageElement | null) => {
		imgRef.current = node;
		if (typeof ref === "function") ref(node);
		else if (ref) ref.current = node;
	};

	return (
		<div
			data-slot="image"
			data-status={status}
			className={cn(imageVariants({ rounded, fit }), containerClassName)}
			style={{ aspectRatio: ratio === undefined ? undefined : String(ratio) }}
		>
			{status !== "error" &&
				(placeholder ? (
					<img
						src={placeholder}
						alt=""
						aria-hidden
						className={cn(
							"scale-110 blur-xl transition-opacity duration-(--duration-slow) ease-standard",
							status === "loaded" && "opacity-0 delay-200",
						)}
					/>
				) : (
					<span
						aria-hidden
						className={cn(
							"motion-ember-pulse absolute inset-0 transition-opacity duration-(--duration-slow) ease-standard",
							status === "loaded" && "opacity-0",
						)}
					/>
				))}
			{status === "error" ? (
				<div
					data-slot="image-fallback"
					role="img"
					aria-label={alt}
					className="absolute inset-0 flex flex-col items-center justify-center gap-2 p-4 text-center text-sm text-fg-subtle transition-opacity duration-(--duration-base) ease-standard starting:opacity-0"
				>
					{fallback ?? (
						<>
							<ImageOff aria-hidden className="size-6" />
							{alt && <span className="line-clamp-2 max-w-[24ch]">{alt}</span>}
						</>
					)}
				</div>
			) : (
				<img
					ref={setRef}
					src={src}
					alt={alt}
					data-slot="image-img"
					onLoad={(e) => {
						setStatus("loaded");
						onLoad?.(e);
					}}
					onError={(e) => {
						setStatus("error");
						onError?.(e);
					}}
					className={cn(
						"transition-[opacity,filter,scale] duration-(--duration-relax) ease-ember",
						status === "loaded" ? "scale-100 opacity-100 blur-none" : "scale-[1.04] opacity-0 blur-md",
						className,
					)}
					style={style}
					{...props}
				/>
			)}
		</div>
	);
}

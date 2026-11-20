import { OTPField as BaseOTPField } from "@base-ui/react/otp-field";
import { cva, type VariantProps } from "class-variance-authority";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import * as React from "react";
import { cn } from "../lib/cn";
import { amplitude, springs } from "../lib/motion";

const slotVariants = cva(
	[
		"relative flex shrink-0 items-center justify-center rounded-md border border-line-strong bg-surface-sunken text-fg-strong shadow-rim",
		"transition-[border-color,box-shadow,background-color] duration-(--duration-fast) ease-standard",
		"hover:not-has-[input:disabled]:not-has-focus:border-line-hover",
		"has-focus:border-brand has-focus:ring-3 has-focus:ring-brand-soft",
		"has-data-filled:border-line-hover",
		"has-data-invalid:border-danger has-data-invalid:has-focus:ring-danger-soft has-aria-invalid:border-danger",
		"has-[input:disabled]:cursor-not-allowed has-[input:disabled]:opacity-50",
		"has-[input:not([type=hidden]):read-only]:bg-surface has-[input:not([type=hidden]):read-only]:has-focus:ring-0",
	],
	{
		variants: {
			size: {
				sm: "h-9 w-8 text-base",
				md: "h-11 w-10 text-lg",
				lg: "h-13 w-12 text-2xl",
			},
		},
		defaultVariants: { size: "md" },
	},
);

const SizeContext = React.createContext<VariantProps<typeof slotVariants>["size"]>("md");

export type OTPFieldProps = React.ComponentProps<typeof BaseOTPField.Root> &
	VariantProps<typeof slotVariants> & {
		/**
		 * 区切りを入れる位置。`[3]` なら 3 文字目の後ろに区切りが入る。
		 * children を渡したときは使わない
		 */
		groups?: number[];
		/** 欄のアクセシブルネーム。見えないラベルとして最初の枠に結び付く。Field の中では FieldLabel を使う */
		"aria-label"?: string;
	};

/**
 * ワンタイムコードを入れる欄。1 文字ずつ枠が分かれ、入れると次の枠へ進む。貼り付けにも対応する。
 * children を省くと `length` の数だけ枠を並べる。ラベルは Field か、`id` と `<label htmlFor>` で付ける。
 * 入れた文字は弾んで現れ、全部埋まると枠の外側が左から順に一度だけ光る。
 */
export function OTPField({
	className,
	size = "md",
	length,
	groups,
	children,
	"aria-label": ariaLabel,
	id: idProp,
	...props
}: OTPFieldProps) {
	const generatedId = React.useId();
	const id = idProp ?? generatedId;
	return (
		<SizeContext.Provider value={size}>
			{/* Base UI は最初の枠の aria-label を使わないので、見えないラベルで名前を付ける */}
			{ariaLabel && (
				<label htmlFor={id} className="sr-only">
					{ariaLabel}
				</label>
			)}
			<BaseOTPField.Root
				data-slot="otp-field"
				id={ariaLabel ? id : idProp}
				length={length}
				className={cn("flex w-fit items-center gap-2", className)}
				{...props}
			>
				{children ??
					Array.from({ length }, (_, index) => (
						// biome-ignore lint/suspicious/noArrayIndexKey: 枠の位置そのものがキーになる
						<React.Fragment key={index}>
							<OTPFieldInput
								aria-label={index === 0 ? undefined : `${index + 1} 文字目（全 ${length} 文字）`}
							/>
							{groups?.includes(index + 1) && index + 1 < length && <OTPFieldSeparator />}
						</React.Fragment>
					))}
			</BaseOTPField.Root>
		</SizeContext.Provider>
	);
}

/**
 * 1 文字分の枠。中の本物の入力欄は文字を透かし、上に重ねた文字だけを動かす。
 * 2 文字目以降には「2 文字目（全 6 文字）」のような aria-label を付ける。
 */
export function OTPFieldInput({ className, ...props }: React.ComponentProps<typeof BaseOTPField.Input>) {
	const size = React.useContext(SizeContext);
	const reduce = useReducedMotion();
	return (
		<BaseOTPField.Input
			data-slot="otp-field-input"
			render={(inputProps, state) => (
				<div className={cn(slotVariants({ size }), className)}>
					{/* 全部埋まった瞬間に、左の枠から順に一度だけ光る。枠の輪（box-shadow）とは別の層に置く */}
					<motion.span
						aria-hidden
						className="pointer-events-none absolute -inset-px rounded-[inherit] shadow-glow"
						initial={false}
						animate={state.complete && !reduce ? { opacity: [0, 1, 0] } : { opacity: 0 }}
						transition={{
							duration: 0.8,
							delay: state.complete ? state.index * amplitude.stagger : 0,
							ease: [0.16, 1, 0.3, 1],
						}}
					/>
					<input
						{...inputProps}
						className={cn(
							"absolute inset-0 size-full rounded-[inherit] bg-transparent text-center font-mono text-transparent caret-brand outline-none",
							"selection:bg-transparent disabled:cursor-not-allowed",
						)}
					/>
					<span aria-hidden className="pointer-events-none font-mono font-medium tabular-nums">
						<AnimatePresence mode="popLayout" initial={false}>
							{state.value && (
								<motion.span
									key={state.value}
									className="inline-block"
									initial={reduce ? false : { opacity: 0, scale: 0.4, y: 6, filter: amplitude.swapBlur }}
									animate={{ opacity: 1, scale: 1, y: 0, filter: "blur(0px)" }}
									exit={
										reduce
											? { opacity: 0, transition: { duration: 0 } }
											: { opacity: 0, scale: 0.6, transition: { duration: 0.1, ease: [0.16, 1, 0.3, 1] } }
									}
									transition={springs.pop}
								>
									{inputProps.type === "password" ? (
										<span className="block size-2.5 rounded-full bg-current" />
									) : (
										state.value
									)}
								</motion.span>
							)}
						</AnimatePresence>
					</span>
				</div>
			)}
			{...props}
		/>
	);
}

/** 枠の間の区切り。3 桁ずつ分けると読み上げやすい */
export function OTPFieldSeparator({
	className,
	...props
}: React.ComponentProps<typeof BaseOTPField.Separator>) {
	return (
		<BaseOTPField.Separator
			data-slot="otp-field-separator"
			className={cn("h-0.5 w-3 rounded-full bg-line-strong", className)}
			{...props}
		/>
	);
}

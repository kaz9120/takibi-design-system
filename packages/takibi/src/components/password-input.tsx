import type { VariantProps } from "class-variance-authority";
import { Eye, EyeOff } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import * as React from "react";
import { swap } from "../lib/motion";
import {
	InputGroup,
	InputGroupAddon,
	InputGroupButton,
	InputGroupInput,
	type InputGroupInputProps,
	type inputGroupVariants,
} from "./input-group";

export type PasswordInputProps = Omit<InputGroupInputProps, "type"> &
	VariantProps<typeof inputGroupVariants> & {
		/** 文字を見せている状態。省くと内部で持つ */
		visible?: boolean;
		defaultVisible?: boolean;
		onVisibleChange?: (visible: boolean) => void;
		/** 表示の切り替えボタンのアクセシブルネーム。押されているかは aria-pressed で伝わる */
		toggleLabel?: string;
		/** 枠の className */
		groupClassName?: string;
	};

/**
 * パスワードを入れる欄。右端のボタンで、伏せ字と文字の表示を切り替える。
 * 切り替えても、入力欄のフォーカスとカーソルの位置は動かない。ラベルは Field で付ける。
 */
export function PasswordInput({
	size,
	visible: visibleProp,
	defaultVisible = false,
	onVisibleChange,
	toggleLabel = "パスワードを表示",
	groupClassName,
	disabled,
	autoComplete = "current-password",
	...props
}: PasswordInputProps) {
	const [uncontrolled, setUncontrolled] = React.useState(defaultVisible);
	const visible = visibleProp ?? uncontrolled;
	const reduce = useReducedMotion();

	const toggle = () => {
		const next = !visible;
		if (visibleProp === undefined) setUncontrolled(next);
		onVisibleChange?.(next);
	};

	return (
		<InputGroup size={size} className={groupClassName}>
			<InputGroupInput
				data-slot="password-input"
				type={visible ? "text" : "password"}
				autoComplete={autoComplete}
				spellCheck={false}
				autoCapitalize="off"
				disabled={disabled}
				{...props}
			/>
			<InputGroupAddon align="end">
				<InputGroupButton
					data-slot="password-input-toggle"
					aria-label={toggleLabel}
					aria-pressed={visible}
					disabled={disabled}
					onClick={toggle}
				>
					<AnimatePresence mode="popLayout" initial={false}>
						<motion.span
							key={visible ? "hide" : "show"}
							className="flex"
							{...swap}
							transition={reduce ? { duration: 0 } : swap.transition}
						>
							{visible ? <EyeOff aria-hidden /> : <Eye aria-hidden />}
						</motion.span>
					</AnimatePresence>
				</InputGroupButton>
			</InputGroupAddon>
		</InputGroup>
	);
}

import { File as FileIcon, ImageIcon, Upload, X } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import * as React from "react";
import { cn } from "../lib/cn";
import { springs } from "../lib/motion";
import { Button } from "./button";

export type FileDropProps = Omit<
	React.ComponentProps<"input">,
	"type" | "value" | "defaultValue" | "onChange" | "children" | "size"
> & {
	/** 選んだファイル。省くと内部で持つ */
	value?: File[];
	defaultValue?: File[];
	onValueChange?: (files: File[]) => void;
	/** 受け付けなかったファイル。形式か大きさが合わないもの */
	onReject?: (files: File[]) => void;
	/** 1 ファイルの上限（バイト） */
	maxSize?: number;
	/** md は案内の文とアイコンを持つ広い面、sm は 1 行の細い面 */
	size?: "sm" | "md";
	/** 面の中身。省くと、アイコンと案内の文を出す */
	children?: React.ReactNode;
	/** 面の下に、選んだファイルの一覧を出すか */
	showList?: boolean;
	/** 案内の文 */
	label?: React.ReactNode;
	/** 案内の補足。形式や大きさの上限を書く */
	hint?: React.ReactNode;
	/** 面の className */
	className?: string;
	/** input の className */
	inputClassName?: string;
};

/**
 * ファイルを落とすか、押して選ぶ面。中に隠れた本物の `<input type="file">` があるので、
 * Tab で届き、Enter や Space で選ぶ画面が開く。ファイルを重ねると枠と面がブランドカラーになり、落とすと一覧に加わる。
 */
export function FileDrop({
	value: valueProp,
	defaultValue = [],
	onValueChange,
	onReject,
	maxSize,
	accept,
	multiple,
	disabled,
	size = "md",
	children,
	showList = true,
	label,
	hint,
	className,
	inputClassName,
	id: idProp,
	...props
}: FileDropProps) {
	const [uncontrolled, setUncontrolled] = React.useState(defaultValue);
	const files = valueProp ?? uncontrolled;
	const [dragging, setDragging] = React.useState(false);
	const [rejected, setRejected] = React.useState(0);
	const depth = React.useRef(0);
	const reduce = useReducedMotion();
	const generatedId = React.useId();
	const id = idProp ?? generatedId;
	const listRef = React.useRef<HTMLUListElement>(null);
	const inputRef = React.useRef<HTMLInputElement>(null);

	const commit = (next: File[]) => {
		if (valueProp === undefined) setUncontrolled(next);
		onValueChange?.(next);
	};

	const add = (incoming: File[]) => {
		const ok: File[] = [];
		const ng: File[] = [];
		for (const file of incoming) {
			if (matchesAccept(file, accept) && (maxSize === undefined || file.size <= maxSize)) ok.push(file);
			else ng.push(file);
		}
		setRejected(ng.length);
		if (ng.length) onReject?.(ng);
		if (!ok.length) return;
		commit(multiple ? [...files, ...ok] : ok.slice(0, 1));
	};

	const remove = (index: number) => {
		commit(files.filter((_, i) => i !== index));
		// 外したら、次の項目の外すボタンへ。なければ面へフォーカスを移す。消えていく項目は煙の間も DOM に残るので、キーで探す
		const next = files[index + 1] ?? files[index - 1];
		requestAnimationFrame(() => {
			const target = next
				? listRef.current?.querySelector<HTMLButtonElement>(`[data-file-key="${CSS.escape(fileKey(next))}"]`)
				: null;
			if (target) target.focus();
			else inputRef.current?.focus();
		});
	};

	const dragProps = disabled
		? {}
		: {
				onDragEnter: (event: React.DragEvent) => {
					if (!hasFiles(event)) return;
					event.preventDefault();
					depth.current += 1;
					setDragging(true);
				},
				onDragOver: (event: React.DragEvent) => {
					if (!hasFiles(event)) return;
					event.preventDefault();
					event.dataTransfer.dropEffect = "copy";
				},
				onDragLeave: () => {
					depth.current = Math.max(0, depth.current - 1);
					if (depth.current === 0) setDragging(false);
				},
				onDrop: (event: React.DragEvent) => {
					event.preventDefault();
					depth.current = 0;
					setDragging(false);
					add(Array.from(event.dataTransfer.files));
				},
			};

	return (
		<div data-slot="file-drop" className="flex w-full flex-col gap-3">
			<label
				htmlFor={id}
				data-slot="file-drop-zone"
				data-dragging={dragging || undefined}
				data-disabled={disabled || undefined}
				data-size={size}
				className={cn(
					"group/drop relative isolate flex cursor-pointer rounded-lg border border-dashed border-line-strong bg-surface-sunken text-fg-muted select-none",
					"transition-[border-color,background-color,box-shadow,color] duration-(--duration-base) ease-ember",
					"hover:not-data-disabled:border-line-hover hover:not-data-disabled:text-fg",
					"has-focus-visible:border-brand has-focus-visible:ring-3 has-focus-visible:ring-brand-soft",
					// 重ねている間、枠は実線のブランドカラーに、面はブランドカラーの薄い色になる
					"data-dragging:border-solid data-dragging:border-brand data-dragging:bg-brand-soft data-dragging:text-fg-strong data-dragging:shadow-glow-soft",
					"has-aria-invalid:border-danger",
					"data-disabled:cursor-not-allowed data-disabled:opacity-50",
					size === "md"
						? "min-h-40 flex-col items-center justify-center gap-3 px-6 py-8 text-center"
						: "min-h-12 items-center gap-3 px-4 py-2.5",
					className,
				)}
				{...dragProps}
			>
				<input
					ref={inputRef}
					id={id}
					type="file"
					accept={accept}
					multiple={multiple}
					disabled={disabled}
					className={cn("sr-only", inputClassName)}
					onChange={(event) => {
						add(Array.from(event.currentTarget.files ?? []));
						// 同じファイルを選び直しても変化が届くように、値を空に戻す
						event.currentTarget.value = "";
					}}
					{...props}
				/>
				{children ?? (
					<>
						<motion.span
							aria-hidden
							className={cn(
								"flex shrink-0 items-center justify-center rounded-full border border-line bg-surface-raised text-fg-muted shadow-rim",
								"transition-colors duration-(--duration-base) ease-ember group-data-dragging/drop:border-brand group-data-dragging/drop:text-brand",
								size === "md" ? "size-11 [&_svg]:size-5" : "size-8 [&_svg]:size-4",
							)}
							animate={dragging && !reduce ? { y: -4, scale: 1.08 } : { y: 0, scale: 1 }}
							transition={springs.land}
						>
							<Upload />
						</motion.span>
						<span className={cn("flex flex-col gap-1", size === "sm" && "text-left")}>
							<span className="text-sm font-medium text-fg">
								{dragging ? "ここに落とす" : (label ?? "ファイルを落とすか、押して選ぶ")}
							</span>
							{hint && <span className="text-sm text-fg-muted">{hint}</span>}
						</span>
					</>
				)}
			</label>
			{rejected > 0 && (
				<p data-slot="file-drop-error" role="alert" className="text-sm text-danger">
					{rejected} 件は追加できません。形式か大きさが合いません。
				</p>
			)}
			{showList && files.length > 0 && (
				<ul
					ref={listRef}
					data-slot="file-drop-list"
					className="flex flex-col gap-1.5"
					aria-label="選んだファイル"
				>
					<AnimatePresence initial={false} mode="popLayout">
						{files.map((file, index) => (
							<FileDropItem
								key={fileKey(file)}
								file={file}
								disabled={disabled}
								onRemove={() => remove(index)}
							/>
						))}
					</AnimatePresence>
				</ul>
			)}
		</div>
	);
}

function FileDropItem({
	file,
	disabled,
	onRemove,
	ref,
}: {
	file: File;
	disabled?: boolean;
	onRemove: () => void;
	ref?: React.Ref<HTMLLIElement>;
}) {
	const reduce = useReducedMotion();
	const preview = useObjectUrl(file.type.startsWith("image/") ? file : null);
	const [broken, setBroken] = React.useState(false);
	return (
		<motion.li
			ref={ref}
			data-slot="file-drop-item"
			layout={!reduce}
			initial={reduce ? false : { opacity: 0, y: 8 }}
			animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
			// 煙: 外すと上へ薄れて消える
			exit={
				reduce
					? { opacity: 0, transition: { duration: 0 } }
					: { opacity: 0, y: -8, filter: "blur(2px)", transition: { duration: 0.2, ease: [0.16, 1, 0.3, 1] } }
			}
			transition={springs.ignite}
			className="flex items-center gap-3 rounded-md border border-line bg-surface-raised py-1.5 pr-1.5 pl-1.5 shadow-rim"
		>
			<span className="flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-sm bg-surface-sunken text-fg-muted">
				{preview && !broken ? (
					<img src={preview} alt="" className="size-full object-cover" onError={() => setBroken(true)} />
				) : file.type.startsWith("image/") ? (
					<ImageIcon className="size-4" aria-hidden />
				) : (
					<FileIcon className="size-4" aria-hidden />
				)}
			</span>
			<span className="flex min-w-0 flex-1 flex-col">
				<span className="truncate text-sm text-fg">{file.name}</span>
				<span className="text-xs text-fg-muted tabular-nums">{formatBytes(file.size)}</span>
			</span>
			<Button
				data-slot="file-drop-remove"
				data-file-key={fileKey(file)}
				variant="ghost"
				size="icon-sm"
				aria-label={`${file.name} を外す`}
				disabled={disabled}
				onClick={onRemove}
			>
				<X />
			</Button>
		</motion.li>
	);
}

function fileKey(file: File) {
	return `${file.name}-${file.size}-${file.lastModified}`;
}

function useObjectUrl(file: File | null) {
	const [url, setUrl] = React.useState<string>();
	React.useEffect(() => {
		if (!file) return;
		const next = URL.createObjectURL(file);
		setUrl(next);
		return () => URL.revokeObjectURL(next);
	}, [file]);
	return url;
}

function hasFiles(event: React.DragEvent) {
	return Array.from(event.dataTransfer.types).includes("Files");
}

/** input の accept と同じ規則で、ファイルを受け付けるか調べる。落としたファイルは accept を素通りするため */
function matchesAccept(file: File, accept?: string) {
	if (!accept) return true;
	const name = file.name.toLowerCase();
	const type = file.type.toLowerCase();
	return accept
		.split(",")
		.map((rule) => rule.trim().toLowerCase())
		.some((rule) => {
			if (!rule) return false;
			if (rule.startsWith(".")) return name.endsWith(rule);
			if (rule.endsWith("/*")) return type.startsWith(rule.slice(0, -1));
			return type === rule;
		});
}

function formatBytes(bytes: number) {
	if (bytes < 1024) return `${bytes} B`;
	if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(bytes < 10 * 1024 ? 1 : 0)} KB`;
	return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

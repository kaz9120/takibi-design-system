import * as React from "react";
import { cn } from "../lib/cn";

type Spark = {
	left: string;
	x: number;
	y: number;
	sway: number;
	delay: number;
	duration: number;
	size: number;
};

const between = (min: number, max: number) => min + Math.random() * (max - min);
const side = () => (Math.random() < 0.5 ? -1 : 1);

/**
 * 火の粉を count 個ばらまく。3 割は小さい粒で、速く高く飛んで 280〜460ms で消える。残りは大きい粒で、低くゆっくり上がって 520〜830ms で消える。
 * 長さは、焚き火の計算モデルで火の粉の明るさが 1% になるまでの時間から取った（小さい粒 0.28 秒、大きい粒 0.83 秒）。
 * 位置は横に等分した区画の中でずらすので、1 か所に固まらない。
 */
function scatter(count: number): Spark[] {
	return Array.from({ length: count }, (_, i) => {
		const pop = Math.random() < 0.3;
		const x = side() * (pop ? between(6, 16) : between(2, 8));
		return {
			left: `${8 + ((i + Math.random()) / count) * 84}%`,
			x,
			y: -(pop ? between(26, 44) : between(14, 26)),
			sway: -Math.sign(x) * between(1, 4),
			delay: pop ? between(0, 40) : between(20, 160),
			duration: pop ? between(280, 460) : between(520, 830),
			size: pop ? between(2, 2.8) : between(2.4, 3.6),
		};
	});
}

/**
 * 右上の角の 1 点から、火の粉を count 個飛ばす。真上から右へ 60 度、左へ 35 度までの扇形に広がる。
 * 薪の 1 か所がはぜたときと同じで、出どころは 1 点、飛ぶ先はばらばらになる。
 */
function burst(count: number): Spark[] {
	return Array.from({ length: count }, () => {
		const pop = Math.random() < 0.4;
		const angle = between(-0.6, 1.05);
		const reach = pop ? between(30, 46) : between(14, 28);
		const x = Math.sin(angle) * reach;
		return {
			left: `calc(100% - ${between(7, 11)}px)`,
			x,
			y: -Math.cos(angle) * reach - 4,
			sway: -Math.sign(x) * between(1, 4),
			delay: pop ? between(0, 30) : between(10, 110),
			duration: pop ? between(280, 460) : between(520, 830),
			size: pop ? between(2, 2.8) : between(2.4, 3.4),
		};
	});
}

export type SparksProps = Omit<React.ComponentProps<"span">, "children"> & {
	/** 火の粉の数。既定は 7。5〜9 に収める */
	count?: number;
	/** 縁から外へ広がる光（motion-flare）を一緒に出す。既定は true */
	flare?: boolean;
	/** 火の粉の出どころ。"edge" は上の縁の全体、"corner" は右上の角の 1 点。既定は "edge" */
	from?: "edge" | "corner";
};

/**
 * はぜる。完了の瞬間に、親の上の縁（from="corner" では右上の角の 1 点）から火の粉が数個だけ飛び、縁から光が外へ広がって消える。
 * 親を position: relative にして、完了したときだけ描画する。飛ぶ先、速さ、大きさは描画のたびに変わる。
 * 1 つの操作につき、主役の 1 か所だけに使う。動きを減らす設定では何も見えない。
 */
export function Sparks({ count = 7, flare = true, from = "edge", className, ...props }: SparksProps) {
	// 乱数はサーバーとブラウザで値が変わるので、表示したあとに決める
	const [sparks, setSparks] = React.useState<Spark[]>([]);
	React.useEffect(() => setSparks(from === "corner" ? burst(count) : scatter(count)), [count, from]);
	return (
		<span
			aria-hidden
			data-slot="sparks"
			className={cn(
				"pointer-events-none absolute inset-0 rounded-[inherit]",
				flare && "motion-flare",
				className,
			)}
			{...props}
		>
			{sparks.map((s, i) => (
				<span
					// biome-ignore lint/suspicious/noArrayIndexKey: 火の粉は描画のたびに作り直し、並べ替えない
					key={i}
					className="motion-spark absolute top-0 rounded-full shadow-[0_0_6px_var(--color-heat-ember)]"
					style={
						{
							left: s.left,
							width: s.size,
							height: s.size,
							"--spark-x": `${s.x}px`,
							"--spark-y": `${s.y}px`,
							"--spark-sway": `${s.sway}px`,
							"--spark-delay": `${s.delay}ms`,
							"--spark-duration": `${s.duration}ms`,
						} as React.CSSProperties
					}
				/>
			))}
		</span>
	);
}

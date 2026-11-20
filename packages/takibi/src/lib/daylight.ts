import { setTheme, type Theme } from "./theme";

/**
 * 時刻に合わせるときの、仮想の場所と日付。位置情報は使わない。
 * 浅間山麓の標高 1200m（北緯 36.4 度）、秋分の日、晴れ。太陽は 12 時に真南で最も高く（53.6 度）、6 時に出て 18 時に沈む。
 */
export const DAYLIGHT_SITE = { name: "浅間山麓 標高 1200m、秋分の日", latitude: 36.4 } as const;

/** 太陽が地平線の下 3 度より上にある間を、昼のテーマにする。5 時 45 分と 18 時 15 分に切り替わる */
const SWITCH_ELEVATION = -3;

const RAD = Math.PI / 180;
const smooth = (from: number, to: number, x: number) => {
	const t = Math.min(1, Math.max(0, (x - from) / (to - from)));
	return t * t * (3 - 2 * t);
};

/** 時刻（0〜24 の小数）での太陽の高度（度）。秋分の日は、太陽が天の赤道の上にあるので、緯度と時刻だけで決まる */
export function sunElevation(hours: number): number {
	const hourAngle = (hours - 12) * 15 * RAD;
	return Math.asin(Math.cos(DAYLIGHT_SITE.latitude * RAD) * Math.cos(hourAngle)) / RAD;
}

export type Sky = {
	/** 夜のテーマか、昼のテーマか */
	theme: Theme;
	/** 0 は真夜中か正午。1 は日の出・日の入りの間際。CSS の --sky-phase に入る */
	phase: number;
	/** 太陽の高度（度） */
	elevation: number;
};

/**
 * 時刻（0〜24 の小数）での空の状態。
 * 夜は、太陽が地平線の下 18 度（天文薄明の終わり）から 3 度へ昇るにつれて phase が 0 から 1 になり、面の色に薄明の青が乗る。
 * 昼は、太陽の高度が 20 度から 0 度へ下がるにつれて phase が 0 から 1 になり、面の色が低い日の光の色に寄る。
 */
export function skyAt(hours: number): Sky {
	const elevation = sunElevation(hours);
	const theme: Theme = elevation > SWITCH_ELEVATION ? "light" : "dark";
	const phase = theme === "dark" ? smooth(-18, SWITCH_ELEVATION, elevation) : 1 - smooth(0, 20, elevation);
	return { theme, phase, elevation };
}

const hoursOf = (date: Date) => date.getHours() + date.getMinutes() / 60 + date.getSeconds() / 3600;

/** 空の状態を画面に当てる。テーマが変わるときは setTheme() の切り替えの動きが出る */
export function applySky(sky: Sky, root: HTMLElement = document.documentElement) {
	root.style.setProperty("--sky-phase", sky.phase.toFixed(3));
	setTheme(sky.theme, root);
}

/**
 * 端末の時計に合わせて、テーマと面の色を動かし続ける。1 分ごとに更新する。
 * 返す関数を呼ぶと止まり、面の色は真夜中か正午の色に戻る（テーマは止めたときのまま残る）。
 */
export function startDaylight({
	now = () => new Date(),
	root = document.documentElement,
}: {
	now?: () => Date;
	root?: HTMLElement;
} = {}) {
	const tick = () => applySky(skyAt(hoursOf(now())), root);
	tick();
	const id = window.setInterval(tick, 60_000);
	return () => {
		window.clearInterval(id);
		root.style.removeProperty("--sky-phase");
	};
}

/** 天気。晴れか曇り。デザインシステムは天気を取りに行かないので、アプリが渡す */
export type Weather = "clear" | "cloudy";

/** 天気を画面に当てる。曇りでは、面、文字、枠線の色みが抜けて灰色に寄る */
export function setWeather(weather: Weather, root: HTMLElement = document.documentElement) {
	if (weather === "cloudy") root.dataset.weather = "cloudy";
	else delete root.dataset.weather;
}

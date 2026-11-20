/*
 * ストーリー用の見本の画像。焚き火の計算モデル（labs/fire3d）の画面を、時刻を変えて 3 枚撮ったもの（800×500）。
 * npm のパッケージには入れない（package.json の files で除いている）。
 */
import campfire1 from "./campfire-1.webp";
import campfire2 from "./campfire-2.webp";
import campfire3 from "./campfire-3.webp";
import tiny from "./campfire-tiny.webp";

/** 夜の焚き火の画像 3 枚 */
export const campfires: readonly [string, string, string] = [campfire1, campfire2, campfire3];

/** 1 枚目を 32×20 に縮めたもの。読み込みを待つ間にぼかして見せる */
export const campfireTiny: string = tiny;

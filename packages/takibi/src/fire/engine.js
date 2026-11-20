/* ============================================================
   焚き火の計算モデル（<takibi-fire> と labs/fire3d が使う）
   ------------------------------------------------------------
   薪、熾、地面を立体の形にして、炎を 3 次元の流れとして WebGL2 で計算して描く。

   薪の組み方: ロングファイヤー型。太い丸太 2 本を、内側の面が 15cm 離れるように地面へ平行に置く。
   その間に、四つ割りの細い薪を丸太と同じ向きに 2 段でくべる。丸太は太くて火がつきにくく、燃えるのは間の薪。

   形の作り方: 画面の 1 点ごとに視線を伸ばし、薪までの距離を返す関数（距離関数）に当たる所を探す。
   薪は絵ではなく形なので、どの角度から見ても輪郭、重なり、影が合う。
   - 丸太: 円柱。太さは長さ方向にゆるく変わり、少し曲がっている。樹皮は縦の溝を凹凸として持つ
   - 割った薪: 円柱を、芯を通る 1 枚か 2 枚の面で切った形。割り面は繊維に沿った細かい凹凸を持つ
   - 切り口: 軸に対して数度傾いた平面。年輪は木の芯を中心に広がる（割った薪では、芯は割り面の角にある）
   - 焦げ: 火に近い面が炭になる。炭は木目に沿って長い四角に割れ、割れ目は 3mm ほどくぼむ。上を向いた面には白い灰が乗る
   - 熾: 枕木の間に積もった炭のかたまり。1 個ずつが形を持つ

   炎: 0.8m × 0.8m × 0.53m の空間を 96 × 96 × 64 のマスに分け、速度、温度、燃料のガス、酸素、すすを毎コマ解く。
   燃料は熱い薪の表面と熾から出て、空気と混ざった所で燃える。色はすすの温度から黒体放射の式で決める。
   炎全体の明るさと重心を毎コマ測り、その位置の光源で薪と地面を照らす。

   負荷の抑え方:
   - 計算も描画も GPU で行う。JS が毎コマ行うのは、薪の状態の更新と、火の粉（最大 300 個）の移動だけ
   - GPU から値を読むときは待たない（reader）。炎の光は GPU の上でまとめ、合成がそのまま読む
   - 薪と地面は、形か視点が変わったときだけ描き直す。描き直しは rebuildFrames コマに分け、1 コマの重さを抑える。
     薪が落ちる、折れる、視点を動かす、の間だけは 4 割の解像度で毎コマ描く

   使い方:
     const engine = createFireEngine(canvas, { params, view, onEvent, manual });
     await engine.ready;            // シェーダーが組み上がるまで待つ
     engine.resize(w, h);           // 描く大きさ（画素）
     engine.render(performance.now());  // 1 コマ進めて描く。呼ぶ間隔が時間の進みになる（上限 0.05 秒）
   manual を true にすると焼き出し用になり、GPU の値をその場で読む（毎コマの値がそろう代わりに、GPU を待つ）。
   ============================================================ */

/** 薪の向きから横へ回った角度 az、見下ろす角度 el、中心からの距離 dist（m）、縦の画角 fov（度）の候補 */
export const ANGLES = [
	{ name: "斜め前・低め", az: 28, el: 12, dist: 1.5, fov: 34 },
	{ name: "薪の端から", az: 8, el: 16, dist: 1.2, fov: 34 },
	{ name: "真横", az: 90, el: 10, dist: 1.3, fov: 34 },
	{ name: "見下ろす", az: 40, el: 38, dist: 1.25, fov: 34 },
];

export function createFireEngine(canvas, options = {}) {
const manual = !!options.manual;
const gl = canvas.getContext("webgl2", { antialias: false, alpha: true, premultipliedAlpha: true, powerPreference: options.powerPreference ?? "default" });
function fail(msg) { throw new Error(msg); }
if (!gl) fail("このブラウザでは WebGL2 が使えない");
if (!gl.getExtension("EXT_color_buffer_float") && !gl.getExtension("EXT_color_buffer_half_float")) fail("浮動小数のテクスチャに描けない");
gl.getExtension("OES_texture_float_linear");
const timerExt = gl.getExtension("EXT_disjoint_timer_query_webgl2");

// ---------- 薪の並び（単位はメートル。x は薪の向き、y は上、z は横） ----------
// type: 0 丸太、1 半割り、2 四つ割り。r は太さの半分。spin は軸まわりの向き、bend は曲がり、heat は火の当たり方
const LOGS = [
	// 両脇の丸太。地面に直に置く。太いので火はつきにくく、内側の面が焦げるだけ
	{ a: [-0.31, 0.06, -0.142], b: [0.29, 0.06, -0.13], r: 0.06, type: 0, spin: 0.3, bend: 0.005, heat: 0.3 },
	{ a: [-0.28, 0.057, 0.128], b: [0.31, 0.057, 0.14], r: 0.057, type: 0, spin: 2.1, bend: -0.004, heat: 0.3 },
	// 間にくべた薪。四つ割りを丸太と同じ向きに、2 段に重ねる
	{ a: [-0.2, 0.062, -0.04], b: [0.19, 0.066, -0.032], r: 0.04, type: 2, spin: 3.9, bend: 0.002, heat: 1 },
	{ a: [-0.17, 0.064, 0.03], b: [0.215, 0.06, 0.04], r: 0.038, type: 2, spin: 5.4, bend: -0.002, heat: 1 },
	{ a: [-0.215, 0.118, -0.012], b: [0.17, 0.126, 0.012], r: 0.039, type: 2, spin: 4.5, bend: 0.002, heat: 1 },
	{ a: [-0.15, 0.115, 0.058], b: [0.225, 0.122, 0.03], r: 0.034, type: 1, spin: 3.3, bend: -0.002, heat: 1 },
];
const MAX_LOGS = 14;

// ---------- WebGL の道具 ----------
const VS = `#version 300 es
in vec2 p; out vec2 uv;
void main(){ uv = p * 0.5 + 0.5; gl_Position = vec4(p, 0.0, 1.0); }`;
// シェーダーは、できるブラウザでは裏で組み立てる（KHR_parallel_shader_compile）。組み上がるまで ready は終わらない
const parallel = gl.getExtension("KHR_parallel_shader_compile");
const pending = [];
function compile(type, src) { const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); return s; }
function program(fs) {
	const vs = compile(gl.VERTEX_SHADER, VS), fsh = compile(gl.FRAGMENT_SHADER, `#version 300 es\nprecision highp float;\nprecision highp sampler2D;\n${fs}`);
	const p = gl.createProgram(); gl.attachShader(p, vs); gl.attachShader(p, fsh); gl.bindAttribLocation(p, 0, "p"); gl.linkProgram(p);
	const prog = { p, u: {} }; pending.push({ prog, fsh }); return prog;
}
const programsDone = () => !parallel || pending.every(({ prog }) => gl.getProgramParameter(prog.p, parallel.COMPLETION_STATUS_KHR));
function finishPrograms() {
	for (const { prog, fsh } of pending) {
		if (!gl.getProgramParameter(prog.p, gl.LINK_STATUS)) fail(`シェーダーの組み立てに失敗: ${gl.getProgramInfoLog(prog.p)} ${gl.getShaderInfoLog(fsh) ?? ""}`);
		const n = gl.getProgramParameter(prog.p, gl.ACTIVE_UNIFORMS);
		for (let i = 0; i < n; i++) { const info = gl.getActiveUniform(prog.p, i); const name = info.name.replace(/\[0\]$/, ""); prog.u[name] = gl.getUniformLocation(prog.p, name); }
	}
	pending.length = 0;
}
const quad = gl.createVertexArray(); gl.bindVertexArray(quad);
gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
function target(w, h) {
	const tex = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, tex);
	gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA16F, w, h, 0, gl.RGBA, gl.HALF_FLOAT, null);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
	const fbo = gl.createFramebuffer(); gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
	gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
	return { tex, fbo, w, h };
}
function draw(prog, dst, set) {
	gl.useProgram(prog.p);
	gl.bindFramebuffer(gl.FRAMEBUFFER, dst ? dst.fbo : null);
	gl.viewport(0, 0, dst ? dst.w : canvas.width, dst ? dst.h : canvas.height);
	let unit = 0;
	const api = {
		tex(name, t) { gl.activeTexture(gl.TEXTURE0 + unit); gl.bindTexture(gl.TEXTURE_2D, t.tex ?? t); gl.uniform1i(prog.u[name], unit++); return api; },
		f(name, ...v) { if (prog.u[name]) gl[`uniform${v.length}f`](prog.u[name], ...v); return api; },
		i(name, v) { if (prog.u[name]) gl.uniform1i(prog.u[name], v); return api; },
		fv(name, size, arr) { if (prog.u[name]) gl[`uniform${size}fv`](prog.u[name], arr); return api; },
	};
	set(api);
	gl.bindVertexArray(quad); gl.drawArrays(gl.TRIANGLES, 0, 3);
}

// ---------- 炎の計算（3 次元の格子を、1 枚の画像に 8 × 8 枚の断面として並べて持つ） ----------
const NX = 96, NY = 96, NZ = 64, TX = 8, TY = 8;
const CELL = 0.8 / NX; // 1 マス 8.3mm
const ORIGIN = [-0.4, 0, (-NZ * CELL) / 2];
const SIMLIB = `
const ivec3 N = ivec3(${NX}, ${NY}, ${NZ}); const ivec2 TILES = ivec2(${TX}, ${TY});
const float CELL = ${CELL.toFixed(6)}; const vec3 ORIGIN = vec3(${ORIGIN.map((v) => v.toFixed(5)).join(", ")});
ivec3 cellOf(ivec2 f){ ivec2 t = f / N.xy; return ivec3(f - t * N.xy, t.x + t.y * TILES.x); }
vec4 fetch(sampler2D s, ivec3 c){ c = clamp(c, ivec3(0), N - 1); return texelFetch(s, ivec2(c.x + (c.z % TILES.x) * N.x, c.y + (c.z / TILES.x) * N.y), 0); }
vec4 tile(sampler2D s, vec2 xy, int k){ k = clamp(k, 0, N.z - 1); vec2 o = vec2(float(k % TILES.x), float(k / TILES.x)) * vec2(N.xy); return texture(s, (o + clamp(xy, vec2(0.5), vec2(N.xy) - 0.5)) / vec2(N.xy * TILES)); }
// マスの単位の位置 g での値。断面の中は線形補間、断面の間は 2 枚を混ぜる
vec4 samp(sampler2D s, vec3 g){ float z = g.z - 0.5; float k0 = floor(z); return mix(tile(s, g.xy, int(k0)), tile(s, g.xy, int(k0) + 1), z - k0); }
`;
const PLANCK = `
vec3 planck(float T){
	vec3 lam = vec3(610e-9, 550e-9, 465e-9);
	vec3 x = 0.0143877 / (lam * T);
	vec3 b = 1.0 / (pow(lam / 610e-9, vec3(5.0)) * (exp(x) - 1.0));
	return b / (1.0 / (exp(0.0143877 / (610e-9 * 1500.0)) - 1.0));
}
// 炎が 1m あたりに出す光。すすの量 × その温度の黒体放射。根元の反応している所には、すすのない青い光が少しある
vec3 flameEmit(vec4 s){
	vec3 e = planck(s.x) * (1.0 - exp(-s.w * 1.6)) * smoothstep(800.0, 1000.0, s.x) * 260.0;
	e += vec3(0.04, 0.1, 0.4) * min(s.y * s.z, 0.3) * smoothstep(700.0, 1100.0, s.x) * exp(-s.w * 6.0) * 5.0;
	return e;
}`;
const SIMLOGS = `
uniform vec4 uLogA[${MAX_LOGS}]; uniform vec4 uLogB[${MAX_LOGS}]; uniform vec4 uLogC[${MAX_LOGS}]; uniform vec4 uLogD[${MAX_LOGS}]; uniform int uLogN; uniform float uBed;
float hash3(vec3 p){ p = fract(p * vec3(0.1031, 0.1030, 0.0973)); p += dot(p, p.yxz + 33.33); return fract((p.x + p.y) * p.z); }
float vnoise3(vec3 p){ vec3 i = floor(p), f = fract(p); f = f*f*(3.0-2.0*f);
	return mix(mix(mix(hash3(i), hash3(i+vec3(1,0,0)), f.x), mix(hash3(i+vec3(0,1,0)), hash3(i+vec3(1,1,0)), f.x), f.y),
		mix(mix(hash3(i+vec3(0,0,1)), hash3(i+vec3(1,0,1)), f.x), mix(hash3(i+vec3(0,1,1)), hash3(i+vec3(1,1,1)), f.x), f.y), f.z); }
float heatAt(vec3 p){ vec3 q = (p - vec3(0.0, 0.075, 0.0)) / vec3(0.21, 0.1, 0.1); return exp(-dot(q, q)); }
// 薪の表面までの距離（円柱として）と、その薪への火の当たり方
float logDist(vec3 p, int i){ vec3 A = uLogA[i].xyz, ba = uLogB[i].xyz - A; vec3 pa = p - A; float h = clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0); return length(pa - ba * h) - uLogA[i].w * 0.9; }
`;
const ADVECT = program(`
out vec4 o; uniform sampler2D uVel, uSrc; uniform float uDt;
${SIMLIB}
void main(){
	ivec3 c = cellOf(ivec2(gl_FragCoord.xy)); vec3 g = vec3(c) + 0.5;
	vec3 v = fetch(uVel, c).xyz;
	vec3 mid = g - 0.5 * uDt * v / CELL;
	o = samp(uSrc, g - uDt * samp(uVel, mid).xyz / CELL);
}`);
// 燃料の出る所、反応、冷却。状態は (温度 T, 燃料のガス F, 酸素 O, すす S)
const REACT = program(`
out vec4 o; uniform sampler2D uState; uniform float uDt, uTime, uIntensity, uBurn;
${SIMLIB}${SIMLOGS}
void main(){
	ivec3 c = cellOf(ivec2(gl_FragCoord.xy)); vec3 p = ORIGIN + (vec3(c) + 0.5) * CELL;
	// 外の縁は外気: 300 K、燃料なし、酸素あり
	if (c.x == 0 || c.x == N.x - 1 || c.z == 0 || c.z == N.z - 1 || c.y == N.y - 1) { o = vec4(300.0, 0.0, 1.0, 0.0); return; }
	vec4 s = fetch(uState, c);
	// 熱と気体の拡散: 隣の 6 マスと少し混ぜる
	vec4 nb = fetch(uState, c + ivec3(1,0,0)) + fetch(uState, c - ivec3(1,0,0)) + fetch(uState, c + ivec3(0,1,0)) + fetch(uState, c - ivec3(0,1,0)) + fetch(uState, c + ivec3(0,0,1)) + fetch(uState, c - ivec3(0,0,1));
	s = mix(s, nb / 6.0, 0.12);
	float T = max(s.x, 300.0), F = max(s.y, 0.0), O = clamp(s.z, 0.0, 1.0), S = max(s.w, 0.0);
	// 燃料は、熱い薪の表面から 3cm までの空気と、熾の上に出る。太い丸太は火の当たり方が小さいので、ほとんど出さない
	float src = 0.0; float solid = 0.0; float smoke = 0.0;
	for (int i = 0; i < ${MAX_LOGS}; i++) {
		if (i >= uLogN) break;
		float d = logDist(p, i);
		if (d < 0.0) solid = 1.0;
		float band = smoothstep(0.03, 0.004, d) * step(0.0, d);
		src += band * uLogD[i].y;
		// 火が移る前の薪からは、燃えないガスと水蒸気（煙）が出る
		smoke += band * uLogD[i].z;
	}
	src = min(src, 1.3) * heatAt(p);
	// 熾からも少し出る。熾の山が大きいほど多い
	src += (0.2 + 0.5 * uBed) * smoothstep(0.07, 0.03, p.y) * step(abs(p.x), 0.22) * step(abs(p.z), 0.075);
	// 出る量は場所と時刻でむらがある。長さ方向に、よく燃える所が 10cm ほどの幅でゆっくり入れ替わる
	float n = vnoise3(vec3(p.x * 14.0, p.y * 14.0 - uTime * 1.1, p.z * 14.0 + uTime * 0.3));
	float n2 = vnoise3(vec3(p.x * 7.0 + uTime * 0.2, uTime * 0.5, p.z * 5.0));
	src *= (0.15 + 1.7 * n) * (0.4 + 1.2 * n2) * uIntensity;
	F += src * 8.0 * uDt;
	S += smoke * heatAt(p) * 2.5 * uDt;
	T += (980.0 - T) * clamp(src * 14.0 * uDt, 0.0, 1.0) * step(T, 980.0);
	// 反応: 燃料 1 に対して酸素 1.6 を使う。発火点（約 700 K）より上でだけ進む
	float ign = smoothstep(620.0, 780.0, T);
	float r = min(min(F, O / 1.6), 60.0 * F * O * ign * uDt);
	F -= r; O -= 1.6 * r; T += 2300.0 * r; S += 1.6 * r;
	// すすは、酸素のある熱い所で燃えてなくなる
	S -= S * O * smoothstep(1000.0, 1350.0, T) * 5.0 * uDt;
	// 冷却: すすの放射（T の 4 乗）と、周りの空気との混合
	float t4 = T * T * T * T - 8.1e9;
	T -= (1.3e-9 * min(S, 1.5) * t4 + 0.8 * (T - 300.0)) * uDt;
	F *= 1.0 - 0.4 * uDt;
	S *= 1.0 - (T < 700.0 ? 0.7 : 0.1) * uDt;
	// 薪の中には気体がない
	if (solid > 0.5) { F = 0.0; S = 0.0; O = 0.3; }
	o = vec4(clamp(T, 300.0, 1900.0), F, clamp(O, 0.0, 1.0), max(S, 0.0));
}`);
const FORCE = program(`
out vec4 o; uniform sampler2D uVel, uState; uniform float uDt, uTime, uWind;
${SIMLIB}${SIMLOGS}
vec3 pot(vec3 p){ return vec3(vnoise3(p * 15.0 + vec3(0.0, -uTime * 2.0, 3.1)), vnoise3(p * 15.0 + vec3(7.3, -uTime * 2.0, 0.0)), vnoise3(p * 15.0 + vec3(1.7, -uTime * 2.0, 9.2))); }
void main(){
	ivec3 c = cellOf(ivec2(gl_FragCoord.xy)); vec3 p = ORIGIN + (vec3(c) + 0.5) * CELL;
	vec3 v = fetch(uVel, c).xyz; float T = fetch(uState, c).x;
	// 浮力: 熱い気体は軽いので上へ加速する。加速度は g (T/Ta − 1)
	v.y += 9.8 * (T / 300.0 - 1.0) * uDt;
	// マスより細かい乱れ: 発散のない小さな渦（ベクトルポテンシャルの回転）を、熱い所にだけ足す
	float e = 0.004;
	vec3 dx = pot(p + vec3(e, 0, 0)) - pot(p - vec3(e, 0, 0)), dy = pot(p + vec3(0, e, 0)) - pot(p - vec3(0, e, 0)), dz = pot(p + vec3(0, 0, e)) - pot(p - vec3(0, 0, e));
	vec3 curl = vec3(dy.z - dz.y, dz.x - dx.z, dx.y - dy.x) / (2.0 * e);
	v += curl * 0.03 * smoothstep(500.0, 1100.0, T) * uDt * 60.0;
	v.x += (uWind - v.x) * 0.6 * uDt * smoothstep(900.0, 320.0, T);
	v *= 1.0 - 0.35 * uDt;
	// 地面と薪は通り抜けない
	if (c.y == 0) v.y = 0.0;
	for (int i = 0; i < ${MAX_LOGS}; i++) { if (i >= uLogN) break; if (logDist(p, i) < 0.0) v *= 0.0; }
	o = vec4(v, 1.0);
}`);
const DIVERGENCE = program(`
out vec4 o; uniform sampler2D uVel;
${SIMLIB}
void main(){
	ivec3 c = cellOf(ivec2(gl_FragCoord.xy));
	float d = fetch(uVel, c + ivec3(1,0,0)).x - fetch(uVel, c - ivec3(1,0,0)).x + fetch(uVel, c + ivec3(0,1,0)).y - (c.y == 0 ? 0.0 : fetch(uVel, c - ivec3(0,1,0)).y) + fetch(uVel, c + ivec3(0,0,1)).z - fetch(uVel, c - ivec3(0,0,1)).z;
	o = vec4(d / (2.0 * CELL), 0, 0, 1);
}`);
const PRESSURE_LIB = `
// 上と横は開いている（圧力 0）。地面は閉じている（勾配 0）
float P(sampler2D s, ivec3 c){ if (c.x < 0 || c.x >= N.x || c.z < 0 || c.z >= N.z || c.y >= N.y) return 0.0; c.y = max(c.y, 0); return fetch(s, c).x; }
`;
const JACOBI = program(`
out vec4 o; uniform sampler2D uP, uDiv;
${SIMLIB}${PRESSURE_LIB}
void main(){
	ivec3 c = cellOf(ivec2(gl_FragCoord.xy));
	float sum = P(uP, c + ivec3(1,0,0)) + P(uP, c - ivec3(1,0,0)) + P(uP, c + ivec3(0,1,0)) + P(uP, c - ivec3(0,1,0)) + P(uP, c + ivec3(0,0,1)) + P(uP, c - ivec3(0,0,1));
	o = vec4((sum - CELL * CELL * fetch(uDiv, c).x) / 6.0, 0, 0, 1);
}`);
const GRADIENT = program(`
out vec4 o; uniform sampler2D uP, uVel;
${SIMLIB}${PRESSURE_LIB}
void main(){
	ivec3 c = cellOf(ivec2(gl_FragCoord.xy));
	vec3 v = fetch(uVel, c).xyz;
	v -= vec3(P(uP, c + ivec3(1,0,0)) - P(uP, c - ivec3(1,0,0)), P(uP, c + ivec3(0,1,0)) - P(uP, c - ivec3(0,1,0)), P(uP, c + ivec3(0,0,1)) - P(uP, c - ivec3(0,0,1))) / (2.0 * CELL);
	if (c.y == 0) v.y = 0.0;
	o = vec4(v, 1.0);
}`);
// 炎の光を、断面 1 枚につき 8 × 8 に縮めた画像。合計の色と重心を求めるために読む
const LIGHTMAP = program(`
in vec2 uv; out vec4 o; uniform sampler2D uState;
${PLANCK}
void main(){
	vec3 e = vec3(0.0); vec2 px = 1.0 / vec2(textureSize(uState, 0));
	for (int j = -1; j <= 1; j++) for (int i = -1; i <= 1; i++) e += flameEmit(texture(uState, uv + vec2(i, j) * px * 4.0));
	e /= 9.0; o = vec4(e, dot(e, vec3(0.3, 0.6, 0.1)));
}`);

// ---------- シェーダー ----------
const SCENE = program(`
in vec2 uv; layout(location = 0) out vec4 o0; layout(location = 1) out vec4 o1; layout(location = 2) out vec4 o2; layout(location = 3) out vec4 o3;
uniform vec2 uRes; uniform vec3 uCam, uRight, uUp, uFwd; uniform float uFocal, uTime, uBurn, uWhite; uniform vec2 uCenter;
uniform sampler2D uState; uniform vec3 uLightPos, uLightCol;
${SIMLIB}
uniform vec4 uLogA[${MAX_LOGS}]; // 端 a (x, y, z) と太さの半分
uniform vec4 uLogB[${MAX_LOGS}]; // 端 b (x, y, z) と種類
uniform vec4 uLogC[${MAX_LOGS}]; // (軸まわりの向き, 曲がり, 火の当たり方, 乱数)
uniform vec4 uLogD[${MAX_LOGS}]; // (燃え進み 0〜1.3, 燃料の出方, 生木の度合い, 0)
uniform float uBed; // 熾の山の量（0〜1）
uniform int uLogN;

float hash(vec2 p){ p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
float hash3(vec3 p){ p = fract(p * vec3(0.1031, 0.1030, 0.0973)); p += dot(p, p.yxz + 33.33); return fract((p.x + p.y) * p.z); }
float vnoise(vec2 p){ vec2 i = floor(p), f = fract(p); f = f*f*(3.0-2.0*f);
	return mix(mix(hash(i), hash(i+vec2(1,0)), f.x), mix(hash(i+vec2(0,1)), hash(i+vec2(1,1)), f.x), f.y); }
float fbm(vec2 p){ float a = 0.5, s = 0.0; for(int i=0;i<4;i++){ s += a*vnoise(p); p = p*2.03 + 17.1; a *= 0.5; } return s; }
float vnoise3(vec3 p){ vec3 i = floor(p), f = fract(p); f = f*f*(3.0-2.0*f);
	return mix(mix(mix(hash3(i), hash3(i+vec3(1,0,0)), f.x), mix(hash3(i+vec3(0,1,0)), hash3(i+vec3(1,1,0)), f.x), f.y),
		mix(mix(hash3(i+vec3(0,0,1)), hash3(i+vec3(1,0,1)), f.x), mix(hash3(i+vec3(0,1,1)), hash3(i+vec3(1,1,1)), f.x), f.y), f.z); }
// 炭の割れ: 木目（x）の向きに長い四角の区画。返す値は (割れ目からの距離, 区画ごとの乱数)
vec2 cracks(vec2 p){
	vec2 i = floor(p), f = fract(p); float d1 = 9.0, d2 = 9.0, id = 0.0;
	for(int y=-1;y<=1;y++) for(int x=-1;x<=1;x++){
		vec2 g = vec2(x, y); vec2 c = g + vec2(hash(i + g), hash(i + g + 7.7)) * 0.7 + 0.15;
		vec2 dv = (c - f) * vec2(1.0, 1.25); float d = max(abs(dv.x), abs(dv.y));
		if (d < d1) { d2 = d1; d1 = d; id = hash(i + g + 3.1); } else if (d < d2) d2 = d;
	}
	return vec2(d2 - d1, id);
}

// 火に近い度合い（0〜1）。火は丸太の間にある
float heatAt(vec3 p){
	vec3 q = (p - vec3(0.0, 0.075, 0.0)) / vec3(0.21, 0.1, 0.1);
	return exp(-dot(q, q));
}

// 薪 1 本の座標。返す値: x は端 a からの長さ、yz は軸に垂直な面での位置（向きを回したあと）
struct LogP { float x; vec2 q; float len; float r; float kind; float seed; float heat; float burn; };
LogP logLocal(vec3 p, int i){
	vec3 A = uLogA[i].xyz, B = uLogB[i].xyz; vec3 ax = B - A; float len = length(ax); ax /= len;
	vec3 e1 = normalize(cross(ax, vec3(0.0, 1.0, 0.0))); vec3 e2 = cross(e1, ax);
	vec3 d = p - A; float x = dot(d, ax);
	// 木は少し曲がっている
	float tt = clamp(x / len, 0.0, 1.0);
	vec3 c = d - ax * x - e2 * uLogC[i].y * sin(3.1416 * tt) * 4.0 * 0.25 - e1 * uLogC[i].y * sin(6.2832 * tt) * 0.4;
	float cs = cos(uLogC[i].x), sn = sin(uLogC[i].x);
	vec2 q = vec2(dot(c, e1), dot(c, e2)); q = vec2(q.x * cs - q.y * sn, q.x * sn + q.y * cs);
	return LogP(x, q, len, uLogA[i].w, uLogB[i].w, uLogC[i].w, uLogC[i].z, uLogD[i].x);
}
// 焦げの度合い（0〜1）: 火に近く、長く燃えたほど進む。場所ごとにむらがある
float charOf(vec3 p, LogP L){
	float n = fbm(vec2(L.x * 9.0 + L.seed * 30.0, atan(L.q.y, L.q.x) * 1.3));
	float h = heatAt(p) * L.heat;
	float ch = smoothstep(0.0, 1.0, (h * 1.25 + (n - 0.5) * 0.45) * (0.35 + 2.3 * L.burn) - 0.22);
	// 燃え進みが 0.85 を超えた薪は、火から遠い所まで炭になる
	return max(ch, smoothstep(0.85, 1.15, L.burn + (n - 0.5) * 0.2));
}
// 薪 1 本までの距離。detail が 1 のときは、表面の細かい凹凸まで入れる
float sdLog(vec3 p, int i, float detail, out float face){
	LogP L = logLocal(p, i);
	float tt = L.x / L.len; float ang = atan(L.q.y, L.q.x); float rr = length(L.q);
	// 太さ: 長さ方向にゆるく変わる。節の所は 6% ほど太い
	float knot = exp(-pow((tt - 0.3 - 0.4 * L.seed) * 9.0, 2.0)) * exp(-pow(sin((ang - L.seed * 6.0) * 0.5) * 2.2, 2.0));
	float R = L.r * (1.0 + 0.05 * sin(tt * 5.0 + L.seed * 20.0) + 0.04 * sin(ang * 2.0 + L.seed * 9.0) + 0.14 * knot);
	float ch = charOf(p, L);
	// 炭になった所だけが痩せる。火に近い中ほどから細り、端は太いまま残る。最大で元の 3 割の太さになる
	R *= 1.0 - min(0.7, 0.58 * smoothstep(0.35, 1.0, ch) * L.burn);
	float dCyl = rr - R; float d = dCyl; face = 0.0; // 0: 樹皮
	// 割り面
	if (L.kind > 0.5) {
		float off = L.r * 0.08;
		float d1 = L.q.y - off; // 半割り: 上半分を落とす
		if (L.kind > 1.5) { float d2 = L.q.x - off; if (d2 > d1) d1 = d2; }
		// 割り面は、裂けた繊維で少し波打つ
		d1 += (vnoise(vec2(L.x * 14.0, L.seed * 50.0)) - 0.5) * 0.006 + (vnoise(vec2(L.x * 5.0 + 3.0, L.q.x * 40.0)) - 0.5) * 0.005;
		if (L.kind > 1.5) d1 = max(L.q.y - off + (vnoise(vec2(L.x * 14.0, L.seed * 50.0)) - 0.5) * 0.006, L.q.x - off + (vnoise(vec2(L.x * 11.0, L.seed * 80.0)) - 0.5) * 0.006);
		if (d1 > d) { d = d1; face = 1.0; } // 1: 割り面
	}
	// 切り口: 軸に対して少し傾いている
	float capA = -L.x + L.q.x * (L.seed - 0.5) * 0.25, capB = L.x - L.len + L.q.y * (L.seed - 0.3) * 0.2;
	float cap = max(capA, capB);
	if (cap > d) { d = cap; face = 2.0; } // 2: 切り口
	if (detail > 0.5 && d < 0.02) {
		float bump = 0.0;
		if (face < 0.5) {
			// 樹皮: 縦に長い板が重なり、間に深い溝がある
			float f1 = vnoise(vec2(ang * R * 230.0 + L.seed * 40.0, L.x * 8.0 + 2.0 * vnoise(vec2(ang * 3.0, L.x * 5.0))));
			float f2 = vnoise(vec2(ang * R * 700.0, L.x * 60.0 + 4.0));
			bump = (smoothstep(0.2, 0.7, f1) - 0.5) * 0.003 + (f2 - 0.5) * 0.001;
		} else if (face < 1.5) {
			// 割り面: 繊維に沿った細い筋
			bump = (vnoise(vec2(L.x * 30.0, (L.q.x + L.q.y) * 900.0)) - 0.5) * 0.0012 + (vnoise(vec2(L.x * 8.0, (L.q.x - L.q.y) * 260.0 + L.seed * 9.0)) - 0.5) * 0.0018;
		} else {
			// 切り口: のこぎりの跡と、乾燥で入った放射状の割れ
			float rad = abs(sin(ang * 3.0 + L.seed * 20.0 + rr * 30.0));
			bump = -smoothstep(0.08, 0.0, rad * rr / L.r) * 0.003 * smoothstep(0.1, 0.5, rr / L.r) + (vnoise(vec2(L.q.x * 500.0, L.q.y * 80.0)) - 0.5) * 0.0006;
		}
		// 炭: 木目の向きに長い四角に割れる。割れ目は 3mm ほどくぼみ、区画の面は少しふくらむ
		if (ch > 0.3) {
			vec2 cp = face > 1.5 ? L.q * 70.0 : vec2(L.x * 34.0 + L.seed * 7.0, (face < 0.5 ? ang * R : (L.q.x + L.q.y) * 0.7) * 62.0);
			vec2 c = cracks(cp);
			float k = smoothstep(0.3, 0.75, ch);
			bump = mix(bump, -smoothstep(0.16, 0.0, c.x) * 0.0034 + (c.y - 0.5) * 0.0012, k);
		}
		d -= bump;
	}
	return d;
}
// 熾: 丸太の間の地面に積もった炭のかたまり。大きいもの（約 3cm）と小さいもの（約 1.6cm）を混ぜ、形は 1 個ずつ欠けさせる
float sdCoals(vec3 p, out float id){
	id = 0.0;
	float env = max(abs(p.x) - 0.23, abs(p.z) - 0.078);
	if (env > 0.04) return env;
	// 山の高さ: 中央が高く、燃えるほど増える
	float top = (0.014 + 0.04 * uBed) * (1.0 - 0.5 * smoothstep(0.1, 0.23, abs(p.x))) + 0.014 * vnoise(p.xz * 16.0);
	float d = 9.0;
	for (int j = 0; j < 3; j++) {
		vec3 g = j == 2 ? vec3(0.017, 0.013, 0.017) : vec3(0.032, 0.022, 0.03);
		vec3 q = p + float(j) * vec3(0.0137, 0.0091, 0.0113);
		vec3 ci = floor(q / g); vec3 f = q - (ci + 0.5) * g;
		float h = hash3(ci + float(j) * 17.0);
		// 3 割の区画には何も置かない。すき間ができて、奥の熾が見える
		if (hash3(ci + 2.9 + float(j)) < 0.3) continue;
		float sz = (j == 2 ? 0.0042 : 0.0072) + (j == 2 ? 0.003 : 0.0065) * h;
		vec3 off = (vec3(hash3(ci + 1.3), hash3(ci + 5.7), hash3(ci + 9.1)) - 0.5) * g * 0.3;
		// かたまりごとに向きを変える
		float a = h * 6.2832; vec3 r = f - off; r.xz = mat2(cos(a), -sin(a), sin(a), cos(a)) * r.xz;
		vec3 b = abs(r) - vec3(sz * 1.5, sz * 0.75, sz);
		float dd = length(max(b, 0.0)) + min(max(b.x, max(b.y, b.z)), 0.0) - sz * 0.45;
		// 欠けた角と、表面の割れ
		dd += (vnoise3(q * 170.0 + h * 9.0) - 0.5) * sz * 0.9 + (vnoise3(q * 520.0) - 0.5) * 0.0012;
		float cy = (ci.y + 0.5) * g.y;
		if (cy > top || cy < 0.0) continue;
		if (dd < d) { d = dd; id = h; }
	}
	return max(min(d, 0.03), env);
}
// 全体までの距離。mat: 0 地面、1 薪、2 熾
float map(vec3 p, float detail, out int mat, out int idx, out float face){
	float d = p.y; mat = 0; idx = -1; face = 0.0;
	if (detail > 0.5) d -= (vnoise(p.xz * 40.0) - 0.5) * 0.003 + (vnoise(p.xz * 9.0) - 0.5) * 0.004;
	// 薪の束の外では、束までの距離だけを返して速く進む
	vec3 bb = abs(p - vec3(0.0, 0.1, 0.0)) - vec3(0.36, 0.14, 0.23);
	float dbb = length(max(bb, 0.0));
	if (dbb > 0.05) { if (dbb < d) d = dbb; return d; }
	for (int i = 0; i < ${MAX_LOGS}; i++) {
		if (i >= uLogN) break;
		float f; float dl = sdLog(p, i, detail, f);
		if (dl < d) { d = dl; mat = 1; idx = i; face = f; }
	}
	float cid; float dc = sdCoals(p, cid);
	if (dc < d) { d = dc; mat = 2; idx = -1; face = cid; }
	return d;
}
float mapD(vec3 p){ int m, i; float f; return map(p, 1.0, m, i, f); }
float mapC(vec3 p){ int m, i; float f; return map(p, 0.0, m, i, f); }
vec3 normalAt(vec3 p){
	vec2 e = vec2(0.0007, 0.0);
	return normalize(vec3(mapD(p + e.xyy) - mapD(p - e.xyy), mapD(p + e.yxy) - mapD(p - e.yxy), mapD(p + e.yyx) - mapD(p - e.yyx)));
}
// 光源へ向かう途中で、どれだけ遮られるか（0 が影、1 が日なた）。k が大きいほど影の縁が硬い
float shadow(vec3 p, vec3 l, float maxT, float k){
	float res = 1.0, t = 0.006;
	for (int i = 0; i < 28; i++) {
		float h = mapC(p + l * t);
		res = min(res, k * h / t);
		t += clamp(h, 0.004, 0.05);
		if (res < 0.02 || t > maxT) break;
	}
	return clamp(res, 0.0, 1.0);
}
// くぼみやすき間の暗さ
float occlusion(vec3 p, vec3 n){
	float o = 0.0, s = 1.0;
	for (int i = 1; i <= 4; i++) { float h = 0.012 * float(i); o += (h - mapC(p + n * h)) * s; s *= 0.6; }
	return clamp(1.0 - 9.0 * o, 0.0, 1.0);
}
${PLANCK}

void main(){
	vec2 ndc = (gl_FragCoord.xy - 0.5 * uRes) / uRes.y + uCenter;
	vec3 rd = normalize(uFwd * uFocal + uRight * ndc.x + uUp * ndc.y);
	vec3 ro = uCam;
	// 視線を進めて、形に当たる所を探す
	float t = 0.0; bool hit = false;
	for (int i = 0; i < 110; i++) {
		vec3 p = ro + rd * t;
		float d = t < 0.0 ? 1.0 : mapD(p);
		if (d < 0.0006 * (1.0 + t * 2.0)) { hit = true; break; }
		t += d * 0.85;
		if (t > 9.0) break;
	}
	// 形に当たらずに終わった視線は、地面との交点を直に求める
	if (!hit && rd.y < -0.001) { float tg = -ro.y / rd.y; if (tg < 9.0) { t = tg; hit = true; } }
	float fire = 1.0;
	vec4 gAlb = vec4(0.0), gEmit = vec4(0.0), gMisc = vec4(1.0); vec3 gN = vec3(0.0, 1.0, 0.0);
	// 空: 夜は暗い青、白い光のときは明るい灰色
	vec3 sky = mix(vec3(0.004, 0.005, 0.008), vec3(0.55, 0.6, 0.66), uWhite);
	vec3 col = sky;
	if (hit) {
		vec3 p = ro + rd * t;
		int mat, idx; float face; map(p, 1.0, mat, idx, face);
		vec3 n = normalAt(p);
		vec3 alb = vec3(0.1); float rough = 0.9; vec3 emit = vec3(0.0);
		float h = heatAt(p);
		if (mat == 0) {
			// 地面: 土と、火のまわりに積もった灰
			float n1 = fbm(p.xz * 12.0), n2 = fbm(p.xz * 55.0 + 3.0);
			vec3 soil = mix(vec3(0.07, 0.052, 0.038), vec3(0.14, 0.11, 0.085), n1) * (0.75 + 0.5 * n2);
			vec3 ash = vec3(0.27, 0.255, 0.24) * (0.65 + 0.5 * n2);
			float r = length(p.xz * vec2(1.1, 0.9));
			alb = mix(ash, soil, smoothstep(0.16, 0.42, r + (n1 - 0.5) * 0.14));
			// 落ち葉や小枝のかけらが、所々に暗く散る
			alb *= 1.0 - 0.35 * smoothstep(0.62, 0.75, fbm(p.xz * 30.0 + 7.0));
		} else if (mat == 1) {
			LogP L = logLocal(p, idx);
			float ang = atan(L.q.y, L.q.x); float rr = length(L.q);
			float ch = charOf(p, L);
			if (face < 0.5) {
				// 樹皮: 灰茶色。溝の底は暗く、所々に地衣類の明るい斑点がある
				float f1 = vnoise(vec2(ang * L.r * 230.0 + L.seed * 40.0, L.x * 8.0 + 2.0 * vnoise(vec2(ang * 3.0, L.x * 5.0))));
				float tone = fbm(vec2(ang * 3.0 + L.seed * 5.0, L.x * 6.0));
				alb = mix(vec3(0.1, 0.075, 0.058), vec3(0.2, 0.158, 0.125), smoothstep(0.2, 0.7, f1)) * (0.7 + 0.6 * tone);
				alb = mix(alb, vec3(0.32, 0.34, 0.27), smoothstep(0.7, 0.8, fbm(vec2(ang * 5.0, L.x * 14.0 + L.seed * 3.0))) * 0.5);
			} else if (face < 1.5) {
				// 割り面: 明るい木の色。繊維に沿った濃淡がある。芯に近い所は少し濃い
				float g1 = fbm(vec2(L.x * 6.0 + L.seed * 4.0, (L.q.x + L.q.y) * 700.0));
				float g2 = vnoise(vec2(L.x * 2.0, (L.q.x - L.q.y) * 160.0 + L.seed * 20.0));
				alb = mix(vec3(0.5, 0.36, 0.2), vec3(0.74, 0.6, 0.4), g1) * (0.82 + 0.3 * g2);
				alb = mix(alb, vec3(0.42, 0.26, 0.14), smoothstep(0.5, 0.0, rr / L.r) * 0.45);
			} else {
				// 切り口: 年輪。割った薪では、芯は割り面の角にある
				vec2 c = L.kind > 1.5 ? L.q - vec2(L.r * 0.08) : (L.kind > 0.5 ? L.q - vec2(0.0, L.r * 0.08) : L.q);
				float ring = 0.5 + 0.5 * sin(length(c) * 950.0 + fbm(c * 60.0 + L.seed * 9.0) * 5.0);
				alb = mix(vec3(0.46, 0.32, 0.18), vec3(0.72, 0.58, 0.38), ring) * (0.9 + 0.2 * vnoise(c * 300.0));
				// 外側の樹皮の輪
				if (rr > L.r * 0.9) alb = vec3(0.1, 0.075, 0.055);
			}
			// 焦げ: 茶色に焼けてから黒い炭になる。炭は少しつやがある
			alb = mix(alb, vec3(0.2, 0.11, 0.05), smoothstep(0.05, 0.3, ch) * 0.8);
			alb = mix(alb, vec3(0.016, 0.015, 0.016), smoothstep(0.25, 0.55, ch));
			rough = mix(0.92, 0.55, smoothstep(0.4, 0.8, ch));
			vec2 cp = face > 1.5 ? L.q * 70.0 : vec2(L.x * 34.0 + L.seed * 7.0, (face < 0.5 ? ang * L.r : (L.q.x + L.q.y) * 0.7) * 62.0);
			vec2 c = cracks(cp);
			// 灰: 炭の上を向いた面と区画の角に、白い灰が薄く乗る
			float ashN = fbm(vec2(L.x * 40.0, ang * 4.0 + L.seed * 12.0));
			float ashy = smoothstep(0.6, 0.9, ch) * smoothstep(0.45, 0.8, ashN + 0.25 * n.y) * (0.4 + 0.6 * vnoise(cp * 0.7));
			alb = mix(alb, vec3(0.4, 0.385, 0.37), ashy * 0.6);
			// 熾火: 炭の割れ目の奥と、空気の当たる下の面が赤く光る。灰をかぶった所は光らない
			float breath = 0.5 + 0.5 * sin(uTime * (0.6 + c.y * 1.6) + c.y * 40.0 + L.seed * 30.0);
			float glow = smoothstep(0.55, 0.95, ch) * h * L.heat * (0.35 + 0.65 * smoothstep(0.3, -0.6, n.y));
			float T = mix(950.0, 1300.0, clamp(glow * (0.6 + 0.4 * breath), 0.0, 1.0));
			float crack = smoothstep(0.2, 0.0, c.x);
			emit = planck(T + crack * 110.0) * (crack * 1.2 + 0.35 * (0.3 + 0.7 * c.y)) * (1.0 - 0.9 * ashy) * smoothstep(0.0, 0.3, glow) * 16.0 * fire;
		} else {
			// 熾: かたまりの 3 割は冷えて黒く、灰をかぶる。残りは、空気の当たる縁と割れ目から赤くなる。
			// 明るい所は、風の通り道に沿って数秒かけて移る
			float id = face;
			float air = fbm(p.xz * 9.0 + vec2(uTime * 0.11, -uTime * 0.07)) + 0.07 * sin(uTime * 0.9 + p.x * 14.0);
			float alive = smoothstep(0.3, 0.42, id) * smoothstep(0.32, 0.6, air + 0.25 * id);
			float deep = clamp(1.0 - occlusion(p, n), 0.0, 1.0);
			vec2 c = cracks(vec2(p.x * 190.0 + id * 30.0, (p.z + p.y) * 150.0));
			float ashy = smoothstep(0.42, 0.7, fbm(p.xz * 120.0 + id * 9.0) + 0.35 * n.y - 0.25 * alive);
			alb = mix(vec3(0.02, 0.019, 0.02), vec3(0.4, 0.385, 0.37), ashy * 0.75);
			// 縁（面の向きが視線に対して斜めの所）と割れ目は灰が落ちやすく、温度がそのまま見える
			float rim = pow(1.0 - abs(dot(n, -rd)), 2.0);
			float crack = smoothstep(0.14, 0.0, c.x);
			float T = mix(930.0, 1290.0, clamp(0.25 + 0.55 * alive + 0.3 * deep, 0.0, 1.0));
			float bare = clamp(0.12 + 0.55 * crack + 0.5 * rim + 0.6 * deep, 0.0, 1.3) * (1.0 - 0.8 * ashy);
			emit = planck(T + 60.0 * crack) * bare * (0.08 + 0.92 * alive) * 20.0 * fire * smoothstep(0.26, 0.16, abs(p.x));
		}
		// 視点と薪が変わらない間は使い回す値を書き出す: 色、面の向き、熾の光、すき間の暗さ、3 つの光源からの影
		float ao = occlusion(p, n);
		float lift = mat == 0 ? 0.012 : 0.003;
		float shSun = shadow(p + n * 0.002, normalize(vec3(0.45, 0.8, 0.4)), 1.2, 14.0);
		vec3 l0 = vec3(0.0, 0.05, 0.0) - p; float d0 = length(l0);
		vec3 l1 = vec3(0.0, 0.32, 0.0) - p; float d1 = length(l1);
		gAlb = vec4(alb, rough); gN = n; gEmit = vec4(emit, shSun);
		gMisc = vec4(ao, shadow(p + n * lift, l0 / d0, d0, 5.0), shadow(p + n * lift, l1 / d1, d1, 4.0), 0.0);
	}
	o0 = gAlb; o1 = vec4(gN, hit ? t : -1.0); o2 = gEmit; o3 = gMisc;
}`);
// 炎: 計算した空間の中を視線に沿って刻み、その場の光を足していく。冷えたすす（煙）は奥の光を弱める。画面の半分の解像度で描く
const VOLUME = program(`
in vec2 uv; out vec4 o;
uniform sampler2D uG1, uState; uniform vec2 uRes; uniform vec3 uCam, uRight, uUp, uFwd; uniform float uFocal, uTime; uniform int uSteps; uniform vec2 uCenter;
${SIMLIB}${PLANCK}
float hash(vec2 p){ p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
void main(){
	vec2 ndc = (uv - 0.5) * vec2(uRes.x / uRes.y, 1.0) + uCenter;
	vec3 rd = normalize(uFwd * uFocal + uRight * ndc.x + uUp * ndc.y); vec3 ro = uCam;
	float t = texture(uG1, uv).a;
	vec3 bmin = ORIGIN, bmax = ORIGIN + vec3(N) * CELL; vec3 inv = 1.0 / rd;
	vec3 t0 = (bmin - ro) * inv, t1 = (bmax - ro) * inv; vec3 ta = min(t0, t1), tb = max(t0, t1);
	float tn = max(max(ta.x, ta.y), max(ta.z, 0.0)), tf = min(min(tb.x, tb.y), min(tb.z, t > 0.0 ? t : 9.0));
	vec3 acc = vec3(0.0); float tr = 1.0;
	if (tf > tn) {
		// 刻みの始まりを画素ごとにずらして、層の縞を防ぐ。ずらし方は隣どうしで偏らない並び（interleaved gradient noise）にする
		float ds = (tf - tn) / float(uSteps); float jit = fract(52.9829189 * fract(dot(gl_FragCoord.xy + 5.588 * floor(mod(uTime * 60.0, 8.0)), vec2(0.06711056, 0.00583715))));
		for (int i = 0; i < 64; i++) {
			if (i >= uSteps) break;
			vec4 st = samp(uState, (ro + rd * (tn + (float(i) + jit) * ds) - ORIGIN) / CELL);
			acc += tr * flameEmit(st) * ds;
			tr *= exp(-st.w * smoothstep(900.0, 600.0, st.x) * ds * 5.0);
		}
	}
	o = vec4(acc, tr);
}`);
// 仕上げ: 使い回す値に、このコマの炎の光を当て、炎を重ねる
const COMPOSITE = program(`
in vec2 uv; out vec4 o;
uniform sampler2D uG0, uG1, uG2, uG3, uVol; uniform vec2 uRes; uniform vec3 uCam, uRight, uUp, uFwd; uniform float uFocal, uTime, uWhite, uDay, uMask, uLightFix; uniform vec3 uLightPos, uLightCol; uniform int uMode; uniform sampler2D uLight0, uLight1; uniform vec2 uCenter;
${PLANCK}
float hash(vec2 p){ p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
float vnoise(vec2 p){ vec2 i = floor(p), f = fract(p); f = f*f*(3.0-2.0*f);
	return mix(mix(hash(i), hash(i+vec2(1,0)), f.x), mix(hash(i+vec2(0,1)), hash(i+vec2(1,1)), f.x), f.y); }
void main(){
	vec2 ndc = (uv - 0.5) * vec2(uRes.x / uRes.y, 1.0) + uCenter;
	vec3 rd = normalize(uFwd * uFocal + uRight * ndc.x + uUp * ndc.y); vec3 ro = uCam;
	vec4 g0 = texture(uG0, uv), g1 = texture(uG1, uv), g2 = texture(uG2, uv), g3 = texture(uG3, uv);
	// 空: 夜は暗い青、昼と白い光のときは明るい灰色
	vec3 sky = mix(vec3(0.004, 0.005, 0.008), vec3(0.55, 0.6, 0.66), max(uWhite, uDay));
	// 炎の光: 毎コマ GPU の上で測った色と重心（1 × 1 の画像）を読む。焼き出しのときだけ、決まった値を使う
	vec3 lightCol = uLightFix > 0.5 ? uLightCol : texelFetch(uLight0, ivec2(0), 0).rgb;
	vec3 lightPos = uLightFix > 0.5 ? uLightPos : texelFetch(uLight1, ivec2(0), 0).xyz;
	// 焼き出し用: 1 は炎の光と炎を抜いた絵、2 は炎の光だけ、3 は炎と火の粉だけ
	if (uMode >= 2) sky = vec3(0.0);
	vec3 col = sky; float t = g1.a;
	// 縁を透明にするとき（uMask）は、何もない所を黒にして、炎の後ろに空の色が混ざらないようにする
	if (t <= 0.0 && uMask > 0.5) col = vec3(0.0);
	if (t > 0.0) {
		vec3 p = ro + rd * t; vec3 n = normalize(g1.xyz); vec3 alb = g0.rgb; float rough = g0.a; vec3 v = -rd; float ao = g3.x;
		// 白い光: 斜め上からの太陽と、空からの光
		vec3 sunDir = normalize(vec3(0.45, 0.8, 0.4));
		float spec = pow(max(dot(n, normalize(sunDir + v)), 0.0), mix(60.0, 8.0, rough)) * (1.0 - rough) * 0.6;
		vec3 white = alb * (vec3(1.0, 0.96, 0.9) * max(dot(n, sunDir), 0.0) * g2.a * 2.2 + vec3(0.5, 0.56, 0.66) * (0.5 + 0.5 * n.y) * ao * 0.75) + spec * g2.a * vec3(2.2);
		// 火の光: 熾（丸太の間、低い位置）と、炎（毎コマ測った明るさと重心）。影は、炎の中心を高さ 32cm に置いたときのものを使い回す
		vec3 night = alb * vec3(0.022, 0.026, 0.038) * (0.5 + 0.5 * n.y) * ao; vec3 fireLit = vec3(0.0);
		for (int k = 0; k < 2; k++) {
			vec3 lp = k == 0 ? vec3(0.0, 0.05, 0.0) : lightPos;
			vec3 lc = k == 0 ? planck(1250.0) * 1.2 : lightCol;
			vec3 l = lp - p; float d2 = dot(l, l); l /= sqrt(d2);
			float sp = pow(max(dot(n, normalize(l + v)), 0.0), mix(60.0, 8.0, rough)) * (1.0 - rough) * 0.7;
			vec3 term = (alb * max(dot(n, l), 0.0) + sp) * lc * (k == 0 ? g3.y : g3.z) * 0.085 / (d2 + 0.01);
			if (k == 0) night += term; else fireLit = term;
		}
		// 熾の明るさは、空気の当たり方で数秒かけて上下する
		float breath = 0.72 + 0.5 * vnoise(p.xz * 26.0 + uTime * vec2(0.35, -0.22)) * vnoise(p.xz * 7.0 - uTime * 0.15) * 1.6;
		// 昼は日の光のほうが強いので、炎が照らす分は 12% だけ足す。熾の光はそのまま足す
		col = mix(night + fireLit + g2.rgb * breath, white + fireLit * 0.12 + g2.rgb * breath, uDay);
		col = mix(col, white, uWhite);
		if (uMode == 1) col = night + g2.rgb * breath;
		if (uMode == 2) col = fireLit;
		if (uMode == 3) col = vec3(0.0);
		// 遠くの地面は、空の色へ薄れる
		col = mix(col, sky, smoothstep(2.5, 8.0, t));
	}
	// a には、炎そのものの明るさを入れる。仕上げで、縁の外でも炎と火の粉だけは残すために使う
	float glow = 0.0;
	if (uWhite < 0.5 && uMode != 1 && uMode != 2) { vec4 vol = texture(uVol, uv); col = col * vol.a + vol.rgb; glow = max(vol.r, max(vol.g, vol.b)); }
	o = vec4(col, glow);
}`);
// 火の粉: 1/30 秒ぶんの軌跡を線で描く
const SPARK = (() => {
	const p = gl.createProgram();
	gl.attachShader(p, compile(gl.VERTEX_SHADER, `#version 300 es
in vec2 aPos; in vec3 aCol; out vec3 vCol; void main(){ vCol = aCol; gl_Position = vec4(aPos, 0.0, 1.0); }`));
	gl.attachShader(p, compile(gl.FRAGMENT_SHADER, `#version 300 es
precision highp float; in vec3 vCol; out vec4 o; void main(){ o = vec4(vCol, max(vCol.r, max(vCol.g, vCol.b))); }`));
	gl.bindAttribLocation(p, 0, "aPos"); gl.bindAttribLocation(p, 1, "aCol"); gl.linkProgram(p);
	return p;
})();
const sparkVao = gl.createVertexArray(); const sparkBuf = gl.createBuffer();
gl.bindVertexArray(sparkVao); gl.bindBuffer(gl.ARRAY_BUFFER, sparkBuf);
gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 20, 0);
gl.enableVertexAttribArray(1); gl.vertexAttribPointer(1, 3, gl.FLOAT, false, 20, 8);
const DOWN = program(`
in vec2 uv; out vec4 o; uniform sampler2D uSrc; uniform vec2 uTexel;
void main(){
	// a（炎そのものの明るさ）も一緒ににじませる。仕上げで、にじみのうち炎の分だけを取り出すのに使う
	vec4 c = texture(uSrc, uv) * 4.0;
	c += texture(uSrc, uv + uTexel * vec2(-1, -1)) + texture(uSrc, uv + uTexel * vec2(1, -1)) + texture(uSrc, uv + uTexel * vec2(-1, 1)) + texture(uSrc, uv + uTexel * vec2(1, 1));
	o = c / 8.0;
}`);
const UP = program(`
in vec2 uv; out vec4 o; uniform sampler2D uSrc, uBase; uniform vec2 uTexel; uniform float uMix;
void main(){
	vec4 c = texture(uSrc, uv + uTexel * vec2(-1, 0)) + texture(uSrc, uv + uTexel * vec2(1, 0)) + texture(uSrc, uv + uTexel * vec2(0, -1)) + texture(uSrc, uv + uTexel * vec2(0, 1));
	c += texture(uSrc, uv + uTexel * vec2(-0.7, -0.7)) + texture(uSrc, uv + uTexel * vec2(0.7, -0.7)) + texture(uSrc, uv + uTexel * vec2(-0.7, 0.7)) + texture(uSrc, uv + uTexel * vec2(0.7, 0.7));
	o = mix(texture(uBase, uv), c / 8.0, uMix);
}`);
// 仕上げ: 明るさを画面の範囲に収める。uMask のときは、地面の縁を楕円で透明にし、縁の外は炎と火の粉だけを残す
const FINAL = program(`
in vec2 uv; out vec4 o; uniform sampler2D uScene, uBloom; uniform float uExposure, uBloomAmt, uTime, uMask, uDay;
float hash(vec2 p){ p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
vec3 aces(vec3 x){ return clamp((x * (2.51 * x + 0.03)) / (x * (2.43 * x + 0.59) + 0.14), 0.0, 1.0); }
void main(){
	vec4 s = texture(uScene, uv); vec4 bb = texture(uBloom, uv) * uBloomAmt; vec3 b = bb.rgb;
	vec3 c = aces((s.rgb + b) * uExposure);
	c = pow(c, vec3(1.0 / 2.2));
	c += (hash(gl_FragCoord.xy + fract(uTime) * 61.0) - 0.5) / 255.0;
	if (uMask < 0.5) { o = vec4(c, 1.0); return; }
	// 地面: 画面の下から 28.5% の高さを中心に、横 49%、縦 38.5% の楕円。中心から 58% までは不透明で、縁で消える
	vec2 q = (uv - vec2(0.5, 0.2846)) / vec2(0.4904, 0.3846);
	float m = clamp((1.0 - length(q)) / 0.42, 0.0, 1.0); m = m * m * (3.0 - 2.0 * m);
	// 縁の外には、炎、火の粉、そのにじみだけを残す。薪と地面の色は入れない。
	// 炎の色は、その画素の光のうち炎が占める割合（a に入れてある炎そのものの明るさ ÷ 全体の明るさ）で取り出す。にじみも同じ
	float w = clamp(s.a / max(max(s.r, max(s.g, s.b)), 1e-5), 0.0, 1.0);
	float wb = clamp(bb.a / max(max(b.r, max(b.g, b.b)), 1e-5), 0.0, 1.0);
	vec3 e = pow(aces((s.rgb * w + b * wb) * uExposure), vec3(1.0 / 2.2));
	// 夜は、光の明るさをそのまま不透明さにして重ねる（赤 1.5、緑 1.2、青 0.6 の重み。書き出した動画と同じ）
	float ae = clamp(dot(e, vec3(1.5, 1.2, 0.6)), 0.0, 1.0);
	// 昼は明るい背景の上に置かれるので、光を不透明にすると暗い色の炎が背景を汚す。昼だけは、光を足すだけにする（a を増やさない）
	float a = max(m, ae * (1.0 - uDay));
	// 高い炎や風で流れた炎が画面の端で切れないよう、上の 12% と左右の 6% で消す
	float edge = smoothstep(1.0, 0.88, uv.y) * smoothstep(0.0, 0.06, uv.x) * smoothstep(1.0, 0.94, uv.x);
	o = vec4(min(max(c, 0.0) * m + e * (1.0 - m), vec3(mix(a, 1.0, uDay))), a) * edge;
}`);
// 炎の光の合計: 断面ごとに縮めた画像（LIGHTMAP）を 1 画素にまとめる。uWhich が 0 なら色と明るさ、1 なら重心
const LIGHTSUM = program(`
in vec2 uv; out vec4 o; uniform sampler2D uL; uniform int uWhich;
${SIMLIB}
void main(){
	vec3 col = vec3(0.0), c = vec3(0.0); float l = 0.0;
	for (int y = 0; y < ${TY * 8}; y++) for (int x = 0; x < ${TX * 8}; x++) {
		vec4 e = texelFetch(uL, ivec2(x, y), 0); float w = e.a; if (!(w > 0.0)) continue;
		col += e.rgb; l += w;
		int k = (x >> 3) + (y >> 3) * TILES.x;
		c += w * vec3(ORIGIN.x + ((float(x & 7) + 0.5) / 8.0) * float(N.x) * CELL, ((float(y & 7) + 0.5) / 8.0) * float(N.y) * CELL, ORIGIN.z + (float(k) + 0.5) * CELL);
	}
	// 1 画素が受け持つ体積（m³）を掛けて、光の総量にする
	float v = (float(N.x) * CELL / 8.0) * (float(N.y) * CELL / 8.0) * CELL;
	if (uWhich == 0) o = vec4(col * v * 22.0, l * v);
	else o = vec4(l > 1e-6 ? vec3(c.x / l, max(0.26, c.y / l), c.z / l) : vec3(0.0, 0.3, 0.0), l * v);
}`);

// ---------- 状態 ----------
// volScale は炎を描く解像度（画面に対する比）、substeps は 1 コマが 1/45 秒より長いときに流れを解く回数、
// rebuildFrames は薪と地面の描き直しを何コマに分けるか、day は昼の光の割合、mask は縁を透明にするか
const params = { speed: 20, exposure: 0, white: false, intensity: 0.8, wind: 0, iters: 12, paused: false, steps: 48, sparks: true, volScale: manual ? 1 : 0.5, substeps: 2, maxStep: 1 / 50, rebuildFrames: 1, day: 0, mask: false, ...options.params };
// 画面への収め方。zoom は拡大、center は視線の中心のずれ（画面の高さを 1 とする）、fit は縦長の画面で引くか
const view = { zoom: 1, center: [0, 0], fit: true, ...options.view };
const emit = (type, detail = {}) => options.onEvent?.(type, detail);
const sim = { vel: [target(NX * TX, NY * TY), target(NX * TX, NY * TY)], state: [target(NX * TX, NY * TY), target(NX * TX, NY * TY)], pressure: [target(NX * TX, NY * TY), target(NX * TX, NY * TY)], div: target(NX * TX, NY * TY), light: target(TX * 8, TY * 8), sum0: target(1, 1), sum1: target(1, 1) };
for (const t of sim.state) { gl.bindFramebuffer(gl.FRAMEBUFFER, t.fbo); gl.clearColor(300, 0, 1, 0); gl.clear(gl.COLOR_BUFFER_BIT); }
gl.clearColor(0, 0, 0, 0);
const swap = (pair) => { pair.reverse(); };
// GPU から値を読む道具。request() で読み出しを頼み、poll() が true を返したコマで pix に届く。描画は待たせない。
// read() はその場で読む（GPU を待つ）。焼き出しのときだけ使う
function reader(w, h) {
	const pix = new Float32Array(w * h * 4); const buf = gl.createBuffer(); let sync = null;
	gl.bindBuffer(gl.PIXEL_PACK_BUFFER, buf); gl.bufferData(gl.PIXEL_PACK_BUFFER, pix.byteLength, gl.STREAM_READ); gl.bindBuffer(gl.PIXEL_PACK_BUFFER, null);
	return {
		pix,
		read(fbo) { gl.bindFramebuffer(gl.FRAMEBUFFER, fbo); gl.readPixels(0, 0, w, h, gl.RGBA, gl.FLOAT, pix); },
		request(fbo) {
			if (sync) return;
			gl.bindFramebuffer(gl.FRAMEBUFFER, fbo); gl.bindBuffer(gl.PIXEL_PACK_BUFFER, buf); gl.readPixels(0, 0, w, h, gl.RGBA, gl.FLOAT, 0); gl.bindBuffer(gl.PIXEL_PACK_BUFFER, null);
			// ここでは flush しない。命令は、このコマの描画が終わるときにまとめて GPU へ送られる
			sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
		},
		poll() {
			if (!sync) return false;
			const s = gl.clientWaitSync(sync, 0, 0);
			if (s === gl.TIMEOUT_EXPIRED) return false;
			gl.deleteSync(sync); sync = null;
			if (s === gl.WAIT_FAILED) return false;
			gl.bindBuffer(gl.PIXEL_PACK_BUFFER, buf); gl.getBufferSubData(gl.PIXEL_PACK_BUFFER, 0, pix); gl.bindBuffer(gl.PIXEL_PACK_BUFFER, null);
			return true;
		},
	};
}
const light = { pos: [0, 0.3, 0], col: [0, 0, 0], lum: 0 }; const lightRead = [reader(1, 1), reader(1, 1)]; let lightAge = 9;
const cam = { ...ANGLES[0], target: [0, 0.22, 0] };
let scene = null, blooms = [], gFull = null, gBack = null, gLow = null, vol = null;
// 使い回す値を書く先。4 枚の画像に同時に書く
function gbuffer(w, h) {
	const fbo = gl.createFramebuffer(); gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
	const tex = [0, 1, 2, 3].map((i) => {
		const t = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, t);
		gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA16F, w, h, 0, gl.RGBA, gl.HALF_FLOAT, null);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
		gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0 + i, gl.TEXTURE_2D, t, 0);
		return t;
	});
	return { fbo, tex, w, h, valid: false };
}
const free = (t) => { if (!t) return; for (const x of t.tex.length ? t.tex : [t.tex]) gl.deleteTexture(x); gl.deleteFramebuffer(t.fbo); };
// 描く大きさ（画素）を決める。変わったときだけ、描く先を作り直す
let sizeKey = "";
function resize(w, h) {
	w = Math.max(2, Math.round(w)); h = Math.max(2, Math.round(h));
	const k = `${w}x${h}x${params.volScale}`;
	if (k === sizeKey) return;
	sizeKey = k;
	for (const t of [scene, gFull, gBack, gLow, vol, ...blooms.flatMap((b) => [b.down, b.up])]) free(t);
	canvas.width = w; canvas.height = h;
	scene = target(w, h); blooms = [];
	gFull = gbuffer(w, h); gBack = gbuffer(w, h); gLow = gbuffer(Math.max(2, Math.round(w * 0.4)), Math.max(2, Math.round(h * 0.4)));
	vol = target(Math.max(2, Math.round(w * params.volScale)), Math.max(2, Math.round(h * params.volScale)));
	fullKey = ""; fullStruct = ""; lowKey = ""; job = null;
	let bw = w, bh = h;
	for (let i = 0; i < 4; i++) { bw = Math.max(2, bw >> 1); bh = Math.max(2, bh >> 1); blooms.push({ down: target(bw, bh), up: target(bw, bh) }); }
}
// ---------- 薪の状態と、時間で燃え進む変化 ----------
// burn は燃え進み。0 が生木、0.1 で火が移り、0.8 で折れ、1.3 で熾になって消える。
// 実物の四つ割りの薪は 20 分ほどで燃え尽きるとして、等倍では 1 秒に 1/1000 ずつ進める。太い丸太はその 1/25 の速さ
const logs = LOGS.map((l, i) => ({ ...l, a: [...l.a], b: [...l.b], seed: (i * 0.618 + 0.17) % 1, burn: l.type === 0 ? 0.3 : i < 4 ? 0.5 : 0.28, slot: i - 2, anim: null }));
// 薪を置ける場所。下の段 2 つ、上の段 2 つ、その上に 1 つ
const SLOTS = [
	{ a: [-0.2, 0.062, -0.04], b: [0.19, 0.066, -0.032] }, { a: [-0.17, 0.064, 0.03], b: [0.215, 0.06, 0.04] },
	{ a: [-0.215, 0.118, -0.012], b: [0.17, 0.126, 0.012] }, { a: [-0.15, 0.115, 0.058], b: [0.225, 0.122, 0.03] },
	{ a: [-0.19, 0.165, 0.03], b: [0.2, 0.17, -0.015] },
];
const fire = { bed: 0.25, boost: 0, message: "", low: false };
const logA = new Float32Array(MAX_LOGS * 4), logB = new Float32Array(MAX_LOGS * 4), logC = new Float32Array(MAX_LOGS * 4), logD = new Float32Array(MAX_LOGS * 4);
// 燃料のガスの出方: 火が移るまでは少なく、燃え進み 0.1〜0.7 で最も多く、炭になるにつれて減る
const fuelOf = (l) => { const b = l.burn; const phase = b < 0.1 ? 0.1 + b * 4 : b < 0.7 ? 1 : Math.max(0.12, 1 - (b - 0.7) * 1.45); return phase * l.heat * l.heat; };
function uploadLogs() {
	logA.fill(0); logB.fill(0); logC.fill(0); logD.fill(0);
	logs.forEach((l, i) => {
		const dy = l.anim?.kind === "drop" ? (1 - l.anim.t * l.anim.t) * 0.25 : 0;
		logA.set([l.a[0], l.a[1] + dy, l.a[2], l.r], i * 4); logB.set([l.b[0], l.b[1] + dy, l.b[2], l.type], i * 4);
		logC.set([l.spin, l.bend, l.heat, l.seed], i * 4); logD.set([l.burn, l.anim?.kind === "drop" ? 0 : fuelOf(l), Math.max(0, 1 - l.burn / 0.08), 0], i * 4);
	});
}
const setLogs = (s) => s.fv("uLogA", 4, logA).fv("uLogB", 4, logB).fv("uLogC", 4, logC).fv("uLogD", 4, logD).i("uLogN", logs.length).f("uBed", fire.bed);
// 薪と熾の形が変わったかを見分ける値。燃え進みは 0.01 刻みで見る
const shapeKey = () => logs.map((l) => `${Math.round(l.burn * 100)},${l.a[1].toFixed(3)},${l.b[1].toFixed(3)},${l.a[2].toFixed(3)},${l.anim ? l.anim.t.toFixed(2) : ""}`).join(";") + `|${fire.bed.toFixed(2)}`;
const bedTop = () => 0.02 + 0.04 * fire.bed;
function updateLogs(dt) {
	const step = (dt * params.speed) / 1000;
	for (let i = logs.length - 1; i >= 0; i--) {
		const l = logs[i];
		if (l.anim) {
			l.anim.t = Math.min(1, l.anim.t + dt / l.anim.dur);
			if (l.anim.kind === "sag") { const e = l.anim; const k = e.t * e.t; l[e.end][1] = e.from + (e.to - e.from) * k; }
			if (l.anim.t >= 1) { if (l.anim.kind !== "sag") pop(8 + Math.floor(Math.random() * 6), 1.4, l); l.anim = null; }
			continue;
		}
		// 火が弱いと、燃え進みも遅い
		l.burn += step * (l.type === 0 ? 0.04 : 1) * (0.35 + 0.65 * Math.min(1, params.intensity / 0.8));
		if (l.type === 0) { l.burn = Math.min(l.burn, 0.62); continue; }
		// 折れる: 燃え進みが 0.8 を超えると、いちばん細った中ほどで 2 つに折れ、折れた端が熾の上へ落ちる
		if (!l.broken && l.burn > 0.8 && logs.length < MAX_LOGS) {
			const k = 0.42 + Math.random() * 0.16; const mid = l.a.map((v, j) => v + (l.b[j] - v) * k);
			const gap = 0.012; const ax = [(l.b[0] - l.a[0]), (l.b[1] - l.a[1]), (l.b[2] - l.a[2])]; const len = Math.hypot(...ax); const u = ax.map((v) => v / len);
			const left = { ...l, b: mid.map((v, j) => v - u[j] * gap), broken: true, seed: (l.seed + 0.31) % 1, slot: -1 };
			const right = { ...l, a: mid.map((v, j) => v + u[j] * gap), broken: true, seed: (l.seed + 0.57) % 1, slot: -1 };
			left.a = [...l.a]; right.b = [...l.b];
			const to = bedTop() + l.r * 0.45;
			left.anim = { kind: "sag", end: "b", t: 0, dur: 0.35, from: left.b[1], to: Math.min(left.b[1], to) };
			right.anim = { kind: "sag", end: "a", t: 0, dur: 0.42, from: right.a[1], to: Math.min(right.a[1], to) };
			// 外側の端も、支えを失って少し下がる
			left.a[1] = Math.max(to, left.a[1] - 0.02); right.b[1] = Math.max(to, right.b[1] - 0.02);
			logs.splice(i, 1, left, right);
			pop(10 + Math.floor(Math.random() * 8), 1.5, { a: mid, b: mid });
			emit("break");
			continue;
		}
		// 熾になる: 燃え進みが 1.3 に達した薪は形を失い、熾の山に加わる
		if (l.burn >= 1.3) { logs.splice(i, 1); fire.bed = Math.min(1, fire.bed + 0.09); pop(3, 0.8, l); emit("ember"); }
	}
	// 熾は、薪がなくなると少しずつ灰になって減る
	const fed = logs.some((l) => l.type !== 0);
	// 熾は、薪があるうちも量に比例して灰になる（くべ続けると 0.6〜0.7 でつり合う）
	if (!fed) fire.bed = Math.max(0.05, fire.bed - step * 0.3); else fire.bed = Math.max(0.05, fire.bed - step * 0.3 * fire.bed);
	// くべた薪がすべて熾になったら、1 回だけ知らせる
	if (!fed && !fire.low) { fire.low = true; emit("low"); } else if (fed) fire.low = false;
	fire.boost *= Math.exp(-dt / 2.5);
	uploadLogs();
}
// 薪をくべる: 空いている場所に、四つ割りを 1 本置く。25cm 上から 0.3 秒で落ちる。置けたら true を返す
function stoke(auto = false) {
	const used = new Set(logs.map((l) => l.slot));
	const free = SLOTS.findIndex((_, i) => !used.has(i));
	if (free < 0 || logs.length >= MAX_LOGS - 1) { fire.message = "置く場所がない。薪が燃えて折れるまで待つ"; return false; }
	const sl = SLOTS[free]; const lift = Math.max(0, bedTop() - 0.03) * (free < 2 ? 1 : 0.5);
	logs.push({ a: [sl.a[0] + (Math.random() - 0.5) * 0.03, sl.a[1] + lift, sl.a[2] + (Math.random() - 0.5) * 0.012], b: [sl.b[0] + (Math.random() - 0.5) * 0.03, sl.b[1] + lift, sl.b[2] + (Math.random() - 0.5) * 0.012], r: 0.034 + Math.random() * 0.006, type: Math.random() < 0.75 ? 2 : 1, spin: 3.3 + Math.random() * 2.2, bend: (Math.random() - 0.5) * 0.005, heat: 1, seed: Math.random(), burn: 0, slot: free, anim: { kind: "drop", t: 0, dur: 0.3 } });
	fire.message = "";
	emit("stoke", { auto });
	return true;
}
// 熾を寄せる: 折れた薪を丸太の間の中央へ寄せて、熾の上に寝かせる。空気が入るので、数秒だけ火が強くなる
function tend() {
	let n = 0;
	for (const l of logs) {
		if (!l.broken) continue;
		const y = bedTop() + l.r * 0.5; const z = (n % 2 ? 1 : -1) * (0.012 + 0.02 * Math.random()); n++;
		const cx = (l.a[0] + l.b[0]) / 2; const pull = cx * 0.25;
		l.a = [l.a[0] - pull, y, z]; l.b = [l.b[0] - pull, y + (Math.random() - 0.5) * 0.01, z + (Math.random() - 0.5) * 0.02];
	}
	fire.boost = 0.5; pop(12 + Math.floor(Math.random() * 8), 1.3, null);
}
// 息を吹く: power（0〜1）の分だけ、数秒のあいだ火が強くなり、熾から火の粉が飛ぶ
function blow(power = 0.5) {
	const k = Math.min(1, Math.max(0, power));
	fire.boost = Math.max(fire.boost, k); pop(4 + Math.floor(k * 16), 0.8 + k, null);
}
// ---------- 火の粉 ----------
const sparks = []; let nextPop = 2; const probe = target(TX * 4, TY * 4); const probeRead = reader(TX * 4, TY * 4); const probePix = probeRead.pix; let probeAge = 9;
// 薪 src の上（なければ熾の上）から、count 個の火の粉を飛ばす
function pop(count, power, src) {
	if (!params.sparks || params.white) return;
	for (let i = 0; i < count; i++) {
		const k = Math.random();
		const p = src ? [src.a[0] + (src.b[0] - src.a[0]) * k, src.a[1] + (src.b[1] - src.a[1]) * k + 0.02, src.a[2] + (src.b[2] - src.a[2]) * k] : [(Math.random() - 0.5) * 0.36, bedTop() + 0.02, (Math.random() - 0.5) * 0.1];
		const az = Math.random() * 6.2832, up = 0.4 + Math.random() * 0.9, sp = (0.5 + Math.random() * 1.4) * power;
		sparks.push({ p, v: [Math.cos(az) * sp * 0.6, up * sp, Math.sin(az) * sp * 0.6], T: 1350 + Math.random() * 250, life: 0, max: 0.6 + Math.random() ** 2 * 2.4, m: 0.5 + Math.random() });
	}
}
function gasVel(p) {
	const gx = (p[0] - ORIGIN[0]) / (NX * CELL), gy = p[1] / (NY * CELL), gz = (p[2] - ORIGIN[2]) / (NZ * CELL);
	if (gx < 0 || gx >= 1 || gy < 0 || gy >= 1 || gz < 0 || gz >= 1) return [0, 0, 0];
	const k = Math.floor(gz * NZ); const x = (k % TX) * 4 + Math.floor(gx * 4), y = Math.floor(k / TX) * 4 + Math.floor(gy * 4);
	const i = (y * TX * 4 + x) * 4; return [probePix[i], probePix[i + 1], probePix[i + 2]];
}
const planckJs = (T) => { const ref = 1 / (Math.exp(0.0143877 / (610e-9 * 1500)) - 1); return [610e-9, 550e-9, 465e-9].map((l) => 1 / ((l / 610e-9) ** 5 * (Math.exp(0.0143877 / (l * T)) - 1)) / ref); };
const sparkData = new Float32Array(300 * 10);
function updateSparks(dt, project) {
	// 火の粉を運ぶ気流を、0.1〜0.2 秒おきに GPU から読む。届くのを待たず、届いたコマから使う
	probeRead.poll();
	if (++probeAge > (manual ? 2 : 5)) {
		probeAge = 0; gl.bindFramebuffer(gl.READ_FRAMEBUFFER, sim.vel[0].fbo); gl.bindFramebuffer(gl.DRAW_FRAMEBUFFER, probe.fbo); gl.blitFramebuffer(0, 0, NX * TX, NY * TY, 0, 0, TX * 4, TY * 4, gl.COLOR_BUFFER_BIT, gl.NEAREST);
		if (manual) probeRead.read(probe.fbo); else probeRead.request(probe.fbo);
	}
	// はぜる: 次に飛ぶまでの時間は指数分布。広葉樹の薪を想定して、平均 4 秒に 1 回、1〜4 個
	nextPop -= dt;
	if (nextPop <= 0) { const burning = logs.filter((l) => l.type !== 0 && l.burn > 0.1); if (burning.length && params.intensity > 0.05) { const count = 1 + Math.floor(Math.random() ** 2 * 4); pop(count, 1, burning[Math.floor(Math.random() * burning.length)]); if (params.sparks && !params.white) emit("pop", { count }); } nextPop = -Math.log(1 - Math.random()) * (2.4 / (0.15 + params.intensity)); }
	let n = 0;
	for (let i = sparks.length - 1; i >= 0; i--) {
		const s = sparks[i]; s.life += dt;
		if (s.life >= s.max || s.p[1] < 0) { sparks.splice(i, 1); continue; }
		// 軽い炭のかけらは、気体の流れに 0.12 秒ほど遅れて追従し、重さでわずかに落ちる
		const g = gasVel(s.p); const k = 1 - Math.exp(-dt / (0.12 * s.m));
		for (let j = 0; j < 3; j++) { s.v[j] += (g[j] - s.v[j]) * k + (Math.random() - 0.5) * 2 * dt; }
		s.v[1] -= 1.2 * s.m * dt;
		for (let j = 0; j < 3; j++) s.p[j] += s.v[j] * dt;
		// 小さいので、約 1 秒で 1500 K から 800 K まで冷える
		s.T = 760 + (s.T - 760) * Math.exp(-dt / (0.9 * s.m));
		if (n >= 300) continue;
		const a = project(s.p), b = project([s.p[0] - s.v[0] / 30, s.p[1] - s.v[1] / 30, s.p[2] - s.v[2] / 30]);
		if (!a || !b) continue;
		const c = planckJs(s.T); const gain = 16 * Math.min(1, s.life / 0.03);
		sparkData.set([b[0], b[1], c[0] * gain * 0.2, c[1] * gain * 0.2, c[2] * gain * 0.2, a[0], a[1], c[0] * gain, c[1] * gain, c[2] * gain], n * 10); n++;
	}
	return n;
}
function stepSim(dt) {
	draw(ADVECT, sim.vel[1], (s) => s.tex("uVel", sim.vel[0]).tex("uSrc", sim.vel[0]).f("uDt", dt)); swap(sim.vel);
	draw(ADVECT, sim.state[1], (s) => s.tex("uVel", sim.vel[0]).tex("uSrc", sim.state[0]).f("uDt", dt)); swap(sim.state);
	draw(REACT, sim.state[1], (s) => setLogs(s.tex("uState", sim.state[0]).f("uDt", dt).f("uTime", time).f("uIntensity", params.intensity + fire.boost))); swap(sim.state);
	draw(FORCE, sim.vel[1], (s) => setLogs(s.tex("uVel", sim.vel[0]).tex("uState", sim.state[0]).f("uDt", dt).f("uTime", time).f("uWind", params.wind))); swap(sim.vel);
	draw(DIVERGENCE, sim.div, (s) => s.tex("uVel", sim.vel[0]));
	for (let i = 0; i < params.iters; i++) { draw(JACOBI, sim.pressure[1], (s) => s.tex("uP", sim.pressure[0]).tex("uDiv", sim.div)); swap(sim.pressure); }
	draw(GRADIENT, sim.vel[1], (s) => s.tex("uP", sim.pressure[0]).tex("uVel", sim.vel[0])); swap(sim.vel);
}
// 炎の光の色と重心を GPU の上でまとめる。合成はその画像を直に読むので、ここでは GPU を待たない。
// JS の側の light（明るさを外へ知らせるのに使う）には、0.1 秒ほど遅れて届く
function measureLight() {
	draw(LIGHTMAP, sim.light, (s) => s.tex("uState", sim.state[0]));
	draw(LIGHTSUM, sim.sum0, (s) => s.tex("uL", sim.light).i("uWhich", 0));
	draw(LIGHTSUM, sim.sum1, (s) => s.tex("uL", sim.light).i("uWhich", 1));
	const [r0, r1] = lightRead;
	const take = () => { light.col = [r0.pix[0], r0.pix[1], r0.pix[2]]; light.lum = r0.pix[3]; if (r1.pix[3] > 0) light.pos = [r1.pix[0], r1.pix[1], r1.pix[2]]; };
	if (manual) { r0.read(sim.sum0.fbo); r1.read(sim.sum1.fbo); take(); return; }
	const got0 = r0.poll(), got1 = r1.poll(); if (got0 || got1) take();
	if (++lightAge > 2) { lightAge = 0; r0.request(sim.sum0.fbo); r1.request(sim.sum1.fbo); }
}
uploadLogs();
let time = 0, last = 0, query = null;
// 焼き出し: mode 1 は炎の光と炎を抜いた絵、2 は炎の光だけ、3 は炎と火の粉だけ。light に色を入れると、炎の光をその値に固定する
const bake = { on: manual, mode: 0, light: null, t: 0 };
const stats = { gpuMs: null, rebuilt: 0 };
// 薪と地面の描き直し。fullKey / fullStruct は gFull を描いたときの状態、job は数コマに分けて描いている途中の仕事
let fullKey = "", fullStruct = "", lowKey = "", job = null;
// 見た目が大きく変わる状態（視点、薪の位置、落ちる・折れる動き）。燃え進みと熾の量は入れない
const structOf = (camKey) => `${camKey}|${logs.map((l) => `${l.a[1].toFixed(3)},${l.b[1].toFixed(3)},${l.a[2].toFixed(3)},${l.anim ? l.anim.t.toFixed(2) : ""}`).join(";")}`;
const ATTACH = [gl.COLOR_ATTACHMENT0, gl.COLOR_ATTACHMENT1, gl.COLOR_ATTACHMENT2, gl.COLOR_ATTACHMENT3];

function render(t) {
	if (!scene) return;
	const dt = Math.min(0.05, (t - last) / 1000 || 1 / 60); last = t; time += dt;
	// カメラ: 中心のまわりを回る
	const az = (cam.az * Math.PI) / 180, el = (cam.el * Math.PI) / 180;
	const pos = [cam.target[0] + cam.dist * Math.cos(el) * Math.cos(az), cam.target[1] + cam.dist * Math.sin(el), cam.target[2] + cam.dist * Math.cos(el) * Math.sin(az)];
	const fwd = [cam.target[0] - pos[0], cam.target[1] - pos[1], cam.target[2] - pos[2]]; const fl = Math.hypot(...fwd); fwd.forEach((v, i) => { fwd[i] = v / fl; });
	const right = [-fwd[2], 0, fwd[0]]; const rl = Math.hypot(...right); right.forEach((v, i) => { right[i] = v / rl; });
	const up = [right[1] * fwd[2] - right[2] * fwd[1], right[2] * fwd[0] - right[0] * fwd[2], right[0] * fwd[1] - right[1] * fwd[0]];
	// 画面が縦長のときは、横に 0.75m が入るように引く（view.fit）
	const aspect = canvas.width / canvas.height;
	const focal = (0.5 / Math.tan((cam.fov * Math.PI) / 360)) * (view.fit ? Math.min(1, aspect / 1.1) : 1) * view.zoom;
	const cx = view.center[0], cy = view.center[1];

	// 作業台用: GPU の時間の目安を stats.gpuMs に入れる。Chrome では仕事の量を変えても値がほとんど動かないので、重さの判断には使わない
	let q = null;
	if (options.timing && timerExt && !query) { q = gl.createQuery(); gl.beginQuery(timerExt.TIME_ELAPSED_EXT, q); }
	if (!params.paused) updateLogs(dt);
	if (!params.paused && !params.white) {
		// 流れは 1/50 秒より長い刻みでは解かない。1 コマが長いとき（30 コマ/秒）は substeps 回に分ける
		const n = dt > 1 / 45 ? Math.max(1, params.substeps) : 1;
		for (let i = 0; i < n; i++) stepSim(Math.min(dt / n, params.maxStep));
		measureLight();
	}
	// 薪と地面は、視点、燃えた度合い、画面の大きさが変わったときだけ描き直す
	const camOf = (c) => (s2, w, h) => s2.f("uRes", w, h).f("uCam", ...c.pos).f("uRight", ...c.right).f("uUp", ...c.up).f("uFwd", ...c.fwd).f("uFocal", c.focal).f("uCenter", c.cx, c.cy);
	const camNow = { pos, right, up, fwd, focal, cx, cy };
	const camUniforms = camOf(camNow);
	const camKey = `${pos.map((v) => v.toFixed(4))}|${focal.toFixed(4)}|${cx},${cy}`;
	const key = `${camKey}|${shapeKey()}`; const struct = structOf(camKey);
	const busy = api.moving || logs.some((l) => l.anim);
	const strips = Math.max(1, Math.round(params.rebuildFrames));
	if (!job && key !== fullKey && !busy) job = { key, struct, y: 0, cam: camOf(camNow), A: logA.slice(), B: logB.slice(), C: logC.slice(), D: logD.slice(), n: logs.length, bed: fire.bed };
	if (job) {
		// 途中のコマでも形がずれないよう、仕事を始めたときの薪と視点で、下から帯ごとに描く
		const y1 = Math.min(gBack.h, job.y + Math.ceil(gBack.h / strips));
		gl.bindFramebuffer(gl.FRAMEBUFFER, gBack.fbo); gl.drawBuffers(ATTACH);
		gl.enable(gl.SCISSOR_TEST); gl.scissor(0, job.y, gBack.w, y1 - job.y);
		draw(SCENE, gBack, (s2) => job.cam(s2, gBack.w, gBack.h).fv("uLogA", 4, job.A).fv("uLogB", 4, job.B).fv("uLogC", 4, job.C).fv("uLogD", 4, job.D).i("uLogN", job.n).f("uBed", job.bed).f("uTime", 0).f("uWhite", 0));
		gl.disable(gl.SCISSOR_TEST);
		job.y = y1;
		if (job.y >= gBack.h) { [gFull, gBack] = [gBack, gFull]; fullKey = job.key; fullStruct = job.struct; job = null; stats.rebuilt++; }
	}
	// 大きく変わった直後と、動いている間は、4 割の解像度でその場で描いたものを使う
	let g = gFull;
	if (fullStruct !== struct) {
		g = gLow;
		if (lowKey !== key) {
			gl.bindFramebuffer(gl.FRAMEBUFFER, gLow.fbo); gl.drawBuffers(ATTACH);
			draw(SCENE, gLow, (s2) => setLogs(camUniforms(s2, gLow.w, gLow.h).f("uTime", 0).f("uWhite", 0)));
			lowKey = key;
		}
	}
	if (!params.white) draw(VOLUME, vol, (s2) => camUniforms(s2, vol.w, vol.h).tex("uG1", g.tex[1]).tex("uState", sim.state[0]).f("uTime", time).i("uSteps", params.steps));
	draw(COMPOSITE, scene, (s2) => camUniforms(s2, scene.w, scene.h).tex("uG0", g.tex[0]).tex("uG1", g.tex[1]).tex("uG2", g.tex[2]).tex("uG3", g.tex[3]).tex("uVol", vol).tex("uLight0", sim.sum0).tex("uLight1", sim.sum1)
		.f("uTime", time).f("uWhite", params.white ? 1 : 0).f("uDay", params.day).f("uMask", params.mask ? 1 : 0)
		.f("uLightFix", bake.light ? 1 : 0).f("uLightPos", 0, 0.32, 0).f("uLightCol", ...(bake.light ?? [0, 0, 0])).i("uMode", bake.mode));
	// 火の粉を、炎の上から足して描く
	const project = (p) => {
		const d = [p[0] - pos[0], p[1] - pos[1], p[2] - pos[2]]; const z = d[0] * fwd[0] + d[1] * fwd[1] + d[2] * fwd[2]; if (z < 0.05) return null;
		return [(2 * ((focal * (d[0] * right[0] + d[1] * right[1] + d[2] * right[2])) / z - cx)) / aspect, 2 * ((focal * (d[0] * up[0] + d[1] * up[1] + d[2] * up[2])) / z - cy)];
	};
	const nSparks = params.paused ? 0 : updateSparks(dt, project);
	if (nSparks > 0 && !params.white && bake.mode !== 1 && bake.mode !== 2) {
		gl.bindFramebuffer(gl.FRAMEBUFFER, scene.fbo); gl.viewport(0, 0, scene.w, scene.h);
		gl.useProgram(SPARK); gl.bindVertexArray(sparkVao); gl.bindBuffer(gl.ARRAY_BUFFER, sparkBuf); gl.bufferData(gl.ARRAY_BUFFER, sparkData.subarray(0, nSparks * 10), gl.DYNAMIC_DRAW);
		gl.enable(gl.BLEND); gl.blendFunc(gl.ONE, gl.ONE); gl.drawArrays(gl.LINES, 0, nSparks * 2); gl.disable(gl.BLEND);
	}
	let src = scene;
	for (const b of blooms) { draw(DOWN, b.down, (s) => s.tex("uSrc", src).f("uTexel", 1 / src.w, 1 / src.h)); src = b.down; }
	for (let i = blooms.length - 2; i >= 0; i--) { const b = blooms[i]; draw(UP, b.up, (s) => s.tex("uSrc", src).tex("uBase", b.down).f("uTexel", 1 / src.w, 1 / src.h).f("uMix", 0.55)); src = b.up; }
	draw(FINAL, null, (s) => s.tex("uScene", scene).tex("uBloom", src).f("uExposure", 2 ** params.exposure).f("uBloomAmt", params.white ? 0.04 : 0.2).f("uTime", time).f("uMask", params.mask ? 1 : 0).f("uDay", params.day));
	if (q) { gl.endQuery(timerExt.TIME_ELAPSED_EXT); query = q; }
	else if (query && gl.getQueryParameter(query, gl.QUERY_RESULT_AVAILABLE)) { if (!gl.getParameter(timerExt.GPU_DISJOINT_EXT)) stats.gpuMs = gl.getQueryParameter(query, gl.QUERY_RESULT) / 1e6; gl.deleteQuery(query); query = null; }
}

const api = {
	gl, params, view, cam, ANGLES, logs, fire, sparks, light, bake, stats,
	/** 視点を動かしている間は true にする。薪と地面を 4 割の解像度で毎コマ描く */
	moving: false,
	stoke, tend, blow, uploadLogs, resize, render,
	/** 流れだけを n 回進める（描かない）。始めに炎を育てるのに使う */
	warm(n = 1) { for (let i = 0; i < n; i++) { time += 1 / 50; stepSim(1 / 50); } },
	/**
	 * 流れを n 回進めて GPU が終わるまで待ち、1 回あたりの時間（ms）を返す。GPU の速さを知るのに、始めに 1 回だけ使う。
	 * GPU を待つあいだ画面が止まるので、毎コマは呼ばない
	 */
	bench(n = 5) {
		const px = new Float32Array(4);
		// 先にたまっている命令を終わらせてから測る
		gl.bindFramebuffer(gl.FRAMEBUFFER, sim.sum0.fbo); gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.FLOAT, px);
		const t0 = performance.now();
		api.warm(n);
		gl.bindFramebuffer(gl.FRAMEBUFFER, sim.state[0].fbo); gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.FLOAT, px);
		return (performance.now() - t0) / n;
	},
	/** 焼き出し用: 1/60 秒ずつ n コマ進めて描き、GPU が終わるまで待つ */
	advance(n = 1) { for (let i = 0; i < n; i++) { bake.t += 1000 / 60; render(bake.t); } gl.finish(); },
	/** GPU の資源を手放す。呼んだあとは使えない */
	dispose() { gl.getExtension("WEBGL_lose_context")?.loseContext(); },
	ready: null,
};
api.ready = new Promise((resolve, reject) => {
	const check = () => {
		try {
			if (gl.isContextLost()) throw new Error("WebGL のコンテキストが失われた");
			if (!programsDone()) { setTimeout(check, 16); return; }
			finishPrograms(); resolve(api);
		} catch (e) { reject(e); }
	};
	check();
});
return api;
}

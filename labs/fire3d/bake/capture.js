// 計算モデルを 1 コマずつ進めて撮る。bake.sh が __WORK__ と __PORT__ を差し替えて playwright-cli に渡す
async page => {
  const d='__WORK__/';
  await page.setViewportSize({width:800,height:600});
  await page.goto('http://127.0.0.1:__PORT__/labs/fire3d/index.html?bake=1');
  await page.waitForFunction(()=>window.__lab || document.getElementById('error').textContent, null, {timeout:60000});
  const err = await page.evaluate(()=>document.getElementById('error').textContent);
  if (err) return 'ERR '+err.slice(0,600);
  // 10 秒ぶん進めて、炎を育てる
  for (let i=0;i<20;i++) await page.evaluate(()=>window.__lab.advance(30));
  await page.evaluate(()=>{ window.__lab.bake.mode = 3; });
  const lum=[], col=[0,0,0];
  const N=204;
  for (let i=0;i<N;i++) {
    const L = await page.evaluate(()=>{ window.__lab.advance(2); const l=window.__lab.light; return [l.lum, ...l.col]; });
    lum.push(+L[0].toFixed(4)); col[0]+=L[1]/N; col[1]+=L[2]/N; col[2]+=L[3]/N;
    await page.screenshot({path:d+`flame-${String(i).padStart(3,'0')}.png`});
  }
  await page.evaluate(()=>{ window.__lab.bake.mode = 1; window.__lab.params.sparks=false; window.__lab.advance(1); });
  await page.screenshot({path:d+'base.png'});
  await page.evaluate((c)=>{ window.__lab.bake.mode = 2; window.__lab.bake.light = c; window.__lab.advance(1); }, col);
  await page.screenshot({path:d+'lit.png'});
  await page.evaluate(()=>{ window.__lab.bake.mode = 0; window.__lab.bake.light = null; window.__lab.set('white', true); window.__lab.advance(1); });
  await page.screenshot({path:d+'day.png'});
  await page.evaluate((x)=>{ window.__bakeMeta = x; }, {lum, col});
  return 'frames '+N+' meanLum '+(lum.reduce((a,b)=>a+b,0)/N).toFixed(3)+' col '+col.map(v=>v.toFixed(3)).join(',');
}

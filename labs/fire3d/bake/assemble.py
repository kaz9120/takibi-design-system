"""撮ったコマから <takibi-fire> の素材を作る。使い方: python3 assemble.py <作業フォルダ> <packages/takibi/src>

- 6 秒 180 コマのループにする。最後の 24 コマを先頭へクロスフェードする
- 下地（夜、昼）は縁を透明にした webp、炎の光は透明つき webp、炎と火の粉は mp4 にする
- 各コマの明るさ（平均を 1 とする）を fire.js の LUM に書き込む
"""
from PIL import Image
import json, numpy as np, subprocess, shutil, os
import sys
d=sys.argv[1].rstrip('/')+'/'; PKG=sys.argv[2].rstrip('/')+'/'; BOX=(150,60,670,580); S=520; N=180; X=24
os.makedirs(d+'out',exist_ok=True); os.makedirs(d+'loop',exist_ok=True)
raw=open(d+'meta.raw').read().strip(); meta=json.loads(raw); meta=json.loads(meta) if isinstance(meta,str) else meta
lum=meta['lum']; out_lum=[]
for i in range(N):
    a=Image.open(d+f'flame-{i:03d}.png').convert('RGB').crop(BOX)
    if i<X:
        b=Image.open(d+f'flame-{N+i:03d}.png').convert('RGB').crop(BOX); k=i/X
        a=Image.blend(b,a,k); out_lum.append(lum[N+i]*(1-k)+lum[i]*k)
    else: out_lum.append(lum[i])
    a.save(d+f'loop/f{i:03d}.png')
m=sum(out_lum)/N; norm=[round(v/m,3) for v in out_lum]
json.dump(norm, open(d+'out/lum.json','w'))
yy,xx=np.mgrid[0:S,0:S]; r=np.sqrt(((xx-260)/255.0)**2+((yy-372)/200.0)**2)
mask=np.clip((1.0-r)/0.42,0,1); mask=mask*mask*(3-2*mask)
A=Image.fromarray((mask*255).astype('uint8'))
for name,outn in [('base.png','base-night.webp'),('day.png','base-day.webp')]:
    im=Image.open(d+name).convert('RGB').crop(BOX).convert('RGBA'); im.putalpha(A); im.save(d+'out/'+outn, quality=82, method=6)
def rgba(img, mul=None):
    img=np.asarray(img).astype(np.float32)/255
    a=np.clip(img.max(axis=2)*1.15,0,1)
    rgb=np.where(a[...,None]>1e-3, img/np.maximum(a[...,None],1e-3), 0)
    if mul is not None: a=a*mul
    return Image.fromarray((np.dstack([np.clip(rgb,0,1),a])*255).astype('uint8'),'RGBA')
rgba(Image.open(d+'lit.png').convert('RGB').crop(BOX), mask).save(d+'out/lit.webp', quality=80, method=6)
k=min(range(N), key=lambda i: abs(norm[i]-1.0)); rgba(Image.open(d+f'loop/f{k:03d}.png')).save(d+'out/flame-still.webp', quality=80, method=6)
subprocess.run(['ffmpeg','-y','-loglevel','error','-framerate','30','-i',d+'loop/f%03d.png','-c:v','libx264','-preset','slow','-crf','27','-pix_fmt','yuv420p','-movflags','+faststart','-an',d+'out/flame.mp4'],check=True)
# fire.js の明るさの表を差し替える
p=PKG+'fire.js'; s=open(p).read()
i=s.index('const LUM = ['); j=s.index('];',i)+2
s=s[:i]+'const LUM = '+json.dumps([0.694 if abs(v-0.693)<1e-9 else v for v in norm])+';'+s[j:]; open(p,'w').write(s)
for n in ['base-day.webp','base-night.webp','flame-still.webp','flame.mp4','lit.webp']:
    shutil.copy(d+'out/'+n,PKG+'fire/'+n)
print('still',k,{n:os.path.getsize(d+'out/'+n) for n in os.listdir(d+'out')})

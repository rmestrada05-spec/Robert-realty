#!/usr/bin/env python3
"""Sable UGC spot v3 — assembly. Run in the Higgsfield sandbox ./build.
usage: python3 build_ad3.py <vo.wav> <vo.json> <out.mp4> <tap_clip.mp4> <tap_contact_src_seconds> [tempo]
"""
import sys, os, json, subprocess, shutil
from PIL import Image, ImageDraw, ImageFont

VO, VOJ, OUT, TAP, TAP_CONTACT = sys.argv[1], sys.argv[2], sys.argv[3], sys.argv[4], float(sys.argv[5])
TEMPO = float(sys.argv[6]) if len(sys.argv) > 6 else 1.0
FPS = 24; W, H = 1080, 1920
BONE = (0xF3, 0xF2, 0xEE); INK = (0x14, 0x13, 0x0F)
F = lambda n, s: ImageFont.truetype(f"fonts/{n}.otf", s)
words = json.load(open(VOJ))
for w in words: w["s"] = round(w["s"]/TEMPO, 3); w["e"] = round(w["e"]/TEMPO, 3)
if TEMPO != 1.0:
    subprocess.run(["ffmpeg","-y","-loglevel","error","-i",VO,"-filter:a",f"atempo={TEMPO}","vo_tempo.wav"], check=True); VO = "vo_tempo.wav"

norm = lambda s: ''.join(c for c in s.lower() if c.isalnum())
def t_of(seq, after=0.0, alt=None):
    for cand in [seq] + ([alt] if alt else []):
        q = [norm(x) for x in cand.split()]
        for i in range(len(words)-len(q)+1):
            if words[i]["s"] >= after and [norm(w["w"]) for w in words[i:i+len(q)]] == q:
                return words[i]["s"], words[i+len(q)-1]["e"]
    raise SystemExit(f"phrase not found: {seq}")

t_nine  = t_of("nine signed", alt="9 signed")[0]
t_three = t_of("read three", alt="read 3")[0]
t_stop  = t_of("so I stopped")[0]
t_card  = t_of("I put the house")[0]
t_tap   = t_of("they tap")[0]
t_there = t_of("right there")[1]
t_form  = t_of("no form")[0]
t_want  = t_of("when they want")[0]
t_text  = t_of("they text")[0]
t_fields= t_of("the sign")[0]
t_sable = [w for w in words if w["s"] > t_fields + 0.9][0]["s"]
vo_end  = words[-1]["e"]; END = vo_end + 1.4
contact = t_tap + 0.35
print("anchors", dict(nine=t_nine, three=t_three, stop=t_stop, card=t_card, tap=t_tap, contact=contact, want=t_want, fields=t_fields, sable=t_sable, end=END))

# source geometry
PHONE_W = round(1920 * 750/1624)   # 887 — uniform scale of the 750x1624 screen captures
def fit_phone(im):
    """scale a 750x1624 frame to full height, center on bone."""
    bg = Image.new("RGB", (W, H), BONE)
    s = im.resize((PHONE_W, H), Image.LANCZOS)
    bg.paste(s, ((W - PHONE_W)//2, 0)); return bg

# segments: (t0, t1, source, src_in, speed|None, kind, zoom_from, zoom_to)
# kind: vid | vid_fit (speed fitted, capped) | vid_hold | img ; zoom = centered crop factor animated t0→t1
SCROLL_SRC_START, SCROLL_SRC_END, MAX_SPEED = 2.95, 11.45, 1.6
segs = [
    (0.0,          t_nine,        "c1_pen.mp4",   1.20, 1.0, "vid",  1.00, 1.00),
    (t_nine,       t_three,       "c1_pen.mp4",   3.30, 1.0, "vid",  1.15, 1.18),
    (t_three,      t_stop,        "c1_pen.mp4",   3.75, 1.0, "vid",  1.30, 1.36),
    (t_stop,       t_card,        "c2_slide.mp4", 0.80, 1.0, "vid",  1.00, 1.00),
    (t_card,       t_card+0.9,    "c3_phone.mp4", 1.30, 1.0, "vid",  1.00, 1.00),
    (t_card+0.9,   contact,       TAP, TAP_CONTACT-(contact-(t_card+0.9)), 1.0, "vid", 1.00, 1.00),
    (contact,      contact+0.25,  TAP, TAP_CONTACT, 1.0, "vid", 1.00, 1.04),               # hold the contact a beat
    (contact+0.25, contact+1.65,  "screen_only_v6.mp4", 1.10, 1.0, "phone", 1.00, 1.00),  # banner → tap → page
    (contact+1.65, t_want+0.5,    "screen_only_v6.mp4", SCROLL_SRC_START, None, "phone_fit", 1.00, 1.00),
    (t_want+0.5,   t_fields,      "messages_send.mp4", 0.0, 1.0, "phone_hold", 1.00, 1.00),
    (t_fields,     t_sable,       "03_three_fields.png", 0, 1.0, "img", 1.00, 1.00),
    (t_sable,      vo_end+0.2,    "04_one_tap.png", 0, 1.0, "img", 1.00, 1.00),
    (vo_end+0.2,   END,           "07_lockup_light_end.png", 0, 1.0, "img", 1.00, 1.00),
]

def extract(src, src_in, dur, speed, n, tag, native=False):
    d = f"seg3_{tag}"; shutil.rmtree(d, ignore_errors=True); os.makedirs(d)
    vf = f"setpts=PTS/{speed},fps={FPS}" + ("" if native else f",scale={W}:{H}:flags=lanczos")
    subprocess.run(["ffmpeg","-y","-loglevel","error","-ss",f"{max(0,src_in):.3f}","-i",src,"-t",f"{dur*speed+0.6:.3f}",
                    "-vf",vf,"-frames:v",str(n),f"{d}/%05d.jpg","-q:v","3"], check=True)
    fr = sorted(os.listdir(d))
    while len(fr) < n: fr.append(fr[-1])
    return [f"{d}/{x}" for x in fr[:n]]

frames = []  # (path, zoom, is_phone)
for i,(t0,t1,src,sin,spd,kind,z0,z1) in enumerate(segs):
    n = int(round((t1-t0)*FPS))
    if n <= 0: continue
    zooms = [z0 + (z1-z0)*k/max(1,n-1) for k in range(n)]
    if kind == "img":
        frames += [(src, 1.0, False)]*n
    elif kind in ("phone","phone_hold"):
        frames += [(p, z, True) for p,z in zip(extract(src, sin, t1-t0, 1.0, n, i, native=True), zooms)]
    elif kind == "phone_fit":
        need = (t1-t0); spd = min(MAX_SPEED, (SCROLL_SRC_END-SCROLL_SRC_START)/need)
        frames += [(p, z, True) for p,z in zip(extract(src, sin, need, spd, n, i, native=True), zooms)]
    else:
        frames += [(p, z, False) for p,z in zip(extract(src, sin, t1-t0, spd, n, i), zooms)]
NF = len(frames); print("frames", NF, "dur", round(NF/FPS,2))

# zoom punch on "no form" (pattern interrupt): 1.0 → 1.07 over 0.4s
punch = [(t_form, t_form+0.4)]

phrases = [
    ("forty people", "my open house. sunday."),
    ("nine signed", "9 signed in."),
    ("I could read", "I could read 3."),
    ("so I stopped", "so I stopped asking."),
    ("I put the house", "I put the house on a card."),
    ("they tap", "they tap it to their phone."),
    ("and the whole", "the whole listing. right there."),
    ("no app", "no app. no form."),
    ("when they want", "when they want something…"),
    ("they text me", "they text me. one tap."),
    ("their number", "their number, address attached."),
]
cap = []
for key, text in phrases:
    try: s,_ = t_of(key, 0.0, alt=key.replace("nine","9").replace("three","3").replace("forty","40"))
    except SystemExit: continue
    cap.append((s, text))
cap.sort()
spans = [(s, cap[i+1][0] if i+1 < len(cap) else t_fields, txt) for i,(s,txt) in enumerate(cap)]
spans[0] = (0.0, spans[0][1], spans[0][2])

CAPF = F("Inter-Medium", 58); LTF = F("Inter-Light", 34)
def overlays(im, t):
    d = ImageDraw.Draw(im, "RGBA")
    for s,e,txt in spans:
        if s <= t < e:
            tw = CAPF.getlength(txt); x = (W-tw)/2; y = H*0.70
            d.rounded_rectangle([x-30, y-18, x+tw+30, y+78], radius=24, fill=(0,0,0,155))
            d.text((x, y), txt, font=CAPF, fill=(255,255,255))
    if contact+1.4 <= t < t_fields:
        lt = "sable  ·  $99/mo  ·  card included"; tw = LTF.getlength(lt); x, y = 54, 1540
        d.rounded_rectangle([x-20, y-14, x+tw+20, y+50], radius=16, fill=(243,242,238,200))
        d.text((x, y), lt, font=LTF, fill=INK)
    return im

out = "frames3"; shutil.rmtree(out, ignore_errors=True); os.makedirs(out)
for i,(p,z,is_phone) in enumerate(frames):
    t = i/FPS
    im = Image.open(p).convert("RGB")
    if is_phone: im = fit_phone(im)
    elif im.size != (W,H): im = im.resize((W,H), Image.LANCZOS)
    for a,b in punch:
        if a <= t < b: z *= 1.0 + 0.07*((t-a)/(b-a))
    if z != 1.0:
        w,h = int(W/z), int(H/z); im = im.crop(((W-w)//2,(H-h)//2,(W-w)//2+w,(H-h)//2+h)).resize((W,H), Image.LANCZOS)
    im = overlays(im, t); im.save(f"{out}/{i:05d}.jpg", quality=93)

def sox(c): subprocess.run(["sox"]+c, check=True)
sox(["-n","-r","48000","-c","1","pen.wav","synth","0.06","noise","fade","0","0.06","0.05","lowpass","1800","gain","-18"])
sox(["-n","-r","48000","-c","1","click.wav","synth","0.03","noise","fade","0","0.03","0.025","highpass","2500","gain","-16"])
sox(["-n","-r","48000","-c","1","chime.wav","synth","0.35","sine","1318","synth","0.35","sine","mix","1760","fade","0.005","0.35","0.3","gain","-22"])
sox(["-n","-r","48000","-c","1","whoosh.wav","synth","0.35","noise","fade","0.1","0.35","0.2","bandpass","1200","400","gain","-20"])
ms = lambda t: int(max(0,t)*1000)
pen_t, click_t, chime_t, whoosh_t = t_nine-0.2, contact, contact+0.35, t_want+0.5+1.0
filt = (f"[1]adelay={ms(pen_t)}|{ms(pen_t)}[a1];[2]adelay={ms(click_t)}|{ms(click_t)}[a2];[3]adelay={ms(chime_t)}|{ms(chime_t)}[a3];"
        f"[4]adelay={ms(whoosh_t)}|{ms(whoosh_t)}[a4];[0][a1][a2][a3][a4]amix=inputs=5:normalize=0,loudnorm=I=-14:TP=-1.5:LRA=11,apad,atrim=0:{END:.3f}[a]")
subprocess.run(["ffmpeg","-y","-loglevel","error","-i",VO,"-i","pen.wav","-i","click.wav","-i","chime.wav","-i","whoosh.wav",
                "-filter_complex",filt,"-map","[a]","-ar","48000","mix3.wav"], check=True)
subprocess.run(["ffmpeg","-y","-loglevel","error","-framerate",str(FPS),"-i",f"{out}/%05d.jpg","-i","mix3.wav",
                "-c:v","libx264","-pix_fmt","yuv420p","-crf","18","-r",str(FPS),"-c:a","aac","-b:a","192k","-shortest","-movflags","+faststart",OUT], check=True)
print("done", OUT)

#!/usr/bin/env python3
"""Sable UGC spot — assembly. Run inside the Higgsfield sandbox in ./build.
usage: python3 build_ad.py <vo.wav> <vo.json> <out.mp4>
"""
import sys, os, json, subprocess, shutil, math
from PIL import Image, ImageDraw, ImageFont

VO, VOJ, OUT = sys.argv[1], sys.argv[2], sys.argv[3]
FPS = 24; W, H = 1080, 1920
BONE = (0xF3, 0xF2, 0xEE); INK = (0x14, 0x13, 0x0F)
F = lambda n, s: ImageFont.truetype(f"fonts/{n}.otf", s)
words = json.load(open(VOJ))

def t_of(seq, after=0.0):
    """start time of the first occurrence of word sequence (lowercased, punctuation-insensitive) after time `after`."""
    norm = lambda s: ''.join(c for c in s.lower() if c.isalnum())
    seq = [norm(x) for x in seq.split()]
    for i in range(len(words) - len(seq) + 1):
        if words[i]["s"] >= after and [norm(w["w"]) for w in words[i:i+len(seq)]] == seq:
            return words[i]["s"], words[i+len(seq)-1]["e"]
    raise SystemExit(f"phrase not found: {seq}")

# ---- anchors from the VO ----
t_three  = t_of("read three")[0] if any("three" in w["w"].lower() for w in words[:12]) else t_of("read 3")[0]
t_stop   = t_of("so I stopped")[0]
t_card   = t_of("I put the house")[0]
t_tap    = t_of("they tap")[0]
t_form   = t_of("no form")[1]
t_want   = t_of("when they want")[0]
t_text   = t_of("they text me")[0]
t_fields = t_of("the sign")[0]
t_sable  = [w for w in words if w["s"] > t_fields + 1.0][0]["s"]  # first word of the last sentence
vo_end   = words[-1]["e"]
END = vo_end + 1.9

print("anchors", dict(three=t_three, stop=t_stop, card=t_card, tap=t_tap, want=t_want, text=t_text, fields=t_fields, sable=t_sable, end=END))

# ---- segments: (t0, t1, source, src_in, speed, kind) ----
# kind: 'vid' | 'img' | 'vid_hold' (play then freeze last frame)
contact = t_tap + 0.40            # phone meets card ≈ on "tap"
segs = [
    (0.0,            t_three,       "c1_pen.mp4",       1.20, 1.0, "vid"),
    (t_three,        t_stop,        "c1_pen.mp4",       3.70, 1.0, "vid_zoom"),   # push-in on the scribble
    (t_stop,         t_card,        "c2_slide.mp4",     0.80, 1.0, "vid"),
    (t_card,         contact-0.65,  "c3_phone.mp4",     1.30, 1.0, "vid"),
    (contact-0.65,   contact,       "c4_tap.mp4",       1.95, 1.0, "vid"),
    (contact,        contact+1.3,   "screen_only_v6.mp4", 1.60, 1.0, "vid"),      # banner → tap → hero
    (contact+1.3,    t_want+0.9,    "screen_only_v6.mp4", 2.95, None, "vid_fit"), # scroll fitted to the slot
    (t_want+0.9,     t_fields,      "messages_send.mp4", 0.00, 1.0, "vid_hold"),
    (t_fields,       t_sable,       "03_three_fields.png", 0, 1.0, "img"),
    (t_sable,        vo_end+0.25,   "04_one_tap.png",    0, 1.0, "img"),
    (vo_end+0.25,    END,           "07_lockup_light_end.png", 0, 1.0, "img"),
]

SCROLL_SRC_SPAN = 11.45 - 2.95     # seconds of real scroll in the source

def extract(src, src_in, dur, speed, n_frames, tag):
    d = f"seg_{tag}"; shutil.rmtree(d, ignore_errors=True); os.makedirs(d)
    vf = f"setpts=PTS/{speed},fps={FPS},scale={W}:{H}:flags=lanczos"
    subprocess.run(["ffmpeg","-y","-loglevel","error","-ss",f"{src_in:.3f}","-i",src,"-t",f"{dur*speed+0.5:.3f}",
                    "-vf",vf,"-frames:v",str(n_frames),f"{d}/%05d.jpg","-q:v","3"], check=True)
    fr = sorted(os.listdir(d))
    while len(fr) < n_frames: fr.append(fr[-1])      # hold last frame if short
    return [f"{d}/{x}" for x in fr]

frames = []   # list of (path, zoom)
for i,(t0,t1,src,sin,spd,kind) in enumerate(segs):
    n = int(round((t1 - t0) * FPS))
    if n <= 0: continue
    if kind == "img":
        frames += [(src, 1.0)] * n
    elif kind == "vid_fit":
        spd = SCROLL_SRC_SPAN / (t1 - t0)
        frames += [(p, 1.0) for p in extract(src, sin, t1-t0, spd, n, i)]
    elif kind == "vid_zoom":
        frames += [(p, 1.0 + 0.06*(k/max(1,n-1))) for k,p in enumerate(extract(src, sin, t1-t0, 1.0, n, i))]
    else:
        frames += [(p, 1.0) for p in extract(src, sin, t1-t0, spd, n, i)]
NF = len(frames); print("frames", NF, "dur", NF/FPS)

# ---- captions (phrase → shown from its first word start until the next phrase starts) ----
phrases = [
    ("40 people", "40 people walked in."),
    ("nine signed in", "9 signed in."),
    ("I could read", "I could read 3."),
    ("so I stopped", "so I stopped asking."),
    ("I put the house", "I put the house on a card."),
    ("they tap", "they tap."),
    ("and the whole", "the whole listing. no app. no form."),
    ("when they want", "when they want something…"),
    ("they text me", "they text me. one tap."),
    ("their number", "their number, address attached."),
]
cap_times = []
for key, text in phrases:
    try: s,_ = t_of(key, 0.0)
    except SystemExit:
        # tolerate whisper digit/word variants
        alt = key.replace("nine","9").replace("three","3")
        s,_ = t_of(alt, 0.0)
    cap_times.append((s, text))
cap_times.sort()
cap_spans = [(s, cap_times[i+1][0] if i+1 < len(cap_times) else t_fields, txt) for i,(s,txt) in enumerate(cap_times)]
cap_spans[0] = (0.0, cap_spans[0][1], cap_spans[0][2])  # first caption is on frame 0

CAPF = F("Inter-Medium", 56); LTF = F("Inter-Light", 34)
def draw_overlays(im, t):
    d = ImageDraw.Draw(im, "RGBA")
    for s,e,txt in cap_spans:
        if s <= t < e:
            tw = CAPF.getlength(txt); x = (W - tw)/2; y = H*0.72
            d.rounded_rectangle([x-28, y-18, x+tw+28, y+74], radius=22, fill=(0,0,0,150))
            d.text((x, y), txt, font=CAPF, fill=(255,255,255))
    if t >= 7.0 and t < t_fields:
        lt = "sable  ·  $99/mo  ·  card included"
        tw = LTF.getlength(lt); x, y = 54, H - 150
        d.rounded_rectangle([x-20, y-14, x+tw+20, y+50], radius=16, fill=(243,242,238,190))
        d.text((x, y), lt, font=LTF, fill=INK)
    return im

out = "frames_out"; shutil.rmtree(out, ignore_errors=True); os.makedirs(out)
for i,(p,z) in enumerate(frames):
    im = Image.open(p).convert("RGB")
    if im.size != (W,H): im = im.resize((W,H), Image.LANCZOS)
    if z != 1.0:
        w,h = int(W/z), int(H/z); im = im.crop(((W-w)//2,(H-h)//2,(W-w)//2+w,(H-h)//2+h)).resize((W,H), Image.LANCZOS)
    im = draw_overlays(im, i/FPS)
    im.save(f"{out}/{i:05d}.jpg", quality=93)

# ---- audio: VO + synthesized foley, normalized ----
def sox(cmd): subprocess.run(["sox"]+cmd, check=True)
sox(["-n","-r","48000","-c","1","pen.wav","synth","0.06","noise","fade","0","0.06","0.05","lowpass","1800","gain","-18"])
sox(["-n","-r","48000","-c","1","click.wav","synth","0.03","noise","fade","0","0.03","0.025","highpass","2500","gain","-14"])
sox(["-n","-r","48000","-c","1","chime.wav","synth","0.35","sine","1318","synth","0.35","sine","mix","1760","fade","0.005","0.35","0.3","gain","-22"])
sox(["-n","-r","48000","-c","1","whoosh.wav","synth","0.35","noise","fade","0.1","0.35","0.2","bandpass","1200","400","gain","-20"])
pen_t = t_three - 0.35; click_t = contact; chime_t = contact + 0.12; whoosh_t = t_want + 0.9 + 1.0
filt = (f"[1]adelay={int(pen_t*1000)}|{int(pen_t*1000)}[a1];[2]adelay={int(click_t*1000)}|{int(click_t*1000)}[a2];"
        f"[3]adelay={int(chime_t*1000)}|{int(chime_t*1000)}[a3];[4]adelay={int(whoosh_t*1000)}|{int(whoosh_t*1000)}[a4];"
        f"[0][a1][a2][a3][a4]amix=inputs=5:normalize=0,loudnorm=I=-14:TP=-1.5:LRA=11,apad,atrim=0:{END:.3f}[a]")
subprocess.run(["ffmpeg","-y","-loglevel","error","-i",VO,"-i","pen.wav","-i","click.wav","-i","chime.wav","-i","whoosh.wav",
                "-filter_complex",filt,"-map","[a]","-ar","48000","mix.wav"], check=True)
subprocess.run(["ffmpeg","-y","-loglevel","error","-framerate",str(FPS),"-i",f"{out}/%05d.jpg","-i","mix.wav",
                "-c:v","libx264","-pix_fmt","yuv420p","-crf","18","-r",str(FPS),"-c:a","aac","-b:a","192k","-shortest",
                "-movflags","+faststart",OUT], check=True)
print("done", OUT)

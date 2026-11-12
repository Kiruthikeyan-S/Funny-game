from PIL import Image, ImageDraw
import os

SRC = r'f:\BINGO game\assets\design_src\gme imag'
OUT_CARD = r'f:\BINGO game\assets\monsters\cards'
OUT_SPR = r'f:\BINGO game\assets\monsters\sprites'
os.makedirs(OUT_CARD, exist_ok=True)
os.makedirs(OUT_SPR, exist_ok=True)

# id -> (file, mode, options)
MAP = {
    'forest_goblin': ('img07.jpg', 'cutout', {'crop': (45, 20, 160, 175), 'thresh': 40}),
    'shadow_wolf': ('img12.jpg', 'card', {}),
    'tree_guardian': ('img04.jpg', 'cutout', {'thresh': 28}),
    'skeleton_knight': ('img03.jpg', 'cutout', {'thresh': 40, 'global': 38}),
    'spider_queen': ('img11.jpg', 'card', {}),
    'dark_witch': ('img10.jpg', 'cutout', {'thresh': 40}),
    'ice_golem': ('img13.jpg', 'cutout', {'thresh': 40}),
    'frost_wyvern': ('img02.jpg', 'cutout', {'thresh': 38, 'global': 30}),
    'three_headed_beast': ('img05.jpg', 'card', {'crop': (0, 50, 531, 487)}),
    'shadow_assassin': ('img08.jpg', 'cutout', {'thresh': 40}),
    'demon_knight': ('img01.jpg', 'card', {}),
    'cursed_dragon': ('img09.jpg', 'card', {}),
    'witch_queen': ('img06.jpg', 'card', {}),
}

def cutout(img, thresh, glob=0):
    rgb = img.convert('RGB')
    w, h = rgb.size
    SENT = (255, 0, 255)
    work = rgb.copy()
    for xy in [(0, 0), (w - 1, 0), (0, h - 1), (w - 1, h - 1), (w // 2, 0), (w // 2, h - 1), (0, h // 2), (w - 1, h // 2)]:
        if work.getpixel(xy) != SENT:
            ImageDraw.floodfill(work, xy, SENT, thresh=thresh)
    rgba = rgb.convert('RGBA')
    px = rgba.load()
    wp = work.load()
    for y in range(h):
        for x in range(w):
            if wp[x, y] == SENT:
                px[x, y] = (0, 0, 0, 0)
            elif glob:
                r, g, b = rgb.getpixel((x, y))
                bg = rgb.getpixel((0, 0))
                if abs(r - bg[0]) + abs(g - bg[1]) + abs(b - bg[2]) < glob * 3:
                    px[x, y] = (0, 0, 0, 0)
    bbox = rgba.getbbox()
    return rgba.crop(bbox) if bbox else rgba

report = []
for mid, (fn, mode, opt) in MAP.items():
    im = Image.open(os.path.join(SRC, fn)).convert('RGB')
    if 'crop' in opt:
        im = im.crop(opt['crop'])
    # card (character design image)
    card = im.copy()
    card.thumbnail((640, 640), Image.LANCZOS)
    card.save(os.path.join(OUT_CARD, mid + '.jpg'), quality=86)
    if mode == 'cutout':
        cut = cutout(im, opt.get('thresh', 40), opt.get('global', 0))
        cut.thumbnail((360, 360), Image.LANCZOS)
        cut.save(os.path.join(OUT_SPR, mid + '.png'), optimize=True)
        report.append((mid, 'card+sprite', cut.size))
    else:
        report.append((mid, 'card', card.size))
for r in report:
    print(r)

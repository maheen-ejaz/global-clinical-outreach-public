# /// script
# requires-python = ">=3.12"
# dependencies = ["pillow==12.3.0"]
# ///
"""Render the dashboard's public branding; no prospect data or network access.

Rebuild with: uv run --no-project scripts/build-brand-assets.py
Inter is bundled under its SIL Open Font License (scripts/brand/OFL.txt).
"""

import math
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

REPO = Path(__file__).resolve().parent.parent
WEB = REPO / "web"
SCALE = 3
BLUE = "#2f6fe4"
INK = "#18181b"


def font(size, weight=500):
    result = ImageFont.truetype(str(REPO / "scripts/brand/Inter.ttf"), round(size * SCALE))
    result.set_variation_by_axes([32, weight])
    return result


def line(draw, points, fill, width=1):
    draw.line([(round(x * SCALE), round(y * SCALE)) for x, y in points],
              fill=fill, width=max(1, round(width * SCALE)), joint="curve")


def ellipse(draw, bounds, fill=None, outline=None, width=1):
    draw.ellipse(tuple(round(v * SCALE) for v in bounds), fill=fill, outline=outline,
                 width=round(width * SCALE))


def text(draw, position, label, size, fill=INK, weight=500, tracking=0):
    x, y = (v * SCALE for v in position)
    face = font(size, weight)
    if not tracking:
        draw.text((x, y), label, font=face, fill=fill, anchor="lt")
        return
    for char in label:
        draw.text((x, y), char, font=face, fill=fill, anchor="lt")
        x += draw.textlength(char, font=face) + tracking * SCALE


def icon(size):
    """A connected G: open orbit, horizontal bridge and a distinct endpoint."""
    image = Image.new("RGB", (size, size), BLUE)
    draw = ImageDraw.Draw(image)
    # A quiet gradient shares the dashboard's primary-button palette.
    for y in range(size):
        t = y / max(1, size - 1)
        draw.line((0, y, size, y), fill=(round(47 - 18 * t), round(111 - 32 * t), round(228 - 44 * t)))
    k = size / 32
    points = [(16 + 9 * math.cos(math.radians(a)), 16 + 9 * math.sin(math.radians(a)))
              for a in range(316, 39, -2)]
    points.append((17, 21.8))
    draw.line([(round(x * k), round(y * k)) for x, y in points], fill="white",
              width=round(3.4 * k), joint="curve")
    for x, y in [points[0], points[-1]]:
        draw.ellipse(((x - 1.7) * k, (y - 1.7) * k, (x + 1.7) * k, (y + 1.7) * k), fill="white")
    draw.ellipse((22.7 * k, 6.7 * k, 27.3 * k, 11.3 * k), fill="#b9d1ff")
    return image


def social_card():
    image = Image.new("RGB", (1200 * SCALE, 630 * SCALE), "#f7f8fc")
    draw = ImageDraw.Draw(image)
    # The geometry is illustrative, not a map of actual providers or their locations.
    ellipse(draw, (727, 86, 1193, 552), fill="#edf2fc")
    center_x, center_y, radius = 960, 310, 204

    def project(lat, lon):
        x = math.cos(lat) * math.sin(lon)
        y = math.sin(lat)
        z = math.cos(lat) * math.cos(lon)
        # Tilt the sphere for a more natural editorial composition.
        angle = math.radians(-18)
        return (center_x + radius * (x * math.cos(angle) - y * math.sin(angle)),
                center_y + radius * (x * math.sin(angle) + y * math.cos(angle)), z)

    for latitude in [-60, -30, 0, 30, 60]:
        points = [project(math.radians(latitude), math.radians(lon)) for lon in range(-90, 91, 2)]
        line(draw, [(x, y) for x, y, _ in points], "#b6cbef", 1.2)
    for longitude in [-60, -30, 0, 30, 60]:
        points = [project(math.radians(lat), math.radians(longitude)) for lat in range(-90, 91, 2)]
        line(draw, [(x, y) for x, y, _ in points], "#b6cbef", 1.2)
    ellipse(draw, (center_x-radius, center_y-radius, center_x+radius, center_y+radius), outline="#b6cbef", width=1.2)

    # Three broad connections keep the image readable in a small link preview.
    routes = [(830, 218), (1067, 258), (935, 450)]
    for start, end, control in [(routes[0], routes[1], (942, 115)),
                                (routes[1], routes[2], (1110, 413)),
                                (routes[2], routes[0], (763, 365))]:
        points = []
        for i in range(101):
            t = i / 100
            points.append(((1-t)**2*start[0]+2*(1-t)*t*control[0]+t*t*end[0],
                           (1-t)**2*start[1]+2*(1-t)*t*control[1]+t*t*end[1]))
        line(draw, points, BLUE, 2.8)
    for x, y in routes:
        ellipse(draw, (x-15, y-15, x+15, y+15), fill="#d8e5ff")
        ellipse(draw, (x-7, y-7, x+7, y+7), fill=BLUE)
        ellipse(draw, (x-2.5, y-2.5, x+2.5, y+2.5), fill="white")

    mark = icon(48 * SCALE)
    mask = Image.new("L", mark.size)
    ImageDraw.Draw(mask).rounded_rectangle((0, 0, mark.width-1, mark.height-1), radius=12*SCALE, fill=255)
    image.paste(mark, (64*SCALE, 56*SCALE), mask)
    text(draw, (128, 68), "GooCampus", 25, weight=600)
    text(draw, (64, 164), "RESEARCH & PARTNERSHIPS", 13, fill="#61708a", tracking=1.7)
    text(draw, (60, 220), "Global clinical", 75, weight=600)
    text(draw, (60, 303), "outreach.", 75, fill=BLUE, weight=600)
    text(draw, (64, 416), "Clinical programmes. Provider connections.", 23, fill="#566173", weight=400)
    text(draw, (64, 453), "One workspace for a world of opportunities.", 23, fill="#566173", weight=400)
    line(draw, [(64, 543), (1136, 543)], "#dce2ed")
    line(draw, [(64, 543), (133, 543)], BLUE, 3)
    text(draw, (64, 572), "GLOBAL CLINICAL OUTREACH", 12, fill="#61708a", tracking=1.4)
    text(draw, (848, 569), "outreach.goocampusglobal.com", 15, fill="#61708a", weight=400)
    return image.resize((1200, 630), Image.Resampling.LANCZOS)


def main():
    (WEB / "assets").mkdir(exist_ok=True)
    social_card().save(WEB / "assets/social-card-v1.png", optimize=True)
    master = icon(1536)
    favicon = master.copy()
    mask = Image.new("L", master.size)
    ImageDraw.Draw(mask).rounded_rectangle((0, 0, 1535, 1535), radius=384, fill=255)
    favicon.putalpha(mask)
    for filename, size in [("favicon-16x16.png", 16), ("favicon-32x32.png", 32),
                           ("apple-touch-icon.png", 180), ("icon-192.png", 192), ("icon-512.png", 512)]:
        source = favicon if filename.startswith("favicon") else master
        source.resize((size, size), Image.Resampling.LANCZOS).save(WEB / filename, optimize=True)
    favicon.resize((64, 64), Image.Resampling.LANCZOS).save(WEB / "favicon.ico", sizes=[(16, 16), (32, 32), (48, 48), (64, 64)])
    print("Wrote social card, favicon and home-screen icons to web/")


if __name__ == "__main__":
    main()

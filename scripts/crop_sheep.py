"""Split the supplied transparent sprite sheet without altering its pixels.

Run from any directory with Python and Pillow installed.
"""
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
ASSETS = ROOT / 'public/forgame/sheepforgame'
source = Image.open(ASSETS / 'sheepforgame.png')
assert source.mode == 'RGBA' and source.size == (1536, 1024)
columns = [0, 270, 510, 750, 1000, 1250, 1536]
rows = [0, 270, 514, 763, 1024]
output = ASSETS / 'styles'
output.mkdir(exist_ok=True)
count = 0
source_pixels = sum(source.getchannel('A').histogram()[1:])
cropped_pixels = 0

for row in range(4):
    for col in range(6):
        cell = source.crop((columns[col], rows[row], columns[col + 1], rows[row + 1]))
        alpha = cell.getchannel('A')
        bounds = alpha.getbbox()
        if bounds is None:
            continue
        left, top, right, bottom = bounds
        assert left > 0 and top > 0 and right < cell.width and bottom < cell.height, 'Crop cuts through artwork'
        sheep = cell.crop(bounds)
        assert sheep.width <= 216 and sheep.height <= 256
        canvas = Image.new('RGBA', (240, 280), (0, 0, 0, 0))
        # No mask: copy RGBA directly so semitransparent edge pixels stay unchanged.
        canvas.paste(sheep, ((canvas.width - sheep.width) // 2, canvas.height - 12 - sheep.height))
        count += 1
        canvas.save(output / f'sheep-{count:02}.png', optimize=True)
        cropped_pixels += sum(canvas.getchannel('A').histogram()[1:])

assert count == 20
assert cropped_pixels == source_pixels, 'Every visible source pixel must be preserved exactly once'
print(f'Saved {count} transparent PNGs (240 × 280), preserving all {source_pixels} visible pixels.')

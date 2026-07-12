# The art system

Hard rule: **no Activision or Treyarch assets, no game screenshots, no
Agency FB font file.** Everything under `public/art/` is original SVG
drawn for this project. The look is achieved by speaking the same visual
language — palette, lighting, geometry — not by borrowing files.

## Inventory

| Path | What it is |
| --- | --- |
| `art/backdrop/` | The scene: four stacked layers (sky/haze/geometry/floor) per variant |
| `art/maps/` | Eight mission preview scenes, one per project |
| `art/emblems/` | Enamel rank emblems I–V (gold lives here) |
| `art/icons/` | The 16-glyph interface icon set |
| `art/playercard/` | The personal emblem on the top-bar chip |
| `art/renders/` | Weapon-style renders (the C/C++ "weapon" art) |
| `art/portrait/` | The operator portrait |
| `art/textures/` | Grain and scanline tiles |

## The shared grammar

All scene art follows the same rules the UI does: the scene palette (cool
blue-grey world, one warm key light), flat vector geometry with 1px
hairline detail, low-alpha atmospherics, and a single readable subject per
image. Mission maps are duotone environment scenes with a subtle noise
pass — dark enough that white map-name labels always sit legible on top.

## The portrait

`art/portrait/operator.svg` is a five-tone posterized rendering of a
photograph, embedded as an indexed-palette PNG inside an SVG dossier
frame (registration marks, scanlines, file annotations). The posterize
step is what makes a photo read as game art instead of a photo.

## Regenerating for your own fork

The art is checked in as final SVGs; nothing at build time generates it.
To make your own set, keep the grammar: pick 5-7 scene tones, posterize
your portrait to ≤5 tones, draw maps as flat duotone scenes, and reserve
one warm accent for light sources only. Any vector editor (or a small
script emitting SVG) works — consistency of palette matters far more than
drawing skill.

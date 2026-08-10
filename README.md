<img src="assets/icon-128.png" width="72" alt="Paster icon">

# Paster

A Figma and FigJam plugin that pastes a list of text into your selected layers — one line per layer — and copies text back out of a selection.

Drop in a column from a spreadsheet, a list of names, or a set of copy variants, select the text layers you want filled, and hit Paste.

## Options

| Option | What it does |
| --- | --- |
| **Loop through list** | When there are more layers than lines, start over at the top of the list. Off, extra layers keep their current text. |
| **Ignore empty lines** | Skip blank lines instead of emptying a layer with them. |
| **Trim whitespace** | Strip leading and trailing spaces from each line. |
| **Reverse order** | Paste the list bottom-to-top. |
| **Shuffle order** | Randomize the list before pasting. |
| **Sort by position** | Fill layers in reading order (top-to-bottom, then left-to-right on canvas) instead of Figma's layer order. Also applies to copying. |
| **Separator** | Split the input on new lines, commas, or a custom string. |

Options are saved between sessions, so your setup is there next time you open the plugin.

**Copy from selection** does the reverse: it reads every text layer in your selection and writes it into the editor, one line each.

## Development

```bash
npm install
npm run dev
```

Then in Figma: **Plugins → Development → Import plugin from manifest…** and pick `manifest.json`. `npm run dev` rebuilds on save; use **Plugins → Development → Run last plugin** (⌥⌘P) to reload.

For a production bundle:

```bash
npm run build
```

## Project structure

```
src/code.ts     Plugin sandbox — selection, font loading, paste/copy, saved settings
src/ui.tsx      Plugin UI (React + Tailwind)
src/ui.css      Tailwind entry, theme tokens, dark-mode variant
src/types.ts    Shared option types and defaults
assets/         Community icon and cover art
dist/           Build output referenced by manifest.json
```

The UI is bundled into a single self-contained `dist/ui.html`, which is what Figma requires. Dark mode hooks the `.figma-dark` class Figma puts on the document when `themeColors` is enabled.

## Publishing

1. `npm run build` and confirm the built plugin works in Figma.
2. **Plugins → Development → Publish** (or manage the listing from the Figma Community page).
3. Upload `assets/icon-128.png` as the plugin icon and `assets/cover-art.png` as the cover image.
4. Use the description and tags below, then submit for review.

**Description**

> Paste a list of text into your selected layers — one line each. Drop in a column from a spreadsheet or a list of copy variants, select your text layers, and fill them all at once. Loop a short list across many layers, ignore empty lines, trim whitespace, reverse or shuffle the order, fill in canvas reading order, or split on commas and custom separators. Copy from selection pulls text back out the same way. Your settings are remembered between sessions.

**Tags:** text, content, copy, paste, localization, data, productivity

Paster requests no network access and reads nothing beyond the layers you have selected.

## License

MIT — see [LICENSE](LICENSE).

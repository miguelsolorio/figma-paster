import { DEFAULT_OPTIONS, PasteOptions, STORAGE_KEY } from './types';

figma.showUI(__html__, { themeColors: true, width: 560, height: 420 });

figma.clientStorage.getAsync(STORAGE_KEY).then(stored => {
  figma.ui.postMessage({ type: 'init', options: { ...DEFAULT_OPTIONS, ...(stored ?? {}) } });
});

function resolveSeparator(options: PasteOptions): string {
  if (options.separator === 'comma') return ',';
  if (options.separator === 'custom') return options.customSeparator || '\n';
  return '\n';
}

function shuffleInPlace(lines: string[]) {
  for (let i = lines.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [lines[i], lines[j]] = [lines[j], lines[i]];
  }
}

// Reading order: top-to-bottom, then left-to-right for nodes on the same row.
function byCanvasPosition(a: TextNode, b: TextNode) {
  const dy = a.absoluteTransform[1][2] - b.absoluteTransform[1][2];
  return Math.abs(dy) > 0.5 ? dy : a.absoluteTransform[0][2] - b.absoluteTransform[0][2];
}

figma.ui.onmessage = async msg => {
  if (msg.type === 'save-options') {
    await figma.clientStorage.setAsync(STORAGE_KEY, msg.options);
    return;
  }

  const options: PasteOptions = { ...DEFAULT_OPTIONS, ...(msg.options ?? {}) };
  let textNodes = figma.currentPage.selection.filter(node => node.type === 'TEXT') as TextNode[];
  if (options.sortByPosition) {
    textNodes = textNodes.slice().sort(byCanvasPosition);
  }

  if (msg.type === 'paste') {
    console.log('## 🖌️ Pasting');
    let lines = (msg.text as string).split(resolveSeparator(options));
    if (options.trimLines) lines = lines.map(line => line.trim());
    if (options.ignoreEmpty) lines = lines.filter(line => line.length > 0);
    if (options.reverse) lines.reverse();
    if (options.shuffle) shuffleInPlace(lines);

    if (lines.length === 0 || (lines.length === 1 && lines[0] === '')) {
      figma.notify('Nothing to paste');
      return;
    }
    if (textNodes.length === 0) {
      figma.notify('Select at least one text layer');
      return;
    }

    const ignoredNodes = figma.currentPage.selection.length - textNodes.length;
    const targets = options.loop ? textNodes : textNodes.slice(0, lines.length);

    // Load every font used by every target up front, so assignment order
    // can't depend on font-load timing.
    const failed = new Set<TextNode>();
    await Promise.all(targets.map(async node => {
      try {
        const fonts = node.characters.length > 0
          ? node.getRangeAllFontNames(0, node.characters.length)
          : [node.fontName as FontName];
        await Promise.all(fonts.map(font => figma.loadFontAsync(font)));
      } catch (err) {
        console.log(`Error loading fonts for "${node.name}":`, err);
        failed.add(node);
      }
    }));

    let index = 0;
    let skipped = 0;
    for (const node of targets) {
      if (failed.has(node)) {
        skipped++;
      } else {
        node.characters = lines[index % lines.length];
      }
      index++;
    }

    const notices: string[] = [];
    if (ignoredNodes > 0) notices.push(`Ignored ${ignoredNodes} non-text layer(s)`);
    if (skipped > 0) notices.push(`Skipped ${skipped} layer(s) with missing fonts`);
    if (notices.length > 0) figma.notify(notices.join(' · '));
  }

  else if (msg.type === 'copy') {
    console.log('## 🖨️ Copying');
    if (textNodes.length === 0) {
      figma.notify('Please select a text layer');
      return;
    }
    figma.ui.postMessage({
      type: 'copyFromSelection',
      text: textNodes.map(node => node.characters).join('\n'),
    });
  }
};

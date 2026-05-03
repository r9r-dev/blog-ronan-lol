// Convert color emojis to grayscale unicode equivalents (where possible),
// and wrap remaining emojis with a class so CSS can desaturate them.

const emojiMap: Record<string, string> = {
  // Checkmarks and crosses
  '✅': '✓', '☑️': '✓', '☑': '✓', '✔️': '✓', '✔': '✓',
  '❌': '⨯', '✖️': '⨯', '✖': '⨯', '❎': '⨯',

  // Math
  '➕': '+', '➖': '−',

  // Arrows
  '⬆️': '↑', '⬇️': '↓', '➡️': '→', '⬅️': '←',
  '↗️': '↗', '↘️': '↘', '↙️': '↙', '↖️': '↖',

  // Warnings (already monochrome)
  '⚠️': '⚠', '⚠': '⚠',

  // Geometric shapes
  '⭕': '○', '⚫': '●', '⚪': '○',
  '⬛': '■', '⬜': '□',
  '▪️': '▪', '▫️': '▫', '◾': '▪', '◽': '▫',
  '◼️': '■', '◻️': '□',
  '🔺': '▲', '🔻': '▼',

  // Hearts
  '❤️': '♥', '❤': '♥',
};

const emojiRegex =
  /[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F000}-\u{1F02F}\u{1F0A0}-\u{1F0FF}\u{1F100}-\u{1F64F}\u{1F680}-\u{1F6FF}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}]/gu;

function processNode(node: Text) {
  let text = node.textContent ?? '';
  for (const [emoji, unicode] of Object.entries(emojiMap)) {
    if (text.includes(emoji)) text = text.replaceAll(emoji, unicode);
  }
  if (text !== node.textContent) node.textContent = text;
}

function walkText(root: Element, action: (n: Text) => void) {
  if (!root.tagName) return;
  if (root.tagName === 'CODE' || root.tagName === 'PRE') return;
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const nodes: Text[] = [];
  let n: Node | null;
  while ((n = walker.nextNode())) nodes.push(n as Text);
  nodes.forEach(action);
}

function wrapColorEmojis(root: Element) {
  if (root.tagName === 'CODE' || root.tagName === 'PRE') return;
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const nodes: Text[] = [];
  let n: Node | null;
  while ((n = walker.nextNode())) {
    const parent = (n as Text).parentElement;
    if (!parent || parent.classList.contains('emoji-grayscale')) continue;
    nodes.push(n as Text);
  }
  nodes.forEach((textNode) => {
    const text = textNode.textContent ?? '';
    const matches = text.match(emojiRegex);
    if (!matches || matches.length === 0) return;

    const parts = text.split(emojiRegex);
    const fragment = document.createDocumentFragment();
    let matchIndex = 0;
    parts.forEach((part) => {
      if (part) fragment.appendChild(document.createTextNode(part));
      if (matchIndex < matches.length) {
        const span = document.createElement('span');
        span.className = 'emoji-grayscale';
        span.textContent = matches[matchIndex];
        fragment.appendChild(span);
        matchIndex++;
      }
    });
    textNode.parentNode?.replaceChild(fragment, textNode);
  });
}

function run() {
  const root = document.querySelector<HTMLElement>('.post-content');
  if (!root) return;
  walkText(root, processNode);
  wrapColorEmojis(root);
}

run();
document.addEventListener('astro:page-load', run);

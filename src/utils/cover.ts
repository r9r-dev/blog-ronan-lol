const palette = [
  'oklch(0.32 0.10 25)',
  'oklch(0.32 0.08 200)',
  'oklch(0.32 0.10 60)',
  'oklch(0.32 0.08 145)',
  'oklch(0.32 0.08 290)',
];

const stripWords = new Set(['le', 'la', 'les', "l'", 'the', 'a', 'an', 'un', 'une', 'des']);

export interface Cover {
  color: string;
  monogram: string;
}

export function getCover(id: string, title: string): Cover {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) | 0;
  const color = palette[Math.abs(h) % palette.length];

  const words = title.trim().split(/\s+/);
  let firstWord = words[0] || '·';
  if (stripWords.has(firstWord.toLowerCase()) && words[1]) firstWord = words[1];
  const monogram = (firstWord[0] || '·').toUpperCase();

  return { color, monogram };
}

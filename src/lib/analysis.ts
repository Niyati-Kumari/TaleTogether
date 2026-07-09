import type { Genre, StoryFormat, WritingScore } from '../types';

const emotionalWords = [
  'love',
  'grief',
  'fear',
  'hope',
  'ache',
  'joy',
  'memory',
  'lonely',
  'kind',
  'hurt',
  'belong',
  'loss',
  'home',
  'dream',
  'afraid',
  'gentle',
  'brave',
];

const transitionWords = ['then', 'later', 'suddenly', 'meanwhile', 'because', 'after', 'before', 'finally'];

const vividVerbs: Record<string, string> = {
  said: 'whispered',
  went: 'drifted',
  looked: 'studied',
  felt: 'carried',
  saw: 'noticed',
  walked: 'moved',
  ran: 'rushed',
};

const clamp = (value: number) => Math.max(35, Math.min(98, Math.round(value)));

export const analyzeWriting = (text: string): WritingScore => {
  const normalized = text.trim();
  const words = normalized.split(/\s+/).filter(Boolean);
  const sentences = normalized.split(/[.!?]+/).filter((part) => part.trim().length > 0);
  const uniqueWords = new Set(words.map((word) => word.toLowerCase().replace(/[^a-z]/g, '')));
  const emotionalHits = words.filter((word) => emotionalWords.includes(word.toLowerCase().replace(/[^a-z]/g, ''))).length;
  const transitionHits = words.filter((word) => transitionWords.includes(word.toLowerCase().replace(/[^a-z]/g, ''))).length;
  const averageSentenceLength = words.length / Math.max(sentences.length, 1);
  const startsWell = sentences.filter((sentence) => sentence.trim().match(/^[A-Z]/)).length;
  const punctuationBalance = (text.match(/[,;:—-]/g) ?? []).length;

  const creativity = clamp(uniqueWords.size * 1.7 + punctuationBalance * 1.5 + emotionalHits * 3);
  const grammar = clamp(55 + (startsWell / Math.max(sentences.length, 1)) * 22 - Math.abs(18 - averageSentenceLength) * 1.5);
  const emotion = clamp(42 + emotionalHits * 8 + (text.includes('I ') ? 8 : 0) + (text.includes('my ') ? 6 : 0));
  const flow = clamp(48 + transitionHits * 9 + (sentences.length > 4 ? 10 : 0) - Math.abs(16 - averageSentenceLength) * 1.2);
  const vocabulary = clamp(uniqueWords.size * 1.4 + words.length * 0.12);

  const overall = (creativity + grammar + emotion + flow + vocabulary) / 5;

  const suggestions = [
    ...(averageSentenceLength > 25 ? ['Shorten a few long sentences to make the pacing easier to follow.'] : []),
    ...(emotionalHits < 3 ? ['Add one or two emotionally specific details so the reader feels what is at stake.'] : []),
    ...(transitionHits < 1 && sentences.length > 3 ? ['Use a transition phrase to make the shift between moments smoother.'] : []),
    ...(uniqueWords.size < 45 ? ['Replace repeated words with more vivid verbs or sensory nouns.'] : []),
    ...(words.length < 120 ? ['Develop the scene a bit further with setting, inner thought, or dialogue.'] : []),
  ].slice(0, 4);

  return {
    creativity,
    grammar,
    emotion,
    flow,
    vocabulary,
    wordCount: words.length,
    level: overall >= 85 ? 'Emerging Author' : overall >= 72 ? 'Rising Writer' : 'Developing Voice',
    suggestions,
  };
};

export const suggestOpeningRewrite = (text: string) => {
  const firstSentences = text
    .split(/(?<=[.!?])/)
    .map((sentence) => sentence.trim())
    .filter(Boolean)
    .slice(0, 3)
    .join(' ');

  if (!firstSentences) {
    return 'Start with one concrete image, one emotional truth, and one unanswered question. That combination creates instant curiosity.';
  }

  return firstSentences
    .replace(/\bI felt\b/gi, 'I carried')
    .replace(/\bI saw\b/gi, 'I noticed')
    .replace(/\bThere was\b/gi, 'What stayed with me was')
    .concat(' Add one sensory detail—sound, smell, temperature, or texture—to make the opening land harder.');
};

export const suggestEnding = (text: string, genre: Genre) => {
  const endings: Record<Genre, string> = {
    Personal: 'End by returning to the moment that changed you and naming what you understand now that you could not understand then.',
    Memoir: 'Let the final paragraph connect a private memory to a larger inheritance: family, place, language, or identity.',
    Fantasy: 'Close with a small cost of victory so the world feels larger than the plot.',
    Romance: 'End on an emotionally decisive choice, not just a confession.',
    Adventure: 'Leave the reader with motion—departure, pursuit, or the next map point ahead.',
    Poetry: 'Finish on the sharpest image, then trust silence to do the rest.',
    'Sci-Fi': 'Tie the speculative idea back to one human relationship the technology cannot replace.',
    Horror: 'Let the last line imply that the danger has changed shape rather than disappeared.',
  };

  return text.trim().length > 0
    ? endings[genre]
    : 'Write a full draft first, then choose an ending that answers the emotional question, not just the plot question.';
};

export const generateCharacterIdeas = (title: string, genre: Genre) => {
  const anchor = title || 'your story';
  return [
    `A protagonist who wants stability but is forced to protect something fragile in ${anchor}.`,
    `A secondary character who speaks casually but notices everything—use them to reveal tension without exposition.`,
    `An antagonist shaped by fear rather than cruelty, especially effective for ${genre.toLowerCase()} stories.`,
  ];
};

export const convertStoryFormat = (text: string, format: StoryFormat) => {
  const source = text.trim() || 'A family memory begins quietly and expands into something larger than one life.';
  const firstLine = source.split(/(?<=[.!?])/).slice(0, 2).join(' ').trim();

  switch (format) {
    case 'Biography':
      return `Biography framing:\n\n${firstLine}\n\nThis moment becomes the opening point for a life shaped by resilience, displacement, and the quiet discipline of beginning again.`;
    case 'Novel':
      return `Novel framing:\n\n${firstLine}\n\nStretch this into a chapter by deepening the setting, adding scene-level dialogue, and introducing the central conflict in the final paragraph.`;
    case 'Movie Script':
      return `INT. MODEST ROOM - EVENING\n\nA trunk slides out from beneath the bed. Dust lifts in the amber light.\n\nNARRATOR (V.O.)\n${firstLine}\n\nThe room is ordinary, but the object is not.`;
    case 'Poem':
      return `${firstLine.replace(/, /g, ',\n').replace(/\. /g, '\n')}\n\nmake the memory breathe\nthrough image\nnot explanation`;
    default:
      return source;
  }
};

export const polishText = (text: string) => {
  let polished = text;

  Object.entries(vividVerbs).forEach(([plain, vivid]) => {
    polished = polished.replace(new RegExp(`\\b${plain}\\b`, 'gi'), vivid);
  });

  return polished.replace(/\bvery\b/gi, 'remarkably').trim();
};

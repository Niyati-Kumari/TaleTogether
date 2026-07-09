import type { StoryDraft } from '../types';

const DRAFT_KEY = 'taletogether-draft';

export const defaultDraft = (): StoryDraft => ({
  title: '',
  summary: '',
  genre: 'Personal',
  tags: ['memory'],
  coverStyle: 'linear-gradient(135deg, #7c3aed, #ec4899)',
  coverImageUrl: undefined,
  visibility: 'public',
  isPersonal: true,
  challenge: '',
  chapters: [
    {
      title: 'Chapter 1',
      content: '',
    },
  ],
});

export const loadDraft = () => {
  if (typeof window === 'undefined') {
    return defaultDraft();
  }

  const raw = window.localStorage.getItem(DRAFT_KEY);
  if (!raw) {
    return defaultDraft();
  }

  try {
    const parsed = JSON.parse(raw) as StoryDraft;
    return {
      ...defaultDraft(),
      ...parsed,
      chapters: parsed.chapters?.length ? parsed.chapters : defaultDraft().chapters,
      tags: parsed.tags?.length ? parsed.tags : defaultDraft().tags,
    };
  } catch {
    return defaultDraft();
  }
};

export const persistDraft = (draft: StoryDraft) => {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
};

export const clearDraft = () => {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.removeItem(DRAFT_KEY);
};

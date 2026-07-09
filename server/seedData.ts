export type SeedUser = {
  id: string;
  name: string;
  email: string;
  password: string;
  handle: string;
  bio: string;
  level: string;
  avatar: string;
  followersBase: number;
  readersBase: number;
  achievements: string[];
  focusGenres: string[];
  streak: number;
};

export type SeedStory = {
  id: string;
  title: string;
  summary: string;
  genre: string;
  tags: string[];
  authorId: string;
  coverStyle: string;
  publishedAt: string;
  visibility: 'public' | 'private';
  isPersonal: boolean;
  challenge?: string;
  chapters: Array<{ title: string; content: string }>;
  stats: { likes: number; comments: number; reads: number };
  estimatedMinutes: number;
};

export const seedUsers: SeedUser[] = [
  {
    id: 'demo-writer',
    name: 'Niyati Rao',
    email: 'demo@taletogether.app',
    password: 'demo12345',
    handle: '@niyatiwrites',
    bio: 'I collect lived moments, quiet feelings, and unfinished ideas, then turn them into stories people can keep.',
    level: 'Rising Writer',
    avatar: 'NR',
    followersBase: 324,
    readersBase: 1820,
    achievements: ['First public story', '7-day writing streak', 'Featured in Memory Week'],
    focusGenres: ['Personal', 'Memoir', 'Fantasy'],
    streak: 8,
  },
  {
    id: 'aanya',
    name: 'Aanya Mehta',
    email: 'aanya@taletogether.app',
    password: 'seeded-author',
    handle: '@aanyatells',
    bio: 'Writing about migration, girlhood, and brave little choices.',
    level: 'Intermediate',
    avatar: 'AM',
    followersBase: 1820,
    readersBase: 22400,
    achievements: ['1k readers reached', 'Memoir finalist', 'Community mentor'],
    focusGenres: ['Personal', 'Memoir', 'Romance'],
    streak: 30,
  },
  {
    id: 'rahul',
    name: 'Rahul Sen',
    email: 'rahul@taletogether.app',
    password: 'seeded-author',
    handle: '@rahulworlds',
    bio: 'Fantasy worlds with emotional cores and stubborn heroes.',
    level: 'Advanced',
    avatar: 'RS',
    followersBase: 5240,
    readersBase: 98300,
    achievements: ['Published first novel', '30-day streak', 'Fantasy challenge winner'],
    focusGenres: ['Fantasy', 'Adventure', 'Sci-Fi'],
    streak: 30,
  },
  {
    id: 'meera',
    name: 'Meera Kapoor',
    email: 'meera@taletogether.app',
    password: 'seeded-author',
    handle: '@meerainverse',
    bio: 'Poems, micro-memoirs, and scenes that smell like rain.',
    level: 'Intermediate',
    avatar: 'MK',
    followersBase: 3100,
    readersBase: 40880,
    achievements: ['Top poet', 'Editor pick', '100 comments received'],
    focusGenres: ['Poetry', 'Personal', 'Memoir'],
    streak: 12,
  },
  {
    id: 'dev',
    name: 'Dev Khanna',
    email: 'dev@taletogether.app',
    password: 'seeded-author',
    handle: '@devwritescode',
    bio: 'Engineer by day, sci-fi storyteller by night.',
    level: 'Intermediate',
    avatar: 'DK',
    followersBase: 1450,
    readersBase: 15200,
    achievements: ['Sci-fi weekly winner', 'First collaboration story'],
    focusGenres: ['Sci-Fi', 'Adventure', 'Personal'],
    streak: 9,
  },
];

export const seedChallenges = [
  {
    id: 'memory-lane',
    cadence: 'Daily',
    title: 'Memory Lane',
    prompt: 'Write a story about an object that still carries a piece of your childhood.',
    prize: 'Featured on the home page',
  },
  {
    id: 'future-2050',
    cadence: 'Monthly',
    title: 'Life After 2050',
    prompt: 'Imagine a life transformed by technology, but anchor it in one human relationship.',
    prize: '₹10,000 + editorial review',
  },
  {
    id: '500-words',
    cadence: 'Weekend',
    title: 'Exactly 500',
    prompt: 'Tell a complete emotional story in 500 words, no more and no less.',
    prize: 'Top 10 featured in the newsletter',
  },
];

const memoirOpening = `The steel trunk lived under my grandmother's bed for so long that I thought it belonged to the house more than to her. It smelled like old saris, camphor, and railway stations. Every summer, when the power cuts stretched into the evening and the whole lane moved to the terrace for air, she would pull the trunk open and tell us how she arrived in Delhi with one bag, two children, and no certainty except the address folded into her blouse.`;
const memoirChapterTwo = `She never called it courage. She called it Tuesday. She said courage sounded too dramatic for what women like her did. They simply woke up before fear did, packed lunch into steel boxes, and walked into unfamiliar cities before sunrise could ask them what right they had to begin again.`;
const fantasyOpening = `By the time the last lighthouse on the Salt Coast went dark, Tara had already stolen the map from the governor's study. It was smaller than she expected, folded into a silver compass case, but the ink on it moved like tidewater. Whole islands drifted from one edge to the other as if the world itself were trying to hide.`;
const fantasyChapterTwo = `In the city of glass bridges, no one spoke the old king's name aloud. Merchants tapped it into wooden counters with their knuckles; soldiers carved half of it into scabbards and left the rest unfinished. Tara learned very quickly that secrets here did not sleep. They perched on rooftops, shimmered in market mirrors, and followed her like a second shadow.`;
const poetryOpening = `Rain arrived with the shyness of a letter / tucked halfway under the door. / Mother stopped speaking in full sentences / and began naming the sky in teaspoons. / I stood at the window / counting all the things we never say directly / and how water says them anyway.`;
const poetryChapterTwo = `There is a version of grief / that folds the bedsheet neatly. / Another that leaves tea unfinished. / Another that waters plants / because something in the house / should still believe in tomorrow.`;
const scifiOpening = `When the city started rating memories for resale value, Arjun discovered his happiest day was worth less than a train ticket. The broker smiled kindly as if low emotional demand were a small inconvenience. Behind the glass wall, rows of archived childhoods blinked blue in refrigerated stacks.`;
const scifiChapterTwo = `He took a night shift tagging memory fragments from strangers: wedding laughter, exam results, hospital corridors, the exact sound of a father clearing his throat before apologizing. The work should have numbed him. Instead it taught him that most people do not lose their lives all at once. They sell them scene by scene.`;
const personalOpening = `On my first day of college I wore confidence like a badly fitted jacket. It looked fine from a distance, but every time someone asked me a simple question—What's your name? Which course? Where are you from?—it tightened at the shoulders. By lunch, I had learned that homesickness can arrive before you've even unpacked.`;
const personalChapterTwo = `The turning point was not dramatic. No viral friendship montage, no perfect speech. Just a girl in yellow sneakers asking if the empty seat beside me was taken, then acting as if my answer mattered. For the first time that day, I laughed without checking how I sounded.`;

export const seedStories: SeedStory[] = [
  {
    id: 'lifelines-trunk',
    title: 'The Trunk Under Her Bed',
    summary: 'A granddaughter pieces together her grandmother’s migration story through the objects she kept and the memories she refused to dramatize.',
    genre: 'Memoir',
    tags: ['family', 'migration', 'identity'],
    authorId: 'aanya',
    coverStyle: 'linear-gradient(135deg, #f97316, #fb7185)',
    publishedAt: '2026-06-21T00:00:00.000Z',
    visibility: 'public',
    isPersonal: true,
    challenge: 'Memory Lane',
    chapters: [
      { title: 'The Trunk', content: memoirOpening },
      { title: 'What Courage Looked Like', content: memoirChapterTwo },
    ],
    stats: { likes: 420, comments: 34, reads: 5200 },
    estimatedMinutes: 6,
  },
  {
    id: 'salt-coast',
    title: 'The Last Map of the Salt Coast',
    summary: 'A thief with a moving map must cross a kingdom built on secrets before the sea swallows its final lighthouse.',
    genre: 'Fantasy',
    tags: ['worldbuilding', 'adventure', 'quest'],
    authorId: 'rahul',
    coverStyle: 'linear-gradient(135deg, #0f172a, #38bdf8)',
    publishedAt: '2026-07-03T00:00:00.000Z',
    visibility: 'public',
    isPersonal: false,
    challenge: 'Life After 2050',
    chapters: [
      { title: 'The Moving Ink', content: fantasyOpening },
      { title: 'A City of Watching Glass', content: fantasyChapterTwo },
    ],
    stats: { likes: 980, comments: 82, reads: 11600 },
    estimatedMinutes: 9,
  },
  {
    id: 'rain-letter',
    title: 'Rain Learned Our Family First',
    summary: 'A lyrical set of poems about grief, weather, and the language homes use when words fail.',
    genre: 'Poetry',
    tags: ['rain', 'family', 'grief'],
    authorId: 'meera',
    coverStyle: 'linear-gradient(135deg, #6366f1, #2dd4bf)',
    publishedAt: '2026-06-28T00:00:00.000Z',
    visibility: 'public',
    isPersonal: true,
    chapters: [
      { title: 'Rain Letter', content: poetryOpening },
      { title: 'Household Grief', content: poetryChapterTwo },
    ],
    stats: { likes: 670, comments: 58, reads: 7400 },
    estimatedMinutes: 4,
  },
  {
    id: 'memory-market',
    title: 'The Memory Market',
    summary: 'In a near future where memories are commodified, an exhausted archivist decides some moments should remain priceless.',
    genre: 'Sci-Fi',
    tags: ['future', 'ethics', 'technology'],
    authorId: 'dev',
    coverStyle: 'linear-gradient(135deg, #111827, #8b5cf6)',
    publishedAt: '2026-07-05T00:00:00.000Z',
    visibility: 'public',
    isPersonal: false,
    chapters: [
      { title: 'What Joy Costs', content: scifiOpening },
      { title: 'Tagged and Shelved', content: scifiChapterTwo },
    ],
    stats: { likes: 530, comments: 41, reads: 6900 },
    estimatedMinutes: 7,
  },
  {
    id: 'college-jacket',
    title: 'The Jacket I Wore on My First Day of College',
    summary: 'A personal story about arriving on campus afraid, and discovering that belonging often begins with one kind question.',
    genre: 'Personal',
    tags: ['college', 'growth', 'friendship'],
    authorId: 'aanya',
    coverStyle: 'linear-gradient(135deg, #14b8a6, #facc15)',
    publishedAt: '2026-07-01T00:00:00.000Z',
    visibility: 'public',
    isPersonal: true,
    challenge: 'Exactly 500',
    chapters: [
      { title: 'A Badly Fitted Jacket', content: personalOpening },
      { title: 'Yellow Sneakers', content: personalChapterTwo },
    ],
    stats: { likes: 720, comments: 77, reads: 9100 },
    estimatedMinutes: 5,
  },
];

export const seedComments = [
  {
    id: 'c1',
    storyId: 'lifelines-trunk',
    authorName: 'Ishita',
    body: 'This feels like my nani too. The line about courage sounding too dramatic is beautiful.',
    createdAt: '2026-07-01T10:30:00.000Z',
  },
  {
    id: 'c2',
    storyId: 'salt-coast',
    authorName: 'Pranav',
    body: 'The moving map is such a strong hook. I want the full novel version.',
    createdAt: '2026-07-06T08:10:00.000Z',
  },
  {
    id: 'c3',
    storyId: 'rain-letter',
    authorName: 'Aditi',
    body: '“Another that waters plants” hit hard. Lovely poem.',
    createdAt: '2026-07-02T12:45:00.000Z',
  },
  {
    id: 'c4',
    storyId: 'memory-market',
    authorName: 'Karan',
    body: 'Great concept. This would make an amazing series.',
    createdAt: '2026-07-07T09:25:00.000Z',
  },
  {
    id: 'c5',
    storyId: 'college-jacket',
    authorName: 'Sana',
    body: 'The yellow sneakers detail makes the whole memory feel real.',
    createdAt: '2026-07-03T18:00:00.000Z',
  },
];

export const seedPreferences = ['Personal', 'Memoir', 'Fantasy'];
export const seedLikes = ['lifelines-trunk', 'rain-letter'];
export const seedFollows = ['aanya', 'rahul'];

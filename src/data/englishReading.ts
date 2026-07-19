import type { EnglishReadingArticle } from '@/types/englishReading'

export const englishReadingArticles: EnglishReadingArticle[] = [
  {
    id: 'lina-rainbow-kite',
    title: 'Lina and the Rainbow Kite',
    emoji: '🪁',
    level: '入门',
    wordCount: 186,
    summary: 'Lina learns that a small act of kindness can help a whole park feel bright again.',
    vocabulary: [
      {
        id: 'breeze',
        word: 'breeze',
        phonetic: '/briːz/',
        meaning: '微风',
        example: 'A soft breeze moved the curtains.',
      },
      {
        id: 'tangled',
        word: 'tangled',
        phonetic: '/ˈtæŋɡəld/',
        meaning: '缠结的，乱成一团的',
        example: 'The string was tangled around the chair.',
      },
      {
        id: 'patiently',
        word: 'patiently',
        phonetic: '/ˈpeɪʃəntli/',
        meaning: '耐心地',
        example: 'She waited patiently for her turn.',
      },
      {
        id: 'cheered',
        word: 'cheered',
        phonetic: '/tʃɪrd/',
        meaning: '欢呼，喝彩',
        example: 'The children cheered when the kite flew high.',
      },
    ],
    paragraphs: [
      [
        { text: 'On Saturday morning, Lina ran to the park with her new rainbow kite. A gentle ' },
        { text: 'breeze', vocabId: 'breeze' },
        { text: ' moved through the trees, and the sky looked wide and blue.' },
      ],
      [
        { text: 'Lina pulled the string and watched the kite jump into the air. Suddenly, the string became ' },
        { text: 'tangled', vocabId: 'tangled' },
        { text: ' in a small tree. Lina felt worried because the kite was a gift from her grandma.' },
      ],
      [
        { text: 'An old man on a bench saw Lina. He walked over slowly and helped her untie the string. Lina held the kite ' },
        { text: 'patiently', vocabId: 'patiently' },
        { text: ' while he worked.' },
      ],
      [
        { text: 'At last, the kite flew again. Other children stopped to watch. They ' },
        { text: 'cheered', vocabId: 'cheered' },
        { text: ', and Lina smiled. She thanked the old man and let two younger kids take turns flying the rainbow kite.' },
      ],
    ],
    questions: [
      {
        id: 'q1',
        prompt: 'Where did Lina go on Saturday morning?',
        options: ['To the library', 'To the park', 'To her school', 'To a shop'],
        answer: 'To the park',
        explanation: '第一段说 Lina ran to the park，所以她去了公园。',
        paragraphHint: '回到第 1 段，找 “ran to the park”。',
      },
      {
        id: 'q2',
        prompt: 'Why did Lina feel worried?',
        options: ['The sky became dark', 'She lost her shoes', 'Her kite string was tangled', 'Grandma called her home'],
        answer: 'Her kite string was tangled',
        explanation: '第二段说风筝线缠在小树上，而且风筝是奶奶送的礼物，所以她担心。',
        paragraphHint: '回到第 2 段，找 “tangled in a small tree”。',
      },
      {
        id: 'q3',
        prompt: 'How did the old man help Lina?',
        options: ['He bought a new kite', 'He untied the string', 'He climbed a tall wall', 'He called other children'],
        answer: 'He untied the string',
        explanation: '第三段说老人 helped her untie the string，说明他帮她解开了线。',
        paragraphHint: '回到第 3 段，找 “untie the string”。',
      },
      {
        id: 'q4',
        prompt: 'What is the main idea of the story?',
        options: ['A kite can teach kindness', 'Parks are always quiet', 'Old trees are dangerous', 'Rainbows only come after rain'],
        answer: 'A kite can teach kindness',
        explanation: '故事最后 Lina 也让更小的孩子轮流放风筝，说明帮助和分享会传递下去。',
        paragraphHint: '回到最后一段，看 Lina 是怎样对待 younger kids 的。',
      },
    ],
  },
  {
    id: 'milo-moon-garden',
    title: 'Milo and the Moon Garden',
    emoji: '🌙',
    level: '入门',
    wordCount: 172,
    summary: 'Milo discovers a quiet garden and learns why small night flowers matter.',
    vocabulary: [
      {
        id: 'glowed',
        word: 'glowed',
        phonetic: '/ɡloʊd/',
        meaning: '发光，发亮',
        example: 'The lamp glowed beside the bed.',
      },
      {
        id: 'whispered',
        word: 'whispered',
        phonetic: '/ˈwɪspərd/',
        meaning: '低声说，耳语',
        example: 'Tom whispered the answer to his sister.',
      },
      {
        id: 'nectar',
        word: 'nectar',
        phonetic: '/ˈnektər/',
        meaning: '花蜜',
        example: 'Bees drink nectar from flowers.',
      },
      {
        id: 'promise',
        word: 'promise',
        phonetic: '/ˈprɑːmɪs/',
        meaning: '承诺，保证',
        example: 'I promise to water the plant every day.',
      },
    ],
    paragraphs: [
      [
        { text: 'Milo could not sleep, so he looked out of his window. Behind his house, tiny white flowers ' },
        { text: 'glowed', vocabId: 'glowed' },
        { text: ' under the moon.' },
      ],
      [
        { text: 'He went outside and heard Grandma in the garden. “These flowers open at night,” she ' },
        { text: 'whispered', vocabId: 'whispered' },
        { text: '. “They are quiet, but they are busy.”' },
      ],
      [
        { text: 'A small moth landed on a flower and drank sweet ' },
        { text: 'nectar', vocabId: 'nectar' },
        { text: '. Milo watched carefully. He had never noticed that night could be so full of life.' },
      ],
      [
        { text: 'Before going back to bed, Milo made a ' },
        { text: 'promise', vocabId: 'promise' },
        { text: '. He would water the moon garden every evening, so the flowers and moths could keep meeting there.' },
      ],
    ],
    questions: [
      {
        id: 'q1',
        prompt: 'Why did Milo look out of his window?',
        options: ['He could not sleep', 'He heard a dog', 'He wanted breakfast', 'He lost a book'],
        answer: 'He could not sleep',
        explanation: '第一段开头说 Milo could not sleep，所以他看向窗外。',
        paragraphHint: '回到第 1 段，找 “could not sleep”。',
      },
      {
        id: 'q2',
        prompt: 'When do the white flowers open?',
        options: ['In the morning', 'At night', 'At lunch time', 'Only in winter'],
        answer: 'At night',
        explanation: '第二段奶奶说 These flowers open at night。',
        paragraphHint: '回到第 2 段，找奶奶说的话。',
      },
      {
        id: 'q3',
        prompt: 'What drank nectar from a flower?',
        options: ['A bird', 'A moth', 'A cat', 'A fish'],
        answer: 'A moth',
        explanation: '第三段说 A small moth landed on a flower and drank sweet nectar。',
        paragraphHint: '回到第 3 段，找 “A small moth”。',
      },
      {
        id: 'q4',
        prompt: 'What did Milo promise to do?',
        options: ['Pick the flowers', 'Sleep in the garden', 'Water the garden every evening', 'Catch the moths'],
        answer: 'Water the garden every evening',
        explanation: '最后一段说 Milo would water the moon garden every evening。',
        paragraphHint: '回到最后一段，找 “water the moon garden”。',
      },
    ],
  },
  {
    id: 'nora-lost-button',
    title: 'Nora and the Lost Button',
    emoji: '🧵',
    level: '入门',
    wordCount: 164,
    summary: 'Nora solves a tiny problem by observing carefully and asking a good question.',
    vocabulary: [
      {
        id: 'missing',
        word: 'missing',
        phonetic: '/ˈmɪsɪŋ/',
        meaning: '丢失的，缺少的',
        example: 'One page is missing from the book.',
      },
      {
        id: 'searched',
        word: 'searched',
        phonetic: '/sɝːtʃt/',
        meaning: '寻找，搜寻',
        example: 'We searched the room for the key.',
      },
      {
        id: 'pattern',
        word: 'pattern',
        phonetic: '/ˈpætərn/',
        meaning: '图案，规律',
        example: 'The scarf has a blue and yellow pattern.',
      },
      {
        id: 'proud',
        word: 'proud',
        phonetic: '/praʊd/',
        meaning: '自豪的',
        example: 'Dad was proud of my hard work.',
      },
    ],
    paragraphs: [
      [
        { text: 'Nora put on her red coat, but one button was ' },
        { text: 'missing', vocabId: 'missing' },
        { text: '. She needed the coat for the school photo.' },
      ],
      [
        { text: 'She ' },
        { text: 'searched', vocabId: 'searched' },
        { text: ' under the table, behind the sofa, and inside her backpack. The button was nowhere.' },
      ],
      [
        { text: 'Then Nora looked at the coat again. The buttons made a little flower ' },
        { text: 'pattern', vocabId: 'pattern' },
        { text: '. She asked Mom if there was an old button box.' },
      ],
      [
        { text: 'In the box, Nora found a yellow button that matched the flower. Mom sewed it on, and Nora felt ' },
        { text: 'proud', vocabId: 'proud' },
        { text: ' because she had solved the problem herself.' },
      ],
    ],
    questions: [
      {
        id: 'q1',
        prompt: 'What was missing from Nora’s coat?',
        options: ['A pocket', 'A button', 'A zipper', 'A flower'],
        answer: 'A button',
        explanation: '第一段说 one button was missing。',
        paragraphHint: '回到第 1 段，找 “one button”。',
      },
      {
        id: 'q2',
        prompt: 'Why did Nora need the coat?',
        options: ['For a school photo', 'For a party', 'For a rainy walk', 'For a trip'],
        answer: 'For a school photo',
        explanation: '第一段说她需要这件外套拍学校照片。',
        paragraphHint: '回到第 1 段，找 “school photo”。',
      },
      {
        id: 'q3',
        prompt: 'What helped Nora choose a new button?',
        options: ['The coat pattern', 'A loud sound', 'A teacher’s note', 'A picture book'],
        answer: 'The coat pattern',
        explanation: '第三段说纽扣组成小花图案，所以她按图案找到了合适的纽扣。',
        paragraphHint: '回到第 3 段，找 “flower pattern”。',
      },
      {
        id: 'q4',
        prompt: 'How did Nora feel at the end?',
        options: ['Sleepy', 'Proud', 'Angry', 'Hungry'],
        answer: 'Proud',
        explanation: '最后一段说 Nora felt proud because she had solved the problem herself。',
        paragraphHint: '回到最后一段，找 “felt proud”。',
      },
    ],
  },
]

export function getDailyEnglishReadingArticle(date = new Date()) {
  const start = new Date(date.getFullYear(), 0, 1)
  const dayOfYear = Math.floor((date.getTime() - start.getTime()) / 86400000)
  return englishReadingArticles[dayOfYear % englishReadingArticles.length]
}

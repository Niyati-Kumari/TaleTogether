type AssistAction = 'opening' | 'ending' | 'polish' | 'character';

const localFallback = ({
  action,
  text,
  genre,
  title,
}: {
  action: AssistAction;
  text: string;
  genre?: string;
  title?: string;
}) => {
  const trimmed = text.trim();
  const firstSentence = trimmed.split(/(?<=[.!?])/).slice(0, 2).join(' ').trim();

  switch (action) {
    case 'opening':
      return firstSentence
        ? `${firstSentence} Add one concrete sensory detail and one unresolved tension in the next sentence so the reader feels immediate curiosity.`
        : 'Open with a concrete image, a private emotion, and one unanswered question.';
    case 'ending':
      return genre === 'Fantasy'
        ? 'Let the final paragraph show the cost of victory, not just the victory itself.'
        : genre === 'Memoir'
          ? 'Return to the memory that shaped the narrator and reveal what it means now.'
          : genre === 'Sci-Fi'
            ? 'Close on the human cost or human hope inside the speculative idea.'
            : 'End by answering the emotional question of the piece, not only the plot question.';
    case 'polish':
      return trimmed
        .replace(/\bvery\b/gi, 'remarkably')
        .replace(/\bsaid\b/gi, 'said quietly')
        .replace(/\bwent\b/gi, 'moved') || 'Write a little more before asking for a line edit.';
    case 'character':
      return `For ${title || 'this story'}, try a protagonist who wants safety, a secondary character who notices what others miss, and an antagonist driven by fear instead of cruelty.`;
    default:
      return 'Keep the emotional center clear and give the scene one vivid image readers can remember.';
  }
};

const buildPrompt = ({
  action,
  text,
  genre,
  title,
}: {
  action: AssistAction;
  text: string;
  genre?: string;
  title?: string;
}) => {
  const shared = `You are an expert fiction and memoir editor for a writing platform called TaleTogether. Be specific, concise, warm, and useful. Do not mention that you are an AI. Preserve the writer's intent.`;

  const userContext = `Title: ${title || 'Untitled'}\nGenre: ${genre || 'Unknown'}\n\nDraft:\n${text || '(empty draft)'}`;

  switch (action) {
    case 'opening':
      return {
        system: shared,
        user: `${userContext}\n\nRewrite or coach the opening so it becomes more emotionally compelling in 4-6 sentences.`,
      };
    case 'ending':
      return {
        system: shared,
        user: `${userContext}\n\nSuggest a stronger ending direction in 4-5 sentences, focused on emotional payoff.`,
      };
    case 'polish':
      return {
        system: shared,
        user: `${userContext}\n\nPolish the provided passage directly. Return only the improved text, keeping the meaning intact.`,
      };
    case 'character':
      return {
        system: shared,
        user: `${userContext}\n\nGenerate 3 concise character ideas with role, motivation, and inner wound.`,
      };
    default:
      return {
        system: shared,
        user: userContext,
      };
  }
};

export const generateWritingAssist = async ({
  action,
  text,
  genre,
  title,
}: {
  action: AssistAction;
  text: string;
  genre?: string;
  title?: string;
}) => {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return {
      output: localFallback({ action, text, genre, title }),
      provider: 'local-fallback',
    };
  }

  try {
    const prompt = buildPrompt({ action, text, genre, title });
    const response = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || 'gpt-4.1-mini',
        input: [
          { role: 'system', content: [{ type: 'input_text', text: prompt.system }] },
          { role: 'user', content: [{ type: 'input_text', text: prompt.user }] },
        ],
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI request failed with ${response.status}`);
    }

    const data = (await response.json()) as {
      output_text?: string;
      output?: Array<{ content?: Array<{ type?: string; text?: string }> }>;
    };

    const outputText =
      data.output_text ||
      data.output
        ?.flatMap((item) => item.content ?? [])
        .map((item) => item.text ?? '')
        .join('\n')
        .trim();

    if (!outputText) {
      throw new Error('OpenAI response did not contain output text');
    }

    return {
      output: outputText,
      provider: 'openai',
    };
  } catch {
    return {
      output: localFallback({ action, text, genre, title }),
      provider: 'local-fallback',
    };
  }
};

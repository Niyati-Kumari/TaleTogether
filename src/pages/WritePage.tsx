import type { ChangeEvent } from "react";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { WriterScoreCard } from "../components/WriterScoreCard";
import {
  analyzeWriting,
  generateCharacterIdeas,
  polishText,
  suggestEnding,
  suggestOpeningRewrite,
} from "../lib/analysis";
import {
  GENRES,
  type AiAssistResponse,
  type Challenge,
  type Story,
  type StoryDraft,
} from "../types";

interface WritePageProps {
  draft: StoryDraft;
  onDraftChange: (draft: StoryDraft) => void;
  onPublish: (draft: StoryDraft) => Promise<Story>;
  onUploadCover: (file: File) => Promise<string>;
  onAiAssist: (payload: {
    action: "opening" | "ending" | "polish" | "character";
    text: string;
    genre?: string;
    title?: string;
  }) => Promise<AiAssistResponse>;
  challenges: Challenge[];
  isAuthenticated: boolean;
}

const coverPresets = [
  "linear-gradient(135deg, #8b5cf6, #f59e0b)",
  "linear-gradient(135deg, #475569, #14b8a6)",
  "linear-gradient(135deg, #fb7185, #f97316)",
  "linear-gradient(135deg, #2563eb, #7c3aed)",
];

export const WritePage = ({
  draft,
  onDraftChange,
  onPublish,
  onUploadCover,
  onAiAssist,
  challenges,
  isAuthenticated,
}: WritePageProps) => {
  const navigate = useNavigate();
  const [selectedChapterIndex, setSelectedChapterIndex] = useState(0);
  const [assistantOutput, setAssistantOutput] = useState("");
  const [assistantSource, setAssistantSource] = useState<
    "openai" | "local-fallback" | "local-ui"
  >("local-ui");
  const [validationMessage, setValidationMessage] = useState("");
  const [aiBusy, setAiBusy] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [uploading, setUploading] = useState(false);

  const draftText = draft.chapters.map((chapter) => chapter.content).join(" ");
  const writerScore = useMemo(() => analyzeWriting(draftText), [draftText]);
  const characterIdeas = useMemo(
    () => generateCharacterIdeas(draft.title, draft.genre),
    [draft.genre, draft.title],
  );

  const updateDraft = (partial: Partial<StoryDraft>) => {
    onDraftChange({ ...draft, ...partial });
  };

  const updateChapter = (
    index: number,
    field: "title" | "content",
    value: string,
  ) => {
    const chapters = draft.chapters.map((chapter, chapterIndex) =>
      chapterIndex === index ? { ...chapter, [field]: value } : chapter,
    );

    updateDraft({ chapters });
  };

  const addChapter = () => {
    updateDraft({
      chapters: [
        ...draft.chapters,
        { title: `Chapter ${draft.chapters.length + 1}`, content: "" },
      ],
    });
    setSelectedChapterIndex(draft.chapters.length);
  };

  const removeChapter = (index: number) => {
    if (draft.chapters.length === 1) {
      return;
    }

    const chapters = draft.chapters.filter(
      (_, chapterIndex) => chapterIndex !== index,
    );
    updateDraft({ chapters });
    setSelectedChapterIndex(
      Math.max(
        0,
        selectedChapterIndex - (index <= selectedChapterIndex ? 1 : 0),
      ),
    );
  };

  const selectedChapter =
    draft.chapters[selectedChapterIndex] ?? draft.chapters[0];

  const setAssistant = (
    output: string,
    source: "openai" | "local-fallback" | "local-ui",
  ) => {
    setAssistantOutput(output);
    setAssistantSource(source);
  };

  const runAssist = async (
    action: "opening" | "ending" | "polish" | "character",
  ) => {
    if (!isAuthenticated) {
      if (action === "opening") {
        setAssistant(
          suggestOpeningRewrite(selectedChapter?.content ?? ""),
          "local-ui",
        );
      } else if (action === "ending") {
        setAssistant(suggestEnding(draftText, draft.genre), "local-ui");
      } else if (action === "character") {
        setAssistant(characterIdeas.join(" "), "local-ui");
      } else if (action === "polish") {
        if (!selectedChapter?.content.trim()) {
          setAssistant(
            "Write a few lines first, then ask for help polishing them.",
            "local-ui",
          );
          return;
        }

        const polished = polishText(selectedChapter.content);
        updateChapter(selectedChapterIndex, "content", polished);
        setAssistant(
          "I cleaned up the active chapter using the local writing helper. Sign in if you want deeper AI help.",
          "local-ui",
        );
      }
      return;
    }

    const sourceText =
      action === "polish"
        ? (selectedChapter?.content ?? "")
        : draftText || selectedChapter?.content || "";
    if (!sourceText.trim()) {
      setAssistant(
        "Write a little more first so the assistant has enough context to help you.",
        "local-ui",
      );
      return;
    }

    setAiBusy(true);

    try {
      const result = await onAiAssist({
        action,
        text: sourceText,
        genre: draft.genre,
        title: draft.title,
      });

      if (action === "polish") {
        updateChapter(selectedChapterIndex, "content", result.output);
        setAssistant(
          "I applied the assistant's improved version to your active chapter.",
          result.provider,
        );
      } else {
        setAssistant(result.output, result.provider);
      }
    } catch (error) {
      setAssistant(
        error instanceof Error ? error.message : "AI assistance failed.",
        "local-ui",
      );
    } finally {
      setAiBusy(false);
    }
  };

  const onCoverFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    if (!isAuthenticated) {
      setValidationMessage(
        "Sign in if you want to upload a cover image. You can still use the colour covers below.",
      );
      event.target.value = "";
      return;
    }

    setUploading(true);
    setValidationMessage("");

    try {
      const url = await onUploadCover(file);
      updateDraft({ coverImageUrl: url });
      setValidationMessage("Your cover image was uploaded.");
    } catch (error) {
      setValidationMessage(
        error instanceof Error ? error.message : "Cover upload failed.",
      );
    } finally {
      setUploading(false);
      event.target.value = "";
    }
  };

  const publish = async () => {
    if (!isAuthenticated) {
      navigate("/auth");
      return;
    }

    if (!draft.title.trim() || !draft.summary.trim()) {
      setValidationMessage(
        "Please add both a title and a short summary first.",
      );
      return;
    }

    if (writerScore.wordCount < 80) {
      setValidationMessage(
        "Please write at least 80 words so readers have something meaningful to enjoy.",
      );
      return;
    }

    setPublishing(true);

    try {
      const createdStory = await onPublish(draft);
      setValidationMessage("");

      if (createdStory.visibility === "private") {
        navigate("/profile/you");
        return;
      }

      navigate(`/story/${createdStory.id}`);
    } catch (error) {
      setValidationMessage(
        error instanceof Error ? error.message : "Unable to publish story.",
      );
    } finally {
      setPublishing(false);
    }
  };

  return (
    <div className="page-stack write-page-grid">
      <section className="panel editor-panel">
        <div className="section-heading">
          <div>
            <p className="eyebrow">story editor</p>
            <h2>Write your story in a few simple steps.</h2>
          </div>
          <div className="muted-small">
            {isAuthenticated
              ? "Your writing is saved locally while you work"
              : "You can draft first and sign in later to publish"}
          </div>
        </div>

        <div className="steps-grid editor-steps">
          <article className="step-card">
            <div className="step-topline">
              <div className="step-number">1</div>
              <div className="card-icon">🏷️</div>
            </div>
            <h4>Add the basics</h4>
            <p>
              Choose a title, genre, and short summary so readers know what the
              story is about.
            </p>
          </article>
          <article className="step-card">
            <div className="step-topline">
              <div className="step-number">2</div>
              <div className="card-icon">🎨</div>
            </div>
            <h4>Choose a cover</h4>
            <p>
              Pick a simple colour theme or upload an image if you want a custom
              look.
            </p>
          </article>
          <article className="step-card">
            <div className="step-topline">
              <div className="step-number">3</div>
              <div className="card-icon">✍️</div>
            </div>
            <h4>Write your chapter</h4>
            <p>
              Start small. One honest memory or one strong scene is enough for a
              first draft.
            </p>
          </article>
          <article className="step-card">
            <div className="step-topline">
              <div className="step-number">4</div>
              <div className="card-icon">🚀</div>
            </div>
            <h4>Save or publish</h4>
            <p>
              Keep it private if you are not ready yet, or publish it for
              readers when you are.
            </p>
          </article>
        </div>

        {!isAuthenticated ? (
          <div className="message-box info">
            You can write freely right now. Sign in only when you want to
            publish, upload a cover image, or use the full AI writing assistant.
          </div>
        ) : (
          <div className="message-box success">
            You are signed in. Your stories, likes, profile, and reading
            preferences are connected to your account.
          </div>
        )}

        <div className="form-grid two-columns">
          <label>
            <span>Title</span>
            <input
              value={draft.title}
              onChange={(event) => updateDraft({ title: event.target.value })}
              className="input"
              placeholder="Example: The day I finally felt brave"
            />
            <div className="field-hint">
              Keep it short and clear so someone understands it at a glance.
            </div>
          </label>
          <label>
            <span>Genre</span>
            <select
              value={draft.genre}
              onChange={(event) =>
                updateDraft({
                  genre: event.target.value as (typeof GENRES)[number],
                })
              }
              className="input"
            >
              {GENRES.map((genre) => (
                <option key={genre} value={genre}>
                  {genre}
                </option>
              ))}
            </select>
            <div className="field-hint">
              Choose the one that feels closest. It does not have to be perfect.
            </div>
          </label>
        </div>

        <label>
          <span>Summary</span>
          <textarea
            value={draft.summary}
            onChange={(event) => updateDraft({ summary: event.target.value })}
            className="textarea"
            rows={3}
            placeholder="In 1 or 2 lines, tell readers what this story is about"
          />
          <div className="field-hint">
            A summary is like a tiny invitation. One or two clear sentences are
            enough.
          </div>
        </label>

        <div className="form-grid three-columns">
          <label>
            <span>Tags</span>
            <input
              value={draft.tags.join(", ")}
              onChange={(event) =>
                updateDraft({
                  tags: event.target.value
                    .split(",")
                    .map((tag) => tag.trim())
                    .filter(Boolean),
                })
              }
              className="input"
              placeholder="memory, family, healing"
            />
            <div className="field-hint">
              Tags help readers find your story. Use simple topic words.
            </div>
          </label>
          <label>
            <span>Visibility</span>
            <select
              value={draft.visibility}
              onChange={(event) =>
                updateDraft({
                  visibility: event.target.value as "public" | "private",
                })
              }
              className="input"
            >
              <option value="public">Public</option>
              <option value="private">Private</option>
            </select>
            <div className="field-hint">
              Choose public if readers can see it. Choose private if it is just
              for you.
            </div>
          </label>
          <label>
            <span>Story type</span>
            <select
              value={draft.isPersonal ? "personal" : "fiction"}
              onChange={(event) =>
                updateDraft({ isPersonal: event.target.value === "personal" })
              }
              className="input"
            >
              <option value="personal">Personal / real life</option>
              <option value="fiction">Fiction</option>
            </select>
            <div className="field-hint">
              Pick personal for real memories and fiction for imagined stories.
            </div>
          </label>
        </div>

        <label>
          <span>Challenge (optional)</span>
          <select
            value={draft.challenge}
            onChange={(event) => updateDraft({ challenge: event.target.value })}
            className="input"
          >
            <option value="">No prompt selected</option>
            {challenges.map((challenge) => (
              <option key={challenge.id} value={challenge.title}>
                {challenge.title} • {challenge.cadence}
              </option>
            ))}
          </select>
          <div className="field-hint">
            Prompts are helpful if you want a simple starting idea.
          </div>
        </label>

        <div className="form-grid two-columns align-start">
          <div>
            <span className="label-title">Colour cover</span>
            <div className="cover-picker">
              {coverPresets.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  className={`cover-swatch ${draft.coverStyle === preset ? "active" : ""}`}
                  style={{ background: preset }}
                  onClick={() => updateDraft({ coverStyle: preset })}
                  aria-label="Choose cover colour"
                />
              ))}
            </div>
            <div className="field-hint">
              A colour cover is the easiest option if you want to move quickly.
            </div>
          </div>

          <label>
            <span>Upload cover image</span>
            <input
              type="file"
              accept="image/*"
              className="input"
              onChange={(event) => void onCoverFileChange(event)}
            />
            <div className="field-hint">
              {uploading
                ? "Uploading your image…"
                : draft.coverImageUrl
                  ? "Your image is ready."
                  : "This is optional. A simple colour cover works perfectly too."}
            </div>
          </label>
        </div>

        <div className="chapter-editor">
          <div className="section-heading compact">
            <div>
              <p className="eyebrow">chapters</p>
              <h3>Write your story</h3>
            </div>
            <button
              type="button"
              className="button-link secondary"
              onClick={addChapter}
            >
              + Add chapter
            </button>
          </div>

          <div className="chapter-tabs">
            {draft.chapters.map((chapter, index) => (
              <button
                key={`${chapter.title}-${index}`}
                type="button"
                className={`chapter-tab ${selectedChapterIndex === index ? "active" : ""}`}
                onClick={() => setSelectedChapterIndex(index)}
              >
                {chapter.title || `Chapter ${index + 1}`}
              </button>
            ))}
          </div>

          <label>
            <span>Chapter title</span>
            <input
              value={selectedChapter.title}
              onChange={(event) =>
                updateChapter(selectedChapterIndex, "title", event.target.value)
              }
              className="input"
              placeholder="Example: The first day"
            />
            <div className="field-hint">
              Give the chapter a simple name. It can be changed later.
            </div>
          </label>

          <label>
            <span>Chapter content</span>
            <textarea
              value={selectedChapter.content}
              onChange={(event) =>
                updateChapter(
                  selectedChapterIndex,
                  "content",
                  event.target.value,
                )
              }
              className="textarea chapter-textarea"
              rows={16}
              placeholder="Start with one moment, one memory, one image, or one feeling. You do not need to write perfectly on the first try."
            />
            <div className="field-hint">
              Good first drafts are often simple. Focus on honesty and clarity
              before polish.
            </div>
          </label>

          <div className="action-row split">
            <button
              type="button"
              className="button-link secondary"
              onClick={() => void runAssist("polish")}
            >
              {aiBusy ? "Working…" : "Make this chapter clearer"}
            </button>
            <button
              type="button"
              className="button-link ghost"
              onClick={() => removeChapter(selectedChapterIndex)}
            >
              Remove chapter
            </button>
          </div>
        </div>

        {validationMessage ? (
          <div className="message-box warning">{validationMessage}</div>
        ) : null}

        <div className="action-row split publish-row">
          <div className="muted-small">
            {writerScore.wordCount} words in your draft
          </div>
          <button
            type="button"
            className="button-link primary"
            onClick={() => void publish()}
            disabled={publishing}
          >
            {publishing
              ? "Publishing…"
              : !isAuthenticated
                ? "Sign in to publish"
                : draft.visibility === "private"
                  ? "Save as private draft"
                  : "Publish for readers"}
          </button>
        </div>
      </section>

      <aside className="write-sidebar">
        <WriterScoreCard score={writerScore} />

        <section className="panel">
          <div className="section-heading compact">
            <div>
              <p className="eyebrow">writing helper</p>
              <h3>Ask for simple support</h3>
            </div>
          </div>

          <p className="panel-intro">
            Click one button below. The suggestion will appear here so you can
            copy it, use it, or ignore it.
          </p>

          <div className="assistant-actions">
            <button
              type="button"
              className="button-link secondary full-width"
              onClick={() => void runAssist("opening")}
            >
              {aiBusy ? "Working…" : "Help me with the opening"}
            </button>
            <button
              type="button"
              className="button-link secondary full-width"
              onClick={() => void runAssist("ending")}
            >
              {aiBusy ? "Working…" : "Help me with the ending"}
            </button>
            <button
              type="button"
              className="button-link secondary full-width"
              onClick={() => void runAssist("character")}
            >
              {aiBusy ? "Working…" : "Give me character ideas"}
            </button>
          </div>

          <div className="assistant-output">
            <strong>Assistant output</strong>
            <p>
              {assistantOutput ||
                "You will see your suggestion here after clicking one of the buttons above."}
            </p>
            <div className="muted-small">
              Source:{" "}
              {assistantSource === "openai"
                ? "AI assistant"
                : assistantSource === "local-fallback"
                  ? "Built-in backup helper"
                  : "Local writing guide"}
            </div>
          </div>
        </section>

        <section className="panel">
          <div className="section-heading compact">
            <div>
              <p className="eyebrow">starter ideas</p>
              <h3>Character suggestions</h3>
            </div>
          </div>
          <ul className="suggestion-list">
            {characterIdeas.map((idea) => (
              <li key={idea}>{idea}</li>
            ))}
          </ul>
        </section>

        <section className="panel preview-card-panel">
          {draft.coverImageUrl ? (
            <img
              src={draft.coverImageUrl}
              alt={draft.title || "Story cover preview"}
              className="preview-image"
            />
          ) : (
            <div
              className="story-cover preview-cover"
              style={{ background: draft.coverStyle }}
            />
          )}
          <h3>{draft.title || "Untitled story"}</h3>
          <p>
            {draft.summary ||
              "Your story preview will appear here while you write."}
          </p>
          <div className="tag-row">
            {draft.tags.filter(Boolean).map((tag) => (
              <span key={tag} className="tag-chip">
                #{tag}
              </span>
            ))}
          </div>
        </section>
      </aside>
    </div>
  );
};

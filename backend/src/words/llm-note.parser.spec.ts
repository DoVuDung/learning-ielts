import { parseLlmNoteText } from './llm-note.parser';

describe('parseLlmNoteText', () => {
  it('returns empty array for empty or blank text', () => {
    expect(parseLlmNoteText('')).toEqual([]);
    expect(parseLlmNoteText('   ')).toEqual([]);
  });

  it('parses JSON array of notes', () => {
    const json = JSON.stringify([
      {
        word: 'ubiquitous',
        definition: 'present everywhere',
        context: 'Smartphones are ubiquitous.',
        tags: ['IELTS'],
      },
    ]);
    const res = parseLlmNoteText(json);
    expect(res).toHaveLength(1);
    expect(res[0].word).toBe('ubiquitous');
    expect(res[0].definition).toBe('present everywhere');
    expect(res[0].context).toBe('Smartphones are ubiquitous.');
    expect(res[0].tags).toEqual(['IELTS']);
  });

  it('parses Markdown table', () => {
    const md = `
| Word | Definition | Example |
|---|---|---|
| Ephemeral | Ngắn ngủi | Fame is ephemeral. |
    `;
    const res = parseLlmNoteText(md);
    expect(res).toHaveLength(1);
    expect(res[0].word).toBe('Ephemeral');
    expect(res[0].definition).toBe('Ngắn ngủi');
    expect(res[0].context).toBe('Fame is ephemeral.');
  });

  it('parses numbered list with definition and example', () => {
    const text = `
1. Ubiquitous (adj): có mặt khắp nơi - Example: Smartphones are ubiquitous nowadays.
2. Resilient - kiên cường
    `;
    const res = parseLlmNoteText(text);
    expect(res.length).toBeGreaterThanOrEqual(2);
    expect(res[0].word).toBe('Ubiquitous');
    expect(res[0].definition).toBe('có mặt khắp nơi');
    expect(res[0].context).toBe('Smartphones are ubiquitous nowadays.');
    expect(res[1].word).toBe('Resilient');
    expect(res[1].definition).toBe('kiên cường');
  });

  it('parses short lines as words without definition', () => {
    const text = `
- Ubiquitous
- Ephemeral
    `;
    const res = parseLlmNoteText(text);
    expect(res).toHaveLength(2);
    expect(res[0].word).toBe('Ubiquitous');
    expect(res[1].word).toBe('Ephemeral');
  });

  it('parses JSON inside markdown code block', () => {
    const text = `Here is the note:
\`\`\`json
[{"word": "eloquent", "meaning": "fluent or persuasive in speaking or writing"}]
\`\`\``;
    const res = parseLlmNoteText(text);
    expect(res).toHaveLength(1);
    expect(res[0].word).toBe('eloquent');
    expect(res[0].definition).toBe('fluent or persuasive in speaking or writing');
  });
});

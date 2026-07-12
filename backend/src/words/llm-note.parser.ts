export interface ParsedLlmNote {
  word: string;
  definition?: string;
  context?: string;
  tags?: string[];
}

export function parseLlmNoteText(rawText: string): ParsedLlmNote[] {
  if (!rawText || !rawText.trim()) return [];
  const trimmed = rawText.trim();

  // 1. Thử parse JSON trước (nếu LLM xuất ra dạng array JSON hoặc code block json)
  try {
    let jsonStr = trimmed;
    const jsonMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
    if (jsonMatch) {
      jsonStr = jsonMatch[1];
    }
    if (jsonStr.startsWith('[') && jsonStr.endsWith(']')) {
      const parsed = JSON.parse(jsonStr);
      if (Array.isArray(parsed)) {
        const results: ParsedLlmNote[] = [];
        for (const item of parsed) {
          if (item && typeof item === 'object' && item.word) {
            results.push({
              word: String(item.word).trim(),
              definition: item.definition || item.meaning ? String(item.definition || item.meaning).trim() : undefined,
              context: item.context || item.example ? String(item.context || item.example).trim() : undefined,
              tags: Array.isArray(item.tags) ? item.tags.map(String) : ['LLM Note'],
            });
          }
        }
        if (results.length > 0) return results;
      }
    }
  } catch {
    // Không phải JSON hợp lệ, tiếp tục parse định dạng văn bản / Markdown
  }

  const lines = trimmed.split(/\r?\n/);
  const results: ParsedLlmNote[] = [];

  // 2. Thử parse Markdown Table (| Word | Definition | Example |)
  const isTable = lines.some((l) => l.includes('|') && /\|.*\|/.test(l));
  if (isTable) {
    for (const line of lines) {
      if (line.trim().startsWith('|---') || line.trim().startsWith('| ---')) continue;
      if (/^\|\s*(word|từ vựng|từ)\s*\|/i.test(line.trim())) continue;

      const cells = line
        .split('|')
        .map((c) => c.trim())
        .filter((c, idx, arr) => idx > 0 && idx < arr.length - 1);

      if (cells.length >= 1 && cells[0]) {
        results.push({
          word: cells[0],
          definition: cells[1] || undefined,
          context: cells[2] || undefined,
          tags: ['LLM Note'],
        });
      }
    }
    if (results.length > 0) return results;
  }

  // 3. Parse theo danh sách (numbered / bullet list)
  // Ví dụ: "1. Ubiquitous (adj): có mặt khắp nơi - Example: Smartphones are ubiquitous."
  for (const line of lines) {
    const cleanedLine = line.replace(/^[0-9]+\.\s*|^[-*]\s*/, '').trim();
    if (!cleanedLine) continue;

    // Tách phần example / context nếu có từ khóa Example:, Ex:, Context:
    let mainPart = cleanedLine;
    let contextPart: string | undefined;

    const exMatch = cleanedLine.match(/(?:[-—|]\s*)?(?:Example|Ex|Ví dụ|Context)\s*:\s*(.+)$/i);
    if (exMatch) {
      contextPart = exMatch[1].trim();
      mainPart = cleanedLine.substring(0, exMatch.index).trim();
    }

    // Tách từ và định nghĩa bằng dấu ':' hoặc '-' hoặc '='
    const sepMatch = mainPart.match(/^([a-zA-Z0-9\s'-]+?)(?:\s*\([^)]*\))?\s*[:\-—=]\s*(.+)$/);
    if (sepMatch) {
      const word = sepMatch[1].trim();
      const def = sepMatch[2].trim();
      if (word && word.length <= 60) {
        results.push({
          word,
          definition: def,
          context: contextPart,
          tags: ['LLM Note'],
        });
        continue;
      }
    }

    // Nếu chỉ có từ đơn giản hoặc cụm từ < 4 từ
    const wordsCount = cleanedLine.split(/\s+/).length;
    if (wordsCount <= 4 && cleanedLine.length <= 40) {
      results.push({
        word: cleanedLine,
        tags: ['LLM Note'],
      });
    }
  }

  return results;
}

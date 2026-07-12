<script lang="ts">
  import { onMount } from 'svelte';
  import { fetchAdminUsers, importLlmNotesAdmin } from '$lib/api';
  import {
    Sparkles,
    BookOpen,
    Upload,
    CheckCircle2,
    AlertCircle,
    User,
    FileText,
    HelpCircle,
    Copy,
    RefreshCw,
  } from 'lucide-svelte';

  let users: Array<{ id: string; name: string; email: string }> = [];
  let selectedUserId = '';
  let rawText = `1. Ubiquitous (adj): có mặt ở khắp mọi nơi
   - Example: Smartphones are ubiquitous in modern society.
2. Ephemeral (adj): ngắn ngủi, phù du
   - Example: Fame in the digital era can be ephemeral.
3. Eloquent (adj): có tài hùng biện, lưu loát
   - Example: She delivered an eloquent speech on environmental protection.`;

  let loading = false;
  let importSuccessMessage = '';
  let errorMessage = '';

  onMount(async () => {
    try {
      users = await fetchAdminUsers();
      if (users && users.length > 0) {
        selectedUserId = users[0].id;
      }
    } catch (err: any) {
      console.error('Failed to load users:', err);
    }
  });

  async function handleImport() {
    errorMessage = '';
    importSuccessMessage = '';

    if (!selectedUserId) {
      errorMessage = 'Vui lòng chọn học viên nhận từ vựng.';
      return;
    }
    if (!rawText || !rawText.trim()) {
      errorMessage = 'Vui lòng dán nội dung từ vựng từ LLM Note.';
      return;
    }

    loading = true;
    try {
      const result = await importLlmNotesAdmin(selectedUserId, rawText);
      if (result && result.success) {
        importSuccessMessage = `🎉 Đã nhập thành công ${result.importedCount} từ vựng cùng 3 mẫu thẻ Flashcard FSRS-5 vào tài khoản học viên!`;
      } else {
        errorMessage = 'Không thể phân tích từ vựng từ văn bản trên. Vui lòng kiểm tra lại định dạng.';
      }
    } catch (err: any) {
      errorMessage = err?.message || 'Lỗi kết nối khi import từ vựng LLM.';
    } finally {
      loading = false;
    }
  }

  function insertTemplate(type: 'numbered' | 'table' | 'json') {
    if (type === 'numbered') {
      rawText = `1. Pragmatic (adj): thực tế, thực dụng
   - Example: We need a pragmatic solution to this problem.
2. Resilient (adj): kiên cường, mau phục hồi
   - Example: Children are remarkably resilient after hardship.`;
    } else if (type === 'table') {
      rawText = `| Word | Definition | Example |
|---|---|---|
| Meticulous | Tỉ mỉ, cẩn thận | He is meticulous about his research. |
| Benevolent | Nhân từ, tốt bụng | A benevolent donor supported our school. |`;
    } else if (type === 'json') {
      rawText = `[
  {
    "word": "Serendipity",
    "definition": "Sự tình cờ may mắn",
    "context": "Finding this old bookstore was pure serendipity.",
    "tags": ["IELTS Band 8", "Academic"]
  }
]`;
    }
  }
</script>

<div class="space-y-8">
  <!-- Header Banner -->
  <div class="p-6 rounded-2xl bg-gradient-to-r from-amber-500/10 via-purple-500/10 to-transparent border border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-6">
    <div class="space-y-2">
      <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-500/30 text-xs font-bold text-amber-400">
        <Sparkles class="size-3.5" />
        <span>LLM AI Smart Parser</span>
      </div>
      <h1 class="text-2xl font-black tracking-tight text-white">
        Nhập Từ Vựng Từ LLM Note (ChatGPT / Gemini / AI Notes)
      </h1>
      <p class="text-sm text-gray-400 max-w-2xl">
        Hệ thống tự động phân tích cấu trúc ghi chú từ LLM (danh sách đánh số, bảng Markdown hoặc JSON), tự động tạo từ điển và lập lịch lặp lại ngắt quãng theo thuật toán FSRS-5.
      </p>
    </div>
  </div>

  {#if importSuccessMessage}
    <div class="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center gap-3 text-emerald-400 text-sm font-semibold">
      <CheckCircle2 class="size-5 shrink-0" />
      <span>{importSuccessMessage}</span>
    </div>
  {/if}

  {#if errorMessage}
    <div class="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center gap-3 text-rose-400 text-sm font-semibold">
      <AlertCircle class="size-5 shrink-0" />
      <span>{errorMessage}</span>
    </div>
  {/if}

  <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
    <!-- Editor & Controls -->
    <div class="lg:col-span-2 space-y-6">
      <div class="p-6 rounded-2xl bg-[#12121a] border border-white/10 space-y-5">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <label class="text-sm font-bold text-white flex items-center gap-2">
            <FileText class="size-4 text-amber-400" />
            <span>Nội dung ghi chú LLM Note</span>
          </label>
          <div class="flex items-center gap-2">
            <span class="text-xs text-gray-400">Mẫu nhanh:</span>
            <button
              type="button"
              on:click={() => insertTemplate('numbered')}
              class="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-xs font-semibold text-gray-300 border border-white/10 transition"
            >
              Danh sách
            </button>
            <button
              type="button"
              on:click={() => insertTemplate('table')}
              class="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-xs font-semibold text-gray-300 border border-white/10 transition"
            >
              Bảng Table
            </button>
            <button
              type="button"
              on:click={() => insertTemplate('json')}
              class="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-xs font-semibold text-gray-300 border border-white/10 transition"
            >
              JSON
            </button>
          </div>
        </div>

        <textarea
          bind:value={rawText}
          rows="12"
          placeholder="Dán nội dung từ vựng xuất ra từ ChatGPT, Gemini hoặc phần mềm ghi chú vào đây..."
          class="w-full rounded-xl bg-black/40 border border-white/10 p-4 text-sm font-mono text-gray-200 placeholder-gray-600 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition leading-relaxed"
        ></textarea>

        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2 border-t border-white/10">
          <div class="flex items-center gap-2">
            <User class="size-4 text-gray-400" />
            <span class="text-xs font-medium text-gray-400">Chọn học viên nhận từ vựng:</span>
            <select
              bind:value={selectedUserId}
              class="px-3 py-1.5 rounded-xl bg-black/40 border border-white/10 text-xs font-semibold text-white focus:outline-none focus:border-amber-500"
            >
              {#each users as u}
                <option value={u.id}>{u.name} ({u.email})</option>
              {/each}
            </select>
          </div>

          <button
            type="button"
            on:click={handleImport}
            disabled={loading || !rawText}
            class="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 text-black font-extrabold text-sm shadow-lg shadow-amber-500/20 hover:scale-[1.02] active:scale-[0.98] transition disabled:opacity-50 disabled:pointer-events-none"
          >
            {#if loading}
              <RefreshCw class="size-4 animate-spin" />
              <span>Đang xử lý & Tạo thẻ...</span>
            {:else}
              <Upload class="size-4" />
              <span>Phân Tích & Import Vào FSRS</span>
            {/if}
          </button>
        </div>
      </div>
    </div>

    <!-- Instructions Sidebar -->
    <div class="space-y-6">
      <div class="p-6 rounded-2xl bg-[#12121a] border border-white/10 space-y-4">
        <h3 class="text-base font-bold text-white flex items-center gap-2">
          <HelpCircle class="size-4 text-amber-400" />
          <span>Hướng dẫn Prompt LLM</span>
        </h3>
        <p class="text-xs text-gray-400 leading-relaxed">
          Bạn có thể gửi prompt sau cho ChatGPT / Gemini / Claude để xuất ghi chú chuẩn nhất:
        </p>
        <div class="p-3.5 rounded-xl bg-black/50 border border-white/10 text-xs font-mono text-amber-300/90 select-all">
          "Trích xuất các từ vựng IELTS quan trọng trong bài học thành danh sách theo định dạng:
          1. [Từ vựng] (loại từ): [Nghĩa tiếng Việt] - Example: [Câu ví dụ mẫu]"
        </div>
        <ul class="space-y-2 text-xs text-gray-400">
          <li class="flex items-start gap-2">
            <span class="text-emerald-400 font-bold">✓</span>
            <span>Tự động tạo 3 loại thẻ: Nhìn từ đoán nghĩa, Nghe đoán từ, Nhìn nghĩa đoán từ.</span>
          </li>
          <li class="flex items-start gap-2">
            <span class="text-emerald-400 font-bold">✓</span>
            <span>Tích hợp trực tiếp với thuật toán lặp lại ngắt quãng FSRS-5.</span>
          </li>
        </ul>
      </div>
    </div>
  </div>
</div>

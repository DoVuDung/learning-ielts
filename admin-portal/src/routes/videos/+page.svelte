<script lang="ts">
  import { onMount } from 'svelte';
  import { fetchAdminVideos, createAdminVideo, updateAdminVideo, deleteAdminVideo } from '$lib/api';
  import { Video, Plus, Youtube, BookOpen, Layers, X, Edit3, Trash2 } from 'lucide-svelte';

  let videos: any[] = [];
  let loading = true;
  let error = '';

  // Add video modal
  let showModal = false;
  let formLoading = false;
  let formError = '';
  let youtubeId = '';
  let title = '';
  let category = 'ielts';
  let level = 'B2';

  async function loadVideos() {
    loading = true;
    error = '';
    try {
      videos = await fetchAdminVideos();
    } catch (err: any) {
      error = err.message || 'Lỗi khi tải danh sách video';
    } finally {
      loading = false;
    }
  }

  onMount(() => {
    loadVideos();
  });

  async function handleAddVideo(e: Event) {
    e.preventDefault();
    if (!youtubeId || !title) {
      formError = 'Vui lòng nhập đầy đủ YouTube ID và tiêu đề';
      return;
    }
    formLoading = true;
    formError = '';
    try {
      await createAdminVideo({ youtubeId, title, category, level });
      showModal = false;
      youtubeId = '';
      title = '';
      await loadVideos();
    } catch (err: any) {
      formError = err.message || 'Lỗi khi thêm bài học video';
    } finally {
      formLoading = false;
    }
  }

  // Filter & Search
  let filterCat = 'ALL';
  let searchQuery = '';

  $: filteredVideos = videos.filter((vid) => {
    if (filterCat !== 'ALL' && vid.category !== filterCat) return false;
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      vid.title?.toLowerCase().includes(q) ||
      vid.youtubeId?.toLowerCase().includes(q)
    );
  });

  // Edit Video Modal
  let editingVideo: any = null;
  let editTitle = '';
  let editCategory = '';
  let editLevel = '';
  let editLoading = false;

  function handleOpenEdit(vid: any) {
    editingVideo = vid;
    editTitle = vid.title;
    editCategory = vid.category;
    editLevel = vid.level;
  }

  async function handleUpdateVideo(e: Event) {
    e.preventDefault();
    if (!editingVideo) return;
    editLoading = true;
    try {
      await updateAdminVideo(editingVideo.id, {
        title: editTitle,
        category: editCategory,
        level: editLevel,
      });
      editingVideo = null;
      await loadVideos();
    } catch (err: any) {
      alert('Lỗi cập nhật video: ' + err.message);
    } finally {
      editLoading = false;
    }
  }

  async function handleDeleteVideo(vid: any) {
    if (!confirm(`Bạn có chắc chắn muốn xoá video "${vid.title}" cùng toàn bộ câu subtitle của video này?`)) return;
    try {
      await deleteAdminVideo(vid.id);
      await loadVideos();
    } catch (err: any) {
      alert('Lỗi xoá video: ' + err.message);
    }
  }
</script>

<div class="space-y-6">
  <div class="flex items-center justify-between">
    <div>
      <h2 class="text-2xl font-black tracking-tight text-white">Quản Lý Thư Viện Bài Học Video</h2>
      <p class="text-sm text-gray-400 mt-1">
        Thêm mới và quản lý kho video luyện nghe Dictation & luyện nói Shadowing IELTS V3
      </p>
    </div>

    <button
      on:click={() => (showModal = true)}
      class="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-600 hover:to-yellow-500 font-bold text-black text-sm transition-colors shadow-lg shadow-amber-500/20"
    >
      <Plus class="size-4" />
      <span>Thêm Video Mới</span>
    </button>
  </div>

  <!-- Filter & Search Bar -->
  <div class="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 p-4 rounded-2xl bg-[#12121a] border border-white/10">
    <div class="flex flex-wrap items-center gap-2">
      <button
        on:click={() => (filterCat = 'ALL')}
        class="px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all {filterCat === 'ALL'
          ? 'bg-amber-500 text-black shadow-md'
          : 'bg-white/5 text-gray-400 hover:text-white'}"
      >
        Tất cả
      </button>
      <button
        on:click={() => (filterCat = 'ielts')}
        class="px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all {filterCat === 'ielts'
          ? 'bg-amber-500 text-black shadow-md'
          : 'bg-white/5 text-gray-400 hover:text-white'}"
      >
        IELTS
      </button>
      <button
        on:click={() => (filterCat = 'ted')}
        class="px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all {filterCat === 'ted'
          ? 'bg-amber-500 text-black shadow-md'
          : 'bg-white/5 text-gray-400 hover:text-white'}"
      >
        TED Talks
      </button>
      <button
        on:click={() => (filterCat = 'news')}
        class="px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all {filterCat === 'news'
          ? 'bg-amber-500 text-black shadow-md'
          : 'bg-white/5 text-gray-400 hover:text-white'}"
      >
        News
      </button>
    </div>

    <div class="relative w-full sm:w-72">
      <input
        type="text"
        bind:value={searchQuery}
        placeholder="Tìm theo Tiêu đề hoặc YouTube ID..."
        class="w-full bg-[#0a0a0f] border border-white/15 rounded-xl px-3.5 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-amber-500"
      />
    </div>
  </div>

  {#if loading}
    <div class="p-12 text-center text-gray-400">Đang tải thư viện bài học...</div>
  {:else if error}
    <div class="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-sm">
      {error}
    </div>
  {:else}
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {#if filteredVideos.length === 0}
        <div class="col-span-3 p-12 text-center text-gray-400 rounded-2xl bg-[#12121a] border border-white/10">
          Không tìm thấy video bài học nào phù hợp bộ lọc.
        </div>
      {:else}
        {#each filteredVideos as vid}
          <div
            class="rounded-2xl bg-[#12121a] border border-white/10 overflow-hidden flex flex-col justify-between hover:border-amber-500/30 transition-all group"
          >
            <div>
              <!-- Thumbnail header -->
              <div class="relative h-44 bg-black/40 overflow-hidden">
                <img
                  src={`https://i.ytimg.com/vi/${vid.youtubeId}/hqdefault.jpg`}
                  alt={vid.title}
                  class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div class="absolute top-3 left-3 flex items-center gap-1.5">
                  <span
                    class="px-2.5 py-1 rounded-full bg-black/70 backdrop-blur-md border border-white/15 text-[11px] font-bold text-amber-400 uppercase"
                  >
                    Level {vid.level}
                  </span>
                  <span
                    class="px-2.5 py-1 rounded-full bg-black/70 backdrop-blur-md border border-white/15 text-[11px] font-semibold text-gray-300"
                  >
                    {vid.category}
                  </span>
                </div>
              </div>

              <!-- Title & info -->
              <div class="p-5 space-y-2">
                <h3 class="font-bold text-white line-clamp-2 text-base group-hover:text-amber-400 transition-colors">
                  {vid.title}
                </h3>
                <div class="flex items-center justify-between text-xs text-gray-400 pt-2">
                  <span>YouTube ID: <strong class="text-gray-300 font-mono">{vid.youtubeId}</strong></span>
                  <span>Câu: <strong class="text-amber-400">{vid._count?.sentences || 0}</strong></span>
                </div>
              </div>
            </div>

            <div class="p-4 border-t border-white/10 bg-white/[0.01] flex items-center justify-between">
              <a
                href={`https://youtube.com/watch?v=${vid.youtubeId}`}
                target="_blank"
                rel="noopener noreferrer"
                class="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-400 hover:text-white transition-colors"
              >
                <Youtube class="size-3.5 text-red-500" />
                <span>Xem</span>
              </a>

              <div class="flex items-center gap-2">
                <button
                  on:click={() => handleOpenEdit(vid)}
                  class="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-xs text-gray-300 transition-colors"
                  title="Sửa video"
                >
                  Sửa
                </button>
                <button
                  on:click={() => handleDeleteVideo(vid)}
                  class="px-2.5 py-1 rounded-lg bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-xs text-red-400 transition-colors"
                  title="Xoá video"
                >
                  Xoá
                </button>
              </div>
            </div>
          </div>
        {/each}
      {/if}
    </div>
  {/if}

  <!-- Modal Add Video -->
  {#if showModal}
    <div
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
    >
      <div
        class="w-full max-w-md rounded-2xl bg-[#12121a] border border-white/15 p-6 shadow-2xl space-y-6"
      >
        <div class="flex items-center justify-between border-b border-white/10 pb-4">
          <h3 class="font-bold text-lg text-white flex items-center gap-2">
            <Video class="size-5 text-amber-400" />
            <span>Thêm Bài Học Video Mới</span>
          </h3>
          <button
            on:click={() => (showModal = false)}
            class="text-gray-400 hover:text-white transition-colors"
          >
            <X class="size-5" />
          </button>
        </div>

        <form on:submit={handleAddVideo} class="space-y-4">
          <div>
            <label class="block text-xs font-semibold text-gray-400 uppercase mb-2">
              YouTube Video ID (Ví dụ: dQw4w9WgXcQ)
            </label>
            <input
              type="text"
              bind:value={youtubeId}
              required
              placeholder="dQw4w9WgXcQ"
              class="w-full bg-[#0a0a0f] border border-white/15 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-amber-500"
            />
          </div>

          <div>
            <label class="block text-xs font-semibold text-gray-400 uppercase mb-2">
              Tiêu Đề Bài Học
            </label>
            <input
              type="text"
              bind:value={title}
              required
              placeholder="IELTS Speaking Band 8.5 Model Answer..."
              class="w-full bg-[#0a0a0f] border border-white/15 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-amber-500"
            />
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-xs font-semibold text-gray-400 uppercase mb-2">
                Chuyên Mục
              </label>
              <select
                bind:value={category}
                class="w-full bg-[#0a0a0f] border border-white/15 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-amber-500"
              >
                <option value="ielts">IELTS Academic</option>
                <option value="speaking">Speaking Practice</option>
                <option value="listening">Listening Dictation</option>
                <option value="general">English General</option>
              </select>
            </div>

            <div>
              <label class="block text-xs font-semibold text-gray-400 uppercase mb-2">
                Trình Độ (Level)
              </label>
              <select
                bind:value={level}
                class="w-full bg-[#0a0a0f] border border-white/15 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-amber-500"
              >
                <option value="A2">Band 4.0 - 5.0 (A2)</option>
                <option value="B1">Band 5.5 - 6.0 (B1)</option>
                <option value="B2">Band 6.5 - 7.0 (B2)</option>
                <option value="C1">Band 7.5 - 8.5 (C1)</option>
              </select>
            </div>
          </div>

          {#if formError}
            <div class="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs">
              {formError}
            </div>
          {/if}

            <div class="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                on:click={() => (showModal = false)}
                class="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-semibold text-gray-300 transition-colors"
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={formLoading}
                class="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-600 hover:to-yellow-500 font-bold text-black text-xs transition-colors"
              >
                {formLoading ? 'Đang thêm...' : 'Thêm Vào Thư Viện'}
              </button>
            </div>
          </form>
        </div>
      </div>
  {/if}

  <!-- Modal Edit Video -->
  {#if editingVideo}
    <div
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
    >
      <div
        class="w-full max-w-md rounded-2xl bg-[#12121a] border border-white/15 p-6 shadow-2xl space-y-6"
      >
        <div class="flex items-center justify-between border-b border-white/10 pb-4">
          <h3 class="font-bold text-lg text-white">Cập Nhật Bài Học Video</h3>
          <button
            on:click={() => (editingVideo = null)}
            class="text-gray-400 hover:text-white transition-colors"
          >
            <X class="size-5" />
          </button>
        </div>

        <form on:submit={handleUpdateVideo} class="space-y-4">
          <div>
            <label class="block text-xs font-semibold text-gray-400 uppercase mb-2">
              Tiêu Đề Video
            </label>
            <input
              type="text"
              bind:value={editTitle}
              class="w-full bg-[#0a0a0f] border border-white/15 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500"
              required
            />
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-xs font-semibold text-gray-400 uppercase mb-2">
                Chủ Đề (Category)
              </label>
              <select
                bind:value={editCategory}
                class="w-full bg-[#0a0a0f] border border-white/15 rounded-xl p-2.5 text-sm text-white focus:outline-none focus:border-amber-500"
              >
                <option value="ielts">IELTS</option>
                <option value="ted">TED Talks</option>
                <option value="news">News</option>
                <option value="story">Story</option>
              </select>
            </div>

            <div>
              <label class="block text-xs font-semibold text-gray-400 uppercase mb-2">
                Cấp Độ (Level)
              </label>
              <select
                bind:value={editLevel}
                class="w-full bg-[#0a0a0f] border border-white/15 rounded-xl p-2.5 text-sm text-white focus:outline-none focus:border-amber-500"
              >
                <option value="A2">A2 (Cơ bản)</option>
                <option value="B1">B1 (Trung cấp)</option>
                <option value="B2">B2 (Khá)</option>
                <option value="C1">C1 (Nâng cao)</option>
              </select>
            </div>
          </div>

          <div class="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              on:click={() => (editingVideo = null)}
              class="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-semibold text-gray-300 transition-colors"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={editLoading}
              class="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-600 hover:to-yellow-500 font-bold text-black text-xs transition-colors"
            >
              {editLoading ? 'Đang lưu...' : 'Lưu Thay Đổi'}
            </button>
          </div>
        </form>
      </div>
    </div>
  {/if}
</div>

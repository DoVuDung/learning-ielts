<script lang="ts">
  import '../app.css';
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  import {
    LayoutDashboard,
    Users,
    Receipt,
    Video,
    ShieldAlert,
    ExternalLink,
    Crown,
    Sparkles,
    Key,
  } from 'lucide-svelte';
  import { getAccessToken, setAccessToken, clearAccessToken } from '$lib/api';

  const navItems = [
    { href: '/', label: 'Tổng Quan KPI', icon: LayoutDashboard },
    { href: '/users', label: 'Quản Lý Học Viên & CSKH', icon: Users },
    { href: '/transactions', label: 'Giao Dịch VietQR / ACID', icon: Receipt },
    { href: '/videos', label: 'Thư Viện Bài Học Video', icon: Video },
    { href: '/llm-notes', label: 'Import LLM Notes (AI)', icon: Sparkles },
  ];

  let showTokenModal = false;
  let tokenInput = '';
  let currentToken = '';

  onMount(() => {
    currentToken = getAccessToken() || '';
    tokenInput = currentToken;
  });

  function handleSaveToken() {
    setAccessToken(tokenInput);
    currentToken = tokenInput.trim();
    showTokenModal = false;
  }

  function handleClearToken() {
    clearAccessToken();
    tokenInput = '';
    currentToken = '';
    showTokenModal = false;
  }
</script>

<div class="flex h-screen overflow-hidden bg-[#0a0a0f] text-gray-100">
  <!-- Sidebar -->
  <aside
    class="w-64 border-r border-white/10 bg-[#12121a]/80 backdrop-blur-xl flex flex-col justify-between shrink-0"
  >
    <div class="p-6 space-y-8">
      <!-- Brand logo -->
      <div class="flex items-center gap-3">
        <div
          class="size-10 rounded-2xl bg-gradient-to-tr from-amber-500 to-yellow-400 flex items-center justify-center shadow-lg shadow-amber-500/20 text-black font-extrabold text-xl"
        >
          B
        </div>
        <div>
          <h1 class="text-base font-black tracking-tight text-white flex items-center gap-1.5">
            BapEnglish
            <span
              class="px-2 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/30 text-[10px] font-bold text-amber-400"
            >
              ADMIN
            </span>
          </h1>
          <p class="text-[11px] text-gray-400">Support & CSKH Portal V3</p>
        </div>
      </div>

      <!-- Nav Menu -->
      <nav class="space-y-1.5">
        {#each navItems as item}
          <a
            href={item.href}
            class="flex items-center gap-3 px-3.5 py-3 rounded-xl text-sm font-semibold transition-all {$page.url.pathname === item.href
              ? 'bg-gradient-to-r from-amber-500/20 to-transparent border-l-4 border-amber-500 text-amber-400 shadow-sm'
              : 'text-gray-400 hover:text-white hover:bg-white/5'}"
          >
            <item.icon class="size-4 shrink-0" />
            <span>{item.label}</span>
          </a>
        {/each}
      </nav>
    </div>

    <!-- Bottom support badge -->
    <div class="p-5 border-t border-white/10 bg-white/[0.02]">
      <div class="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 space-y-2">
        <div class="flex items-center gap-2 text-xs font-bold text-amber-400">
          <Sparkles class="size-3.5" />
          <span>ACID & VietQR Sync</span>
        </div>
        <p class="text-[11px] text-gray-400 leading-relaxed">
          Kết nối trực tiếp API Backend NestJS (Cổng 3001) với chế độ Serializable an toàn.
        </p>
      </div>
    </div>
  </aside>

  <!-- Main content wrapper -->
  <div class="flex-1 flex flex-col min-w-0 overflow-hidden">
    <!-- Top Header -->
    <header
      class="h-16 border-b border-white/10 bg-[#12121a]/60 backdrop-blur-md px-8 flex items-center justify-between shrink-0"
    >
      <div class="flex items-center gap-2 text-sm text-gray-400">
        <span class="font-medium text-white">Hệ thống quản trị học viện</span>
        <span>/</span>
        <span class="text-amber-400 font-semibold">
          {navItems.find((i) => i.href === $page.url.pathname)?.label || 'Bảng điều khiển'}
        </span>
      </div>

      <div class="flex items-center gap-4">
        <button
          type="button"
          on:click={() => (showTokenModal = true)}
          class="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl {currentToken
            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
            : 'bg-amber-500/10 border-amber-500/30 text-amber-400'} border text-xs font-semibold transition-colors"
        >
          <Key class="size-3.5" />
          <span>{currentToken ? 'Token Active' : 'Cấu hình Token'}</span>
        </button>
        <a
          href="http://localhost:3000"
          target="_blank"
          rel="noopener noreferrer"
          class="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-gray-300 transition-colors"
        >
          <span>Mở Client Web App</span>
          <ExternalLink class="size-3.5" />
        </a>
      </div>
    </header>

    <!-- Main scrollable page -->
    <main class="flex-1 overflow-y-auto p-8">
      <div class="max-w-6xl mx-auto">
        <slot />
      </div>
    </main>
  </div>
</div>

{#if showTokenModal}
  <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
    <div class="w-full max-w-md rounded-2xl border border-white/10 bg-[#161622] p-6 shadow-2xl space-y-4">
      <div class="flex items-center justify-between">
        <h3 class="text-base font-bold text-white flex items-center gap-2">
          <Key class="size-4 text-amber-400" />
          <span>Cấu hình Bearer Token (JWT)</span>
        </h3>
        <button
          type="button"
          on:click={() => (showTokenModal = false)}
          class="text-gray-400 hover:text-white text-sm"
        >
          ✕
        </button>
      </div>
      <p class="text-xs text-gray-400 leading-relaxed">
        Nhập JWT Access Token có quyền ADMIN (lấy từ Client Web App sau khi đăng nhập) để gửi kèm trong Header <code class="text-amber-400">Authorization: Bearer &lt;token&gt;</code> cho mọi yêu cầu API.
      </p>
      <div>
        <textarea
          bind:value={tokenInput}
          rows="4"
          placeholder="eyJhbGciOiJIUzI1NiIsIn..."
          class="w-full rounded-xl border border-white/10 bg-black/40 p-3 text-xs font-mono text-white focus:border-amber-500 focus:outline-none"
        ></textarea>
      </div>
      <div class="flex items-center justify-between pt-2">
        <button
          type="button"
          on:click={handleClearToken}
          class="px-4 py-2 rounded-xl border border-rose-500/30 bg-rose-500/10 text-xs font-semibold text-rose-400 hover:bg-rose-500/20 transition-colors"
        >
          Xoá Token
        </button>
        <div class="flex items-center gap-2">
          <button
            type="button"
            on:click={() => (showTokenModal = false)}
            class="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-semibold text-gray-300 transition-colors"
          >
            Hủy
          </button>
          <button
            type="button"
            on:click={handleSaveToken}
            class="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-xs font-bold text-black transition-colors"
          >
            Lưu Token
          </button>
        </div>
      </div>
    </div>
  </div>
{/if}

<script lang="ts">
  import { onMount } from 'svelte';
  import { fetchAdminStats } from '$lib/api';
  import { Users, Crown, Video, DollarSign, ArrowUpRight, CheckCircle2, Clock } from 'lucide-svelte';

  let stats: any = null;
  let loading = true;
  let error = '';

  onMount(async () => {
    try {
      stats = await fetchAdminStats();
    } catch (err: any) {
      error = err.message || 'Không thể tải thống kê KPI';
    } finally {
      loading = false;
    }
  });

  function formatVnd(amount: number) {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  }
</script>

<div class="space-y-8">
  <div class="flex items-center justify-between">
    <div>
      <h2 class="text-2xl font-black tracking-tight text-white">Tổng Quan Hoạt Động IELTS V3</h2>
      <p class="text-sm text-gray-400 mt-1">
        Dữ liệu thời gian thực được đồng bộ từ Cơ sở dữ liệu PostgreSQL & Giao dịch ACID
      </p>
    </div>
  </div>

  {#if loading}
    <div class="grid grid-cols-1 md:grid-cols-4 gap-6 animate-pulse">
      {#each Array(4) as _}
        <div class="h-32 rounded-2xl bg-white/5 border border-white/10" />
      {/each}
    </div>
  {:else if error}
    <div class="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-sm">
      {error}
    </div>
  {:else if stats}
    <!-- KPI Cards -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      <div class="p-6 rounded-2xl bg-[#12121a] border border-white/10 space-y-3">
        <div class="flex items-center justify-between">
          <span class="text-xs font-bold text-gray-400 uppercase tracking-wider">Tổng Học Viên</span>
          <div class="p-2.5 rounded-xl bg-blue-500/10 text-blue-400">
            <Users class="size-5" />
          </div>
        </div>
        <div class="text-3xl font-black text-white">{stats.totalUsers.toLocaleString('vi-VN')}</div>
        <p class="text-xs text-emerald-400 font-semibold flex items-center gap-1">
          <span>+100% Hoạt động</span>
        </p>
      </div>

      <div class="p-6 rounded-2xl bg-[#12121a] border border-amber-500/30 space-y-3">
        <div class="flex items-center justify-between">
          <span class="text-xs font-bold text-amber-400 uppercase tracking-wider">Học Viên PRO</span>
          <div class="p-2.5 rounded-xl bg-amber-500/10 text-amber-400">
            <Crown class="size-5" />
          </div>
        </div>
        <div class="text-3xl font-black text-white">{stats.premiumUsers.toLocaleString('vi-VN')}</div>
        <p class="text-xs text-amber-400/80 font-semibold">Quyền lợi VIP ACID</p>
      </div>

      <div class="p-6 rounded-2xl bg-[#12121a] border border-white/10 space-y-3">
        <div class="flex items-center justify-between">
          <span class="text-xs font-bold text-gray-400 uppercase tracking-wider">Bài Học Video</span>
          <div class="p-2.5 rounded-xl bg-purple-500/10 text-purple-400">
            <Video class="size-5" />
          </div>
        </div>
        <div class="text-3xl font-black text-white">{stats.totalVideos.toLocaleString('vi-VN')}</div>
        <p class="text-xs text-gray-400 font-semibold">Thư viện Dictation/Shadowing</p>
      </div>

      <div class="p-6 rounded-2xl bg-[#12121a] border border-white/10 space-y-3">
        <div class="flex items-center justify-between">
          <span class="text-xs font-bold text-gray-400 uppercase tracking-wider">Doanh Thu VietQR</span>
          <div class="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400">
            <DollarSign class="size-5" />
          </div>
        </div>
        <div class="text-2xl font-black text-emerald-400">{formatVnd(stats.totalRevenue)}</div>
        <p class="text-xs text-gray-400 font-semibold">Tự động đối soát ACID</p>
      </div>
    </div>

    <!-- Recent Transactions Table -->
    <div class="rounded-2xl bg-[#12121a] border border-white/10 overflow-hidden">
      <div class="p-6 border-b border-white/10 flex items-center justify-between">
        <div>
          <h3 class="text-base font-bold text-white">Giao Dịch Nâng Cấp Gần Đây</h3>
          <p class="text-xs text-gray-400 mt-0.5">Lịch sử giao dịch VietQR Napas247 / ACID Serializable</p>
        </div>
      </div>

      <div class="overflow-x-auto">
        <table class="w-full text-left border-collapse">
          <thead>
            <tr class="border-b border-white/10 text-xs text-gray-400 uppercase">
              <th class="p-4 font-semibold">Mã Đơn Hàng</th>
              <th class="p-4 font-semibold">Học Viên</th>
              <th class="p-4 font-semibold">Gói Dịch Vụ</th>
              <th class="p-4 font-semibold">Số Tiền</th>
              <th class="p-4 font-semibold">Trạng Thái</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-white/5 text-sm">
            {#if stats.recentTransactions.length === 0}
              <tr>
                <td colspan="5" class="p-8 text-center text-gray-400">
                  Chưa có giao dịch nâng cấp nào được ghi nhận.
                </td>
              </tr>
            {:else}
              {#each stats.recentTransactions as tx}
                <tr class="hover:bg-white/[0.02] transition-colors">
                  <td class="p-4 font-mono font-bold text-amber-400">{tx.orderId}</td>
                  <td class="p-4">
                    <div class="font-medium text-white">{tx.user?.name || 'Học viên'}</div>
                    <div class="text-xs text-gray-400">{tx.user?.email || ''}</div>
                  </td>
                  <td class="p-4 text-gray-300">{tx.plan}</td>
                  <td class="p-4 font-bold text-emerald-400">{formatVnd(tx.amount)}</td>
                  <td class="p-4">
                    <span
                      class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold {tx.status ===
                      'SUCCESS'
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'}"
                    >
                      {#if tx.status === 'SUCCESS'}
                        <CheckCircle2 class="size-3.5" />
                        <span>Thành công</span>
                      {:else}
                        <Clock class="size-3.5" />
                        <span>Đang xử lý</span>
                      {/if}
                    </span>
                  </td>
                </tr>
              {/each}
            {/if}
          </tbody>
        </table>
      </div>
    </div>
  {/if}
</div>

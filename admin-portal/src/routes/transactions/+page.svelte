<script lang="ts">
  import { onMount } from 'svelte';
  import { fetchAdminTransactions, approveTransaction } from '$lib/api';
  import { Receipt, CheckCircle2, Clock, AlertCircle, RefreshCw } from 'lucide-svelte';

  let transactions: any[] = [];
  let loading = true;
  let error = '';
  let approvingId: string | null = null;

  async function loadTransactions() {
    loading = true;
    error = '';
    try {
      transactions = await fetchAdminTransactions();
    } catch (err: any) {
      error = err.message || 'Không thể tải danh sách giao dịch';
    } finally {
      loading = false;
    }
  }

  onMount(() => {
    loadTransactions();
  });

  async function handleManualApprove(orderId: string) {
    if (!confirm(`Xác nhận duyệt thủ công đơn hàng VietQR ${orderId}?`)) return;
    approvingId = orderId;
    try {
      const res = await approveTransaction(orderId);
      alert(
        res.idempotent
          ? `Giao dịch ${orderId} đã thành công trước đó (Idempotent check).`
          : `Đã duyệt thành công đơn hàng ${orderId} và cộng ngày PRO cho học viên!`,
      );
      await loadTransactions();
    } catch (err: any) {
      alert('Lỗi duyệt giao dịch: ' + err.message);
    } finally {
      approvingId = null;
    }
  }

  function formatVnd(amount: number) {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  }
</script>

<div class="space-y-6">
  <div class="flex items-center justify-between">
    <div>
      <h2 class="text-2xl font-black tracking-tight text-white">Quản Lý Giao Dịch VietQR & ACID</h2>
      <p class="text-sm text-gray-400 mt-1">
        Đối soát toàn bộ mã giao dịch thanh toán Napas247, khóa Serializable bảo đảm 100% không trùng lặp
      </p>
    </div>

    <button
      on:click={loadTransactions}
      class="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-gray-200 transition-colors"
    >
      <RefreshCw class="size-3.5" />
      <span>Làm Mới Dữ Liệu</span>
    </button>
  </div>

  {#if loading}
    <div class="p-12 text-center text-gray-400">Đang tải danh sách giao dịch...</div>
  {:else if error}
    <div class="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-sm">
      {error}
    </div>
  {:else}
    <div class="rounded-2xl bg-[#12121a] border border-white/10 overflow-hidden">
      <table class="w-full text-left border-collapse">
        <thead>
          <tr class="border-b border-white/10 text-xs text-gray-400 uppercase">
            <th class="p-4 font-semibold">Mã Đơn Hàng (OrderId)</th>
            <th class="p-4 font-semibold">Học Viên</th>
            <th class="p-4 font-semibold">Gói Nâng Cấp</th>
            <th class="p-4 font-semibold">Thời Gian PRO</th>
            <th class="p-4 font-semibold">Số Tiền</th>
            <th class="p-4 font-semibold">Trạng Thái</th>
            <th class="p-4 font-semibold text-right">Thao Tác Đối Soát</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-white/5 text-sm">
          {#if transactions.length === 0}
            <tr>
              <td colspan="7" class="p-8 text-center text-gray-400">
                Chưa có đơn hàng thanh toán nào trong hệ thống.
              </td>
            </tr>
          {:else}
            {#each transactions as tx}
              <tr class="hover:bg-white/[0.02] transition-colors">
                <td class="p-4 font-mono font-bold text-amber-400">{tx.orderId}</td>
                <td class="p-4">
                  <div class="font-bold text-white">{tx.user?.name || 'Học viên'}</div>
                  <div class="text-xs text-gray-400">{tx.user?.email || ''}</div>
                </td>
                <td class="p-4 text-gray-300 font-semibold">{tx.plan}</td>
                <td class="p-4 text-xs text-gray-400">+{tx.durationDays} ngày</td>
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
                      <span>Chờ thanh toán</span>
                    {/if}
                  </span>
                </td>
                <td class="p-4 text-right">
                  {#if tx.status !== 'SUCCESS'}
                    <button
                      on:click={() => handleManualApprove(tx.orderId)}
                      disabled={approvingId === tx.orderId}
                      class="px-3 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-xs font-bold transition-colors"
                    >
                      {approvingId === tx.orderId ? 'Đang duyệt ACID...' : 'Duyệt Thủ Công'}
                    </button>
                  {:else}
                    <span class="text-xs text-gray-500 italic">Đã đối soát</span>
                  {/if}
                </td>
              </tr>
            {/each}
          {/if}
        </tbody>
      </table>
    </div>
  {/if}
</div>

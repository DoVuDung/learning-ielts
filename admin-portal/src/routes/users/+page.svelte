<script lang="ts">
  import { onMount } from 'svelte';
  import { fetchAdminUsers, updateUserPremium, updateUserRole, deleteAdminUser } from '$lib/api';
  import { Search, Crown, Shield, UserCheck, AlertCircle, X, Check, Trash2 } from 'lucide-svelte';

  let users: any[] = [];
  let searchQuery = '';
  let loading = true;
  let error = '';

  // Modal support state
  let selectedUser: any = null;
  let extendDays = 30;
  let modalLoading = false;
  let modalMessage = '';

  async function loadUsers() {
    loading = true;
    error = '';
    try {
      users = await fetchAdminUsers(searchQuery);
    } catch (err: any) {
      error = err.message || 'Lỗi khi tải danh sách học viên';
    } finally {
      loading = false;
    }
  }

  onMount(() => {
    loadUsers();
  });

  async function handleGrantPremium(e: Event) {
    e.preventDefault();
    if (!selectedUser) return;
    modalLoading = true;
    modalMessage = '';
    try {
      await updateUserPremium(selectedUser.id, true, extendDays);
      modalMessage = `Đã gia hạn thành công ${extendDays} ngày PRO cho học viên ${selectedUser.name}!`;
      await loadUsers();
      setTimeout(() => {
        selectedUser = null;
        modalMessage = '';
      }, 1500);
    } catch (err: any) {
      modalMessage = 'Lỗi: ' + (err.message || 'Không thể gia hạn');
    } finally {
      modalLoading = false;
    }
  }

  async function handleRevokePremium(user: any) {
    if (!confirm(`Bạn có chắc chắn muốn hủy quyền PRO của ${user.name}?`)) return;
    try {
      await updateUserPremium(user.id, false);
      await loadUsers();
    } catch (err: any) {
      alert(err.message);
    }
  }

  async function handleToggleRole(user: any) {
    const newRole = user.role === 'ADMIN' ? 'USER' : 'ADMIN';
    if (!confirm(`Bạn có chắc chắn muốn chuyển vai trò của ${user.name} sang ${newRole}?`)) return;
    try {
      await updateUserRole(user.id, newRole);
      await loadUsers();
    } catch (err: any) {
      alert(err.message);
    }
  }

  async function handleDeleteUser(user: any) {
    if (!confirm(`CẢNH BÁO: Bạn có chắc chắn muốn xoá vĩnh viễn tài khoản của ${user.name} (${user.email})?`)) return;
    try {
      await deleteAdminUser(user.id);
      await loadUsers();
    } catch (err: any) {
      alert('Lỗi xoá tài khoản: ' + err.message);
    }
  }
</script>

<div class="space-y-6">
  <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
    <div>
      <h2 class="text-2xl font-black tracking-tight text-white">Quản Lý Học Viên & Hỗ Trợ CSKH</h2>
      <p class="text-sm text-gray-400 mt-1">
        Tra cứu tài khoản, hỗ trợ kích hoạt thủ công quyền lợi PRO hoặc gia hạn thời gian
      </p>
    </div>

    <!-- Search Box -->
    <form
      on:submit|preventDefault={loadUsers}
      class="flex items-center gap-2 max-w-sm w-full"
    >
      <div class="relative flex-1">
        <input
          type="text"
          bind:value={searchQuery}
          placeholder="Tìm theo email hoặc họ tên..."
          class="w-full bg-[#12121a] border border-white/15 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-amber-500"
        />
      </div>
      <button
        type="submit"
        class="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 font-bold text-black text-sm transition-colors"
      >
        Tìm
      </button>
    </form>
  </div>

  {#if loading}
    <div class="p-12 text-center text-gray-400">Đang tải danh sách học viên...</div>
  {:else if error}
    <div class="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-sm">
      {error}
    </div>
  {:else}
    <div class="rounded-2xl bg-[#12121a] border border-white/10 overflow-hidden">
      <table class="w-full text-left border-collapse">
        <thead>
          <tr class="border-b border-white/10 text-xs text-gray-400 uppercase">
            <th class="p-4 font-semibold">Học Viên</th>
            <th class="p-4 font-semibold">Vai Trò</th>
            <th class="p-4 font-semibold">Ngày Đăng Ký</th>
            <th class="p-4 font-semibold">Trạng Thái PRO</th>
            <th class="p-4 font-semibold">Hết Hạn</th>
            <th class="p-4 font-semibold text-right">Thao Tác CSKH</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-white/5 text-sm">
          {#if users.length === 0}
            <tr>
              <td colspan="6" class="p-8 text-center text-gray-400">
                Không tìm thấy học viên nào phù hợp.
              </td>
            </tr>
          {:else}
            {#each users as user}
              <tr class="hover:bg-white/[0.02] transition-colors">
                <td class="p-4">
                  <div class="font-bold text-white">{user.name}</div>
                  <div class="text-xs text-gray-400">{user.email}</div>
                </td>
                <td class="p-4">
                  {#if user.role === 'ADMIN'}
                    <span
                      class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-purple-500/20 text-purple-300 border border-purple-500/40"
                    >
                      <Shield class="size-3.5 text-purple-400" />
                      <span>ADMIN</span>
                    </span>
                  {:else}
                    <span
                      class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-white/5 text-gray-400 border border-white/10"
                    >
                      <span>USER</span>
                    </span>
                  {/if}
                </td>
                <td class="p-4 text-gray-400 text-xs">
                  {new Date(user.createdAt).toLocaleDateString('vi-VN')}
                </td>
                <td class="p-4">
                  {#if user.isPremium}
                    <span
                      class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40"
                    >
                      <Crown class="size-3.5 text-amber-400" />
                      <span>Thành viên PRO</span>
                    </span>
                  {:else}
                    <span
                      class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-white/5 text-gray-400 border border-white/10"
                    >
                      <span>Thành viên Miễn phí</span>
                    </span>
                  {/if}
                </td>
                <td class="p-4 text-xs text-gray-300">
                  {user.premiumExpiresAt
                    ? new Date(user.premiumExpiresAt).toLocaleDateString('vi-VN')
                    : '—'}
                </td>
                <td class="p-4 text-right space-x-2">
                  <button
                    on:click={() => handleToggleRole(user)}
                    class="px-2.5 py-1.5 rounded-lg bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/30 text-purple-400 text-xs font-semibold transition-colors"
                  >
                    {user.role === 'ADMIN' ? 'Hủy Admin' : 'Cấp Admin'}
                  </button>
                  <button
                    on:click={() => (selectedUser = user)}
                    class="px-3 py-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-400 text-xs font-semibold transition-colors"
                  >
                    Cấp / Gia Hạn PRO
                  </button>
                  {#if user.isPremium}
                    <button
                      on:click={() => handleRevokePremium(user)}
                      class="px-2.5 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-semibold transition-colors"
                    >
                      Hủy PRO
                    </button>
                  {/if}
                  <button
                    on:click={() => handleDeleteUser(user)}
                    class="px-2.5 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 text-xs font-semibold transition-colors"
                    title="Xoá tài khoản"
                  >
                    Xoá TK
                  </button>
                </td>
              </tr>
            {/each}
          {/if}
        </tbody>
      </table>
    </div>
  {/if}

  <!-- Modal Manual CSKH Support -->
  {#if selectedUser}
    <div
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
    >
      <div
        class="w-full max-w-md rounded-2xl bg-[#12121a] border border-white/15 p-6 shadow-2xl space-y-6"
      >
        <div class="flex items-center justify-between border-b border-white/10 pb-4">
          <h3 class="font-bold text-lg text-white flex items-center gap-2">
            <Crown class="size-5 text-amber-400" />
            <span>Hỗ Trợ Kích Hoạt PRO</span>
          </h3>
          <button
            on:click={() => (selectedUser = null)}
            class="text-gray-400 hover:text-white transition-colors"
          >
            <X class="size-5" />
          </button>
        </div>

        <div class="space-y-2 text-sm">
          <p class="text-gray-400">Học viên:</p>
          <p class="font-bold text-white text-base">{selectedUser.name}</p>
          <p class="text-xs text-gray-400">{selectedUser.email}</p>
        </div>

        <form on:submit={handleGrantPremium} class="space-y-4">
          <div>
            <label class="block text-xs font-semibold text-gray-400 uppercase mb-2">
              Số ngày gia hạn PRO
            </label>
            <select
              bind:value={extendDays}
              class="w-full bg-[#0a0a0f] border border-white/15 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-amber-500"
            >
              <option value={7}>Gói 7 ngày (Dùng thử)</option>
              <option value={30}>Gói 30 ngày (1 Tháng)</option>
              <option value={90}>Gói 90 ngày (3 Tháng)</option>
              <option value={365}>Gói 365 ngày (1 Năm)</option>
              <option value={3650}>Gói 3650 ngày (Trọn Đời)</option>
            </select>
          </div>

          {#if modalMessage}
            <div class="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-semibold">
              {modalMessage}
            </div>
          {/if}

          <div class="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              on:click={() => (selectedUser = null)}
              class="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-semibold text-gray-300 transition-colors"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={modalLoading}
              class="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-600 hover:to-yellow-500 font-bold text-black text-xs transition-colors"
            >
              {modalLoading ? 'Đang xử lý...' : 'Xác Nhận Gia Hạn PRO'}
            </button>
          </div>
        </form>
      </div>
    </div>
  {/if}
</div>

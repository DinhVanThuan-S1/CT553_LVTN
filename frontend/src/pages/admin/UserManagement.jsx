/**
 * UserManagement - QL Người dùng
 * Danh sách, tìm kiếm, lọc, khóa/mở khóa
 */
import { useState, useEffect, useCallback, useRef } from 'react';
import api from '../../lib/api';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Dialog, DialogHeader, DialogBody, DialogFooter } from '../../components/ui/Dialog';
import { useToast } from '../../components/ui/Toast';
import {
  Search, Users, Lock, Unlock, Eye, ChevronLeft, ChevronRight,
  Mail, Phone, Calendar, Shield, UserCheck, UserX, SlidersHorizontal, ChevronDown,
} from 'lucide-react';

export default function UserManagement() {
  const toast = useToast();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [filters, setFilters] = useState({ search: '', role: '', isActive: '' });
  const [selectedUser, setSelectedUser] = useState(null);
  const [showDetail, setShowDetail] = useState(false);
  const [stats, setStats] = useState(null);
  const [showRoleMenu, setShowRoleMenu] = useState(false);
  const [showStatusMenu, setShowStatusMenu] = useState(false);
  const roleMenuRef = useRef(null);
  const statusMenuRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (roleMenuRef.current && !roleMenuRef.current.contains(e.target)) setShowRoleMenu(false);
      if (statusMenuRef.current && !statusMenuRef.current.contains(e.target)) setShowStatusMenu(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page: pagination.page, limit: 15, ...filters };
      Object.keys(params).forEach((k) => !params[k] && delete params[k]);
      const { data } = await api.get('/admin/users', { params });
      setUsers(data.data);
      setPagination(data.pagination);
    } catch {
      toast.error('Không thể tải danh sách người dùng');
    } finally {
      setLoading(false);
    }
  }, [pagination.page, filters]);

  useEffect(() => {
    loadUsers();
    loadStats();
  }, [loadUsers]);

  async function loadStats() {
    try {
      const { data } = await api.get('/admin/users/stats');
      setStats(data.data);
    } catch { /* ignore */ }
  }

  async function handleToggleStatus(user) {
    try {
      const { data } = await api.patch(`/admin/users/${user._id}/toggle-status`);
      toast.success(data.message);
      loadUsers();
      loadStats();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Có lỗi xảy ra');
    }
  }

  function handleSearch(e) {
    e.preventDefault();
    setPagination((p) => ({ ...p, page: 1 }));
  }

  const statCards = stats ? [
    {
      label: 'Sinh viên', value: stats.totalStudents,
      icon: UserCheck,
      from: 'from-blue-500/15', to: 'to-blue-500/5',
      border: 'border-blue-500/20', text: 'text-blue-600',
      ghost: 'text-blue-500/15',
    },
    {
      label: 'Nhà tuyển dụng', value: stats.totalEmployers,
      icon: Users,
      from: 'from-emerald-500/15', to: 'to-emerald-500/5',
      border: 'border-emerald-500/20', text: 'text-emerald-600',
      ghost: 'text-emerald-500/15',
    },
    {
      label: 'Đang hoạt động', value: stats.activeStudents + stats.activeEmployers,
      icon: Shield,
      from: 'from-cyan-500/15', to: 'to-cyan-500/5',
      border: 'border-cyan-500/20', text: 'text-cyan-600',
      ghost: 'text-cyan-500/15',
    },
    {
      label: 'Bị khóa', value: stats.lockedStudents + stats.lockedEmployers,
      icon: UserX,
      from: 'from-red-500/15', to: 'to-red-500/5',
      border: 'border-red-500/20', text: 'text-red-600',
      ghost: 'text-red-500/15',
    },
  ] : [];

  return (
    <div className="animate-fade-in space-y-5">

      {/* ── Hero Header ── */}
      <div className="relative overflow-hidden rounded-2xl border bg-gradient-to-br from-primary/10 via-primary/5 to-transparent p-6 md:p-8">
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-indigo-500/10 to-transparent rounded-full -translate-y-1/3 translate-x-1/4 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-40 h-40 bg-gradient-to-tr from-primary/8 to-transparent rounded-full translate-y-1/2 -translate-x-1/4 pointer-events-none" />
        <div className="relative">
          <div className="flex items-center gap-2 mb-1">
            <Users className="w-5 h-5 text-primary" />
            <span className="text-xs font-semibold text-primary uppercase tracking-widest">Quản Lý Người Dùng</span>
          </div>
          <p className="text-muted-foreground text-sm mt-1.5">
            Quản lý sinh viên và nhà tuyển dụng •&nbsp;
            <strong className="text-foreground">{pagination.total || 0}</strong> tài khoản
          </p>
        </div>
      </div>

      {/* ── Stats ── */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {statCards.map(({ label, value, icon: Icon, from, to, border, text, ghost }) => (
            <div key={label}
              className={`relative overflow-hidden rounded-xl border bg-gradient-to-br ${from} ${to} ${border} p-4`}>
              <Icon className={`w-10 h-10 ${ghost} absolute -bottom-1 -right-1`} />
              <p className={`text-[11px] font-medium ${text} mb-1.5`}>{label}</p>
              <p className={`text-3xl font-bold ${text}`}>{value}</p>
            </div>
          ))}
        </div>
      )}

      {/* ── Filters ── */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground shrink-0">
          <SlidersHorizontal className="w-3.5 h-3.5" />
          Lọc
        </div>

        {/* Search input */}
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          <Input
            placeholder="Tìm theo tên, email..."
            value={filters.search}
            onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value }))}
            className="pl-9"
          />
        </div>

        {/* Role dropdown */}
        <div className="relative shrink-0" ref={roleMenuRef}>
          <button
            type="button"
            onClick={() => { setShowRoleMenu(v => !v); setShowStatusMenu(false); }}
            className={`h-9 flex items-center gap-2 pl-3 pr-2.5 rounded-lg border text-sm font-medium transition-all min-w-[160px] ${
              showRoleMenu
                ? 'border-primary bg-background text-primary ring-2 ring-ring ring-offset-1'
                : 'border-input bg-background text-foreground hover:border-primary/60'
            }`}
          >
            <span className="flex-1 text-left truncate">
              {filters.role === '' ? 'Tất cả role' : filters.role === 'student' ? 'Sinh viên' : 'Nhà tuyển dụng'}
            </span>
            <ChevronDown className={`w-3.5 h-3.5 shrink-0 transition-transform duration-200 ${
              showRoleMenu ? 'rotate-180 text-primary' : 'text-muted-foreground'
            }`} />
          </button>
          {showRoleMenu && (
            <div className="absolute left-0 top-full mt-1.5 z-30 bg-card border border-border/60 rounded-xl shadow-lg overflow-hidden w-48 animate-fade-in">
              <div className="py-1.5">
                {[
                  { value: '', label: 'Tất cả role' },
                  { value: 'student', label: 'Sinh viên' },
                  { value: 'employer', label: 'Nhà tuyển dụng' },
                ].map(({ value, label }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => {
                      setFilters((f) => ({ ...f, role: value }));
                      setPagination((p) => ({ ...p, page: 1 }));
                      setShowRoleMenu(false);
                    }}
                    className={`w-full text-left px-3.5 py-2 text-sm transition-colors flex items-center gap-2 ${
                      filters.role === value
                        ? 'bg-primary/10 text-primary font-semibold'
                        : 'text-foreground hover:bg-muted/50'
                    }`}
                  >
                    {filters.role === value && <div className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />}
                    <span className={filters.role === value ? '' : 'ml-3.5'}>{label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Status dropdown */}
        <div className="relative shrink-0" ref={statusMenuRef}>
          <button
            type="button"
            onClick={() => { setShowStatusMenu(v => !v); setShowRoleMenu(false); }}
            className={`h-9 flex items-center gap-2 pl-3 pr-2.5 rounded-lg border text-sm font-medium transition-all min-w-[168px] ${
              showStatusMenu
                ? 'border-primary bg-background text-primary ring-2 ring-ring ring-offset-1'
                : 'border-input bg-background text-foreground hover:border-primary/60'
            }`}
          >
            <span className="flex-1 text-left truncate">
              {filters.isActive === '' ? 'Tất cả trạng thái' : filters.isActive === 'true' ? 'Đang hoạt động' : 'Bị khóa'}
            </span>
            <ChevronDown className={`w-3.5 h-3.5 shrink-0 transition-transform duration-200 ${
              showStatusMenu ? 'rotate-180 text-primary' : 'text-muted-foreground'
            }`} />
          </button>
          {showStatusMenu && (
            <div className="absolute left-0 top-full mt-1.5 z-30 bg-card border border-border/60 rounded-xl shadow-lg overflow-hidden w-52 animate-fade-in">
              <div className="py-1.5">
                {[
                  { value: '', label: 'Tất cả trạng thái' },
                  { value: 'true', label: 'Đang hoạt động' },
                  { value: 'false', label: 'Bị khóa' },
                ].map(({ value, label }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => {
                      setFilters((f) => ({ ...f, isActive: value }));
                      setPagination((p) => ({ ...p, page: 1 }));
                      setShowStatusMenu(false);
                    }}
                    className={`w-full text-left px-3.5 py-2 text-sm transition-colors flex items-center gap-2 ${
                      filters.isActive === value
                        ? 'bg-primary/10 text-primary font-semibold'
                        : 'text-foreground hover:bg-muted/50'
                    }`}
                  >
                    {filters.isActive === value && <div className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />}
                    <span className={filters.isActive === value ? '' : 'ml-3.5'}>{label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Table ── */}
      <div className="rounded-xl border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/30">
                <th className="text-left px-5 py-3.5 font-semibold text-xs uppercase tracking-wider text-muted-foreground">Người Dùng</th>
                <th className="text-left px-4 py-3.5 font-semibold text-xs uppercase tracking-wider text-muted-foreground">Email</th>
                <th className="text-left px-4 py-3.5 font-semibold text-xs uppercase tracking-wider text-muted-foreground">Vai Trò</th>
                <th className="text-left px-4 py-3.5 font-semibold text-xs uppercase tracking-wider text-muted-foreground">Trạng Thái</th>
                <th className="text-left px-4 py-3.5 font-semibold text-xs uppercase tracking-wider text-muted-foreground">Ngày Tạo</th>
                <th className="text-right px-5 py-3.5 font-semibold text-xs uppercase tracking-wider text-muted-foreground">Thao Tác</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i} className="border-b">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 skeleton rounded-full shrink-0" />
                        <div className="h-4 w-28 skeleton" />
                      </div>
                    </td>
                    <td className="px-4 py-3.5"><div className="h-4 w-40 skeleton" /></td>
                    <td className="px-4 py-3.5"><div className="h-5 w-24 skeleton rounded-full" /></td>
                    <td className="px-4 py-3.5"><div className="h-5 w-20 skeleton rounded-full" /></td>
                    <td className="px-4 py-3.5"><div className="h-4 w-20 skeleton" /></td>
                    <td className="px-5 py-3.5"><div className="h-7 w-16 skeleton rounded-lg ml-auto" /></td>
                  </tr>
                ))
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-16 text-center">
                    <div className="w-12 h-12 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-3">
                      <Users className="w-6 h-6 text-muted-foreground/30" />
                    </div>
                    <p className="text-sm font-medium text-muted-foreground">Không có người dùng nào</p>
                    <p className="text-xs text-muted-foreground mt-1">Thử thay đổi bộ lọc</p>
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user._id} className="border-b hover:bg-muted/20 transition-colors group">
                    {/* Avatar + Name */}
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center text-sm font-bold text-primary shrink-0 border border-primary/10 overflow-hidden">
                          {user.avatar
                            ? <img src={user.avatar} alt="" className="w-9 h-9 object-cover" />
                            : user.fullName?.charAt(0)?.toUpperCase()
                          }
                        </div>
                        <span className="font-medium text-sm group-hover:text-primary transition-colors">{user.fullName}</span>
                      </div>
                    </td>
                    {/* Email */}
                    <td className="px-4 py-3.5 text-muted-foreground text-sm">{user.email}</td>
                    {/* Role badge */}
                    <td className="px-4 py-3.5">
                      {user.role === 'student' ? (
                        <span className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full bg-blue-500/10 text-blue-600 border border-blue-400/20">
                          <UserCheck className="w-3 h-3" /> Sinh viên
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 border border-emerald-400/20">
                          <Users className="w-3 h-3" /> Nhà tuyển dụng
                        </span>
                      )}
                    </td>
                    {/* Status badge */}
                    <td className="px-4 py-3.5">
                      {user.isActive ? (
                        <span className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 border border-emerald-400/20">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          Hoạt động
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full bg-red-500/10 text-red-600 border border-red-400/20">
                          <Lock className="w-2.5 h-2.5" /> Bị khóa
                        </span>
                      )}
                    </td>
                    {/* Date */}
                    <td className="px-4 py-3.5 text-muted-foreground text-xs">
                      {new Date(user.createdAt).toLocaleDateString('vi-VN')}
                    </td>
                    {/* Actions */}
                    <td className="px-5 py-3.5">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => { setSelectedUser(user); setShowDetail(true); }}
                          className="p-1.5 rounded-lg hover:bg-primary/10 transition-colors text-muted-foreground hover:text-primary"
                          title="Xem chi tiết"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleToggleStatus(user)}
                          className={`p-1.5 rounded-lg transition-colors ${user.isActive
                            ? 'hover:bg-red-500/10 text-muted-foreground hover:text-red-600'
                            : 'hover:bg-emerald-500/10 text-muted-foreground hover:text-emerald-600'
                            }`}
                          title={user.isActive ? 'Khóa tài khoản' : 'Mở khóa'}
                        >
                          {user.isActive ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="flex items-center justify-between px-5 py-3 border-t bg-muted/10">
            <p className="text-xs text-muted-foreground">
              <strong className="text-foreground">{pagination.total}</strong> người dùng &bull; Trang {pagination.page}/{pagination.pages}
            </p>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost" size="sm"
                disabled={pagination.page <= 1}
                onClick={() => setPagination((p) => ({ ...p, page: p.page - 1 }))}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <span className="text-xs px-2 font-medium">{pagination.page}</span>
              <Button
                variant="ghost" size="sm"
                disabled={pagination.page >= pagination.pages}
                onClick={() => setPagination((p) => ({ ...p, page: p.page + 1 }))}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* ── Detail Dialog ── */}
      <Dialog open={showDetail} onClose={() => setShowDetail(false)}>
        <DialogHeader onClose={() => setShowDetail(false)}>
          Chi tiết người dùng
        </DialogHeader>
        {selectedUser && (
          <DialogBody>
            <div className="space-y-4">
              {/* Profile header */}
              <div className="flex items-center gap-4 p-4 rounded-xl bg-muted/20 border">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center text-2xl font-bold text-primary shrink-0 border border-primary/10 overflow-hidden">
                  {selectedUser.avatar
                    ? <img src={selectedUser.avatar} alt="" className="w-16 h-16 object-cover" />
                    : selectedUser.fullName?.charAt(0)?.toUpperCase()
                  }
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-lg truncate">{selectedUser.fullName}</h3>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    {selectedUser.role === 'student' ? (
                      <span className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-600 border border-blue-400/20">
                        <UserCheck className="w-3 h-3" /> Sinh viên
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 border border-emerald-400/20">
                        <Users className="w-3 h-3" /> Nhà tuyển dụng
                      </span>
                    )}
                    {selectedUser.isActive ? (
                      <span className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 border border-emerald-400/20">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Hoạt động
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-0.5 rounded-full bg-red-500/10 text-red-600 border border-red-400/20">
                        <Lock className="w-2.5 h-2.5" /> Bị khóa
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Info rows */}
              <div className="space-y-2.5 text-sm">
                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/10 border">
                  <Mail className="w-4 h-4 text-primary shrink-0" />
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-0.5">Email</p>
                    <p className="font-medium">{selectedUser.email}</p>
                  </div>
                </div>
                {selectedUser.phone && (
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/10 border">
                    <Phone className="w-4 h-4 text-primary shrink-0" />
                    <div>
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-0.5">Số điện thoại</p>
                      <p className="font-medium">{selectedUser.phone}</p>
                    </div>
                  </div>
                )}
                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/10 border">
                  <Calendar className="w-4 h-4 text-primary shrink-0" />
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-0.5">Ngày tham gia</p>
                    <p className="font-medium">{new Date(selectedUser.createdAt).toLocaleDateString('vi-VN')}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/10 border">
                  <Shield className="w-4 h-4 text-primary shrink-0" />
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-0.5">Đăng nhập qua</p>
                    <p className="font-medium">{selectedUser.authProvider === 'google' ? 'Google' : 'Email / Password'}</p>
                  </div>
                </div>
              </div>
            </div>
          </DialogBody>
        )}
        <DialogFooter>
          <Button variant="outline" size="sm" onClick={() => setShowDetail(false)}>Đóng</Button>
          {selectedUser && (
            <Button
              size="sm"
              variant={selectedUser.isActive ? 'destructive' : 'default'}
              onClick={() => { handleToggleStatus(selectedUser); setShowDetail(false); }}
              className="gap-1.5"
            >
              {selectedUser.isActive
                ? <><Lock className="w-3.5 h-3.5" /> Khóa tài khoản</>
                : <><Unlock className="w-3.5 h-3.5" /> Mở khóa tài khoản</>
              }
            </Button>
          )}
        </DialogFooter>
      </Dialog>
    </div>
  );
}

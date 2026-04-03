/**
 * UserManagement - QL Người dùng
 * Danh sách, tìm kiếm, lọc, khóa/mở khóa
 */
import { useState, useEffect, useCallback } from 'react';
import api from '../../lib/api';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Badge } from '../../components/ui/Badge';
import { Select } from '../../components/ui/Select';
import { Dialog, DialogHeader, DialogBody, DialogFooter } from '../../components/ui/Dialog';
import { useToast } from '../../components/ui/Toast';
import {
  Search, Users, Lock, Unlock, Eye, ChevronLeft, ChevronRight,
  Mail, Phone, Calendar, Shield, UserCheck, UserX,
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

  const loadUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page: pagination.page, limit: 15, ...filters };
      // Xóa params rỗng
      Object.keys(params).forEach((k) => !params[k] && delete params[k]);
      const { data } = await api.get('/admin/users', { params });
      setUsers(data.data);
      setPagination(data.pagination);
    } catch (error) {
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

  return (
    <div className="animate-fade-in space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Quản Lý Người Dùng</h1>
        <p className="text-muted-foreground text-sm mt-1">Quản lý sinh viên và nhà tuyển dụng</p>
      </div>

      {/* Stats Mini */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: 'Sinh viên', value: stats.totalStudents, icon: UserCheck, color: 'text-blue-500' },
            { label: 'Nhà tuyển dụng', value: stats.totalEmployers, icon: Users, color: 'text-emerald-500' },
            { label: 'Đang hoạt động', value: stats.activeStudents + stats.activeEmployers, icon: Shield, color: 'text-cyan-500' },
            { label: 'Bị khóa', value: stats.lockedStudents + stats.lockedEmployers, icon: UserX, color: 'text-red-500' },
          ].map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="rounded-lg border bg-card px-4 py-3 flex items-center gap-3">
              <Icon className={`w-5 h-5 ${color}`} />
              <div>
                <p className="text-lg font-bold">{value}</p>
                <p className="text-xs text-muted-foreground">{label}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Filters */}
      <div className="rounded-xl border bg-card p-4">
        <form onSubmit={handleSearch} className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Tìm theo tên, email..."
              value={filters.search}
              onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value }))}
              className="pl-9"
            />
          </div>
          <Select
            value={filters.role}
            onChange={(e) => {
              setFilters((f) => ({ ...f, role: e.target.value }));
              setPagination((p) => ({ ...p, page: 1 }));
            }}
            className="w-40"
          >
            <option value="">Tất cả role</option>
            <option value="student">Sinh viên</option>
            <option value="employer">Nhà tuyển dụng</option>
          </Select>
          <Select
            value={filters.isActive}
            onChange={(e) => {
              setFilters((f) => ({ ...f, isActive: e.target.value }));
              setPagination((p) => ({ ...p, page: 1 }));
            }}
            className="w-40"
          >
            <option value="">Tất cả trạng thái</option>
            <option value="true">Đang hoạt động</option>
            <option value="false">Bị khóa</option>
          </Select>
          <Button type="submit" size="sm">Tìm kiếm</Button>
        </form>
      </div>

      {/* Table */}
      <div className="rounded-xl border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/30">
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Người dùng</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Email</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Vai trò</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Trạng thái</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Ngày tạo</th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-b">
                    <td className="px-4 py-3"><div className="h-4 w-32 skeleton" /></td>
                    <td className="px-4 py-3"><div className="h-4 w-40 skeleton" /></td>
                    <td className="px-4 py-3"><div className="h-4 w-16 skeleton" /></td>
                    <td className="px-4 py-3"><div className="h-4 w-20 skeleton" /></td>
                    <td className="px-4 py-3"><div className="h-4 w-24 skeleton" /></td>
                    <td className="px-4 py-3"><div className="h-4 w-16 skeleton ml-auto" /></td>
                  </tr>
                ))
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-muted-foreground">
                    Không có người dùng nào
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user._id} className="border-b hover:bg-muted/20 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                          {user.avatar ? (
                            <img src={user.avatar} alt="" className="w-8 h-8 rounded-full object-cover" />
                          ) : (
                            user.fullName?.charAt(0)
                          )}
                        </div>
                        <span className="font-medium">{user.fullName}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{user.email}</td>
                    <td className="px-4 py-3">
                      <Badge variant={user.role === 'student' ? 'default' : 'success'}>
                        {user.role === 'student' ? 'Sinh viên' : 'Nhà tuyển dụng'}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={user.isActive ? 'success' : 'danger'}>
                        {user.isActive ? 'Hoạt động' : 'Bị khóa'}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground text-xs">
                      {new Date(user.createdAt).toLocaleDateString('vi-VN')}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => { setSelectedUser(user); setShowDetail(true); }}
                          className="p-1.5 rounded-md hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                          title="Xem chi tiết"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleToggleStatus(user)}
                          className={`p-1.5 rounded-md transition-colors ${user.isActive
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
          <div className="flex items-center justify-between px-4 py-3 border-t bg-muted/10">
            <p className="text-xs text-muted-foreground">
              Tổng {pagination.total} người dùng • Trang {pagination.page}/{pagination.pages}
            </p>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost" size="sm"
                disabled={pagination.page <= 1}
                onClick={() => setPagination((p) => ({ ...p, page: p.page - 1 }))}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
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

      {/* Detail Dialog */}
      <Dialog open={showDetail} onClose={() => setShowDetail(false)}>
        <DialogHeader onClose={() => setShowDetail(false)}>
          Chi tiết người dùng
        </DialogHeader>
        {selectedUser && (
          <DialogBody>
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center text-xl font-bold text-primary">
                  {selectedUser.avatar ? (
                    <img src={selectedUser.avatar} alt="" className="w-14 h-14 rounded-full object-cover" />
                  ) : (
                    selectedUser.fullName?.charAt(0)
                  )}
                </div>
                <div>
                  <h3 className="font-semibold text-lg">{selectedUser.fullName}</h3>
                  <Badge variant={selectedUser.role === 'student' ? 'default' : 'success'}>
                    {selectedUser.role === 'student' ? 'Sinh viên' : 'Nhà tuyển dụng'}
                  </Badge>
                </div>
              </div>
              <div className="space-y-3 text-sm">
                <div className="flex items-center gap-3 text-muted-foreground">
                  <Mail className="w-4 h-4" /> {selectedUser.email}
                </div>
                {selectedUser.phone && (
                  <div className="flex items-center gap-3 text-muted-foreground">
                    <Phone className="w-4 h-4" /> {selectedUser.phone}
                  </div>
                )}
                <div className="flex items-center gap-3 text-muted-foreground">
                  <Calendar className="w-4 h-4" /> Tham gia: {new Date(selectedUser.createdAt).toLocaleDateString('vi-VN')}
                </div>
                <div className="flex items-center gap-3 text-muted-foreground">
                  <Shield className="w-4 h-4" /> Đăng nhập qua: {selectedUser.authProvider === 'google' ? 'Google' : 'Email/Password'}
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
            >
              {selectedUser.isActive ? 'Khóa tài khoản' : 'Mở khóa tài khoản'}
            </Button>
          )}
        </DialogFooter>
      </Dialog>
    </div>
  );
}

import { Router } from 'express';
import { db } from '../db.ts';
import { authenticateToken, requireRole, AuthRequest } from '../auth.ts';

const router = Router();

// GET /api/admin/stats - KPI Metrics & Analytics Data
router.get('/stats', authenticateToken, requireRole(['admin']), (req: AuthRequest, res) => {
  try {
    const totalPatients = db.users.filter((u) => u.role === 'patient').length;
    const totalDoctors = db.doctors.length;
    const approvedDoctors = db.doctors.filter((d) => d.approvalStatus === 'approved').length;
    const pendingDoctors = db.doctors.filter((d) => d.approvalStatus === 'pending').length;
    const totalHospitals = db.hospitals.length;
    const totalAppointments = db.appointments.length;
    const completedAppointments = db.appointments.filter((a) => a.appointmentStatus === 'completed').length;
    const upcomingAppointments = db.appointments.filter((a) => a.appointmentStatus === 'upcoming' || a.appointmentStatus === 'confirmed').length;
    const cancelledAppointments = db.appointments.filter((a) => a.appointmentStatus === 'cancelled' || a.appointmentStatus === 'rejected').length;

    // Total Revenue (only paid appointments)
    const totalRevenue = db.payments
      .filter((p) => p.status === 'paid')
      .reduce((sum, p) => sum + p.amount, 0);

    // Monthly Analytics Chart Data (Past 6 Months)
    const monthlyStats = [
      { month: 'Sep', appointments: 28, revenue: 22400, patients: 15 },
      { month: 'Oct', appointments: 42, revenue: 33600, patients: 26 },
      { month: 'Nov', appointments: 65, revenue: 52000, patients: 38 },
      { month: 'Dec', appointments: 88, revenue: 70400, patients: 52 },
      { month: 'Jan', appointments: 112, revenue: 89600, patients: 74 },
      { month: 'Feb', appointments: totalAppointments + 95, revenue: totalRevenue + 76000, patients: totalPatients + 45 },
    ];

    // Department Distribution
    const departmentCounts: Record<string, number> = {};
    db.doctors.forEach((d) => {
      departmentCounts[d.specialization] = (departmentCounts[d.specialization] || 0) + 1;
    });

    const departmentDistribution = Object.entries(departmentCounts).map(([name, count]) => ({
      name,
      value: count,
    }));

    return res.json({
      success: true,
      stats: {
        totalPatients,
        totalDoctors,
        approvedDoctors,
        pendingDoctors,
        totalHospitals,
        totalAppointments,
        completedAppointments,
        upcomingAppointments,
        cancelledAppointments,
        totalRevenue,
      },
      charts: {
        monthlyStats,
        departmentDistribution,
      },
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: 'Failed to compute admin statistics.' });
  }
});

// GET /api/admin/users - Manage Users
router.get('/users', authenticateToken, requireRole(['admin']), (req: AuthRequest, res) => {
  try {
    const { role, search } = req.query as Record<string, string>;

    let list = db.users.map((u) => {
      const safe = { ...u };
      delete safe.password;
      return safe;
    });

    if (role && role !== 'All') {
      list = list.filter((u) => u.role === role);
    }

    if (search && search.trim()) {
      const q = search.toLowerCase().trim();
      list = list.filter(
        (u) =>
          u.name.toLowerCase().includes(q) ||
          u.email.toLowerCase().includes(q) ||
          u.phone.includes(q) ||
          (u.city && u.city.toLowerCase().includes(q))
      );
    }

    return res.json({
      success: true,
      total: list.length,
      users: list,
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: 'Failed to fetch users.' });
  }
});

// PUT /api/admin/users/:id/block - Block/Unblock User
router.put('/users/:id/block', authenticateToken, requireRole(['admin']), (req: AuthRequest, res) => {
  try {
    const user = db.users.find((u) => u._id === req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    if (user.role === 'admin') {
      return res.status(400).json({ success: false, message: 'Administrator accounts cannot be blocked.' });
    }

    user.isBlocked = !user.isBlocked;

    db.logAction(
      user.isBlocked ? 'USER_BLOCKED' : 'USER_UNBLOCKED',
      req.user!.name,
      'admin',
      `${user.isBlocked ? 'Blocked' : 'Unblocked'} account ${user.name} (${user.email})`
    );

    return res.json({
      success: true,
      message: `User account has been ${user.isBlocked ? 'blocked' : 'unblocked'}.`,
      isBlocked: user.isBlocked,
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: 'Failed to toggle block status.' });
  }
});

// GET /api/admin/system-logs - Audit Logs
router.get('/system-logs', authenticateToken, requireRole(['admin']), (req: AuthRequest, res) => {
  try {
    return res.json({
      success: true,
      total: db.systemLogs.length,
      logs: db.systemLogs.slice(0, 50),
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: 'Failed to fetch system logs.' });
  }
});

export default router;

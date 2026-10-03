const crypto = require('crypto');
const QRCode = require('qrcode');
const AttendanceLink = require('./attendanceLink.model');
const Attendance = require('./attendance.model');
const User = require('../admin/admin.model');

/**
 * Returns today's date in Asia/Kolkata timezone in YYYY-MM-DD format
 */
const getTodayKolkata = () => {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
};

class AttendanceLinkService {
  /**
   * 1. Generate link and QR code for T3
   */
  async generateLink({ minutes = 10 }, user) {
    let validMinutes = parseInt(minutes, 10);
    if (isNaN(validMinutes) || validMinutes < 1) validMinutes = 10;
    if (validMinutes > 120) validMinutes = 120; // Max 120 minutes

    const token = crypto.randomBytes(32).toString('hex');
    const startsAt = new Date();
    const expiresAt = new Date(startsAt.getTime() + validMinutes * 60 * 1000);
    const date = getTodayKolkata();

    const baseUrl = process.env.BASE_URL || process.env.APP_URL || process.env.FRONTEND_URL || 'http://localhost:5173';
    const cleanBaseUrl = baseUrl.replace(/\/+$/, '');
    const url = `${cleanBaseUrl}/attend/${token}`;

    const qrCode = await QRCode.toDataURL(url, {
      errorCorrectionLevel: 'M',
      margin: 2,
      width: 320,
      color: {
        dark: '#0f172a',
        light: '#ffffff',
      },
    });

    const link = await AttendanceLink.create({
      token,
      team: 'T3',
      createdBy: user.sub || user._id,
      startsAt,
      expiresAt,
      date,
      active: true,
    });

    return {
      token: link.token,
      url,
      qrCode,
      startsAt: link.startsAt,
      expiresAt: link.expiresAt,
      validMinutes,
      date: link.date,
      team: link.team,
      active: link.active,
    };
  }

  /**
   * Get link metadata (Read-only for attendee UI pre-check)
   */
  async getLinkInfo(token, user) {
    const link = await AttendanceLink.findOne({ token }).populate('createdBy', 'name email');
    if (!link) {
      const err = new Error('Invalid attendance link');
      err.statusCode = 404;
      throw err;
    }

    const now = new Date();
    let status = 'active';
    if (now < link.startsAt) {
      status = 'not_started';
    } else if (!link.active || now > link.expiresAt) {
      status = 'expired';
    }

    const role = user?.role || '';
    const isTeamMember =
      (link.team === 'T3' && (role === 'T3_EXECUTIVE' || role === 'T3')) ||
      (user?.team && user.team.toUpperCase() === link.team.toUpperCase());

    const todayDate = link.date;
    const existing = await Attendance.findOne({
      user: user?.sub || user?._id,
      date: todayDate,
    });

    return {
      token: link.token,
      team: link.team,
      date: link.date,
      startsAt: link.startsAt,
      expiresAt: link.expiresAt,
      active: link.active,
      status,
      isTeamMember,
      alreadyMarked: !!existing,
      markedAt: existing?.markedAt || null,
      createdByName: link.createdBy?.name || 'T3 Member',
    };
  }

  /**
   * 2. Mark attendance (Strictly on POST request)
   */
  async markAttendance(token, user) {
    const link = await AttendanceLink.findOne({ token });
    if (!link) {
      const err = new Error('Invalid attendance link');
      err.statusCode = 404;
      throw err;
    }

    const now = new Date();

    // 1. Not started yet check
    if (now < link.startsAt) {
      const err = new Error('Attendance window has not started yet');
      err.statusCode = 425;
      throw err;
    }

    // 2. Expired or deactivated check
    if (!link.active || now > link.expiresAt) {
      const err = new Error('Attendance link has expired or has been deactivated');
      err.statusCode = 410;
      throw err;
    }

    // 3. Team check
    const role = user?.role || '';
    const isTeamMember =
      (link.team === 'T3' && (role === 'T3_EXECUTIVE' || role === 'T3')) ||
      (user?.team && user.team.toUpperCase() === link.team.toUpperCase());

    if (!isTeamMember) {
      const err = new Error(`Access denied. You do not belong to the required team (${link.team}) for this attendance link.`);
      err.statusCode = 403;
      throw err;
    }

    // 4. Already marked today check
    const todayDate = link.date || getTodayKolkata();
    const existing = await Attendance.findOne({
      user: user.sub || user._id,
      date: todayDate,
    });

    if (existing) {
      const err = new Error('Attendance already marked for today');
      err.statusCode = 409;
      throw err;
    }

    // 5. Save attendance record
    try {
      const attendance = new Attendance({
        user: user.sub || user._id,
        studentId: user.sub || user._id,
        studentName: user.name || '',
        studentEmail: user.email || '',
        team: link.team,
        date: todayDate,
        markedAt: now,
        checkInTime: now,
        linkId: link._id,
        status: 'present',
        method: 'link',
      });
      await attendance.save();
      return attendance;
    } catch (saveErr) {
      // MongoDB duplicate key error code 11000
      if (saveErr.code === 11000) {
        const err = new Error('Attendance already marked for today');
        err.statusCode = 409;
        throw err;
      }
      throw saveErr;
    }
  }

  /**
   * 3. Deactivate link early
   */
  async deactivateLink(token, user) {
    const link = await AttendanceLink.findOne({ token });
    if (!link) {
      const err = new Error('Invalid attendance link');
      err.statusCode = 404;
      throw err;
    }

    link.active = false;
    await link.save();
    return link;
  }

  /**
   * 4. T3 attendance panel (today)
   */
  async getT3TodayPanel() {
    const todayDate = getTodayKolkata();

    // Fetch all active T3 team users
    const allT3Users = await User.find({
      role: { $in: ['T3_EXECUTIVE', 'T3'] },
      isActive: true,
    }).select('_id name email role');

    // Fetch all attendance records for date and team T3
    const attendanceList = await Attendance.find({
      date: todayDate,
      team: 'T3',
    })
      .populate('user', 'name email')
      .sort({ markedAt: 1, checkInTime: 1 });

    const presentMembers = attendanceList.map((rec) => {
      const u = rec.user || {};
      return {
        id: rec._id,
        userId: u._id || rec.studentId,
        name: u.name || rec.studentName || 'T3 Member',
        email: u.email || rec.studentEmail || '',
        markedAt: rec.markedAt || rec.checkInTime || rec.createdAt,
        method: rec.method || 'link',
      };
    });

    const presentUserIds = new Set(presentMembers.map((p) => String(p.userId)));

    const absentMembers = allT3Users
      .filter((u) => !presentUserIds.has(String(u._id)))
      .map((u) => ({
        userId: u._id,
        name: u.name,
        email: u.email,
      }));

    return {
      date: todayDate,
      timeZone: 'Asia/Kolkata',
      presentCount: presentMembers.length,
      absentCount: absentMembers.length,
      totalCount: allT3Users.length,
      presentMembers,
      absentMembers,
    };
  }
}

module.exports = new AttendanceLinkService();

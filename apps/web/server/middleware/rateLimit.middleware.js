// In-memory rate limiter without external dependencies
const requests = new Map();
const WINDOW_MS = 15 * 60 * 1000; // 15 mins
const MAX_REQUESTS = 500;

exports.globalLimiter = (req, res, next) => {
  const ip = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';
  const now = Date.now();

  const userRecord = requests.get(ip) || { count: 0, resetTime: now + WINDOW_MS };

  if (now > userRecord.resetTime) {
    userRecord.count = 1;
    userRecord.resetTime = now + WINDOW_MS;
  } else {
    userRecord.count++;
  }

  requests.set(ip, userRecord);

  res.setHeader('X-RateLimit-Limit', MAX_REQUESTS);
  res.setHeader('X-RateLimit-Remaining', Math.max(0, MAX_REQUESTS - userRecord.count));
  res.setHeader('X-RateLimit-Reset', Math.ceil(userRecord.resetTime / 1000));

  if (userRecord.count > MAX_REQUESTS) {
    return res.status(429).json({
      success: false,
      message: 'Too many requests, please try again later.',
    });
  }

  next();
};

const userCreateRequests = new Map();
exports.createUserLimiter = (req, res, next) => {
  const ip = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';
  const now = Date.now();
  const record = userCreateRequests.get(ip) || { count: 0, resetTime: now + 60 * 1000 };

  if (now > record.resetTime) {
    record.count = 1;
    record.resetTime = now + 60 * 1000;
  } else {
    record.count++;
  }

  userCreateRequests.set(ip, record);

  // H7: Limit to 5 user creations per minute per IP (was 30)
  if (record.count > 5) {
    return res.status(429).json({
      success: false,
      message: 'Too many user creation requests, please try again later.',
    });
  }

  next();
};

const bulkImportRequests = new Map();
const BULK_IMPORT_WINDOW_MS = 5 * 60 * 1000; // 5 mins
const BULK_IMPORT_MAX_REQUESTS = 10;

exports.bulkImportLimiter = (req, res, next) => {
  const ip = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';
  const now = Date.now();
  const record = bulkImportRequests.get(ip) || { count: 0, resetTime: now + BULK_IMPORT_WINDOW_MS };

  if (now > record.resetTime) {
    record.count = 1;
    record.resetTime = now + BULK_IMPORT_WINDOW_MS;
  } else {
    record.count++;
  }

  bulkImportRequests.set(ip, record);

  if (record.count > BULK_IMPORT_MAX_REQUESTS) {
    return res.status(429).json({
      success: false,
      message: 'Too many bulk import requests, please try again later.',
    });
  }

  next();
};

const attendanceGenRequests = new Map();
exports.attendanceGenerateLimiter = (req, res, next) => {
  const key = (req.user?.sub || req.user?._id || req.user?.id || req.ip || req.headers['x-forwarded-for'] || req.socket?.remoteAddress || 'unknown').toString();
  const now = Date.now();
  const record = attendanceGenRequests.get(key) || { count: 0, resetTime: now + 60 * 1000 };

  if (now > record.resetTime) {
    record.count = 1;
    record.resetTime = now + 60 * 1000;
  } else {
    record.count++;
  }

  attendanceGenRequests.set(key, record);

  if (record.count > 10) {
    return res.status(429).json({
      success: false,
      message: 'Too many session generation requests, please try again later.',
    });
  }

  next();
};

const attendanceScanRequests = new Map();
exports.attendanceScanLimiter = (req, res, next) => {
  // Key by authenticated userId so multiple students on the same campus Wi-Fi / NAT IP are not throttled together
  const key = (req.user?.sub || req.user?._id || req.user?.id || req.ip || req.headers['x-forwarded-for'] || req.socket?.remoteAddress || 'unknown').toString();
  const now = Date.now();
  const record = attendanceScanRequests.get(key) || { count: 0, resetTime: now + 60 * 1000 };

  if (now > record.resetTime) {
    record.count = 1;
    record.resetTime = now + 60 * 1000;
  } else {
    record.count++;
  }

  attendanceScanRequests.set(key, record);

  if (record.count > 30) {
    return res.status(429).json({
      success: false,
      message: 'Too many attendance submissions, please try again later.',
    });
  }

  next();
};

exports._inMemoryAttendanceGenRequests = attendanceGenRequests;
exports._inMemoryAttendanceScanRequests = attendanceScanRequests;



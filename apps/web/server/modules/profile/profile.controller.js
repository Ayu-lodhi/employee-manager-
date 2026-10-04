// apps/api/src/modules/profile/profile.controller.js
// Express controllers for profile endpoints.

const mongoose = require('mongoose');
const User = require('../admin/admin.model');
const profileService = require('./profile.service');
const { canViewProfile, sanitizeProfileForViewer } = require('./profile.access');

// Helper to validate MongoDB ObjectId
const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

/**
 * GET /profile/me
 */
exports.getMyProfile = async (req, res, next) => {
  try {
    const { profile, user, completion } = await profileService.getOrCreateProfile(req.user._id);
    const progress = await profileService.getUserProgress(req.user._id);

    return res.status(200).json({
      success: true,
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          tier: user.tier || 'T1',
        },
        profile,
        completion,
        progress,
      },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * PATCH /profile/me
 */
exports.updateMyProfile = async (req, res, next) => {
  try {
    const { profile, completion } = await profileService.updateMyProfile(req.user._id, req.body);
    return res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        profile,
        completion,
      },
    });
  } catch (err) {
    if (err.statusCode) {
      return res.status(err.statusCode).json({ success: false, message: err.message });
    }
    next(err);
  }
};

/**
 * GET /profile/me/completion
 */
exports.getMyCompletion = async (req, res, next) => {
  try {
    const { completion } = await profileService.getOrCreateProfile(req.user._id);
    return res.status(200).json({
      success: true,
      data: completion,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /profile/me/progress
 */
exports.getMyProgress = async (req, res, next) => {
  try {
    const progress = await profileService.getUserProgress(req.user._id);
    return res.status(200).json({
      success: true,
      data: progress,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /profile/team (T3 Executive's team list)
 */
exports.getTeamProfiles = async (req, res, next) => {
  try {
    if (req.user.role !== 'T3_EXECUTIVE') {
      return res.status(403).json({ success: false, message: 'Forbidden: T3 executive access only' });
    }

    const memberIds = await profileService.getLedTeamMemberIds(req.user._id);
    const members = await User.find({ _id: { $in: memberIds } }).select('name email role tier phone');

    const results = [];
    for (const m of members) {
      const { profile } = await profileService.getOrCreateProfile(m._id);
      const sanitized = sanitizeProfileForViewer(profile, 't3_team');
      results.push({
        user: {
          id: m._id,
          name: m.name,
          role: m.role,
          tier: m.tier || 'T1',
        },
        profile: sanitized,
      });
    }

    return res.status(200).json({
      success: true,
      data: results,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /profile/:userId
 */
exports.getUserProfile = async (req, res, next) => {
  try {
    const { userId } = req.params;

    if (!isValidObjectId(userId)) {
      return res.status(400).json({ success: false, message: 'Invalid user ID format' });
    }

    const targetUser = await User.findById(userId).select('-password');
    if (!targetUser) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    let t3MemberIds = [];
    if (req.user.role === 'T3_EXECUTIVE') {
      t3MemberIds = await profileService.getLedTeamMemberIds(req.user._id);
    }

    const authCheck = canViewProfile(req.user, targetUser, t3MemberIds);
    if (!authCheck.allowed) {
      return res.status(403).json({ success: false, message: authCheck.reason || 'Forbidden' });
    }

    const { profile, completion } = await profileService.getOrCreateProfile(targetUser._id);
    const progress = await profileService.getUserProgress(targetUser._id);
    const sanitized = sanitizeProfileForViewer(profile, authCheck.scope);

    // Build user view object respecting scope
    const userView = {
      id: targetUser._id,
      name: targetUser.name,
      role: targetUser.role,
      tier: targetUser.tier || 'T1',
    };
    if (authCheck.scope === 'owner' || authCheck.scope === 'admin') {
      userView.email = targetUser.email;
      userView.phone = targetUser.phone;
    }

    return res.status(200).json({
      success: true,
      data: {
        user: userView,
        profile: sanitized,
        completion,
        progress,
      },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * PATCH /profile/admin/tier/:userId
 */
exports.updateUserTier = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { tier, reason } = req.body;

    if (!isValidObjectId(userId)) {
      return res.status(400).json({ success: false, message: 'Invalid user ID format' });
    }

    const result = await profileService.changeUserTier(req.user, userId, tier, reason);
    return res.status(200).json({
      success: true,
      message: 'User tier updated successfully',
      data: result,
    });
  } catch (err) {
    if (err.statusCode) {
      return res.status(err.statusCode).json({ success: false, message: err.message });
    }
    next(err);
  }
};

/**
 * POST /profile/me/avatar
 */
exports.uploadAvatar = async (req, res, next) => {
  try {
    const { avatarUrl } = req.body;
    if (!avatarUrl || typeof avatarUrl !== 'string') {
      return res.status(400).json({ success: false, message: 'avatarUrl is required' });
    }

    const { profile } = await profileService.getOrCreateProfile(req.user._id);
    profile.avatarUrl = avatarUrl.trim();
    profile.avatarKey = `avatars/${req.user._id}-${Date.now()}`;
    await profile.save();

    return res.status(200).json({
      success: true,
      message: 'Avatar updated successfully',
      data: { avatarUrl: profile.avatarUrl },
    });
  } catch (err) {
    next(err);
  }
};

import crypto from 'node:crypto';
import { adminRepository } from './repository.js';
import { authRepository } from '../auth/repository.js';
import { hashPassword } from '../auth/password.js';
import { paymentsRepository } from '../payments/repository.js';
import { coursesService } from '../courses/service.js';
import { coursesRepository } from '../courses/repository.js';
import { communityService } from '../community/service.js';

function sanitizeUser(user) {
  const { password, passwordHash, resetPasswordToken, resetPasswordExpires, resetPasswordUsedAt, ...safe } = user;
  return safe;
}

function normalizeBranding(input = {}) {
  return {
    logoUrl: input.logoUrl || '',
    faviconUrl: input.faviconUrl || '',
    primaryColor: input.primaryColor || '#7c5cff',
    secondaryColor: input.secondaryColor || '#1f2a46',
    accentColor: input.accentColor || '#29d3ff',
    backgroundColor: input.backgroundColor || '#0b1020',
    textColor: input.textColor || '#e6ecff',
    fontFamily: input.fontFamily || 'Inter, system-ui, sans-serif'
  };
}

function deriveSubscriptionBadge(sub) {
  if (!sub) return { status: 'blocked', badge: 'Blocked' };
  if (sub.status === 'active') return { status: 'active', badge: 'Active' };
  if (sub.status === 'past_due') {
    const grace = sub.gracePeriodEndsAt ? new Date(sub.gracePeriodEndsAt).getTime() : 0;
    if (grace > Date.now()) return { status: 'past_due', badge: 'Awaiting Payment' };
    return { status: 'blocked', badge: 'Blocked' };
  }
  return { status: 'blocked', badge: 'Blocked' };
}

export const adminService = {
  getDashboardMetrics() {
    const users = authRepository.listUsers();
    const students = users.filter((u) => u.globalRole === 'STUDENT' && !u.deletedAt);
    const subscriptions = paymentsRepository.listSubscriptions();
    const activeSubscriptions = subscriptions.filter((s) => s.status === 'active').length;
    const canceledSubscriptions = subscriptions.filter((s) => s.status === 'canceled').length;
    const totalRevenue = subscriptions.reduce((sum, sub) => {
      if (sub.status === 'active' || sub.status === 'past_due') return sum + 49;
      return sum;
    }, 0);
    const revenueOverview = {
      monthlyEstimate: activeSubscriptions * 49,
      yearlyEstimate: activeSubscriptions * 49 * 12,
      totalRevenue
    };
    const completion = coursesRepository.getCompletionStats();
    return {
      totalUsers: users.filter((u) => !u.deletedAt).length,
      totalStudents: students.length,
      activeSubscriptions,
      canceledSubscriptions,
      revenueOverview,
      courseCompletionRate: completion.completionRate,
      completionSummary: completion,
      recentActivity: adminRepository.listActivities().slice(0, 20)
    };
  },

  listStudents(filters = {}) {
    const users = authRepository.listUsers().filter((u) => u.globalRole === 'STUDENT' && !u.deletedAt);
    const subscriptions = paymentsRepository.listSubscriptions();

    let rows = users.map((u) => {
      const sub = subscriptions
        .filter((s) => s.userId === u.id)
        .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())[0];
      const derived = deriveSubscriptionBadge(sub);
      return { ...sanitizeUser(u), subscription: sub || null, subscriptionStatus: derived.status, subscriptionBadge: derived.badge };
    });

    if (filters.country) rows = rows.filter((r) => String(r.country || '').toLowerCase() === String(filters.country).toLowerCase());
    if (filters.subscriptionStatus) rows = rows.filter((r) => r.subscriptionStatus === filters.subscriptionStatus);
    if (filters.active !== undefined) {
      const active = String(filters.active) === 'true';
      rows = rows.filter((r) => (r.status === 'ACTIVE') === active);
    }
    return rows;
  },

  createStudent(input) {
    const password = input.password || crypto.randomBytes(8).toString('base64url');
    const hash = hashPassword(password);
    const user = authRepository.saveUser({
      id: crypto.randomUUID(),
      email: input.email,
      password: hash,
      passwordHash: hash,
      status: input.status || 'ACTIVE',
      globalRole: 'STUDENT',
      name: input.name || '',
      country: input.country || null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      resetPasswordToken: null,
      resetPasswordExpires: null,
      resetPasswordUsedAt: null
    });
    coursesRepository.enrollUserInAllCourses(user.id);
    adminRepository.logActivity({ type: 'student_created', message: `Student ${user.email} created` });
    return { user: sanitizeUser(user), generatedPassword: input.password ? null : password };
  },

  updateStudent(id, patch) {
    const user = authRepository.findUserById(id);
    if (!user) throw new Error('Student not found');
    const next = { ...user, ...patch, updatedAt: new Date().toISOString() };
    if (patch.password) {
      const hash = hashPassword(patch.password);
      next.password = hash;
      next.passwordHash = hash;
    }
    const saved = authRepository.saveUser(next);
    adminRepository.logActivity({ type: 'student_updated', message: `Student ${saved.email} updated` });
    return sanitizeUser(saved);
  },

  deleteStudent(id) {
    const user = authRepository.findUserById(id);
    if (!user) throw new Error('Student not found');
    user.deletedAt = new Date().toISOString();
    user.status = 'DELETED';
    user.updatedAt = new Date().toISOString();
    authRepository.saveUser(user);
    adminRepository.logActivity({ type: 'student_deleted', message: `Student ${user.email} deleted` });
    return { ok: true };
  },

  sendEmailToStudents(userIds, subject, message) {
    const users = userIds.map((id) => authRepository.findUserById(id)).filter(Boolean);
    for (const user of users) {
      adminRepository.logOutboundEmail({ to: user.email, subject, message, from: 'admin-panel' });
    }
    adminRepository.logActivity({ type: 'bulk_email_sent', message: `Bulk email sent to ${users.length} students` });
    return { sent: users.length };
  },

  listSubscriptions() {
    const subs = paymentsRepository.listSubscriptions();
    return subs.map((s) => ({ ...s, badge: deriveSubscriptionBadge(s).badge }));
  },

  createTrack(input) {
    const item = coursesService.createTrack(input);
    adminRepository.logActivity({ type: 'track_created', message: `Track ${item.name || item.title || item.id} created` });
    return item;
  },

  createCourse(input) {
    const item = coursesService.createCourse(input);
    adminRepository.logActivity({ type: 'course_created', message: `Course ${item.title || item.id} created` });
    return item;
  },

  createModule(input) {
    const item = coursesService.createModule(input);
    adminRepository.logActivity({ type: 'module_created', message: `Module ${item.title || item.id} created` });
    return item;
  },

  createLesson(input) {
    const lesson = {
      ...input,
      localizations: (input.localizations || []).map((l) => ({
        locale: l.locale,
        provider: l.provider,
        sourceUrl: l.sourceUrl,
        embedCode: l.embedCode
      }))
    };
    const item = coursesService.createLesson(lesson);
    adminRepository.logActivity({ type: 'lesson_created', message: `Lesson ${item.title || item.id} created` });
    return item;
  },

  getStripeSettings() {
    return paymentsRepository.getConfig();
  },

  updateStripeSettings(settings) {
    const updated = paymentsRepository.updateConfig(settings);
    adminRepository.logActivity({ type: 'stripe_settings_updated', message: 'Stripe settings updated' });
    return updated;
  },

  listCheckoutPages(tenantId = 'default') {
    const branding = this.getBranding(tenantId);
    return adminRepository.listCheckoutPages().map((p) => ({
      ...p,
      customization: {
        ...(p.customization || {}),
        colors: {
          primary: p.customization?.colors?.primary || branding.primaryColor,
          secondary: p.customization?.colors?.secondary || branding.secondaryColor,
          accent: p.customization?.colors?.accent || branding.accentColor
        },
        logo: p.customization?.logo || branding.logoUrl || '',
        typography: p.customization?.typography || branding.fontFamily
      }
    }));
  },

  saveCheckoutPage(page, tenantId = 'default') {
    const branding = this.getBranding(tenantId);
    const merged = {
      ...page,
      customization: {
        ...(page.customization || {}),
        colors: {
          primary: page.customization?.colors?.primary || branding.primaryColor,
          secondary: page.customization?.colors?.secondary || branding.secondaryColor,
          accent: page.customization?.colors?.accent || branding.accentColor
        },
        logo: page.customization?.logo || branding.logoUrl || '',
        typography: page.customization?.typography || branding.fontFamily
      }
    };
    const item = adminRepository.saveCheckoutPage(merged);
    adminRepository.logActivity({ type: 'checkout_page_saved', message: `Checkout page ${item.name || item.id} saved` });
    return item;
  },

  listEmailTemplates(tenantId = 'default') {
    const branding = this.getBranding(tenantId);
    return adminRepository.listEmailTemplates().map((tpl) => ({
      ...tpl,
      logoUrl: tpl.logoUrl || branding.logoUrl || '',
      colors: {
        primary: tpl.colors?.primary || branding.primaryColor,
        secondary: tpl.colors?.secondary || branding.secondaryColor,
        button: tpl.colors?.button || branding.primaryColor
      }
    }));
  },

  getEmailSettings() {
    return adminRepository.getEmailSettings();
  },

  saveEmailSettings(settings) {
    const saved = adminRepository.saveEmailSettings(settings);
    adminRepository.logActivity({ type: 'email_settings_saved', message: 'SMTP settings updated' });
    return saved;
  },

  sendTestEmail(toEmail) {
    const smtp = adminRepository.getEmailSettings();
    adminRepository.logOutboundEmail({
      to: toEmail,
      subject: 'Test email from LMS Admin',
      message: 'This is a test email from admin SMTP settings.',
      smtpHost: smtp.host,
      smtpPort: smtp.port,
      from: 'admin-test'
    });
    adminRepository.logActivity({ type: 'test_email_sent', message: `Test email queued to ${toEmail}` });
    return { ok: true, queued: true };
  },

  saveEmailTemplate(template, tenantId = 'default') {
    const branding = this.getBranding(tenantId);
    const merged = {
      ...template,
      logoUrl: template.logoUrl || branding.logoUrl || '',
      colors: {
        primary: template.colors?.primary || branding.primaryColor,
        secondary: template.colors?.secondary || branding.secondaryColor,
        button: template.colors?.button || branding.primaryColor
      }
    };
    const item = adminRepository.saveEmailTemplate(merged);
    adminRepository.logActivity({ type: 'email_template_saved', message: `Email template ${item.name || item.id} saved` });
    return item;
  },

  listFiles() {
    return adminRepository.listFiles();
  },

  getBranding(tenantId = 'default') {
    return normalizeBranding(adminRepository.getBranding(tenantId));
  },

  saveBranding(tenantId = 'default', branding = {}) {
    const saved = adminRepository.saveBranding(tenantId, normalizeBranding(branding));
    adminRepository.logActivity({ type: 'branding_updated', message: `Branding updated for tenant ${tenantId}` });
    return saved;
  },

  uploadFile(fileMeta) {
    const item = adminRepository.saveFile(fileMeta);
    adminRepository.logActivity({ type: 'file_uploaded', message: `File ${item.name || item.id} uploaded` });
    return item;
  },

  listCommunityPosts() {
    return communityService.listModerationPosts();
  },

  moderateCommunityPost(postId, reason) {
    const adminUser = { id: 'admin', globalRole: 'ADMIN' };
    return communityService.deletePost({ user: adminUser, postId, reason: reason || 'Removed by admin moderation' });
  },
};

/**
 * RBAC middleware factory.
 * Usage:
 *   router.get('/admin', authenticateToken, requireRole('ADMIN'), handler)
 *   router.post('/property', authenticateToken, requireRole('LANDLORD', 'ADMIN'), handler)
 */
export const requireRole = (...roles) => (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Требуется авторизация' });
  }
  if (!roles.includes(req.user.role)) {
    return res.status(403).json({
      error: `Доступ запрещён. Требуется роль: ${roles.join(' или ')}`
    });
  }
  next();
};

/** Shortcut: только администратор */
export const requireAdmin = requireRole('ADMIN');

/** Shortcut: арендодатель или администратор */
export const requireLandlord = requireRole('LANDLORD', 'ADMIN');

export default requireRole;

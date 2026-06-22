import * as Notif from '../models/notificationModel.js';

export async function getNotifications(req, res) {
  try {
    const { id: userId, company_id } = req.user;
    const { unreadOnly = 'false' } = req.query;
    const notifications = await Notif.findForUser(userId, company_id, {
      unreadOnly: unreadOnly === 'true',
    });
    res.json(notifications);
  } catch (err) {
    console.error('[notif:getNotifications]', err);
    res.status(500).json({ message: 'Error interno del servidor.' });
  }
}

export async function getUnreadCount(req, res) {
  try {
    const { id: userId, company_id } = req.user;
    const count = await Notif.countUnread(userId, company_id);
    res.json({ count });
  } catch (err) {
    console.error('[notif:getUnreadCount]', err);
    res.status(500).json({ message: 'Error interno del servidor.' });
  }
}

export async function markRead(req, res) {
  try {
    const { id: userId } = req.user;
    const { id } = req.params;
    await Notif.markRead(id, userId);
    res.json({ message: 'Notificación marcada como leída.' });
  } catch (err) {
    console.error('[notif:markRead]', err);
    res.status(500).json({ message: 'Error interno del servidor.' });
  }
}

export async function markAllRead(req, res) {
  try {
    const { id: userId, company_id } = req.user;
    await Notif.markAllRead(userId, company_id);
    res.json({ message: 'Todas las notificaciones marcadas como leídas.' });
  } catch (err) {
    console.error('[notif:markAllRead]', err);
    res.status(500).json({ message: 'Error interno del servidor.' });
  }
}

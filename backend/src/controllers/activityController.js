import * as Activity from '../models/activityModel.js';

export async function getActivity(req, res) {
  try {
    const { company_id } = req.user;
    const { page = 1, limit = 50, action, entityType } = req.query;
    const result = await Activity.findAll(company_id, { page, limit, action, entityType });
    res.json(result);
  } catch (err) {
    console.error('[activity:getActivity]', err);
    res.status(500).json({ message: 'Error interno del servidor.' });
  }
}

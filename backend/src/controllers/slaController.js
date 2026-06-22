import * as SLA from '../models/slaModel.js';

const VALID_PRIORITIES = ['low', 'medium', 'high', 'critical'];

export async function getSLA(req, res) {
  try {
    const { company_id } = req.user;
    const sla = await SLA.findByCompany(company_id);
    res.json(sla);
  } catch (err) {
    console.error('[sla:getSLA]', err);
    res.status(500).json({ message: 'Error interno del servidor.' });
  }
}

export async function updateSLA(req, res) {
  try {
    const { company_id } = req.user;
    const { priority, response_hours, resolution_hours } = req.body;

    if (!VALID_PRIORITIES.includes(priority)) {
      return res.status(400).json({ message: 'Prioridad inválida.' });
    }
    if (!response_hours || !resolution_hours || response_hours < 1 || resolution_hours < 1) {
      return res.status(400).json({ message: 'Las horas deben ser valores positivos.' });
    }
    if (resolution_hours <= response_hours) {
      return res.status(400).json({ message: 'Las horas de resolución deben ser mayores a las de respuesta.' });
    }

    await SLA.upsert(company_id, priority, Number(response_hours), Number(resolution_hours));
    res.json({ message: 'SLA actualizado.' });
  } catch (err) {
    console.error('[sla:updateSLA]', err);
    res.status(500).json({ message: 'Error interno del servidor.' });
  }
}

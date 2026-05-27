import * as Ticket from '../models/ticketModel.js';

export async function getTickets(req, res) {
  const { id: userId, company_id, role } = req.user;
  const tickets = await Ticket.findAll(company_id, userId, role);
  res.json(tickets);
}

export async function getTicket(req, res) {
  const { company_id, id: userId, role } = req.user;
  const ticket = await Ticket.findById(req.params.id, company_id);

  if (!ticket) return res.status(404).json({ message: 'Ticket no encontrado.' });

  // El usuario solo puede ver sus propios tickets
  if (role === 'user' && ticket.creator_id !== userId) {
    return res.status(403).json({ message: 'No tienes permiso para ver este ticket.' });
  }

  // El agente solo puede ver los que tiene asignados
  if (role === 'agent' && ticket.agent_id !== userId) {
    return res.status(403).json({ message: 'No tienes permiso para ver este ticket.' });
  }

  // Ocultar notas internas a usuarios normales
  if (role === 'user') {
    ticket.comments = ticket.comments.filter(c => !c.internal);
  }

  res.json(ticket);
}

export async function createTicket(req, res) {
  const { id: createdBy, company_id } = req.user;
  const { title, description, priority, categoryId } = req.body;

  if (!title || !description) {
    return res.status(400).json({ message: 'Título y descripción son requeridos.' });
  }

  const ticketId = await Ticket.create({ companyId: company_id, categoryId, createdBy, title, description, priority });
  res.status(201).json({ id: ticketId });
}

export async function updateTicket(req, res) {
  const { company_id, id: userId, role } = req.user;
  const { id } = req.params;
  const { status, priority, assigned_to, category_id } = req.body;

  const allowedFields = {};

  if (role === 'agent') {
    // Agente solo puede cambiar el estado
    if (status) allowedFields.status = status;
  } else {
    // Manager y admin pueden cambiar todo
    if (status)      allowedFields.status      = status;
    if (priority)    allowedFields.priority     = priority;
    if (assigned_to !== undefined) allowedFields.assigned_to = assigned_to;
    if (category_id !== undefined) allowedFields.category_id = category_id;
  }

  const result = await Ticket.update(id, company_id, allowedFields, userId);
  if (result === null) return res.status(404).json({ message: 'Ticket no encontrado.' });

  res.json({ message: 'Ticket actualizado.' });
}

export async function commentTicket(req, res) {
  const { id: userId, company_id, role } = req.user;
  const { id: ticketId } = req.params;
  const { body, internal } = req.body;

  if (!body) return res.status(400).json({ message: 'El comentario no puede estar vacío.' });

  // Solo agentes, managers y admins pueden crear notas internas
  const isInternal = internal && ['agent', 'manager', 'admin'].includes(role);

  // Verificar que el ticket pertenece a la empresa
  const ticket = await Ticket.findById(ticketId, company_id);
  if (!ticket) return res.status(404).json({ message: 'Ticket no encontrado.' });

  // El usuario solo puede comentar en sus propios tickets
  if (role === 'user' && ticket.creator_id !== userId) {
    return res.status(403).json({ message: 'No tienes permiso para comentar en este ticket.' });
  }

  const commentId = await Ticket.addComment(ticketId, userId, body, isInternal);
  res.status(201).json({ id: commentId });
}

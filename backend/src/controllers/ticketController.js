import * as Ticket from '../models/ticketModel.js';

export async function getTickets(req, res) {
  const { id: userId, role } = req.user;
  const tickets = await Ticket.findAll(userId, role);
  res.json(tickets);
}

export async function getTicket(req, res) {
  const { id: userId, role } = req.user;
  const ticket = await Ticket.findById(req.params.id);

  if (!ticket) return res.status(404).json({ message: 'Ticket no encontrado.' });

  if (role === 'user' && ticket.creator_id !== userId) {
    return res.status(403).json({ message: 'No tienes permiso para ver este ticket.' });
  }
  if (role === 'technician' && ticket.assignee_id !== userId) {
    return res.status(403).json({ message: 'No tienes permiso para ver este ticket.' });
  }

  if (role === 'user') {
    ticket.comments = ticket.comments.filter(c => !c.is_internal);
  }

  res.json(ticket);
}

export async function createTicket(req, res) {
  const { id: userId } = req.user;
  const { title, description, priority, categoryId } = req.body;

  if (!title || !description) {
    return res.status(400).json({ message: 'Título y descripción son requeridos.' });
  }

  const ticketId = await Ticket.create({ title, description, priority, categoryId, userId });
  res.status(201).json({ id: ticketId });
}

export async function updateTicket(req, res) {
  const { role } = req.user;
  const { id } = req.params;
  const { status, priority, assigned_to, category_id } = req.body;

  const fields = {};

  if (role === 'technician') {
    if (status) fields.status = status;
  } else {
    // admin puede cambiar todo
    if (status      !== undefined) fields.status      = status;
    if (priority    !== undefined) fields.priority     = priority;
    if (assigned_to !== undefined) fields.assigned_to  = assigned_to;
    if (category_id !== undefined) fields.category_id  = category_id;
  }

  const result = await Ticket.update(id, fields);
  if (result === null) return res.status(404).json({ message: 'Ticket no encontrado.' });

  res.json({ message: 'Ticket actualizado.' });
}

export async function commentTicket(req, res) {
  const { id: userId, role } = req.user;
  const { id: ticketId } = req.params;
  const { content, is_internal } = req.body;

  if (!content) return res.status(400).json({ message: 'El comentario no puede estar vacío.' });

  const ticket = await Ticket.findById(ticketId);
  if (!ticket) return res.status(404).json({ message: 'Ticket no encontrado.' });

  if (role === 'user' && ticket.creator_id !== userId) {
    return res.status(403).json({ message: 'No tienes permiso para comentar en este ticket.' });
  }

  const isInternal = is_internal && ['technician', 'admin'].includes(role);
  const commentId  = await Ticket.addComment(ticketId, userId, content, isInternal);

  res.status(201).json({ id: commentId });
}

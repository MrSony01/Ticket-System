import * as Ticket from '../models/ticketModel.js';
import * as Activity from '../models/activityModel.js';
import * as Notif from '../models/notificationModel.js';
import * as User from '../models/userModel.js';
import { sendMail } from '../services/emailService.js';
import pool from '../config/db.js';

export async function getTickets(req, res) {
  const { id: userId, role, company_id } = req.user;
  const { status, priority, categoryId, assignedTo, search, page, limit } = req.query;
  const result = await Ticket.findAll(userId, role, company_id, {
    status, priority, categoryId, assignedTo, search, page, limit,
  });
  res.json(result);
}

export async function getTicket(req, res) {
  const { id: userId, role, company_id } = req.user;
  const ticket = await Ticket.findById(req.params.id, company_id);

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

export async function getTicketActivity(req, res) {
  const { id: userId, role, company_id } = req.user;
  const { id } = req.params;

  const ticket = await Ticket.findById(id, company_id);
  if (!ticket) return res.status(404).json({ message: 'Ticket no encontrado.' });

  if (role === 'user' && ticket.creator_id !== userId) {
    return res.status(403).json({ message: 'No tienes permiso para ver este ticket.' });
  }
  if (role === 'technician' && ticket.assignee_id !== userId) {
    return res.status(403).json({ message: 'No tienes permiso para ver este ticket.' });
  }

  const logs = await Activity.findForEntity(company_id, 'ticket', Number(id));
  res.json(logs);
}

export async function createTicket(req, res) {
  const { id: userId, company_id } = req.user;
  const { title, description, priority, categoryId } = req.body;

  if (!title || !description) {
    return res.status(400).json({ message: 'Título y descripción son requeridos.' });
  }

  const ticketId = await Ticket.create({ title, description, priority, categoryId, userId, companyId: company_id });

  Activity.log({
    companyId: company_id, userId, action: 'ticket_created',
    entityType: 'ticket', entityId: ticketId,
    metadata: { title, priority: priority ?? 'medium' },
  });

  res.status(201).json({ id: ticketId });
}

export async function updateTicket(req, res) {
  const { id: userId, role, company_id } = req.user;
  const { id } = req.params;
  const { status, priority, assigned_to, category_id } = req.body;

  const fields = {};

  if (role === 'technician') {
    if (status) fields.status = status;
  } else {
    if (status      !== undefined) fields.status      = status;
    if (priority    !== undefined) fields.priority     = priority;
    if (assigned_to !== undefined) fields.assigned_to  = assigned_to;
    if (category_id !== undefined) fields.category_id  = category_id;
  }

  const result = await Ticket.update(id, company_id, fields);
  if (result === null) return res.status(404).json({ message: 'Ticket no encontrado.' });

  Activity.log({
    companyId: company_id, userId, action: 'ticket_updated',
    entityType: 'ticket', entityId: Number(id),
    metadata: fields,
  });

  // Notify assignee when ticket is assigned
  if (fields.assigned_to) {
    Notif.create({
      userId: fields.assigned_to,
      companyId: company_id,
      type: 'ticket_assigned',
      title: 'Ticket asignado',
      message: `Se te ha asignado el ticket #${id}`,
      entityId: Number(id),
    });
    User.findById(fields.assigned_to, company_id).then(assignee => {
      if (assignee?.email) {
        sendMail({
          to: assignee.email,
          subject: `Ticket asignado #${id}`,
          html: `<p>Se te ha asignado el ticket <strong>#${id}</strong>.</p>`,
        });
      }
    }).catch(() => {});
  }

  // Notify when status changes
  if (fields.status) {
    const ticket = await Ticket.findById(id, company_id);
    if (ticket && ticket.creator_id !== userId) {
      Notif.create({
        userId: ticket.creator_id,
        companyId: company_id,
        type: 'ticket_updated',
        title: 'Estado de ticket actualizado',
        message: `Tu ticket #${id} cambió a "${fields.status}"`,
        entityId: Number(id),
      });
      User.findById(ticket.creator_id, company_id).then(creator => {
        if (creator?.email) {
          sendMail({
            to: creator.email,
            subject: `Actualización de ticket #${id}`,
            html: `<p>Tu ticket <strong>#${id}</strong> cambió a "${fields.status}".</p>`,
          });
        }
      }).catch(() => {});
    }
  }

  res.json({ message: 'Ticket actualizado.' });
}

export async function commentTicket(req, res) {
  const { id: userId, role, company_id } = req.user;
  const { id: ticketId } = req.params;
  const { content, is_internal } = req.body;

  if (!content) return res.status(400).json({ message: 'El comentario no puede estar vacío.' });

  const ticket = await Ticket.findById(ticketId, company_id);
  if (!ticket) return res.status(404).json({ message: 'Ticket no encontrado.' });

  if (role === 'user' && ticket.creator_id !== userId) {
    return res.status(403).json({ message: 'No tienes permiso para comentar en este ticket.' });
  }

  const isInternal = is_internal && ['technician', 'admin'].includes(role);
  const commentId  = await Ticket.addComment(ticketId, userId, content, isInternal);

  Activity.log({
    companyId: company_id, userId, action: 'comment_added',
    entityType: 'ticket', entityId: Number(ticketId),
    metadata: { is_internal: isInternal },
  });

  // Notify ticket creator (if commenter is not the creator)
  if (ticket.creator_id !== userId && !isInternal) {
    Notif.create({
      userId: ticket.creator_id,
      companyId: company_id,
      type: 'comment_added',
      title: 'Nuevo comentario',
      message: `Hay un nuevo comentario en tu ticket #${ticketId}`,
      entityId: Number(ticketId),
    });
    User.findById(ticket.creator_id, company_id).then(creator => {
      if (creator?.email) {
        sendMail({
          to: creator.email,
          subject: `Nuevo comentario en ticket #${ticketId}`,
          html: `<p>Hay un nuevo comentario en tu ticket <strong>#${ticketId}</strong>.</p>`,
        });
      }
    }).catch(() => {});
  }

  // Notify assignee (if exists and is not the commenter)
  if (ticket.assignee_id && ticket.assignee_id !== userId && ticket.assignee_id !== ticket.creator_id) {
    Notif.create({
      userId: ticket.assignee_id,
      companyId: company_id,
      type: 'comment_added',
      title: 'Nuevo comentario',
      message: `Hay un nuevo comentario en el ticket #${ticketId}`,
      entityId: Number(ticketId),
    });
    User.findById(ticket.assignee_id, company_id).then(assignee => {
      if (assignee?.email) {
        sendMail({
          to: assignee.email,
          subject: `Nuevo comentario en ticket #${ticketId}`,
          html: `<p>Hay un nuevo comentario en el ticket <strong>#${ticketId}</strong>.</p>`,
        });
      }
    }).catch(() => {});
  }

  res.status(201).json({ id: commentId });
}

export async function exportTickets(req, res) {
  const { company_id } = req.user;
  const { status, priority, categoryId, search } = req.query;

  let where = 'WHERE t.company_id = ?';
  const params = [company_id];

  if (status)     { where += ' AND t.status = ?';      params.push(status); }
  if (priority)   { where += ' AND t.priority = ?';    params.push(priority); }
  if (categoryId) { where += ' AND t.category_id = ?'; params.push(Number(categoryId)); }
  if (search)     { where += ' AND t.title LIKE ?';    params.push(`%${search}%`); }

  const [rows] = await pool.execute(
    `SELECT t.id, t.title, t.status, t.priority, t.created_at, t.updated_at,
            c.name AS category,
            u.name AS creator, u.email AS creator_email,
            a.name AS assignee
     FROM tickets t
     LEFT JOIN categories c ON c.id = t.category_id
     JOIN  users u          ON u.id = t.user_id
     LEFT JOIN users a      ON a.id = t.assigned_to
     ${where}
     ORDER BY t.created_at DESC
     LIMIT 5000`,
    params
  );

  const headers = ['ID', 'Título', 'Estado', 'Prioridad', 'Categoría', 'Creador', 'Email creador', 'Asignado a', 'Creado', 'Actualizado'];
  const csvRows = [
    headers.join(','),
    ...rows.map(r => [
      r.id,
      `"${(r.title ?? '').replace(/"/g, '""')}"`,
      r.status,
      r.priority,
      `"${(r.category ?? '').replace(/"/g, '""')}"`,
      `"${(r.creator ?? '').replace(/"/g, '""')}"`,
      r.creator_email,
      `"${(r.assignee ?? '').replace(/"/g, '""')}"`,
      new Date(r.created_at).toISOString(),
      new Date(r.updated_at).toISOString(),
    ].join(',')),
  ];

  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', 'attachment; filename="tickets.csv"');
  res.send('﻿' + csvRows.join('\r\n'));
}

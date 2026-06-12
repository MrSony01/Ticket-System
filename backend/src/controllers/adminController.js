import bcrypt from 'bcryptjs';
import { randomBytes } from 'crypto';
import * as Admin from '../models/adminModel.js';
import * as Group from '../models/groupModel.js';
import pool from '../config/db.js';

const VALID_ROLES = ['user', 'technician', 'admin'];

export async function getUsers(req, res) {
  try {
    const { company_id } = req.user;
    const users = await Admin.findAllUsers(company_id);
    res.json(users);
  } catch (err) {
    console.error('[admin:getUsers]', err);
    res.status(500).json({ message: 'Error interno del servidor.' });
  }
}

export async function createUser(req, res) {
  try {
    const { company_id } = req.user;
    const { name, email, password, role = 'user', group_id, group_name } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Nombre, email y contraseña son requeridos.' });
    }
    if (!VALID_ROLES.includes(role)) {
      return res.status(400).json({ message: 'Rol inválido.' });
    }

    const exists = await Admin.emailExistsInCompany(email, company_id);
    if (exists) {
      return res.status(409).json({ message: 'Ya existe un usuario con ese email en esta empresa.' });
    }

    // Resolver grupo: crear si viene group_name y no existe
    let resolvedGroupId = group_id ?? null;
    let resolvedGroupName = null;

    if (group_name && group_name.trim()) {
      const trimmed = group_name.trim();
      const existing = await Group.findByName(trimmed, company_id);
      if (existing) {
        resolvedGroupId   = existing.id;
        resolvedGroupName = existing.name;
      } else {
        resolvedGroupId   = await Group.create(trimmed, company_id);
        resolvedGroupName = trimmed;
      }
    } else if (group_id) {
      const groups = await Group.findAll(company_id);
      const found  = groups.find(g => g.id === Number(group_id));
      resolvedGroupName = found?.name ?? null;
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const userId = await Admin.createUser({
      name, email, hashedPassword, role,
      companyId: company_id,
      groupId: resolvedGroupId,
    });

    res.status(201).json({ id: userId, name, email, role, group_id: resolvedGroupId, group_name: resolvedGroupName });
  } catch (err) {
    console.error('[admin:createUser]', err);
    res.status(500).json({ message: 'Error interno del servidor.' });
  }
}

export async function getGroups(req, res) {
  try {
    const { company_id } = req.user;
    const groups = await Group.findAll(company_id);
    res.json(groups);
  } catch (err) {
    console.error('[admin:getGroups]', err);
    res.status(500).json({ message: 'Error interno del servidor.' });
  }
}

export async function createGroup(req, res) {
  try {
    const { company_id } = req.user;
    const { name } = req.body;
    if (!name?.trim()) return res.status(400).json({ message: 'El nombre del grupo es requerido.' });

    const existing = await Group.findByName(name.trim(), company_id);
    if (existing) return res.status(409).json({ message: 'Ya existe un grupo con ese nombre.' });

    const id = await Group.create(name.trim(), company_id);
    res.status(201).json({ id, name: name.trim() });
  } catch (err) {
    console.error('[admin:createGroup]', err);
    res.status(500).json({ message: 'Error interno del servidor.' });
  }
}

export async function deleteGroup(req, res) {
  try {
    const { company_id } = req.user;
    const { id } = req.params;
    const deleted = await Group.remove(id, company_id);
    if (!deleted) return res.status(404).json({ message: 'Grupo no encontrado.' });
    res.json({ message: 'Grupo eliminado.' });
  } catch (err) {
    console.error('[admin:deleteGroup]', err);
    res.status(500).json({ message: 'Error interno del servidor.' });
  }
}

export async function getStats(req, res) {
  try {
    const { company_id } = req.user;
    const [[userRows], [groupRows], [ticketRows], [categoryRows]] = await Promise.all([
      pool.execute(
        `SELECT role, COUNT(*) as count FROM users WHERE company_id = ? GROUP BY role`,
        [company_id]
      ),
      pool.execute(
        `SELECT COUNT(*) as total FROM \`groups\` WHERE company_id = ?`,
        [company_id]
      ),
      pool.execute(
        `SELECT status, COUNT(*) as count FROM tickets WHERE company_id = ? GROUP BY status`,
        [company_id]
      ),
      pool.execute(
        `SELECT COUNT(*) as total FROM categories WHERE company_id = ?`,
        [company_id]
      ),
    ]);

    const users = { total: 0, admin: 0, technician: 0, user: 0 };
    userRows.forEach(r => { users[r.role] = r.count; users.total += r.count; });

    const tickets = { total: 0, open: 0, in_progress: 0, resolved: 0, closed: 0 };
    ticketRows.forEach(r => { tickets[r.status] = r.count; tickets.total += r.count; });

    res.json({ users, groups: groupRows[0].total, categories: categoryRows[0].total, tickets });
  } catch (err) {
    console.error('[admin:getStats]', err);
    res.status(500).json({ message: 'Error interno del servidor.' });
  }
}

export async function updateUserGroup(req, res) {
  try {
    const { company_id } = req.user;
    const { id } = req.params;
    const { group_id } = req.body;
    const updated = await Admin.updateUserGroup(id, company_id, group_id ?? null);
    if (!updated) return res.status(404).json({ message: 'Usuario no encontrado.' });
    res.json({ message: 'Grupo actualizado.' });
  } catch (err) {
    console.error('[admin:updateUserGroup]', err);
    res.status(500).json({ message: 'Error interno del servidor.' });
  }
}

export async function updateRole(req, res) {
  try {
    const { company_id, id: adminId } = req.user;
    const { id } = req.params;
    const { role } = req.body;

    if (!VALID_ROLES.includes(role)) {
      return res.status(400).json({ message: 'Rol inválido.' });
    }
    if (Number(id) === adminId) {
      return res.status(400).json({ message: 'No puedes cambiar tu propio rol.' });
    }

    const updated = await Admin.updateUserRole(id, company_id, role);
    if (!updated) return res.status(404).json({ message: 'Usuario no encontrado.' });

    res.json({ message: 'Rol actualizado.' });
  } catch (err) {
    console.error('[admin:updateRole]', err);
    res.status(500).json({ message: 'Error interno del servidor.' });
  }
}

export async function createInvite(req, res) {
  try {
    const { company_id } = req.user;
    const { name, email, role = 'user', group_id } = req.body;

    if (!name || !email) {
      return res.status(400).json({ message: 'Nombre y email son requeridos.' });
    }
    if (!['user', 'technician', 'admin'].includes(role)) {
      return res.status(400).json({ message: 'Rol inválido.' });
    }

    const exists = await Admin.emailExistsInCompany(email, company_id);
    if (exists) return res.status(409).json({ message: 'Ya existe un usuario con ese email.' });

    const invite_token  = randomBytes(32).toString('hex');
    const placeholder   = await bcrypt.hash(randomBytes(16).toString('hex'), 4);

    const userId = await Admin.createUser({
      name, email, hashedPassword: placeholder,
      role, companyId: company_id, groupId: group_id ?? null,
    });
    await pool.execute('UPDATE users SET invite_token = ? WHERE id = ?', [invite_token, userId]);

    res.status(201).json({ id: userId, name, email, role, invite_token });
  } catch (err) {
    console.error('[admin:createInvite]', err);
    res.status(500).json({ message: 'Error interno del servidor.' });
  }
}

export async function getCompanySettings(req, res) {
  try {
    const { company_id } = req.user;
    const company = await Admin.getCompany(company_id);
    if (!company) return res.status(404).json({ message: 'Empresa no encontrada.' });
    res.json(company);
  } catch (err) {
    console.error('[admin:getCompanySettings]', err);
    res.status(500).json({ message: 'Error interno del servidor.' });
  }
}

export async function updateCompanySettings(req, res) {
  try {
    const { company_id, id: adminId } = req.user;
    const { name, password } = req.body;

    const trimmedName = name?.trim();
    if (!trimmedName)           return res.status(400).json({ message: 'El nombre de la empresa no puede estar vacío.' });
    if (trimmedName.length > 150) return res.status(400).json({ message: 'El nombre no puede superar los 150 caracteres.' });
    if (!password)              return res.status(400).json({ message: 'La contraseña actual es requerida para confirmar este cambio.' });

    // Verify the admin's current password
    const [[adminRow]] = await pool.execute(
      'SELECT password FROM users WHERE id = ? AND company_id = ?',
      [adminId, company_id]
    );
    if (!adminRow) return res.status(404).json({ message: 'Administrador no encontrado.' });

    const valid = await bcrypt.compare(password, adminRow.password);
    if (!valid) return res.status(403).json({ message: 'Contraseña incorrecta. No se aplicaron los cambios.' });

    await Admin.updateCompanyName(company_id, trimmedName);
    res.json({ message: 'Nombre de empresa actualizado correctamente.', name: trimmedName });
  } catch (err) {
    console.error('[admin:updateCompanySettings]', err);
    res.status(500).json({ message: 'Error interno del servidor.' });
  }
}

export async function deleteUser(req, res) {
  try {
    const { company_id, id: adminId } = req.user;
    const { id } = req.params;

    if (Number(id) === adminId) {
      return res.status(400).json({ message: 'No puedes eliminar tu propia cuenta.' });
    }

    const deleted = await Admin.deleteUser(id, company_id);
    if (!deleted) return res.status(404).json({ message: 'Usuario no encontrado.' });

    res.json({ message: 'Usuario eliminado.' });
  } catch (err) {
    console.error('[admin:deleteUser]', err);
    res.status(500).json({ message: 'Error interno del servidor.' });
  }
}

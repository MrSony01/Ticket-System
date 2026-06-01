import bcrypt from 'bcryptjs';
import * as Admin from '../models/adminModel.js';
import * as Group from '../models/groupModel.js';

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

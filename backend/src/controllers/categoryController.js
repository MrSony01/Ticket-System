import * as Category from '../models/categoryModel.js';

export async function getCategories(req, res) {
  const { company_id } = req.user;
  const categories = await Category.findAll(company_id);
  res.json(categories);
}

export async function createCategory(req, res) {
  const { company_id } = req.user;
  const { name } = req.body;
  if (!name) return res.status(400).json({ message: 'El nombre es requerido.' });

  const id = await Category.create(name, company_id);
  res.status(201).json({ id, name });
}

export async function deleteCategory(req, res) {
  const { company_id } = req.user;
  const deleted = await Category.remove(req.params.id, company_id);
  if (!deleted) return res.status(404).json({ message: 'Categoría no encontrada.' });
  res.json({ message: 'Categoría eliminada.' });
}

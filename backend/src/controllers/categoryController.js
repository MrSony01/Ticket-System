import * as Category from '../models/categoryModel.js';

export async function getCategories(req, res) {
  const categories = await Category.findAll();
  res.json(categories);
}

export async function createCategory(req, res) {
  const { name } = req.body;
  if (!name) return res.status(400).json({ message: 'El nombre es requerido.' });

  const id = await Category.create(name);
  res.status(201).json({ id, name });
}

export async function deleteCategory(req, res) {
  const deleted = await Category.remove(req.params.id);
  if (!deleted) return res.status(404).json({ message: 'Categoría no encontrada.' });
  res.json({ message: 'Categoría eliminada.' });
}

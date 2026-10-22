import Service from '../models/service.model.js';

export const getAllServices = async (req, res) => {
  try {
    const services = await Service.find();
    res.json(services);
  } catch {
    res.status(500).json({ error: 'Error interno del servidor.' });
  }
};

export const createService = async (req, res) => {
  try {
    const { name, description, price, image, duration } = req.body;
    if (typeof name !== 'string' || !name.trim() || typeof price !== 'string' || !price.trim()) {
      return res.status(400).json({ error: 'El nombre y precio son requeridos.' });
    }
    const newService = await Service.create({ name: name.trim(), description, price: price.trim(), image, duration });
    res.status(201).json(newService);
  } catch {
    res.status(500).json({ error: 'Error interno del servidor.' });
  }
};

export const updateService = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, price, image, duration } = req.body;
    const updated = await Service.findByIdAndUpdate(
      id,
      { name, description, price, image, duration },
      { new: true, runValidators: true }
    );
    if (!updated) {
      return res.status(404).json({ error: 'Servicio no encontrado.' });
    }
    res.json(updated);
  } catch {
    res.status(500).json({ error: 'Error interno del servidor.' });
  }
};

export const deleteService = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await Service.findByIdAndDelete(id);
    if (!deleted) {
      return res.status(404).json({ error: 'Servicio no encontrado.' });
    }
    res.json({ success: true, message: 'Servicio eliminado.' });
  } catch {
    res.status(500).json({ error: 'Error interno del servidor.' });
  }
};

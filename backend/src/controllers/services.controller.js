import Service from '../models/service.model.js';

export const getAllServices = async (req, res) => {
  try {
    const services = await Service.find();
    res.json(services);
  } catch (error) {
    res.status(500).json({ error: 'Error interno del servidor.' });
  }
};

export const createService = async (req, res) => {
  try {
    const { name, description, price, image } = req.body;
    if (!name || !price) {
      return res.status(400).json({ error: 'El nombre y precio son requeridos.' });
    }
    const newService = await Service.create({ name, description, price, image });
    res.status(201).json(newService);
  } catch (error) {
    res.status(500).json({ error: 'Error interno del servidor.' });
  }
};

export const updateService = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, price, image } = req.body;
    const updated = await Service.findByIdAndUpdate(
      id,
      { name, description, price, image },
      { new: true }
    );
    if (!updated) {
      return res.status(404).json({ error: 'Servicio no encontrado.' });
    }
    res.json(updated);
  } catch (error) {
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
  } catch (error) {
    res.status(500).json({ error: 'Error interno del servidor.' });
  }
};

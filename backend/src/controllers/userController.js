const Joi = require('joi');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const updateProfileSchema = Joi.object({
  name: Joi.string().optional(),
  phone: Joi.string().optional()
});

const getProfile = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { id: true, email: true, name: true, phone: true, role: true, createdAt: true }
    });
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

const updateProfile = async (req, res) => {
  try {
    const { error } = updateProfileSchema.validate(req.body);
    if (error) return res.status(400).json({ error: error.details[0].message });

    const { name, phone } = req.body;

    const user = await prisma.user.update({
      where: { id: req.user.id },
      data: { name, phone },
      select: { id: true, email: true, name: true, phone: true, role: true }
    });

    res.json(user);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = { getProfile, updateProfile };
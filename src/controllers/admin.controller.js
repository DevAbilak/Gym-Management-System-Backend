const { registerUser } = require('../services/auth.service');

const adminRegister = async (req, res, next) => {
  try {
    const payload = req.body;

    if (
      !payload.email ||
      !payload.password ||
      !payload.first_name ||
      !payload.last_name
    ) {
      return res.status(400).json({
        error: 'Email, password, first_name, and last_name are required',
      });
    }

    // Ensure role is provided (admin must specify it)
    if (!payload.role) {
      return res.status(400).json({
        error: 'Role is required. Must be: member, trainer or reception',
      });
    }

    const validRoles = ['member', 'trainer', 'reception'];
    if (!validRoles.includes(payload.role)) {
      return res.status(400).json({
        error: `Invalid role. Must be one of: ${validRoles.join(', ')}`,
      });
    }

    const result = await registerUser(payload);

    // Add admin note to response
    result.message = `[Admin] ${result.message}`;

    res.status(201).json(result);
  } catch (error) {
    if (error.message === 'Email already registered') {
      return res.status(400).json({ error: error.message });
    }
    if (error.message.startsWith('Invalid role')) {
      return res.status(400).json({ error: error.message });
    }
    next(error);
  }
};

module.exports = {
  adminRegister,
};

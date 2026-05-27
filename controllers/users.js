const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

module.exports = {
  createUser,
  loginUser,
  refreshToken,
  logoutUser,
  updateName,
};

async function createUser(req, res) {
  try {
    console.log(`[register] attempt for email ${req.body.email}`);
    const hashed = await bcrypt.hash(req.body.password, 12);
    const user = await User.create({ ...req.body, password: hashed });
    const { password: _, ...safeUser } = user.toObject();
    console.log(`[register] success for email ${req.body.email}`);
    res.status(201).json(safeUser);
  } catch (err) {
    console.error(`[register] error: ${err.message}`);
    res.status(400).json({ message: err.message });
  }
}

async function loginUser(req, res) {
  try {
    console.log(`[login] attempt for email ${req.body.email}`);
    const user = await User.findOne({ email: req.body.email });

    if (!user) {
      console.warn(`[login] no user found for email ${req.body.email}`);
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const match = await bcrypt.compare(req.body.password, user.password);
    if (!match) {
      console.warn(`[login] wrong password for email ${req.body.email}`);
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const { password: _, ...safeUser } = user.toObject();

    const accessToken = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '15m' });
    const refresh = jwt.sign({ id: user._id }, process.env.JWT_REFRESH_SECRET, { expiresIn: '7d' });

    res.cookie('refreshToken', refresh, {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    console.log(`[login] success for user ${user._id}`);
    res.status(200).json({ user: safeUser, accessToken });
  } catch (err) {
    console.error(`[login] error: ${err.message}`);
    res.status(500).json({ message: err.message });
  }
}

async function refreshToken(req, res) {
  const token = req.cookies.refreshToken;
  if (!token) {
    console.warn('[refresh] no refresh token cookie present');
    return res.status(401).json({ message: 'No refresh token' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
    const user = await User.findById(decoded.id).select('-password');
    if (!user) {
      console.warn(`[refresh] user ${decoded.id} not found`);
      return res.status(401).json({ message: 'User not found' });
    }

    const accessToken = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '15m' });
    console.log(`[refresh] issued new access token for user ${user._id}`);
    res.status(200).json({ user, accessToken });
  } catch (err) {
    console.warn(`[refresh] invalid token: ${err.message}`);
    res.clearCookie('refreshToken', { httpOnly: true, secure: true, sameSite: 'none' });
    res.status(401).json({ message: 'Invalid refresh token' });
  }
}

async function logoutUser(req, res) {
  console.log('[logout] clearing refresh token cookie');
  res.clearCookie('refreshToken', { httpOnly: true, secure: true, sameSite: 'none' });
  res.status(200).json({ message: 'Logged out' });
}

async function updateName(req, res) {
  try {
    const user = await User.findByIdAndUpdate(req.body.id, { name: req.body.name }, { new: true }).select('-password');
    console.log(`[updateName] updated name for user ${req.body.id}`);
    res.status(200).json(user);
  } catch (err) {
    console.error(`[updateName] error: ${err.message}`);
    res.status(400).json({ message: err.message });
  }
}

const User = require('../models/User');


module.exports = {
  createUser,
  loginUser,
  updateName
};

const users = []

// Create a single user
async function createUser(req, res) {
  try {
    const user = await User.create(req.body);

    res.status(200).json(user);
  } catch (err) {
    res.status(400).json(err);
  }
}

// Login to front end by checking if credentials are correct
async function loginUser(req, res) {
  try {

    const user = await User.findOne({ email: req.body.email })

    if (!user) {
      res.status(400).json(false)
      return
    }

    if (user.password === req.body.password) {

      res.status(200).json(user)
    } else {
      res.status(400).json(false)
    }

  } catch (err) {
    console.log(err)
  }

}

// Update users name
async function updateName(req, res) {
  try {
    const user = await User.findByIdAndUpdate(req.body.id, { name: req.body.name }, { new: true })

    res.status(200).json(user)
  } catch (err) {
    res.status(400).json(err);
  }
}
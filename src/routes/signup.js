
const express = require('express');
const router = express.Router();

const users = [];

router.post('/v1/signup', (req, res) => {
  const { username, password } = req.body;
  users.push({ username, password });
  res.json({ message: 'User registered successfully' });
});


module.exports = router;
require('dotenv').config();
const cors = require('cors');
const cookieParser = require('cookie-parser');
const express = require('express');
const app = express();
const PORT = process.env.PORT || 8000;
const userRouter = require('./routes/users.js');
const songifyRouter = require('./routes/songify.js');

app.use(cors({
  origin: process.env.CLIENT_URL,
  credentials: true,
}));
app.use((req, _res, next) => {
  console.log(`[${req.method}] ${req.path} — origin: ${req.headers.origin || 'none'}`);
  next();
});
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use('/users', userRouter);
app.use('/songify', songifyRouter);

app.get('/', (req, res) => res.send('OK'));

app.use((err, req, res, next) => {
  res.status(500).json({ message: 'Something went wrong' });
});

app.listen(PORT, () => {
  console.log(`Listening on port: ${PORT}`);
});

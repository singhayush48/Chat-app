const express = require('express');
const app = express();
const port = 3000;
const userRoutes = require('./routes/userRoutes');
const authRoutes = require('./routes/authRoute');
const messagesRoutes = require('./routes/messageRoute.js');
const cookieParser = require('cookie-parser');


const cors = require('cors');
app.use(cors({
  origin: 'http://localhost:5173', // your Vite dev server URL
  credentials: true
}));


app.use(require('cookie-parser')());

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/user', userRoutes);
app.use('/api/auth', authRoutes);
app.use('/api',messagesRoutes);

app.get('/', (req, res) => {
  res.send('Hello, World!');
} );

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
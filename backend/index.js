const express = require('express');
const app = express();
const port = 3000;
const server = require('http').createServer(app);
const { initSocket } = require('./sockets/socket');
const userRoutes = require('./routes/userRoutes');
const authRoutes = require('./routes/authRoute');
const messagesRoutes = require('./routes/messageRoute.js');
const userProfileRoutes = require('./routes/userProfileRoutes');
const cookieParser = require('cookie-parser');
const cors = require('cors');

app.use(cors({
  origin: 'http://localhost:5173', // your Vite dev server URL
  credentials: true
}));

app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serves uploaded avatar files (see middleware/uploadMiddleware.js) at
// e.g. http://localhost:3000/uploads/7-169...jpg
app.use('/uploads', express.static('uploads'));

app.use('/user', userRoutes);
app.use('/api/auth', authRoutes);
app.use('/api', messagesRoutes);
app.use('/api/users', userProfileRoutes);

app.get('/', (req, res) => {
  res.send('Hello, World!');
});

// Socket.IO is attached to the same HTTP server Express uses, so both
// share one port. See sockets/socket.js for everything event-related
// (auth, presence, conversation rooms, typing indicators, etc).
initSocket(server);

server.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});

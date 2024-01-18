// server.js
const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const session = require('express-session');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');

const app = express();
const server = http.createServer(app);
const io = socketIO(server);

// Session middleware
app.use(session({
  secret: 'your-secret-key',
  resave: false,
  saveUninitialized: false,
}));

// Passport initialization
app.use(passport.initialize());
app.use(passport.session());

// Use JSON parser
app.use(bodyParser.json());

// In-memory storage for simplicity (replace with a database in a production environment)
const users = [
  { id: 1, username: 'user1', password: bcrypt.hashSync('password1', 10) },
  { id: 2, username: 'user2', password: bcrypt.hashSync('password2', 10) },
];

// Passport LocalStrategy for user authentication
passport.use(new LocalStrategy(
  (username, password, done) => {
    const user = users.find(u => u.username === username);
    if (!user) return done(null, false, { message: 'Incorrect username.' });
    if (!bcrypt.compareSync(password, user.password)) return done(null, false, { message: 'Incorrect password.' });
    return done(null, user);
  }
));

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser((id, done) => {
  const user = users.find(u => u.id === id);
  done(null, user);
});

// Serve static files
app.use(express.static('public'));

// Routes
app.post('/login', passport.authenticate('local'), (req, res) => {
  res.sendStatus(200);
});

app.get('/logout', (req, res) => {
  req.logout();
  res.redirect('/');
});

app.get('/user', (req, res) => {
  res.json(req.user);
});

io.use((socket, next) => {
  sessionMiddleware(socket.request, socket.request.res, next);
});

io.on('connection', (socket) => {
  console.log('A user connected:', socket.request.session.passport);

  // Handle chat messages
  socket.on('chat message', (message) => {
    io.to(socket.room).emit('chat message', { username: socket.request.session.passport.username, message });
  });

  // Join a room
  socket.on('join room', (room) => {
    socket.join(room);
    socket.room = room;
  });

  // Handle private messages
  socket.on('private message', ({ recipient, message }) => {
    const recipientSocket = findSocketByUsername(io, recipient);
    if (recipientSocket) {
      recipientSocket.emit('private message', { sender: socket.request.session.passport.username, message });
    }
  });

  // Listen for disconnection
  socket.on('disconnect', () => {
    console.log('User disconnected');
  });
});

// Middleware to handle sessions
const sessionMiddleware = session({ secret: 'your-secret-key', resave: false, saveUninitialized: false });
app.use(sessionMiddleware);
io.use((socket, next) => {
  sessionMiddleware(socket.request, socket.request.res, next);
});

// Helper function to find a socket by username
function findSocketByUsername(io, username) {
  const sockets = io.sockets.sockets;
  for (const socketId in sockets) {
    const socket = sockets[socketId];
    if (socket.request.session.passport && socket.request.session.passport.username === username) {
      return socket;
    }
  }
  return null;
}

// Set up server to listen on port 3001
const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

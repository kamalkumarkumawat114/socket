require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const session = require('express-session');
const rateLimit = require('express-rate-limit');
const compression = require('compression');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');
const cors = require('cors');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Environment variables
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI;
const SESSION_SECRET = process.env.SESSION_SECRET || 'supersecretkey';

// Connect to MongoDB
mongoose.connect(MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => console.log('Connected to MongoDB'))
  .catch((err) => console.log(err));

// Define user schema
const userSchema = new mongoose.Schema({
  firstName: String,
  lastName: String,
  email: { type: String, unique: true },
  mobile: String,
  address: String,
  city: String,
  state: String,
  country: String,
  loginId: String,
  password: String,
  socketId: String,
  status: { type: String, default: "Offline" },
});

const User = mongoose.model('User', userSchema);

// Middleware
app.use(express.json());
app.use(compression());
app.use(cors());
app.use(express.static(path.join(__dirname, 'public')));

// Session management
app.use(session({
  secret: SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false } // set to true in production with HTTPS
}));

// Rate limiting to prevent abuse
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
});
app.use(limiter);

// Registration endpoint
app.post('/register', async (req, res) => {
  try {
    const { email, password } = req.body;
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'Email already registered' });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ ...req.body, password: hashedPassword });
    await user.save();
    res.status(201).json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Login endpoint
app.post('/login', async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });
  if (user && await bcrypt.compare(password, user.password)) {
    req.session.userId = user._id;
    user.status = "Online";
    user.socketId = null;
    await user.save();
    res.json({ message: "Login successful", user });
  } else {
    res.status(400).json({ error: "Invalid email or password" });
  }
});

// Profile endpoint
app.get('/profile/:userId', async (req, res) => {
  const user = await User.findById(req.params.userId);
  if (user) {
    res.json(user);
  } else {
    res.status(404).json({ error: "User not found" });
  }
});

// Socket connections
io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);

  socket.on('register', async (data) => {
    const user = await User.findOneAndUpdate(
      { email: data.email },
      { socketId: socket.id, status: 'Online' },
      { new: true }
    );
    io.emit('userStatus', { user });
  });

  socket.on('disconnect', async () => {
    await User.findOneAndUpdate(
      { socketId: socket.id },
      { status: 'Offline' }
    );
    io.emit('userStatus', { user: null });
  });
});

// Get live users
app.get('/live-users', async (req, res) => {
  const users = await User.find({ status: 'Online' });
  res.json(users);
});

// Start server
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));

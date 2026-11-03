require("dotenv").config();
const express = require("express");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || "development_only_change_this_secret";
const DB_PATH = path.join(__dirname, "db.json");

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

const starterProducts = [
  { id: 1, name: "Aurelius Chronograph", brand: "AURELIUS", category: "Chronograph", price: 28999, description: "Precision chronograph with a midnight dial and polished steel finish.", image: "https://images.unsplash.com/photo-1523170335258-f5ed11844a49?auto=format&fit=crop&w=900&q=85", stock: 12 },
  { id: 2, name: "Noir Heritage Automatic", brand: "NOIR", category: "Automatic", price: 42999, description: "A timeless automatic silhouette crafted for understated elegance.", image: "https://images.unsplash.com/photo-1524805444758-089113d48a6d?auto=format&fit=crop&w=900&q=85", stock: 8 },
  { id: 3, name: "Celeste Rose Gold", brand: "CELESTE", category: "Dress", price: 19999, description: "A refined rose-gold finish designed for special occasions.", image: "https://images.unsplash.com/photo-1547996160-81dfa63595aa?auto=format&fit=crop&w=900&q=85", stock: 15 },
  { id: 4, name: "Velocity Sport Pro", brand: "VELOCITY", category: "Sport", price: 15999, description: "A bold everyday sports watch with a durable modern profile.", image: "https://images.unsplash.com/photo-1533139502658-0198f920d8e8?auto=format&fit=crop&w=900&q=85", stock: 20 },
  { id: 5, name: "Monarch Classic Black", brand: "MONARCH", category: "Dress", price: 24999, description: "Minimal black dial, clean markers and a versatile leather strap.", image: "https://images.unsplash.com/photo-1524592094714-0f0654e20314?auto=format&fit=crop&w=900&q=85", stock: 10 },
  { id: 6, name: "Titanium Edge", brand: "AURELIUS", category: "Automatic", price: 36999, description: "Lightweight titanium-inspired styling with a contemporary dial.", image: "https://images.unsplash.com/photo-150 extended", stock: 6 }
];

function readDB() {
  if (!fs.existsSync(DB_PATH)) {
    const initial = { users: [], products: starterProducts.filter(p => !p.image.includes("extended")), orders: [] };
    fs.writeFileSync(DB_PATH, JSON.stringify(initial, null, 2));
  }
  return JSON.parse(fs.readFileSync(DB_PATH, "utf8"));
}
function writeDB(db) { fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2)); }
function tokenFor(user) {
  return jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: "7d" });
}
function auth(req, res, next) {
  const header = req.headers.authorization || "";
  try {
    const token = header.startsWith("Bearer ") ? header.slice(7) : "";
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch { res.status(401).json({ message: "Please log in to continue." }); }
}
function adminOnly(req, res, next) {
  if (req.user.role !== "admin") return res.status(403).json({ message: "Admin access required." });
  next();
}

app.get("/api/health", (req, res) => res.json({ status: "ok", app: "Digital Luxury Watches" }));
app.get("/api/products", (req, res) => {
  const db = readDB();
  const q = String(req.query.q || "").toLowerCase();
  const category = String(req.query.category || "");
  const products = db.products.filter(p =>
    (!q || `${p.name} ${p.brand} ${p.category}`.toLowerCase().includes(q)) &&
    (!category || category === "All" || p.category === category)
  );
  res.json(products);
});

app.post("/api/register", async (req, res) => {
  const { name, email, password } = req.body || {};
  if (!name || !email || !password || password.length < 6) return res.status(400).json({ message: "Enter name, email and a password of at least 6 characters." });
  const db = readDB();
  if (db.users.some(u => u.email === email.toLowerCase())) return res.status(409).json({ message: "Email is already registered." });
  const user = { id: Date.now(), name: name.trim(), email: email.toLowerCase().trim(), password: await bcrypt.hash(password, 10), role: "customer" };
  db.users.push(user); writeDB(db);
  res.status(201).json({ token: tokenFor(user), user: { id: user.id, name: user.name, email: user.email, role: user.role } });
});

app.post("/api/login", async (req, res) => {
  const { email, password } = req.body || {};
  const db = readDB();
  const user = db.users.find(u => u.email === String(email || "").toLowerCase().trim());
  if (!user || !(await bcrypt.compare(password || "", user.password))) return res.status(401).json({ message: "Incorrect email or password." });
  res.json({ token: tokenFor(user), user: { id: user.id, name: user.name, email: user.email, role: user.role } });
});

app.get("/api/me", auth, (req, res) => {
  const db = readDB(); const user = db.users.find(u => u.id === req.user.id);
  if (!user) return res.status(404).json({ message: "Account not found." });
  res.json({ id: user.id, name: user.name, email: user.email, role: user.role });
});

app.post("/api/orders", auth, (req, res) => {
  const { items, customerName, phone, address } = req.body || {};
  if (!Array.isArray(items) || !items.length || !customerName || !phone || !address) return res.status(400).json({ message: "Complete your delivery details and cart." });
  const db = readDB(); const orderItems = [];
  for (const item of items) {
    const product = db.products.find(p => p.id === Number(item.id));
    const qty = Math.max(1, Math.min(20, Number(item.quantity) || 1));
    if (!product || product.stock < qty) return res.status(400).json({ message: `Not enough stock for ${product ? product.name : "a selected product"}.` });
    orderItems.push({ id: product.id, name: product.name, price: product.price, quantity: qty, image: product.image });
  }
  orderItems.forEach(item => { const p = db.products.find(x => x.id === item.id); p.stock -= item.quantity; });
  const order = { id: "LW" + Date.now(), userId: req.user.id, items: orderItems, total: orderItems.reduce((s, i) => s + i.price * i.quantity, 0), customerName, phone, address, status: "Order received", createdAt: new Date().toISOString() };
  db.orders.unshift(order); writeDB(db);
  res.status(201).json(order);
});
app.get("/api/orders", auth, (req, res) => {
  const db = readDB();
  res.json(req.user.role === "admin" ? db.orders : db.orders.filter(o => o.userId === req.user.id));
});

app.post("/api/admin/products", auth, adminOnly, (req, res) => {
  const { name, brand, category, price, description, image, stock } = req.body || {};
  if (!name || !brand || !category || !price || !image) return res.status(400).json({ message: "Name, brand, category, price and image URL are required." });
  const db = readDB(); const product = { id: Date.now(), name, brand, category, price: Number(price), description: description || "", image, stock: Number(stock) || 0 };
  db.products.unshift(product); writeDB(db); res.status(201).json(product);
});
app.put("/api/admin/products/:id", auth, adminOnly, (req, res) => {
  const db = readDB(); const p = db.products.find(x => x.id === Number(req.params.id));
  if (!p) return res.status(404).json({ message: "Product not found." });
  Object.assign(p, req.body, { id: p.id, price: Number(req.body.price ?? p.price), stock: Number(req.body.stock ?? p.stock) });
  writeDB(db); res.json(p);
});
app.delete("/api/admin/products/:id", auth, adminOnly, (req, res) => {
  const db = readDB(); const before = db.products.length;
  db.products = db.products.filter(p => p.id !== Number(req.params.id));
  if (before === db.products.length) return res.status(404).json({ message: "Product not found." });
  writeDB(db); res.json({ message: "Product deleted." });
});

async function seedAdmin() {
  const db = readDB(); const email = (process.env.ADMIN_EMAIL || "admin@luxewatches.demo").toLowerCase();
  if (!db.users.some(u => u.email === email)) {
    db.users.push({ id: Date.now(), name: "Store Admin", email, password: await bcrypt.hash(process.env.ADMIN_PASSWORD || "WatchAdmin@123", 10), role: "admin" });
    writeDB(db);
  }
}
app.get("*", (req, res) => res.sendFile(path.join(__dirname, "public", "index.html")));
seedAdmin().then(() => app.listen(PORT, () => console.log(`Digital Luxury Watches running on port ${PORT}`)));

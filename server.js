const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = 3000;

const UPLOADS_DIR = path.join(__dirname, 'uploads');
const DATA_DIR = path.join(__dirname, 'data');
const METADATA_FILE = path.join(DATA_DIR, 'metadata.json');

// Ensure directories exist
fs.mkdirSync(UPLOADS_DIR, { recursive: true });
fs.mkdirSync(DATA_DIR, { recursive: true });

// Initialize metadata file if it doesn't exist
if (!fs.existsSync(METADATA_FILE)) {
  fs.writeFileSync(METADATA_FILE, JSON.stringify([], null, 2));
}

// Configure multer for .png uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOADS_DIR),
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${file.originalname}`;
    cb(null, uniqueName);
  }
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'image/png') {
      cb(null, true);
    } else {
      cb(new Error('Only .png files are allowed'));
    }
  }
});

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// Serve uploaded photos
app.use('/api/photos', express.static(UPLOADS_DIR));

// Helper: read/write metadata
function readMetadata() {
  const raw = fs.readFileSync(METADATA_FILE, 'utf-8');
  return JSON.parse(raw);
}

function writeMetadata(data) {
  fs.writeFileSync(METADATA_FILE, JSON.stringify(data, null, 2));
}

// POST /api/upload — upload a photo with tags
app.post('/api/upload', upload.single('photo'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  const tags = req.body.tags
    ? req.body.tags.split(',').map(t => t.trim().toLowerCase()).filter(Boolean)
    : [];

  const entry = {
    filename: req.file.filename,
    originalName: req.file.originalname,
    tags,
    uploadedAt: new Date().toISOString()
  };

  const metadata = readMetadata();
  metadata.push(entry);
  writeMetadata(metadata);

  res.json({ message: 'Photo uploaded successfully', entry });
});

// GET /api/all — return all photos metadata
app.get('/api/all', (req, res) => {
  const metadata = readMetadata();
  res.json({ results: metadata });
});

// DELETE /api/photos/:filename — delete a photo and its metadata
app.delete('/api/photos/:filename', (req, res) => {
  const { filename } = req.params;
  const metadata = readMetadata();
  const index = metadata.findIndex(entry => entry.filename === filename);

  if (index === -1) {
    return res.status(404).json({ error: 'Photo not found' });
  }

  // Remove file from disk
  const filePath = path.join(UPLOADS_DIR, filename);
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }

  // Remove from metadata
  metadata.splice(index, 1);
  writeMetadata(metadata);

  res.json({ message: 'Photo deleted successfully' });
});

// GET /api/search?q=term — search photos by partial tag match
app.get('/api/search', (req, res) => {
  const query = (req.query.q || '').trim().toLowerCase();

  if (!query) {
    return res.json({ results: [] });
  }

  const metadata = readMetadata();
  const results = metadata.filter(entry =>
    entry.tags.some(tag => tag.includes(query))
  );

  res.json({ results });
});

// Multer error handling
app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError || err.message === 'Only .png files are allowed') {
    return res.status(400).json({ error: err.message });
  }
  next(err);
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
  console.log(`Upload page: http://localhost:${PORT}/upload.html`);
  console.log(`Search page: http://localhost:${PORT}/search.html`);
  console.log(`Archive page: http://localhost:${PORT}/archive.html`);
});

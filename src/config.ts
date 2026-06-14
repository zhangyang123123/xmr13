import path from 'path';

const UPLOAD_DIR = process.env.UPLOAD_DIR || path.join(__dirname, '..', 'uploads');
const PORT = parseInt(process.env.PORT || '3000', 10);
const MAX_FILE_SIZE = 10 * 1024 * 1024;
const MAX_FILES_PER_REQUEST = 10;
const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const RATE_LIMIT_MAX = 20;

const ALLOWED_MIMETYPES: Record<string, string[]> = {
  image: ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'],
  document: ['application/pdf', 'text/plain', 'text/markdown'],
  archive: ['application/zip', 'application/x-zip-compressed'],
};

const EXTENSION_MAP: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/gif': '.gif',
  'image/webp': '.webp',
  'image/svg+xml': '.svg',
  'application/pdf': '.pdf',
  'text/plain': '.txt',
  'text/markdown': '.md',
  'application/zip': '.zip',
  'application/x-zip-compressed': '.zip',
};

const ALLOWED_EXTENSIONS = new Set(Object.values(EXTENSION_MAP));
const ALL_ALLOWED_MIMETYPES = Object.values(ALLOWED_MIMETYPES).flat();

const IMAGE_MIMETYPES = new Set(ALLOWED_MIMETYPES.image);

export {
  UPLOAD_DIR,
  PORT,
  MAX_FILE_SIZE,
  MAX_FILES_PER_REQUEST,
  RATE_LIMIT_WINDOW_MS,
  RATE_LIMIT_MAX,
  ALLOWED_MIMETYPES,
  EXTENSION_MAP,
  ALLOWED_EXTENSIONS,
  ALL_ALLOWED_MIMETYPES,
  IMAGE_MIMETYPES,
};

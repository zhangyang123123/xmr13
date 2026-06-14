import { Request, Response, NextFunction } from 'express';
import multer from 'multer';
import crypto from 'crypto';
import path from 'path';
import fs from 'fs';
import {
  UPLOAD_DIR,
  MAX_FILE_SIZE,
  MAX_FILES_PER_REQUEST,
  ALL_ALLOWED_MIMETYPES,
  EXTENSION_MAP,
  ALLOWED_EXTENSIONS,
  IMAGE_MIMETYPES,
} from '../config';

interface UploadResult {
  url: string;
  filename: string;
  size: number;
  mimetype: string;
  uploaded_at: string;
  markdown: string;
  html: string;
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    if (!fs.existsSync(UPLOAD_DIR)) {
      fs.mkdirSync(UPLOAD_DIR, { recursive: true });
    }
    cb(null, UPLOAD_DIR);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const safeExt = ALLOWED_EXTENSIONS.has(ext) ? ext : '';
    const uniqueName = crypto.randomUUID() + safeExt;
    cb(null, uniqueName);
  },
});

function resolveMimetype(file: Express.Multer.File): string {
  if (ALL_ALLOWED_MIMETYPES.includes(file.mimetype)) {
    return file.mimetype;
  }
  const ext = path.extname(file.originalname).toLowerCase();
  for (const [mime, e] of Object.entries(EXTENSION_MAP)) {
    if (e === ext) return mime;
  }
  return file.mimetype;
}

const fileFilter = (_req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const resolvedType = resolveMimetype(file);
  if (ALL_ALLOWED_MIMETYPES.includes(resolvedType)) {
    cb(null, true);
  } else {
    cb(new Error(`File type not allowed: ${file.mimetype} (${path.extname(file.originalname)}). Allowed types: images (jpg/png/gif/webp/svg), documents (pdf/txt/md), archives (zip)`));
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: MAX_FILE_SIZE,
    files: MAX_FILES_PER_REQUEST,
  },
});

const uploadMiddleware = upload.array('files', MAX_FILES_PER_REQUEST);

export function handleUpload(req: Request, res: Response, next: NextFunction): void {
  uploadMiddleware(req, res, (err) => {
    if (err) {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          res.status(413).json({ error: 'File too large. Maximum size is 10MB per file.' });
          return;
        }
        if (err.code === 'LIMIT_FILE_COUNT') {
          res.status(400).json({ error: `Too many files. Maximum ${MAX_FILES_PER_REQUEST} files per request.` });
          return;
        }
        res.status(400).json({ error: err.message });
        return;
      }
      if (err.message && err.message.startsWith('File type not allowed')) {
        res.status(415).json({ error: err.message });
        return;
      }
      next(err);
      return;
    }

    const files = req.files as Express.Multer.File[];
    if (!files || files.length === 0) {
      res.status(400).json({ error: 'No files uploaded.' });
      return;
    }

    const protocol = req.protocol;
    const host = req.get('host');
    const results: UploadResult[] = files.map((file) => {
      const url = `${protocol}://${host}/files/${file.filename}`;
      const mimetype = resolveMimetype(file);
      const isImage = IMAGE_MIMETYPES.has(mimetype);
      const markdown = isImage ? `![](${url})` : `[${file.filename}](${url})`;
      const html = isImage ? `<img src="${url}" alt="${file.filename}">` : `<a href="${url}">${file.filename}</a>`;
      return {
        url,
        filename: file.filename,
        size: file.size,
        mimetype,
        uploaded_at: new Date().toISOString(),
        markdown,
        html,
      };
    });

    res.status(200).json({
      success: true,
      count: results.length,
      files: results,
    });
  });
}

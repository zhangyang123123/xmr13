import { Request, Response, NextFunction } from 'express';
import fs from 'fs';
import path from 'path';
import { UPLOAD_DIR, EXTENSION_MAP, ALLOWED_MIMETYPES, IMAGE_MIMETYPES } from '../config';

interface FileInfo {
  filename: string;
  size: number;
  mimetype: string;
  uploaded_at: string;
  url: string;
  thumb_url?: string;
}

function getMimeType(filename: string): string {
  const ext = path.extname(filename).toLowerCase();
  for (const [mime, e] of Object.entries(EXTENSION_MAP)) {
    if (e === ext) return mime;
  }
  return 'application/octet-stream';
}

function getFileCategory(mimetype: string): string {
  for (const [category, mimes] of Object.entries(ALLOWED_MIMETYPES)) {
    if (mimes.includes(mimetype)) return category;
  }
  return 'other';
}

function getAllFiles(): FileInfo[] {
  if (!fs.existsSync(UPLOAD_DIR)) return [];

  return fs
    .readdirSync(UPLOAD_DIR)
    .filter((f) => fs.statSync(path.join(UPLOAD_DIR, f)).isFile())
    .map((filename) => {
      const stat = fs.statSync(path.join(UPLOAD_DIR, filename));
      const mimetype = getMimeType(filename);
      const isImage = IMAGE_MIMETYPES.has(mimetype);
      return {
        filename,
        size: stat.size,
        mimetype,
        uploaded_at: stat.mtime.toISOString(),
        url: `/files/${filename}`,
        thumb_url: isImage ? `/files/${filename}?thumb=200` : undefined,
      };
    })
    .sort((a, b) => new Date(b.uploaded_at).getTime() - new Date(a.uploaded_at).getTime());
}

export function listFiles(req: Request, res: Response): void {
  const pageStr = typeof req.query.page === 'string' ? req.query.page : '1';
  const limitStr = typeof req.query.limit === 'string' ? req.query.limit : '20';
  const page = Math.max(1, parseInt(pageStr, 10));
  const limit = Math.min(100, Math.max(1, parseInt(limitStr, 10)));

  const allFiles = getAllFiles();
  const total = allFiles.length;
  const totalPages = Math.ceil(total / limit);
  const start = (page - 1) * limit;
  const files = allFiles.slice(start, start + limit);

  res.json({
    success: true,
    pagination: {
      page,
      limit,
      total,
      totalPages,
    },
    files,
  });
}

export function deleteFile(req: Request, res: Response): void {
  const rawFilename = typeof req.params.filename === 'string' ? req.params.filename : String(req.params.filename);
  const filename = path.basename(rawFilename);
  const filePath = path.join(UPLOAD_DIR, filename);

  if (!fs.existsSync(filePath)) {
    res.status(404).json({ error: 'File not found.' });
    return;
  }

  fs.unlinkSync(filePath);
  res.json({ success: true, message: `File ${filename} deleted.` });
}

export function getStats(_req: Request, res: Response): void {
  const files = getAllFiles();
  const totalFiles = files.length;
  const totalSize = files.reduce((sum, f) => sum + f.size, 0);

  const typeDistribution: Record<string, { count: number; size: number }> = {};
  for (const file of files) {
    const category = getFileCategory(file.mimetype);
    if (!typeDistribution[category]) {
      typeDistribution[category] = { count: 0, size: 0 };
    }
    typeDistribution[category].count++;
    typeDistribution[category].size += file.size;
  }

  res.json({
    success: true,
    totalFiles,
    totalSize,
    totalSizeHuman: formatBytes(totalSize),
    typeDistribution,
  });
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

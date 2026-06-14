import { Request, Response, NextFunction } from 'express';
import path from 'path';
import fs from 'fs';
import sharp from 'sharp';
import { UPLOAD_DIR, IMAGE_MIMETYPES, EXTENSION_MAP } from '../config';

const resizeCache = new Map<string, Buffer>();

function getMimeType(filename: string): string {
  const ext = path.extname(filename).toLowerCase();
  for (const [mime, e] of Object.entries(EXTENSION_MAP)) {
    if (e === ext) return mime;
  }
  return 'application/octet-stream';
}

export function serveFile(req: Request, res: Response, next: NextFunction): void {
  const rawFilename = typeof req.params.filename === 'string' ? req.params.filename : String(req.params.filename);
  const filename = path.basename(rawFilename);
  const filePath = path.join(UPLOAD_DIR, filename);

  if (!fs.existsSync(filePath)) {
    res.status(404).json({ error: 'File not found.' });
    return;
  }

  const mimetype = getMimeType(filename);
  const isImage = IMAGE_MIMETYPES.has(mimetype);
  const widthStr = typeof req.query.width === 'string' ? req.query.width : undefined;
  const heightStr = typeof req.query.height === 'string' ? req.query.height : undefined;
  const thumbStr = typeof req.query.thumb === 'string' ? req.query.thumb : undefined;
  const width = widthStr ? parseInt(widthStr, 10) : undefined;
  const height = heightStr ? parseInt(heightStr, 10) : undefined;
  const thumb = thumbStr ? parseInt(thumbStr, 10) : undefined;

  if (isImage && (thumb || width || height)) {
    let cacheKey: string;
    let resizeOptions: sharp.ResizeOptions;

    if (thumb) {
      cacheKey = `${filename}_thumb_${thumb}`;
      resizeOptions = {
        width: thumb,
        height: thumb,
        fit: 'cover',
        withoutEnlargement: true,
      };
    } else {
      cacheKey = `${filename}_${width || 'auto'}x${height || 'auto'}`;
      resizeOptions = { withoutEnlargement: true };
      if (width) resizeOptions.width = width;
      if (height) resizeOptions.height = height;
    }

    if (resizeCache.has(cacheKey)) {
      res.type(mimetype);
      res.send(resizeCache.get(cacheKey));
      return;
    }

    let transform = sharp(filePath);
    if (mimetype === 'image/svg+xml') {
      res.type(mimetype);
      fs.createReadStream(filePath).pipe(res);
      return;
    }

    transform
      .resize(resizeOptions)
      .toBuffer()
      .then((buffer) => {
        resizeCache.set(cacheKey, buffer);
        if (resizeCache.size > 200) {
          const firstKey = resizeCache.keys().next().value;
          if (firstKey) resizeCache.delete(firstKey);
        }
        res.type(mimetype);
        res.send(buffer);
      })
      .catch((err) => {
        next(err);
      });
    return;
  }

  res.type(mimetype);
  fs.createReadStream(filePath).pipe(res);
}

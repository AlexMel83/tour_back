import { uploadMiddleware } from '../../middlewares/upload.js';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const BASE_PATH = resolve(__dirname, '..', '..', '..', '..');

async function deleteFile(filePath) {
  const fullPath = path.join(BASE_PATH, filePath);
  try {
    fs.unlink(fullPath);
    console.error(`Successfully deleted ${fullPath}`);
  } catch (error) {
    if (error.code === 'ENOENT') {
      console.error(`File ${fullPath} doesn't exist, skipping delete.`);
    } else {
      console.error(`Error deleting file ${fullPath}:`, error);
      throw error;
    }
  }
}

export default function (app) {
  app.post('/upload', uploadMiddleware, (req, res) => {
    const fileInfo = res.locals.uploadedFile;
    res.status(200).json({
      message: fileInfo.message,
      file: fileInfo,
    });
  });

  app.delete('/delete-file', async (req, res) => {
    const { filePath } = req.body;
    try {
      await deleteFile(filePath);
      res.status(200).json({ message: 'File successfully deleted' });
    } catch (error) {
      console.error('Error in delete-file route:', error);
      res
        .status(500)
        .json({ error: 'Failed to delete file', details: error.message });
    }
  });
}

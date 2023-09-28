import fs from 'fs/promises';
import path from 'path';
import { parseFile } from 'music-metadata';

import chalk from 'chalk';

const folderPath = 'D:/Music/Download';

async function renameMusicFiles() {
  try {
    const files = await fs.readdir(folderPath);
    console.log(`Number of files in the folder: ${chalk.green(files.length)}`);

    for (const file of files) {
      const filePath = path.join(folderPath, file);
      const fileExt = path.extname(file);

      if (fileExt.toLowerCase() === '.mp3') {
        try {
          const { common } = await parseFile(filePath);

          if (common && common.title) {
            const newTitle = common.title
              .replace(/_/g, ' ')
              .replace("(getmp3.pro)", '-')
              .replace(" (Split by LALAL.AI)", '')
              .replace(" split by lalalai", '');
            const newFileName = newTitle + fileExt;

            if (file !== newFileName) {
              const newFilePath = path.join(folderPath, newFileName);
              await fs.rename(filePath, newFilePath);

              // // Update metadata title
              // common.title = newTitle;
              // await updateFile(newFilePath, { common });

              console.log(`[${chalk.red(file)}] renamed to [${chalk.green(file)}]`);
            }
          }
        } catch (metadataErr) {
          console.error(`Error reading metadata from ${file}:`, metadataErr);
        }
      }
    }
  } catch (err) {
    console.error('Error reading folder:', err);
  }
}

renameMusicFiles();

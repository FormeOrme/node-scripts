const fs = require('fs');
const http = require('http');
const cheerio = require('cheerio');
const path = require('path');
const { URL } = require('url');

// Replace 'admin' and 'Lucia2023' with your actual credentials
const options = {
  hostname: '192.168.0.179',
  port: 80,
  path: '/sd/20240421/record000/',
  auth: 'admin:Lucia2023' // Basic authentication
};

const downloadFile = (fileUrl, filename) => {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(filename);
    http.get(fileUrl, (response) => {
      response.pipe(file);
      file.on('finish', () => {
        file.close(resolve(filename));
      });
    }).on('error', (err) => {
      fs.unlink(filename);
      reject(err.message);
    });
  });
};

const createDirectoryIfNotExists = (directory) => {
  if (!fs.existsSync(directory)) {
    fs.mkdirSync(directory);
  }
};

const req = http.request(options, (res) => {
  console.log(`statusCode: ${res.statusCode}`);

  let data = '';

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', async () => {
    const $ = cheerio.load(data);
    const hrefs = $('a')
      .map((i, el) => $(el).attr('href'))
      .get()
      .filter(href => href.endsWith('.265'));

    const folderName = 'ipcam';
    createDirectoryIfNotExists(folderName);

    const baseUrl = new URL(options.path, `http://${options.hostname}`).href;
    for (const href of hrefs) {
      const fileUrl = new URL(href, baseUrl).href;
      const filename = path.join(folderName, path.basename(href));
      await downloadFile(fileUrl, filename);
      console.log(`Downloaded: ${filename}`);
    }
  });
});

req.on('error', (error) => {
  console.error(error);
});

req.end();

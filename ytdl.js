const ytdl = require('ytdl-core');
const fs = require('fs');
const ffmpeg = require('fluent-ffmpeg');
const tmp = require('tmp');
const playlistInfo = require('youtube-playlist-info');

var argv = require('minimist')(process.argv.slice(2));

const dlFolder = "musicDL";

const trimAndFill = (s, n, c) => s.length > n ? s.substring(0, n) : s.padEnd(n, c);

function downloadUrl(url) {
    return new Promise((resolve, reject) => {
        try {
            ytdl.getBasicInfo(url).then(info => {
                const title = info.videoDetails.title;
                const trim = `[${trimAndFill(title, 15, '.')}]`;
                console.log(`Downloading: ${trim}`);

                const tempFilePath = tmp.tmpNameSync();
                const outputPath = `${dlFolder}/${title}.wav`;

                const inputStream = ytdl(url, { quality: 'highestaudio' });
                const outputStream = fs.createWriteStream(tempFilePath);

                inputStream.pipe(outputStream);

                new Promise((success, error) => {
                    outputStream.on('finish', success);
                    outputStream.on('error', error);
                }).then(() => {
                    convertToWav(tempFilePath, outputPath)
                        .then(() => {
                            console.log(`Downloaded ${trim}`);
                            fs.unlinkSync(tempFilePath);
                            resolve(trim);
                        });
                });
            });
        } catch (error) {
            console.error('Error:', error.message);
            reject(error);
        }
    });
}

function convertToWav(inputPath, outputPath) {
    return new Promise((resolve, reject) => {
        ffmpeg()
            .input(inputPath)
            .audioCodec('pcm_s16le')
            .audioFrequency(44100)
            .audioChannels(2)
            .on('end', resolve)
            .on('error', (err) => {
                console.error('Conversion error:', err);
                reject(err);
            })
            .save(outputPath);
    });
}

const base = "https://www.youtube.com/watch?v=";

const url = argv.url;
downloadUrl(url);

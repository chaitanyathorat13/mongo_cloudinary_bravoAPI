const ffmpeg = require('fluent-ffmpeg');
const path = require('path');

const inputFile = path.join(__dirname, 'output.raw');
const outputFile = path.join(__dirname, 'output.mp4');

ffmpeg(inputFile)
  .output(outputFile)
  .on('end', () => {
    console.log('finished');
  })
  .on('error', (err) => {
    console.error('An error occurred:', err.message);
  })
  .run();

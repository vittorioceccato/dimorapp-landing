const sharp = require(process.argv[2] + '/node_modules/sharp');
const [,, , src, dst] = process.argv;
(async () => {
  for (const [a, b, w] of [['computer.png','app-computer.webp',1280],['bolletta-computer.png','app-bolletta-computer.webp',1280],['telefono.png','app-telefono.webp',780]]) {
    const info = await sharp(src + '/' + a).resize({ width: w }).webp({ quality: 80 }).toFile(dst + '/' + b);
    console.log(b, info.width, info.height, info.size);
  }
})();

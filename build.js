const exe = require('@angablue/exe');

const build = exe({
    entry: './index.js',
    out: './maptorium.exe',
    pkg: [ "-c", "package.json"], // Specify extra pkg arguments
    version: '0.9.6',
    target: 'node16-win-x64',
    icon: './maptorium.ico', // Application icons must be in .ico format
    properties: {
        FileDescription: 'Oleg Gunyakov',
        ProductName: 'Maptorium',
        LegalCopyright: 'Maptorium https://github.com/gunyakov/maptorium',
        OriginalFilename: 'maptorium.exe'
    }
});

build.then(() => console.log('Build completed!'));
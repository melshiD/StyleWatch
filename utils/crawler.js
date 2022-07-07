const puppeteer = require('puppeteer');
const fs = require('fs')
const sha256 = require('./melSHA256')
const devices = require('./device_lookup');

const buildImageSetForURL = async (instructions) => {
    const {url, sizes, isFullScreen} = instructions; 
    const hash = sha256.performSHA256(url).slice(0, 16);
    const destinationDirectory = `./resources/images/${hash}`
    if(!fs.existsSync(destinationDirectory)){
        fs.mkdir(destinationDirectory, (err) => {
            if (err) {
                throw err;
            }
            console.log("Directory is created.");
        });
    };
    
    async function takePhoto(size){
        const { width, height, device } = size;
        const browser = await puppeteer.launch({
            headless: true,
            userDataDir: './datadir',
            defaultViewport: {width: width, height: height}
        });
        const page = await browser.newPage();
        await page.goto(url, { waitUntil: 'networkidle2' })
                  .catch(err => console.log(err));
        const hash = sha256.performSHA256(url).slice(0, 16);
        const ds = new Date();
        const tempName = ds.toString().slice(0, 21).replace(' ', '_').replace(':', '_');
        let bundleToken = `${ds.getUTCFullYear()}${ds.getUTCMonth()}${ds.getUTCDate()}${ds.getUTCHours()}${ds.getUTCMinutes()}`;
        await page.screenshot({
            //make path images/hash/bundle_x/something.png
            path: `./resources/images/${hash}/${bundleToken}_${device}.png`,
            fullPage: isFullScreen

        }).catch( err => console.log('trouble writing file:' + err));
        browser.close();
    }


    sizes.map( async (size) => {
        return await takePhoto(size);
    });
}

//build to take a set of urls and a set of devices?
buildImageSetForURL(
    {
        //generate urls off seo search results for keywords: for example, 10 most popular 'vr gaming' results
        url: 'https://animejs.com/', 
        sizes: devices.devicesAndSize(),
        isFullScreen: false
    }
);





//build function to automate scrolling of page by small number of pixles at a time
const puppeteer = require('puppeteer');
const fs = require('fs')

const buildImageSetForURL = async (instructions) => {
    const {url, sizes, fileDestination} = instructions;

    //map over sizes array to take images in new pages
    const {width, height} = sizes[2];

    const browser = await puppeteer.launch({
        userDataDir: './datadir',
        headless: true,
        defaultViewport: {width: width, height: height}

        // args: [`--window-size${sizes[2].width},${sizes[2].height}`]
    });

    const page = await browser.newPage();
    await page.goto(url, { waitUntil: 'networkidle2' })
                    .catch(err => console.log(err));

    const tempName = new Date().toString().slice(0, 21).replace(' ', '_').replace(':', '_');
    await page.screenshot({
        path: `./resources/images/${tempName}_${sizes[2].device}.png`,
        fullPage: false
    }).catch( err => console.log('trouble writing file:' + err));
    //should build a data bundle for attributes not kept in file name
    //to help contextualize more about the captures and results
    browser.close();
}

buildImageSetForURL(
    {
        url: 'https://ourcodeworld.com/articles/read/1187/how-to-open-a-url-in-google-chrome-with-a-specific-window-size-using-the-command-line-in-windows-10', 
        sizes: [{ device: 'laptopscreen', width: 1920, height: 1080 },
                { device: 'ipadAir', width: 820, height: 1180 },
                { device: 'pixil5', width: 393, height: 851 }],
        fileDestination: 'dest'
    }
    
    
);

//build function to automate scrolling of page by small number of pixles at a time
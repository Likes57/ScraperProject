const fs = require('fs');
const puppeteer = require('puppeteer');
const scrapeMainInfo = require('./infoScraper');

const rozetkaSelectors = require('../../store/rozetka/selectors.json');
const alloSelectors = require('../../store/allo/selectors.json');
const foxtrotSelectors = require('../../store/foxtrot/selectors.json');
const citrusSelectors = require('../../store/citrus/selectors.json');

const categories = {
    'Rozetka': require('../../store/rozetka/categories.json'),
    'Allo': require('../../store/allo/categories.json'),
    'Foxtrot': require('../../store/foxtrot/categories.json'),
    'Citrus': require('../../store/citrus/categories.json'),
};

async function waitForPageLoad(page, selector) {
    try {
        await page.waitForSelector(selector);
    } catch (error) {
        throw new Error(`Timeout waiting for selector: ${selector}`);
    }
}


let scrape = async (storeName, selectors, storeCategories, outputPath = '') => {
    const browser = await puppeteer.launch({ headless: false ,timeout: 1000});
    const page = await browser.newPage();
    let results = {};

    for (let categoryName in storeCategories.categories) {
        let categoryUrl = storeCategories.categories[categoryName];
        results[categoryName] = [];

        await page.goto(categoryUrl, { waitUntil: 'domcontentloaded' }); // Переход на сторінку категорії

        // Ожидаем загрузки всех элементов на странице
        await waitForPageLoad(page, selectors.element);

        let products = await scrapeMainInfo(page, selectors, categoryUrl, storeName);

        // Додавання назви магазину до кожного продукту
        products.forEach(product => {
            product.store = storeName;
        });

        results[categoryName].push(...products);
    }

    browser.close();

    // Перевіряємо чи вказаний шлях для збереження
    if (outputPath !== '') {
        const fileName = `${storeName}_results.json`;
        fs.writeFile(outputPath + fileName, JSON.stringify(results, null, 2), (err) => {
            if (err) throw err;
            console.log(`Результаты сохранены в файл ${outputPath}${fileName}`);
        });
    }

    return results;
}

// Массив обещаний для параллельного выполнения скрапинга для разных магазинов
let promises = [];

for (let storeName in categories) {
    let selectors = null;
    switch(storeName) {
        case 'Rozetka':
            selectors = rozetkaSelectors;
            break;
        case 'Allo':
            selectors = alloSelectors;
            break;
        case 'Foxtrot':
            selectors = foxtrotSelectors;
            break;
        case 'Citrus':
            selectors = citrusSelectors;
            break;

        default:
            console.log(`Selectors for ${storeName} not defined`);
            continue;
    }

    promises.push(scrape(storeName, selectors, categories[storeName], '../infoScraperResults/'));
}

Promise.all(promises).then((values) => {
    values.forEach((value, index) => {
        const storeName = Object.keys(categories)[index];
        console.log(`\n\n${storeName} Results:`);
        console.log(JSON.stringify(value, null, 2));
    });
});

const puppeteer = require('puppeteer');
const fs = require('fs').promises;
const path = require('path');
const rozetkaSelectors = require('../../store/rozetka/selectors.json');
const alloSelectors = require('../../store/allo/selectors.json');
const foxtrotSelectors = require('../../store/foxtrot/selectors.json');
const citrusSelectors = require('../../store/citrus/selectors.json');

let scrapeReviews = async (page, selectors, products) => {
    for (let result of products) {
        await page.goto(result.linkReviews);

        let reviewsLoaded = true;
        while (reviewsLoaded) {
            try {
                await page.waitForSelector(selectors.nextReviewsPage, { timeout: 1000 });
                if (page.url().includes('https://rozetka.com.ua') || page.url().includes('https://allo.ua' )|| page.url().includes('https://citrus.ua')|| page.url().includes('https://foxtrot.ua')) {
                    await page.evaluate(() => {
                        return new Promise(resolve => {
                            setTimeout(resolve, 300);
                        });
                    });
                }
                await page.click(selectors.nextReviewsPage);

            } catch (err) {
                reviewsLoaded = false;
            }
        }

        result.reviews = await page.evaluate((selectors) =>
                Array.from(document.querySelectorAll(selectors.reviewList)).map(li => {
                    let nameElement = li.querySelector(selectors.name);
                    let name = nameElement ? nameElement.innerText.trim() : '';

                    let timeElement = li.querySelector(selectors.time);
                    let time = timeElement ? timeElement.innerText.trim() : '';

                    let ratingElement = li.querySelector(selectors.rating);
                    let ratingStyle = ratingElement ? window.getComputedStyle(ratingElement).width : '';
                    let ratingWidth = ratingStyle ? parseFloat(ratingStyle.replace('calc(', '').replace('% - 2px)', '')) : '';
                    let rating = ratingWidth ? Math.round((ratingWidth / 78) * 5) : '';

                    let reviewElement = li.querySelector(selectors.review);
                    let review = reviewElement ? reviewElement.innerText.trim() : '';

                    let prosElement = li.querySelector(selectors.pros);
                    let pros = prosElement ? prosElement.innerText.trim() : '';

                    let consElement = li.querySelector(selectors.cons);
                    let cons = consElement ? consElement.innerText.trim() : '';

                    return { name, time, rating, review, pros, cons };
                })
            , selectors);
    }
}

(async () => {
    const browser = await puppeteer.launch({ headless: false }); // Додаємо параметр headless: false
    const page = await browser.newPage();

    try {
        const reviewLinks = await fs.readFile('../results/reviewLink.json', 'utf-8');
        const products = JSON.parse(reviewLinks);

        for (const category in products) {
            if (Object.prototype.hasOwnProperty.call(products, category)) {
                const smartphones = products[category];
                for (const smartphone in smartphones) {
                    if (Object.prototype.hasOwnProperty.call(smartphones, smartphone)) {
                        const reviews = smartphones[smartphone];
                        for (const review of reviews) {
                            if (review.store === 'Rozetka') {
                                await scrapeReviews(page, rozetkaSelectors, [review]);
                            } else if (review.store === 'Allo') {
                                await scrapeReviews(page, alloSelectors, [review]);
                            } else if (review.store === 'Foxtrot') {
                                await scrapeReviews(page, foxtrotSelectors, [review]);
                            } else if (review.store === 'Citrus') {
                                await scrapeReviews(page, citrusSelectors, [review]);
                            }
                        }
                    }
                }
            }
        }

        // Зберігаємо відгуки у окремий файл JSON
        const outputFilePath = path.join(__dirname, '../ReviewsScraperResult/reviews.json');
        await fs.writeFile(outputFilePath, JSON.stringify(products, null, 2));
        console.log(`Відгуки збережено у файл ${outputFilePath}`);

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await browser.close();
    }
})();

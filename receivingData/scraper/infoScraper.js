const puppeteer = require('puppeteer');

let scrapeMainInfo = async (page, selectors, categoryUrl, storeName) => {
    await page.goto(categoryUrl);
    let results = [];

    if (storeName === 'Foxtrot') {
        let currentPage = 1; // Починаємо з першої сторінки

        while (true) {
            let categoryResults = await page.evaluate((selectors, storeName) => {
                let data = [];
                let elements = document.querySelectorAll(selectors.element);

                for (let element of elements) {
                    let titleElement = element.querySelector(selectors.title);
                    if (!titleElement) {
                        titleElement = element.querySelector(selectors.alternativeTitle);
                    }
                    let priceElement = element.querySelector(selectors.price);
                    let imageElement = element.querySelector(selectors.image);
                    let linkProductElement = element.querySelector(selectors.linkProduct);
                    let linkReviewsElement = element.querySelector(selectors.linkReviews);

                    if (titleElement && priceElement && imageElement && linkProductElement && linkReviewsElement) {
                        let title = titleElement.innerText;
                        let price = priceElement.innerText;
                        let image = imageElement.src;
                        let linkProduct = linkProductElement.href;
                        let linkReviews = linkReviewsElement.href;

                        if (storeName === 'Foxtrot') {
                            linkReviews = linkReviewsElement.href + "#anchor-3";
                        }
                        if (storeName === 'Citrus') {
                            linkProduct = element.href;
                            linkReviews = element.href + "?tab=reviews";
                        }

                        data.push({ title, price, image, linkProduct, linkReviews });
                    }
                }

                return { data, count: elements.length };
            }, selectors, storeName);

            results.push(...categoryResults.data);

            // Збільшуємо номер сторінки
            currentPage++;

            // Формуємо URL наступної сторінки
            let nextPageUrl = `${categoryUrl}?page=${currentPage}`;

            // Перевіряємо існування наступної сторінки
            await page.goto(nextPageUrl, { waitUntil: 'networkidle2' });

            // Перевіряємо, чи вдалося перейти на наступну сторінку
            if (!page.url().includes(`?page=${currentPage}`)) {
                break;
            }
        }
    } else {
        let nextPage = true;

        while (nextPage) {
            let categoryResults = await page.evaluate((selectors, storeName) => {
                let data = [];
                let elements = document.querySelectorAll(selectors.element);

                for (let element of elements) {
                    let titleElement = element.querySelector(selectors.title);
                    let priceElement = element.querySelector(selectors.price);
                    let imageElement = element.querySelector(selectors.image);
                    let linkProductElement = element.querySelector(selectors.linkProduct);
                    let linkReviewsElement = element.querySelector(selectors.linkReviews);

                    if (titleElement && priceElement && imageElement && linkProductElement && linkReviewsElement) {
                        let title = titleElement.innerText;
                        let price = priceElement.innerText;
                        let image = imageElement.src;
                        let linkProduct = linkProductElement.href;
                        let linkReviews = linkReviewsElement.href;
                        if (storeName === 'Foxtrot') {
                            linkReviews = element.href + "#anchor-3";
                        }
                        if (storeName === 'Citrus') {
                            linkProduct = element.href;
                            linkReviews = element.href + "?tab=reviews";
                        }

                        data.push({ title, price, image, linkProduct, linkReviews });
                    }
                }

                return { data, count: elements.length };
            }, selectors, storeName);

            results.push(...categoryResults.data);

            try {
                await page.click(selectors.nextPage);
                await page.waitForNavigation({ waitUntil: 'networkidle0' });
            } catch (err) {
                console.log(err)
                nextPage = false;
            }
        }
    }

    return results;
}

module.exports = scrapeMainInfo;

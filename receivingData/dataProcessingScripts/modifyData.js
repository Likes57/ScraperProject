const fs = require('fs');

// Функція для видалення кирилиці з тексту, видалення кольорів, пам'яті та зайвих символів
function removeCyrillicAndColorAndMemory(text, colorDictionary) {
    const cyrillicRegex = /[а-яґєіїїї]/gi; // Регулярний вираз для видалення кириличних символів
    const serialRegex = /\(([^)]+)\)/g; // Регулярний вираз для знаходження серійних номерів
    const quoteRegex = /\"/g; // Регулярний вираз для видалення (\")

    let result = text.replace(cyrillicRegex, "").replace(quoteRegex, "").trim(); // Видаляємо кириличні символи та подвійні лапки з тексту

    const serialNumbers = result.match(serialRegex); // Отримуємо всі серійні номери з тексту
    result = result.replace(serialRegex, "").trim(); // Видаляємо серійні номери з тексту моделі

    const colorKeys = Object.keys(colorDictionary);
    colorKeys.forEach(colorKey => { // Видаляємо колір з тексту моделі
        const variants = colorDictionary[colorKey];
        variants.forEach(variant => {
            result = result.replace(variant, "").trim();
        });
    });

    return { model: result, serialNumber: serialNumbers ? serialNumbers[0] : null }; // Повертаємо об'єкт з моделлю без серійного номера та серійним номером
}

// Функція для видалення інформації про пам'ять з тексту моделі
function removeMemoryFromModel(modelText) {
    const memoryRegex = /\d+(?:\s*TB|T|GB)?\/\d+(?:\s*TB|T|GB)?/i; // Оновлений регулярний вираз для пам'яті
    return modelText.replace(memoryRegex, "").trim();
}

// Функція для отримання кольору з JSON файлу
function getColorFromJson(colorText, colorDictionary) {
    const colorKeys = Object.keys(colorDictionary);
    for (let i = 0; i < colorKeys.length; i++) {
        const colorKey = colorKeys[i];
        const variants = colorDictionary[colorKey];
        for (let j = 0; j < variants.length; j++) {
            if (colorText.toLowerCase().includes(variants[j].toLowerCase())) {
                return colorKey;
            }
        }
    }
    return null;
}

// Функція для отримання конфігурації пам'яті з тексту моделі
function getMemoryConfigFromText(modelText) {
    const memoryRegex = /(\d+)\s*(TB|T|GB)?\/(\d+)\s*(TB|T|GB)?/i; // Оновлений регулярний вираз для пам'яті
    const match = modelText.match(memoryRegex);
    if (match) {
        const [, ramSize, ramUnit, storageSize, storageUnit] = match;
        const ram = ramSize + (ramUnit ? ramUnit.toUpperCase() : 'GB');
        const storage = storageSize + (storageUnit ? storageUnit.toUpperCase() : 'GB');

        return { ram, storage }; // Повертаємо об'єкт з окремими рядками для оперативної та постійної пам'яті
    }
    return null;
}

// Функція для отримання фірми виробника з назви товару
function getManufacturerFromTitle(title, manufacturerDictionary) {
    const manufacturerKeys = Object.keys(manufacturerDictionary);
    for (let i = 0; i < manufacturerKeys.length; i++) {
        const manufacturerKey = manufacturerKeys[i];
        const variants = manufacturerDictionary[manufacturerKey];
        for (let j = 0; j < variants.length; j++) {
            if (title.toLowerCase().includes(variants[j].toLowerCase())) {
                return manufacturerKey;
            }
        }
    }
    return null;
}

// Функція для обробки продуктів для кожного магазину
function processStore(storeName, filePath, colorDictionaryPath, manufacturerDictionaryPath) {
    const colorDictionary = JSON.parse(fs.readFileSync(colorDictionaryPath, 'utf8')); // Зчитуємо JSON файли словників кольорів
    const manufacturerDictionary = JSON.parse(fs.readFileSync(manufacturerDictionaryPath, 'utf8')); // Зчитуємо JSON файл словника фірм виробників

    fs.readFile(filePath, 'utf8', (err, data) => {
        if (err) {
            console.error(err);
            return;
        }
        try {
            const storeData = JSON.parse(data); // Парсимо JSON дані

            Object.keys(storeData).forEach(category => { // Проходимо по кожному ключу об'єкта і обробляємо кожен об'єкт окремо
                const products = storeData[category];
                if (Array.isArray(products)) {
                    products.forEach(product => {
                        const { model, serialNumber } = removeCyrillicAndColorAndMemory(product.title, colorDictionary); // Видаляємо кириличні символи та колір з тексту моделі
                        const modelWithoutMemory = removeMemoryFromModel(model); // Видаляємо інформацію про пам'ять з тексту моделі
                        product.model = modelWithoutMemory; // Додаємо модель без інформації про пам'ять до об'єкта product
                        product.serialNumber = serialNumber; // Додаємо серійний номер до об'єкта product
                        product.color = getColorFromJson(product.title, colorDictionary); // Отримуємо та додаємо колір до об'єкта product з використанням словника кольорів
                        product.memory = getMemoryConfigFromText(product.title); // Отримуємо та додаємо конфігурацію пам'яті до об'єкта product
                        product.brand = getManufacturerFromTitle(product.title, manufacturerDictionary); // Отримуємо та додаємо фірму виробника до об'єкта product
                    });
                }
            });

            const updatedData = JSON.stringify(storeData, null, 2); // Конвертуємо оновлені дані знову у JSON формат

            fs.writeFile(filePath, updatedData, 'utf8', (err) => { // Записуємо оновлені дані назад у той же файл
                if (err) {
                    console.error(err);
                    return;
                }
                console.log(`Файл ${filePath} успішно оновлено з полями "model", "serialNumber", "color" та "manufacturer"`);
            });
        } catch (err) {
            console.error(`Помилка парсингу JSON для ${storeName}:`, err);
        }
    });
}

// Виклик
processStore('rozetka', '../infoScraperResults/Rozetka_results.json', '../../data/colors.json', '../../data/manufacturers.json');
processStore('allo', '../infoScraperResults/Allo_results.json', '../../data/colors.json', '../../data/manufacturers.json');
processStore('foxtrot', '../infoScraperResults/Foxtrot_results.json', '../../data/colors.json', '../../data/manufacturers.json');
processStore('citrus', '../infoScraperResults/Citrus_results.json', '../../data/colors.json', '../../data/manufacturers.json');
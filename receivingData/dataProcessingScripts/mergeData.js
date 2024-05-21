const fs = require('fs');

// Завантаження та парсинг даних з файлів
const alloData = JSON.parse(fs.readFileSync('../infoScraperResults/Allo_results.json', 'utf8'));
const rozetkaData = JSON.parse(fs.readFileSync('../infoScraperResults/Rozetka_results.json', 'utf8'));
const foxtrotData = JSON.parse(fs.readFileSync('../infoScraperResults/Foxtrot_results.json', 'utf8'));
const citrusData = JSON.parse(fs.readFileSync('../infoScraperResults/Citrus_results.json', 'utf8'));

// Функція для об'єднання об'єктів за ключем "model"
function mergeObjects(...objects) {
    const result = {};

    objects.forEach(obj => {
        for (let key in obj) {
            if (!result[key]) {
                result[key] = [];
            }
            result[key] = result[key].concat(obj[key] || []);
        }
    });

    return result;
}

// Об'єднання даних
const mergedData = mergeObjects(alloData, rozetkaData, foxtrotData, citrusData);

// Групування пристроїв за моделлю
const groupedDevices = {};
for (let category in mergedData) {
    groupedDevices[category] = mergedData[category].reduce((acc, device) => {
        const { model } = device;
        if (!acc[model]) {
            acc[model] = [];
        }
        acc[model].push(device);
        return acc;
    }, {});
}

// Збереження результату у файл
const outputPath = '../results/mergeData.json';
fs.writeFileSync(outputPath, JSON.stringify(groupedDevices, null, 2));
console.log(`Результат було збережено у файл: ${outputPath}`);

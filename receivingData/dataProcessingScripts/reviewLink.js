const fs = require('fs');

// Функція для видалення дублікатів в даних певної категорії
function removeDuplicatesForCategory(categoryData, paramsList) {
    const result = {}; // Об'єкт для збереження результату

    // Проходимо по кожному ключу в даних категорії
    for (const key in categoryData) {
        const items = categoryData[key]; // Отримуємо елементи для поточного ключа
        result[key] = []; // Ініціалізуємо масив для збереження унікальних елементів

        const seen = {}; // Об'єкт для відстеження вже доданих елементів

        items.forEach(item => {
            let isDuplicate = false; // Флаг для перевірки, чи є елемент дублікатом
            for (const params of paramsList) {
                // Перевіряємо, чи всі параметри збігаються
                isDuplicate = Object.keys(params).every(param => item[param] === params[param]);
                if (isDuplicate) break; // Якщо знайдено дублікат, виходимо з циклу
            }

            // Якщо елемент не є дублікатом або його ще не було додано
            if (!isDuplicate || !seen[item.brand + item.store]) {
                result[key].push(item); // Додаємо елемент до результату
                seen[item.brand + item.store] = true; // Позначаємо елемент як доданий
            }
        });
    }

    return result; // Повертаємо результат без дублікатів
}

function removeDuplicates(data, categories, paramsList) {
    const result = {}; // Об'єкт для збереження результату

    // Проходимо по кожній категорії в даних
    for (const category in data) {
        if (categories.includes(category)) {
            result[category] = removeDuplicatesForCategory(data[category], paramsList); // Якщо категорія є в списку для обробки, видаляємо дублікати
        } else {
            result[category] = data[category]; // Якщо категорія не в списку, просто копіюємо дані
        }
    }
    return result;
}

// Читаємо дані з JSON файлу
fs.readFile('../results/slimData.json', 'utf8', (err, jsonString) => {
    if (err) {
        console.log("Error reading file:", err); // Виводимо помилку, якщо не вдалося прочитати файл
        return;
    }

    try {
        const data = JSON.parse(jsonString); // Парсимо JSON дані
        const categoriesToProcess = ['smartphone']; // Список категорій для обробки
        const paramsList = [
            { store: 'Allo' },
            { brand: 'Samsung', store: 'Rozetka' }
        ]; // Список параметрів для перевірки дублікатів

        const result = removeDuplicates(data, categoriesToProcess, paramsList); // Видаляємо дублікати

        // Записуємо результат в новий JSON файл
        fs.writeFile('../results/reviewLink.json', JSON.stringify(result, null, 2), err => {
            if (err) {
                console.log('Error writing file:', err);
                return;
            }
            console.log('Result saved to result.json');
        });
    } catch (err) {
        console.log('Error parsing JSON string:', err);
    }
});

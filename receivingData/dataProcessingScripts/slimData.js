const fs = require('fs');

// Читаємо вміст JSON файлу
fs.readFile('../results/mergeData.json', 'utf8', (err, data) => {
    if (err) {
        console.error('Помилка при читанні файлу:', err);
        return;
    }

    try {
        // Парсимо JSON
        const smartphones = JSON.parse(data);

        // Проходимося по кожному типу смартфонів (тут лише "smartphone")
        for (const [type, models] of Object.entries(smartphones)) {
            // Проходимося по кожній моделі смартфону
            for (const model of Object.values(models)) {
                // Видаляємо вказані поля з кожного об'єкта моделі
                model.forEach(item => {
                    delete item.title;
                    delete item.price;
                    delete item.image;
                    delete item.linkProduct;
                    delete item.model;
                    delete item.serialNumber;
                    delete item.color;
                    delete item.memory;
                });
            }
        }

        // Записуємо змінений JSON у новий файл
        fs.writeFile('../results/slimData.json', JSON.stringify(smartphones, null, 2), err => {
            if (err) {
                console.error('Помилка при записі у файл:', err);
                return;
            }
            console.log('Змінений JSON успішно збережено у файлі mergeData.json');
        });
    } catch (error) {
        console.error('Помилка:', error.message);
    }
});

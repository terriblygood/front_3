const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = 3000;

// Статические файлы
app.use(express.static(path.join(__dirname, '../client')));

// Маршрут для получения всех товаров
app.get('/api/products', (req, res) => {
  try {
    const productsData = fs.readFileSync(path.join(__dirname, 'products.json'), 'utf8');
    res.json(JSON.parse(productsData));
  } catch (error) {
    console.error('Ошибка при чтении файла с товарами:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Маршрут для получения товаров по категории
app.get('/api/products/category/:categoryName', (req, res) => {
  try {
    const categoryName = req.params.categoryName;
    const productsData = JSON.parse(fs.readFileSync(path.join(__dirname, 'products.json'), 'utf8'));
    
    const filteredProducts = productsData.products.filter(product => 
      product.categories.includes(categoryName)
    );
    
    res.json({ products: filteredProducts });
  } catch (error) {
    console.error('Ошибка при фильтрации товаров по категории:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Маршрут для корневой страницы
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/index.html'));
});

app.listen(PORT, () => {
  console.log(`Клиентский сервер запущен на порту ${PORT}`);
}); 
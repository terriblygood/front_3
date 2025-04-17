const express = require('express');
const path = require('path');
const fs = require('fs');
const { graphqlHTTP } = require('express-graphql');
const { buildSchema } = require('graphql');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const PORT = 3000;

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: ["http://localhost:8080", "*"],
    methods: ["GET", "POST"]
  }
});

app.use(express.static(path.join(__dirname, '../client')));

// GraphQL схема
const schema = buildSchema(`
  type Category {
    id: Int
    name: String
  }

  type Product {
    id: Int
    name: String
    price: Float
    description: String
    categories: [String]
  }

  type Query {
    products: [Product]
    product(id: Int!): Product
    productsByCategory(category: String!): [Product]
    productNames: [String]
    productPrices: [ProductPrice]
    productDescriptions: [ProductDescription]
  }

  type ProductPrice {
    id: Int
    name: String
    price: Float
  }

  type ProductDescription {
    id: Int
    name: String
    description: String
  }
`);

// Резолверы
const root = {
  products: () => {
    const data = JSON.parse(fs.readFileSync(path.join(__dirname, 'products.json'), 'utf8'));
    return data.products;
  },
  product: ({ id }) => {
    const data = JSON.parse(fs.readFileSync(path.join(__dirname, 'products.json'), 'utf8'));
    return data.products.find(product => product.id === id);
  },
  productsByCategory: ({ category }) => {
    const data = JSON.parse(fs.readFileSync(path.join(__dirname, 'products.json'), 'utf8'));
    return data.products.filter(product => product.categories.includes(category));
  },
  productNames: () => {
    const data = JSON.parse(fs.readFileSync(path.join(__dirname, 'products.json'), 'utf8'));
    return data.products.map(product => product.name);
  },
  productPrices: () => {
    const data = JSON.parse(fs.readFileSync(path.join(__dirname, 'products.json'), 'utf8'));
    return data.products.map(product => ({
      id: product.id,
      name: product.name,
      price: product.price
    }));
  },
  productDescriptions: () => {
    const data = JSON.parse(fs.readFileSync(path.join(__dirname, 'products.json'), 'utf8'));
    return data.products.map(product => ({
      id: product.id,
      name: product.name,
      description: product.description
    }));
  }
};

app.use('/graphql', graphqlHTTP({
  schema: schema,
  rootValue: root,
  graphiql: true, // Включаем GraphiQL для тестирования запросов
}));

// Старый REST API для совместимости
app.get('/api/products', (req, res) => {
  try {
    const productsData = fs.readFileSync(path.join(__dirname, 'products.json'), 'utf8');
    res.json(JSON.parse(productsData));
  } catch (error) {
    console.error('Ошибка при чтении файла с товарами:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

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

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/index.html'));
});

// WebSocket для чата
io.on('connection', (socket) => {
  console.log('Пользователь подключился к чату');

  socket.on('chat message', (msg) => {
    io.emit('chat message', msg);
    console.log('Сообщение:', msg);
  });

  socket.on('disconnect', () => {
    console.log('Пользователь отключился от чата');
  });
});

server.listen(PORT, () => {
  console.log(`Клиентский сервер запущен на порту ${PORT}`);
  console.log(`GraphQL доступен по адресу http://localhost:${PORT}/graphql`);
}); 
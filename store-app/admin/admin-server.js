const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const fs = require('fs');
const cors = require('cors');
const swaggerUi = require('swagger-ui-express');

const app = express();
const PORT = 8080;
const PRODUCTS_FILE = path.join(__dirname, '../server/products.json');

// Middleware
app.use(bodyParser.json());
app.use(cors());
app.use(express.static(path.join(__dirname, 'public')));

// Swagger API документация
const swaggerDocument = {
  openapi: '3.0.0',
  info: {
    title: 'API интернет-магазина',
    version: '1.0.0',
    description: 'API для управления товарами интернет-магазина'
  },
  servers: [
    {
      url: `http://localhost:${PORT}`,
      description: 'Локальный сервер'
    }
  ],
  paths: {
    '/api/products': {
      get: {
        summary: 'Получить все товары',
        responses: {
          '200': {
            description: 'Успешный ответ',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    products: {
                      type: 'array',
                      items: {
                        $ref: '#/components/schemas/Product'
                      }
                    },
                    categories: {
                      type: 'array',
                      items: {
                        $ref: '#/components/schemas/Category'
                      }
                    }
                  }
                }
              }
            }
          }
        }
      },
      post: {
        summary: 'Добавить новый товар',
        requestBody: {
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/NewProduct'
              }
            }
          }
        },
        responses: {
          '201': {
            description: 'Товар успешно добавлен',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/Product'
                }
              }
            }
          }
        }
      }
    },
    '/api/products/{id}': {
      put: {
        summary: 'Обновить товар по ID',
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: {
              type: 'integer'
            }
          }
        ],
        requestBody: {
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/NewProduct'
              }
            }
          }
        },
        responses: {
          '200': {
            description: 'Товар успешно обновлен',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/Product'
                }
              }
            }
          },
          '404': {
            description: 'Товар не найден'
          }
        }
      },
      delete: {
        summary: 'Удалить товар по ID',
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: {
              type: 'integer'
            }
          }
        ],
        responses: {
          '200': {
            description: 'Товар успешно удален'
          },
          '404': {
            description: 'Товар не найден'
          }
        }
      }
    },
    '/api/products/bulk': {
      post: {
        summary: 'Добавить несколько товаров',
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'array',
                items: {
                  $ref: '#/components/schemas/NewProduct'
                }
              }
            }
          }
        },
        responses: {
          '201': {
            description: 'Товары успешно добавлены',
            content: {
              'application/json': {
                schema: {
                  type: 'array',
                  items: {
                    $ref: '#/components/schemas/Product'
                  }
                }
              }
            }
          }
        }
      }
    }
  },
  components: {
    schemas: {
      Product: {
        type: 'object',
        properties: {
          id: {
            type: 'integer'
          },
          name: {
            type: 'string'
          },
          price: {
            type: 'number'
          },
          description: {
            type: 'string'
          },
          categories: {
            type: 'array',
            items: {
              type: 'string'
            }
          }
        }
      },
      NewProduct: {
        type: 'object',
        properties: {
          name: {
            type: 'string'
          },
          price: {
            type: 'number'
          },
          description: {
            type: 'string'
          },
          categories: {
            type: 'array',
            items: {
              type: 'string'
            }
          }
        },
        required: ['name', 'price', 'description', 'categories']
      },
      Category: {
        type: 'object',
        properties: {
          id: {
            type: 'integer'
          },
          name: {
            type: 'string'
          }
        }
      }
    }
  }
};

app.use('/spec', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// Функция для чтения данных о товарах
function readProductsData() {
  const data = fs.readFileSync(PRODUCTS_FILE, 'utf8');
  return JSON.parse(data);
}

// Функция для записи данных о товарах
function writeProductsData(data) {
  fs.writeFileSync(PRODUCTS_FILE, JSON.stringify(data, null, 2), 'utf8');
}

// Получить все товары
app.get('/api/products', (req, res) => {
  try {
    const data = readProductsData();
    res.json(data);
  } catch (error) {
    console.error('Ошибка при получении товаров:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Добавить новый товар
app.post('/api/products', (req, res) => {
  try {
    const data = readProductsData();
    const newProduct = req.body;
    
    // Генерация нового ID
    const maxId = data.products.reduce((max, product) => Math.max(max, product.id), 0);
    const newId = maxId + 1;
    
    // Добавление нового товара
    const productToAdd = {
      id: newId,
      ...newProduct
    };
    
    data.products.push(productToAdd);
    writeProductsData(data);
    
    res.status(201).json(productToAdd);
  } catch (error) {
    console.error('Ошибка при добавлении товара:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Добавить несколько товаров
app.post('/api/products/bulk', (req, res) => {
  try {
    const data = readProductsData();
    const newProducts = req.body;
    
    if (!Array.isArray(newProducts)) {
      return res.status(400).json({ error: 'Ожидается массив товаров' });
    }
    
    // Генерация новых ID
    let maxId = data.products.reduce((max, product) => Math.max(max, product.id), 0);
    
    const productsToAdd = newProducts.map(product => {
      maxId++;
      return {
        id: maxId,
        ...product
      };
    });
    
    data.products.push(...productsToAdd);
    writeProductsData(data);
    
    res.status(201).json(productsToAdd);
  } catch (error) {
    console.error('Ошибка при добавлении товаров:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Обновить товар по ID
app.put('/api/products/:id', (req, res) => {
  try {
    const data = readProductsData();
    const id = parseInt(req.params.id);
    const updatedProduct = req.body;
    
    const productIndex = data.products.findIndex(product => product.id === id);
    
    if (productIndex === -1) {
      return res.status(404).json({ error: 'Товар не найден' });
    }
    
    data.products[productIndex] = {
      id,
      ...updatedProduct
    };
    
    writeProductsData(data);
    
    res.json(data.products[productIndex]);
  } catch (error) {
    console.error('Ошибка при обновлении товара:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Удалить товар по ID
app.delete('/api/products/:id', (req, res) => {
  try {
    const data = readProductsData();
    const id = parseInt(req.params.id);
    
    const productIndex = data.products.findIndex(product => product.id === id);
    
    if (productIndex === -1) {
      return res.status(404).json({ error: 'Товар не найден' });
    }
    
    data.products.splice(productIndex, 1);
    writeProductsData(data);
    
    res.json({ message: 'Товар успешно удален' });
  } catch (error) {
    console.error('Ошибка при удалении товара:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Маршрут для корневой страницы админки
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/index.html'));
});

app.listen(PORT, () => {
  console.log(`Сервер административной панели запущен на порту ${PORT}`);
  console.log(`Swagger-документация доступна по адресу http://localhost:${PORT}/spec`);
}); 
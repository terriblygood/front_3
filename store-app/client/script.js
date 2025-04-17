document.addEventListener('DOMContentLoaded', () => {
  // Получаем элементы DOM
  const productsContainer = document.getElementById('products-container');
  const categorySelect = document.getElementById('category-select');
  const viewSelect = document.getElementById('view-select');
  const toggleChatBtn = document.getElementById('toggle-chat');
  const chatBody = document.getElementById('chat-body');
  const messagesContainer = document.getElementById('messages');
  const chatInput = document.getElementById('chat-input');
  const sendMessageBtn = document.getElementById('send-message');
  
  // Данные о товарах и категориях
  let products = [];
  let categories = [];
  
  // Текущий режим отображения
  let currentView = 'full';
  
  // Текущая выбранная категория
  let currentCategory = 'all';
  
  // Подключение к WebSocket
  const socket = io();
  const username = `Пользователь_${Math.floor(Math.random() * 1000)}`;
  
  // Загрузка данных о товарах с использованием GraphQL
  async function fetchProductsGraphQL() {
    try {
      const query = getGraphQLQuery();
      
      const response = await fetch('/graphql', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query })
      });
      
      const result = await response.json();
      
      if (result.errors) {
        throw new Error(result.errors[0].message);
      }
      
      processGraphQLResult(result.data);
      
      // Загрузка категорий отдельным запросом
      if (!categories.length) {
        await fetchCategories();
      }
      
    } catch (error) {
      console.error('Ошибка при загрузке товаров через GraphQL:', error);
      productsContainer.innerHTML = '<p>Произошла ошибка при загрузке товаров</p>';
      // Если GraphQL не работает, пробуем загрузить через REST API
      fetchProductsREST();
    }
  }
  
  // Получение GraphQL запроса в зависимости от выбранного режима и категории
  function getGraphQLQuery() {
    if (currentCategory !== 'all') {
      return `{
        productsByCategory(category: "${currentCategory}") {
          id
          name
          ${currentView === 'full' || currentView === 'names-prices' ? 'price' : ''}
          ${currentView === 'full' || currentView === 'names-descriptions' ? 'description' : ''}
          ${currentView === 'full' ? 'categories' : ''}
        }
      }`;
    }
    
    switch (currentView) {
      case 'names-prices':
        return `{
          productPrices {
            id
            name
            price
          }
        }`;
      case 'names-descriptions':
        return `{
          productDescriptions {
            id
            name
            description
          }
        }`;
      case 'full':
      default:
        return `{
          products {
            id
            name
            price
            description
            categories
          }
        }`;
    }
  }
  
  // Обработка результата GraphQL запроса
  function processGraphQLResult(data) {
    if (currentCategory !== 'all') {
      products = data.productsByCategory || [];
    } else {
      switch (currentView) {
        case 'names-prices':
          products = data.productPrices || [];
          break;
        case 'names-descriptions':
          products = data.productDescriptions || [];
          break;
        case 'full':
        default:
          products = data.products || [];
          break;
      }
    }
    
    displayProducts(products);
  }
  
  // Загрузка категорий
  async function fetchCategories() {
    try {
      const response = await fetch('/api/products');
      const data = await response.json();
      categories = data.categories;
      populateCategories(categories);
    } catch (error) {
      console.error('Ошибка при загрузке категорий:', error);
    }
  }
  
  // Запасной метод загрузки данных через REST API
  async function fetchProductsREST() {
    try {
      let url = '/api/products';
      
      if (currentCategory !== 'all') {
        url = `/api/products/category/${currentCategory}`;
      }
      
      const response = await fetch(url);
      const data = await response.json();
      
      if (url.includes('category')) {
        products = data.products;
      } else {
        products = data.products;
        categories = data.categories;
        populateCategories(categories);
      }
      
      displayProducts(products);
    } catch (error) {
      console.error('Ошибка при загрузке товаров через REST API:', error);
      productsContainer.innerHTML = '<p>Произошла ошибка при загрузке товаров</p>';
    }
  }
  
  // Функция для отображения товаров
  function displayProducts(productsToDisplay) {
    productsContainer.innerHTML = '';
    
    if (productsToDisplay.length === 0) {
      productsContainer.innerHTML = '<p>Товаров не найдено</p>';
      return;
    }
    
    productsToDisplay.forEach(product => {
      const productCard = document.createElement('div');
      productCard.classList.add('product-card');
      
      // HTML для карточки в зависимости от режима отображения
      let cardHTML = `<h2>${product.name}</h2>`;
      
      // Добавляем цену, если она доступна в текущем режиме
      if (product.price !== undefined) {
        const formattedPrice = new Intl.NumberFormat('ru-RU', {
          style: 'currency',
          currency: 'RUB'
        }).format(product.price);
        
        cardHTML += `<div class="product-price">${formattedPrice}</div>`;
      }
      
      // Добавляем описание, если оно доступно в текущем режиме
      if (product.description !== undefined) {
        cardHTML += `<p class="product-description">${product.description}</p>`;
      }
      
      // Добавляем категории, если они доступны в текущем режиме
      if (product.categories !== undefined) {
        const categoriesHTML = product.categories.map(category => 
          `<span class="category-tag">${category}</span>`
        ).join('');
        
        cardHTML += `<div class="product-categories">${categoriesHTML}</div>`;
      }
      
      productCard.innerHTML = cardHTML;
      productsContainer.appendChild(productCard);
    });
  }
  
  // Функция для заполнения списка категорий
  function populateCategories(categoriesData) {
    categorySelect.innerHTML = '<option value="all">Все товары</option>';
    
    categoriesData.forEach(category => {
      const option = document.createElement('option');
      option.value = category.name;
      option.textContent = category.name;
      categorySelect.appendChild(option);
    });
  }
  
  // Обработчик изменения выбранной категории
  categorySelect.addEventListener('change', () => {
    currentCategory = categorySelect.value;
    fetchProductsGraphQL();
  });
  
  // Обработчик изменения режима отображения
  viewSelect.addEventListener('change', () => {
    currentView = viewSelect.value;
    fetchProductsGraphQL();
  });
  
  // Функционал чата
  
  // Переключение видимости чата
  toggleChatBtn.addEventListener('click', () => {
    if (chatBody.classList.contains('open')) {
      chatBody.classList.remove('open');
      toggleChatBtn.textContent = 'Открыть чат';
    } else {
      chatBody.classList.add('open');
      toggleChatBtn.textContent = 'Закрыть чат';
      // Прокрутка чата вниз при открытии
      messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }
  });
  
  // Отправка сообщения
  function sendMessage() {
    const messageText = chatInput.value.trim();
    if (messageText === '') return;
    
    // Отправка сообщения через WebSocket
    const message = {
      text: messageText,
      sender: username,
      role: 'customer',
      timestamp: new Date().toISOString()
    };
    
    socket.emit('chat message', message);
    
    // Очистка поля ввода
    chatInput.value = '';
  }
  
  // Обработчик нажатия кнопки отправки
  sendMessageBtn.addEventListener('click', sendMessage);
  
  // Обработчик нажатия Enter в поле ввода
  chatInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      sendMessage();
    }
  });
  
  // Обработчик получения нового сообщения
  socket.on('chat message', (msg) => {
    const messageElement = document.createElement('div');
    messageElement.classList.add('message');
    
    // Определяем класс сообщения в зависимости от отправителя
    if (msg.role === 'admin') {
      messageElement.classList.add('admin');
    } else {
      messageElement.classList.add('user');
    }
    
    // Форматируем время
    const time = new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    messageElement.innerHTML = `
      <div class="message-header">
        <span class="sender">${msg.sender}</span>
        <span class="time">${time}</span>
      </div>
      <div class="message-text">${msg.text}</div>
    `;
    
    messagesContainer.appendChild(messageElement);
    
    // Прокрутка чата вниз при добавлении нового сообщения
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  });
  
  // Загружаем товары при загрузке страницы
  fetchProductsGraphQL();
}); 
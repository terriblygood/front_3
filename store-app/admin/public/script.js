document.addEventListener('DOMContentLoaded', () => {
  // DOM-элементы
  const productsList = document.getElementById('products-list');
  const addProductBtn = document.getElementById('add-product-btn');
  const addBulkBtn = document.getElementById('add-bulk-btn');
  const productModal = document.getElementById('product-modal');
  const bulkModal = document.getElementById('bulk-modal');
  const confirmModal = document.getElementById('confirm-modal');
  const productForm = document.getElementById('product-form');
  const bulkForm = document.getElementById('bulk-form');
  const categoriesContainer = document.getElementById('categories-container');
  const modalTitle = document.getElementById('modal-title');
  const cancelBtn = document.getElementById('cancel-btn');
  const bulkCancelBtn = document.getElementById('bulk-cancel-btn');
  const confirmDeleteBtn = document.getElementById('confirm-delete-btn');
  const cancelDeleteBtn = document.getElementById('cancel-delete-btn');
  const closeBtns = document.querySelectorAll('.close');
  
  // Элементы чата
  const toggleChatBtn = document.getElementById('toggle-chat');
  const chatBody = document.getElementById('chat-body');
  const messagesContainer = document.getElementById('messages');
  const chatInput = document.getElementById('chat-input');
  const sendMessageBtn = document.getElementById('send-message');
  
  let products = [];
  let categories = [];
  let currentProductId = null;
  let productToDeleteId = null;
  
  const API_URL = 'http://localhost:8080/api';
  
  // WebSocket для чата - подключаемся к клиентскому серверу
  const socket = io('http://localhost:3000');
  const adminName = 'Администратор';
  
  async function fetchProducts() {
    try {
      const response = await fetch(`${API_URL}/products`);
      const data = await response.json();
      products = data.products;
      categories = data.categories;
      renderProducts();
    } catch (error) {
      console.error('Ошибка при загрузке товаров:', error);
      showError('Не удалось загрузить товары');
    }
  }
  
  function renderProducts() {
    productsList.innerHTML = '';
    
    if (products.length === 0) {
      productsList.innerHTML = '<tr><td colspan="5" class="text-center">Нет товаров</td></tr>';
      return;
    }
    
    products.forEach(product => {
      const tr = document.createElement('tr');
      
      // Форматирование цены
      const formattedPrice = new Intl.NumberFormat('ru-RU', {
        style: 'currency',
        currency: 'RUB'
      }).format(product.price);
      
      // Форматирование категорий
      const categoriesHTML = product.categories.map(category => 
        `<span class="category-badge">${category}</span>`
      ).join('');
      
      tr.innerHTML = `
        <td>${product.id}</td>
        <td>${product.name}</td>
        <td>${formattedPrice}</td>
        <td>${categoriesHTML}</td>
        <td class="table-actions">
          <button class="btn primary edit-btn" data-id="${product.id}">Редактировать</button>
          <button class="btn danger delete-btn" data-id="${product.id}">Удалить</button>
        </td>
      `;
      
      productsList.appendChild(tr);
    });
    
    document.querySelectorAll('.edit-btn').forEach(btn => {
      btn.addEventListener('click', () => openEditModal(parseInt(btn.dataset.id)));
    });
    
    document.querySelectorAll('.delete-btn').forEach(btn => {
      btn.addEventListener('click', () => openDeleteConfirmation(parseInt(btn.dataset.id)));
    });
  }
  
  function renderCategories(selectedCategories = []) {
    categoriesContainer.innerHTML = '';
    
    categories.forEach(category => {
      const isChecked = selectedCategories.includes(category.name);
      
      const checkboxGroup = document.createElement('div');
      checkboxGroup.classList.add('checkbox-group');
      
      checkboxGroup.innerHTML = `
        <input type="checkbox" id="category-${category.id}" name="categories" value="${category.name}" ${isChecked ? 'checked' : ''}>
        <label for="category-${category.id}">${category.name}</label>
      `;
      
      categoriesContainer.appendChild(checkboxGroup);
    });
  }
  
  function openAddModal() {
    modalTitle.textContent = 'Добавить товар';
    productForm.reset();
    renderCategories();
    currentProductId = null;
    productModal.style.display = 'block';
  }
  
  function openEditModal(productId) {
    const product = products.find(p => p.id === productId);
    
    if (!product) {
      showError('Товар не найден');
      return;
    }
    
    modalTitle.textContent = 'Редактировать товар';
    
    document.getElementById('product-name').value = product.name;
    document.getElementById('product-price').value = product.price;
    document.getElementById('product-description').value = product.description;
    
    renderCategories(product.categories);
    
    currentProductId = product.id;
    productModal.style.display = 'block';
  }
  
  function openDeleteConfirmation(productId) {
    productToDeleteId = productId;
    confirmModal.style.display = 'block';
  }
  
  async function saveProduct(productData) {
    try {
      const url = currentProductId 
        ? `${API_URL}/products/${currentProductId}` 
        : `${API_URL}/products`;
      
      const method = currentProductId ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(productData)
      });
      
      if (!response.ok) {
        throw new Error('Ошибка при сохранении товара');
      }
      
      await fetchProducts();
      productModal.style.display = 'none';
    } catch (error) {
      console.error('Ошибка при сохранении товара:', error);
      showError('Не удалось сохранить товар');
    }
  }
  
  async function addBulkProducts(productsData) {
    try {
      const response = await fetch(`${API_URL}/products/bulk`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(productsData)
      });
      
      if (!response.ok) {
        throw new Error('Ошибка при добавлении товаров');
      }
      
      await fetchProducts();
      bulkModal.style.display = 'none';
    } catch (error) {
      console.error('Ошибка при добавлении товаров:', error);
      showError('Не удалось добавить товары');
    }
  }
  
  async function deleteProduct(productId) {
    try {
      const response = await fetch(`${API_URL}/products/${productId}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) {
        throw new Error('Ошибка при удалении товара');
      }
      
      await fetchProducts();
      confirmModal.style.display = 'none';
    } catch (error) {
      console.error('Ошибка при удалении товара:', error);
      showError('Не удалось удалить товар');
    }
  }
  
  function showError(message) {
    alert(message);
  }
  
  addProductBtn.addEventListener('click', openAddModal);
  
  addBulkBtn.addEventListener('click', () => {
    bulkModal.style.display = 'block';
  });
  
  productForm.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const formData = new FormData(productForm);
    const name = formData.get('name');
    const price = parseFloat(formData.get('price'));
    const description = formData.get('description');
    const categoriesValues = formData.getAll('categories');
    
    const productData = {
      name,
      price,
      description,
      categories: categoriesValues
    };
    
    saveProduct(productData);
  });
  
  bulkForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    try {
      const jsonData = document.getElementById('bulk-json').value;
      const productsData = JSON.parse(jsonData);
      
      if (!Array.isArray(productsData)) {
        showError('Введите корректный JSON-массив товаров');
        return;
      }
      
      await addBulkProducts(productsData);
    } catch (error) {
      console.error('Ошибка при парсинге JSON:', error);
      showError('Неверный формат JSON');
    }
  });
  
  confirmDeleteBtn.addEventListener('click', () => {
    if (productToDeleteId) {
      deleteProduct(productToDeleteId);
    }
  });
  
  cancelBtn.addEventListener('click', () => {
    productModal.style.display = 'none';
  });
  
  bulkCancelBtn.addEventListener('click', () => {
    bulkModal.style.display = 'none';
  });
  
  cancelDeleteBtn.addEventListener('click', () => {
    confirmModal.style.display = 'none';
    productToDeleteId = null;
  });
  
  closeBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      productModal.style.display = 'none';
      bulkModal.style.display = 'none';
      confirmModal.style.display = 'none';
    });
  });
  
  // Функциональность чата
  
  // Переключение видимости чата
  toggleChatBtn.addEventListener('click', () => {
    if (chatBody.classList.contains('open')) {
      chatBody.classList.remove('open');
      toggleChatBtn.textContent = 'Открыть чат';
    } else {
      chatBody.classList.add('open');
      toggleChatBtn.textContent = 'Закрыть чат';
      messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }
  });
  
  // Отправка сообщения
  function sendMessage() {
    const messageText = chatInput.value.trim();
    if (messageText === '') return;
    
    const message = {
      text: messageText,
      sender: adminName,
      role: 'admin',
      timestamp: new Date().toISOString()
    };
    
    socket.emit('chat message', message);
    chatInput.value = '';
  }
  
  // Обработчик нажатия кнопки отправки сообщения
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
    
    if (msg.role === 'admin') {
      messageElement.classList.add('admin');
    } else {
      messageElement.classList.add('user');
    }
    
    const time = new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    messageElement.innerHTML = `
      <div class="message-header">
        <span class="sender">${msg.sender}</span>
        <span class="time">${time}</span>
      </div>
      <div class="message-text">${msg.text}</div>
    `;
    
    messagesContainer.appendChild(messageElement);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  });
  
  window.addEventListener('click', (e) => {
    if (e.target === productModal) {
      productModal.style.display = 'none';
    } else if (e.target === bulkModal) {
      bulkModal.style.display = 'none';
    } else if (e.target === confirmModal) {
      confirmModal.style.display = 'none';
      productToDeleteId = null;
    }
  });

  fetchProducts();
}); 
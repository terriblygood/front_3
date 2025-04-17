document.addEventListener('DOMContentLoaded', () => {

  const productsContainer = document.getElementById('products-container');
  const categorySelect = document.getElementById('category-select');
  

  let products = [];
  let categories = [];
  
 
  async function fetchProducts() {
    try {
      const response = await fetch('/api/products');
      const data = await response.json();
      products = data.products;
      categories = data.categories;
      

      displayProducts(products);
      populateCategories(categories);
    } catch (error) {
      console.error('Ошибка при загрузке товаров:', error);
      productsContainer.innerHTML = '<p>Произошла ошибка при загрузке товаров</p>';
    }
  }
  

  function displayProducts(productsToDisplay) {
    productsContainer.innerHTML = '';
    
    if (productsToDisplay.length === 0) {
      productsContainer.innerHTML = '<p>Товаров не найдено</p>';
      return;
    }
    
    productsToDisplay.forEach(product => {
      const productCard = document.createElement('div');
      productCard.classList.add('product-card');
      

      const formattedPrice = new Intl.NumberFormat('ru-RU', {
        style: 'currency',
        currency: 'RUB'
      }).format(product.price);
      
      
      const categoriesHTML = product.categories.map(category => 
        `<span class="category-tag">${category}</span>`
      ).join('');
      
      productCard.innerHTML = `
        <h2>${product.name}</h2>
        <div class="product-price">${formattedPrice}</div>
        <p class="product-description">${product.description}</p>
        <div class="product-categories">
          ${categoriesHTML}
        </div>
      `;
      
      productsContainer.appendChild(productCard);
    });
  }
  

  function populateCategories(categoriesData) {
    categorySelect.innerHTML = '<option value="all">Все товары</option>';
    
    categoriesData.forEach(category => {
      const option = document.createElement('option');
      option.value = category.name;
      option.textContent = category.name;
      categorySelect.appendChild(option);
    });
  }
  

  categorySelect.addEventListener('change', async () => {
    const selectedCategory = categorySelect.value;
    
    if (selectedCategory === 'all') {
      displayProducts(products);
      return;
    }
    
    try {
      const response = await fetch(`/api/products/category/${selectedCategory}`);
      const data = await response.json();
      displayProducts(data.products);
    } catch (error) {
      console.error('Ошибка при фильтрации товаров:', error);
    }
  });
  

  fetchProducts();
}); 
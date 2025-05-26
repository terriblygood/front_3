
## Установка и запуск

1. Установите зависимости:

```
cd store-app
npm install
docker-compose up --build
```
докер запустили и хватит больше не над ниче

2. Запустите оба сервера одновременно:

```
npm start
```

Или запустите серверы по отдельности:

```
npm run start-client    # Запуск клиентского сервера
npm run start-admin     # Запуск административного сервера
```

## Доступ к приложению

- Интернет-магазин: http://localhost:3000
- Панель администратора: http://localhost:8080
- API документация (Swagger): http://localhost:8080/spec
- GraphQL playground: http://localhost:3000/graphql


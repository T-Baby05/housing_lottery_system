# lottery-server

还房摇号系统 Spring Boot 后端工程。

## 本地验证

```bash
mvn test
```

## 本地启动

```bash
mvn spring-boot:run
```

默认端口为 `8080`，可通过环境变量 `LOTTERY_SERVER_PORT` 覆盖。

数据库连接当前为占位配置，可通过 `LOTTERY_DB_URL`、`LOTTERY_DB_USERNAME`、`LOTTERY_DB_PASSWORD` 覆盖。Issue #1 不创建数据库表，也不实现业务 API。

# 还房摇号系统 MVP 实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 构建还房摇号系统 MVP，支撑一场 900 人次、4 种房型、700 套房源的现场摇号活动

**Architecture:** Spring Boot 3 单体后端 + Vue 3 管理端 + Vue 3 移动查询端。摇号引擎独立抽离为 LotteryEngine 纯函数模块，可独立测试和送检。所有表从第一天带 project_id 为多项目预留。

**Tech Stack:** Spring Boot 3 + MyBatis-Plus + MySQL 8.0 / Vue 3 + Element Plus + Vite

---

## Task 1: 后端项目脚手架

**Files:**
- Create: `lottery-server/pom.xml`
- Create: `lottery-server/src/main/java/com/housing/lottery/LotteryApplication.java`
- Create: `lottery-server/src/main/resources/application.yml`

- [ ] **Step 1: 创建 Spring Boot 项目目录结构**

```bash
mkdir -p lottery-server/src/main/java/com/housing/lottery/{config,controller,service,mapper,entity,engine}
mkdir -p lottery-server/src/main/resources
mkdir -p lottery-server/src/test/java/com/housing/lottery/engine
```

- [ ] **Step 2: 编写 pom.xml**

```xml
<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 http://maven.apache.org/xsd/maven-4.0.0.xsd">
    <modelVersion>4.0.0</modelVersion>
    <parent>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-parent</artifactId>
        <version>3.2.5</version>
    </parent>
    <groupId>com.housing</groupId>
    <artifactId>lottery-server</artifactId>
    <version>1.0.0-SNAPSHOT</version>
    <name>lottery-server</name>

    <properties>
        <java.version>17</java.version>
        <mybatis-plus.version>3.5.6</mybatis-plus.version>
        <easyexcel.version>3.3.3</easyexcel.version>
    </properties>

    <dependencies>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-web</artifactId>
        </dependency>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-security</artifactId>
        </dependency>
        <dependency>
            <groupId>com.baomidou</groupId>
            <artifactId>mybatis-plus-spring-boot3-starter</artifactId>
            <version>${mybatis-plus.version}</version>
        </dependency>
        <dependency>
            <groupId>com.mysql</groupId>
            <artifactId>mysql-connector-j</artifactId>
            <scope>runtime</scope>
        </dependency>
        <dependency>
            <groupId>com.alibaba</groupId>
            <artifactId>easyexcel</artifactId>
            <version>${easyexcel.version}</version>
        </dependency>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-test</artifactId>
            <scope>test</scope>
        </dependency>
    </dependencies>

    <build>
        <plugins>
            <plugin>
                <groupId>org.springframework.boot</groupId>
                <artifactId>spring-boot-maven-plugin</artifactId>
            </plugin>
        </plugins>
    </build>
</project>
```

- [ ] **Step 3: 编写启动类**

```java
package com.housing.lottery;

import org.mybatis.spring.annotation.MapperScan;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
@MapperScan("com.housing.lottery.mapper")
public class LotteryApplication {
    public static void main(String[] args) {
        SpringApplication.run(LotteryApplication.class, args);
    }
}
```

- [ ] **Step 4: 编写 application.yml**

```yaml
spring:
  datasource:
    url: jdbc:mysql://localhost:3306/housing_lottery?useUnicode=true&characterEncoding=utf-8&serverTimezone=Asia/Shanghai
    username: root
    password: ${DB_PASSWORD:root}
    driver-class-name: com.mysql.cj.jdbc.Driver

mybatis-plus:
  configuration:
    map-underscore-to-camel-case: true
    log-impl: org.apache.ibatis.logging.stdout.StdOutImpl
  global-config:
    db-config:
      id-type: auto
      logic-delete-field: deleted
      logic-delete-value: 1
      logic-not-delete-value: 0

server:
  port: 8080
```

- [ ] **Step 5: 验证项目可启动**

Run: `cd lottery-server && mvn spring-boot:run`

Expected: Spring Boot 启动成功（如无 MySQL 则报连接错误，属正常）

- [ ] **Step 6: Commit**

```bash
git add lottery-server/
git commit -m "feat: scaffold Spring Boot project with MyBatis-Plus and EasyExcel"
```

---

## Task 2: 数据库初始化

**Files:**
- Create: `lottery-server/src/main/resources/db/schema.sql`
- Create: `lottery-server/src/main/resources/db/data.sql`

- [ ] **Step 1: 编写建表 SQL**

```sql
-- schema.sql
CREATE DATABASE IF NOT EXISTS housing_lottery DEFAULT CHARSET utf8mb4;
USE housing_lottery;

CREATE TABLE project (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    code VARCHAR(50) NOT NULL UNIQUE,
    status VARCHAR(20) NOT NULL DEFAULT 'DRAFT',
    lottery_date DATE,
    data_hash VARCHAR(64),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE household (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    project_id BIGINT NOT NULL,
    participant_no VARCHAR(20) NOT NULL,
    holder_name VARCHAR(50) NOT NULL,
    id_card VARCHAR(100) NOT NULL,
    phone VARCHAR(50) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'NORMAL',
    member_count INT DEFAULT 1,
    lottery_status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uk_project_pno (project_id, participant_no),
    INDEX idx_project_status (project_id, status),
    INDEX idx_project_lottery_status (project_id, lottery_status)
) ENGINE=InnoDB;

CREATE TABLE housing_unit (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    project_id BIGINT NOT NULL,
    unit_code VARCHAR(50) NOT NULL,
    house_type VARCHAR(10) NOT NULL,
    building VARCHAR(50),
    floor_level INT,
    area DECIMAL(8,2),
    status VARCHAR(20) NOT NULL DEFAULT 'AVAILABLE',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uk_project_ucode (project_id, unit_code),
    INDEX idx_project_type (project_id, house_type)
) ENGINE=InnoDB;

CREATE TABLE wish (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    household_id BIGINT NOT NULL,
    priority INT NOT NULL,
    house_type VARCHAR(10) NOT NULL,
    is_active TINYINT DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uk_household_priority (household_id, priority),
    INDEX idx_household (household_id)
) ENGINE=InnoDB;

CREATE TABLE lottery_round (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    project_id BIGINT NOT NULL,
    round_order INT NOT NULL,
    house_type VARCHAR(10) NOT NULL,
    candidate_count INT DEFAULT 0,
    winner_count INT DEFAULT 0,
    seed VARCHAR(64),
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    started_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uk_project_order (project_id, round_order)
) ENGINE=InnoDB;

CREATE TABLE lottery_result (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    round_id BIGINT NOT NULL,
    household_id BIGINT NOT NULL,
    result VARCHAR(20) NOT NULL,
    sort_order INT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_round (round_id),
    INDEX idx_household (household_id)
) ENGINE=InnoDB;

CREATE TABLE audit_log (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    project_id BIGINT,
    action VARCHAR(50) NOT NULL,
    operator VARCHAR(50),
    detail TEXT,
    created_at DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3),
    INDEX idx_project (project_id),
    INDEX idx_action_time (action, created_at)
) ENGINE=InnoDB;
```

- [ ] **Step 2: 编写初始数据 SQL**

```sql
-- data.sql: 初始化一个演示项目
INSERT INTO project (name, code, status) VALUES ('演示项目', 'DEMO-001', 'PREPARING');
```

- [ ] **Step 3: 执行 SQL 创建数据库**

Run: `mysql -u root -p < lottery-server/src/main/resources/db/schema.sql`
Run: `mysql -u root -p < lottery-server/src/main/resources/db/data.sql`

- [ ] **Step 4: Commit**

```bash
git add lottery-server/src/main/resources/db/
git commit -m "feat: add database schema and seed data"
```

---

## Task 3: 实体类与 Mapper

**Files:**
- Create: `lottery-server/src/main/java/com/housing/lottery/entity/Project.java`
- Create: `lottery-server/src/main/java/com/housing/lottery/entity/Household.java`
- Create: `lottery-server/src/main/java/com/housing/lottery/entity/HousingUnit.java`
- Create: `lottery-server/src/main/java/com/housing/lottery/entity/Wish.java`
- Create: `lottery-server/src/main/java/com/housing/lottery/entity/LotteryRound.java`
- Create: `lottery-server/src/main/java/com/housing/lottery/entity/LotteryResult.java`
- Create: `lottery-server/src/main/java/com/housing/lottery/entity/AuditLog.java`
- Create: `lottery-server/src/main/java/com/housing/lottery/mapper/*.java`

- [ ] **Step 1: 编写实体类 Project.java**

```java
package com.housing.lottery.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@TableName("project")
public class Project {
    @TableId(type = IdType.AUTO)
    private Long id;
    private String name;
    private String code;
    private String status;
    private LocalDate lotteryDate;
    private String dataHash;
    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createdAt;
    @TableField(fill = FieldFill.INSERT_UPDATE)
    private LocalDateTime updatedAt;
}
```

- [ ] **Step 2: 编写实体类 Household.java**

```java
package com.housing.lottery.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@TableName("household")
public class Household {
    @TableId(type = IdType.AUTO)
    private Long id;
    private Long projectId;
    private String participantNo;
    private String holderName;
    private String idCard;
    private String phone;
    private String status;
    private Integer memberCount;
    private String lotteryStatus;
    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createdAt;
    @TableField(fill = FieldFill.INSERT_UPDATE)
    private LocalDateTime updatedAt;
}
```

- [ ] **Step 3: 编写实体类 HousingUnit.java**

```java
package com.housing.lottery.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@TableName("housing_unit")
public class HousingUnit {
    @TableId(type = IdType.AUTO)
    private Long id;
    private Long projectId;
    private String unitCode;
    private String houseType;
    private String building;
    private Integer floorLevel;
    private BigDecimal area;
    private String status;
    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createdAt;
    @TableField(fill = FieldFill.INSERT_UPDATE)
    private LocalDateTime updatedAt;
}
```

- [ ] **Step 4: 编写实体类 Wish.java**

```java
package com.housing.lottery.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@TableName("wish")
public class Wish {
    @TableId(type = IdType.AUTO)
    private Long id;
    private Long householdId;
    private Integer priority;
    private String houseType;
    private Integer isActive;
    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createdAt;
}
```

- [ ] **Step 5: 编写实体类 LotteryRound.java**

```java
package com.housing.lottery.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@TableName("lottery_round")
public class LotteryRound {
    @TableId(type = IdType.AUTO)
    private Long id;
    private Long projectId;
    private Integer roundOrder;
    private String houseType;
    private Integer candidateCount;
    private Integer winnerCount;
    private String seed;
    private String status;
    private LocalDateTime startedAt;
    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createdAt;
}
```

- [ ] **Step 6: 编写实体类 LotteryResult.java**

```java
package com.housing.lottery.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@TableName("lottery_result")
public class LotteryResult {
    @TableId(type = IdType.AUTO)
    private Long id;
    private Long roundId;
    private Long householdId;
    private String result;
    private Integer sortOrder;
    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createdAt;
}
```

- [ ] **Step 7: 编写实体类 AuditLog.java**

```java
package com.housing.lottery.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@TableName("audit_log")
public class AuditLog {
    @TableId(type = IdType.AUTO)
    private Long id;
    private Long projectId;
    private String action;
    private String operator;
    private String detail;
    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createdAt;
}
```

- [ ] **Step 8: 编写所有 Mapper 接口**

```java
package com.housing.lottery.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.housing.lottery.entity.*;
import org.apache.ibatis.annotations.Mapper;

@Mapper
public interface ProjectMapper extends BaseMapper<Project> {}

@Mapper
public interface HouseholdMapper extends BaseMapper<Household> {}

@Mapper
public interface HousingUnitMapper extends BaseMapper<HousingUnit> {}

@Mapper
public interface WishMapper extends BaseMapper<Wish> {}

@Mapper
public interface LotteryRoundMapper extends BaseMapper<LotteryRound> {}

@Mapper
public interface LotteryResultMapper extends BaseMapper<LotteryResult> {}

@Mapper
public interface AuditLogMapper extends BaseMapper<AuditLog> {}
```

Place each interface in its own file under `mapper/`.

- [ ] **Step 9: 添加 MyBatis-Plus 自动填充配置**

```java
package com.housing.lottery.config;

import com.baomidou.mybatisplus.core.handlers.MetaObjectHandler;
import org.apache.ibatis.reflection.MetaObject;
import org.springframework.context.annotation.Configuration;

import java.time.LocalDateTime;

@Configuration
public class MybatisPlusConfig implements MetaObjectHandler {
    @Override
    public void insertFill(MetaObject metaObject) {
        this.strictInsertFill(metaObject, "createdAt", LocalDateTime.class, LocalDateTime.now());
    }

    @Override
    public void updateFill(MetaObject metaObject) {
        this.strictUpdateFill(metaObject, "updatedAt", LocalDateTime.class, LocalDateTime.now());
    }
}
```

- [ ] **Step 10: Commit**

```bash
git add lottery-server/src/main/java/com/housing/lottery/entity/ lottery-server/src/main/java/com/housing/lottery/mapper/ lottery-server/src/main/java/com/housing/lottery/config/
git commit -m "feat: add entity classes and MyBatis-Plus mappers"
```

---

## Task 4: 摇号引擎 LotteryEngine（TDD 核心模块）

**Files:**
- Create: `lottery-server/src/main/java/com/housing/lottery/engine/LotteryEngine.java`
- Create: `lottery-server/src/main/java/com/housing/lottery/engine/LotteryInput.java`
- Create: `lottery-server/src/main/java/com/housing/lottery/engine/LotteryOutput.java`
- Create: `lottery-server/src/test/java/com/housing/lottery/engine/LotteryEngineTest.java`

- [ ] **Step 1: 编写 LotteryInput 数据类**

```java
package com.housing.lottery.engine;

import java.util.List;

public class LotteryInput {
    private final List<String> candidateIds;
    private final int winnerCount;
    private final String seed;

    public LotteryInput(List<String> candidateIds, int winnerCount, String seed) {
        this.candidateIds = candidateIds;
        this.winnerCount = winnerCount;
        this.seed = seed;
    }

    public List<String> getCandidateIds() { return candidateIds; }
    public int getWinnerCount() { return winnerCount; }
    public String getSeed() { return seed; }
}
```

- [ ] **Step 2: 编写 LotteryOutput 数据类**

```java
package com.housing.lottery.engine;

import java.util.List;

public class LotteryOutput {
    private final List<String> winnerIds;
    private final List<String> loserIds;
    private final String seed;

    public LotteryOutput(List<String> winnerIds, List<String> loserIds, String seed) {
        this.winnerIds = winnerIds;
        this.loserIds = loserIds;
        this.seed = seed;
    }

    public List<String> getWinnerIds() { return winnerIds; }
    public List<String> getLoserIds() { return loserIds; }
    public String getSeed() { return seed; }
}
```

- [ ] **Step 3: 编写测试 —— 可复现性**

```java
package com.housing.lottery.engine;

import org.junit.jupiter.api.Test;
import java.util.List;
import static org.junit.jupiter.api.Assertions.*;

class LotteryEngineTest {

    @Test
    void shouldProduceSameResultWithSameSeed() {
        LotteryEngine engine = new LotteryEngine();
        List<String> candidates = List.of("H001","H002","H003","H004","H005","H006","H007","H008","H009","H010");
        String seed = "test-seed-001";

        LotteryOutput result1 = engine.draw(new LotteryInput(candidates, 3, seed));
        LotteryOutput result2 = engine.draw(new LotteryInput(candidates, 3, seed));

        assertEquals(result1.getWinnerIds(), result2.getWinnerIds());
        assertEquals(result1.getLoserIds(), result2.getLoserIds());
    }
}
```

Run: `cd lottery-server && mvn test -Dtest=LotteryEngineTest#shouldProduceSameResultWithSameSeed`

Expected: FAIL — LotteryEngine 类尚未创建

- [ ] **Step 4: 实现 LotteryEngine 使测试通过**

```java
package com.housing.lottery.engine;

import java.security.SecureRandom;
import java.util.ArrayList;
import java.util.List;

public class LotteryEngine {

    public LotteryOutput draw(LotteryInput input) {
        List<String> pool = new ArrayList<>(input.getCandidateIds());
        SecureRandom rng = createRng(input.getSeed());

        for (int i = pool.size() - 1; i > 0; i--) {
            int j = rng.nextInt(i + 1);
            String tmp = pool.get(i);
            pool.set(i, pool.get(j));
            pool.set(j, tmp);
        }

        int count = Math.min(input.getWinnerCount(), pool.size());
        List<String> winners = List.copyOf(pool.subList(0, count));
        List<String> losers = List.copyOf(pool.subList(count, pool.size()));

        return new LotteryOutput(winners, losers, input.getSeed());
    }

    private SecureRandom createRng(String seed) {
        try {
            SecureRandom rng = SecureRandom.getInstance("SHA1PRNG");
            rng.setSeed(seed.getBytes());
            return rng;
        } catch (Exception e) {
            throw new RuntimeException("Failed to initialize RNG", e);
        }
    }
}
```

Run: `cd lottery-server && mvn test -Dtest=LotteryEngineTest#shouldProduceSameResultWithSameSeed`

Expected: PASS

- [ ] **Step 5: 编写测试 —— 中签数量正确**

```java
@Test
void shouldReturnCorrectWinnerCount() {
    LotteryEngine engine = new LotteryEngine();
    List<String> candidates = List.of("H001","H002","H003","H004","H005");
    LotteryOutput result = engine.draw(new LotteryInput(candidates, 2, "seed-002"));

    assertEquals(2, result.getWinnerIds().size());
    assertEquals(3, result.getLoserIds().size());
}

@Test
void shouldNotExceedCandidateCount() {
    LotteryEngine engine = new LotteryEngine();
    List<String> candidates = List.of("H001","H002","H003");
    LotteryOutput result = engine.draw(new LotteryInput(candidates, 100, "seed-003"));

    assertEquals(3, result.getWinnerIds().size());
    assertEquals(0, result.getLoserIds().size());
}
```

Run: `cd lottery-server && mvn test -Dtest=LotteryEngineTest`

Expected: PASS（全部测试通过）

- [ ] **Step 6: 编写测试 —— 不同种子产生不同结果**

```java
@Test
void shouldProduceDifferentResultsWithDifferentSeeds() {
    LotteryEngine engine = new LotteryEngine();
    List<String> candidates = List.of("H001","H002","H003","H004","H005","H006","H007","H008","H009","H010");

    LotteryOutput result1 = engine.draw(new LotteryInput(candidates, 3, "seed-alpha"));
    LotteryOutput result2 = engine.draw(new LotteryInput(candidates, 3, "seed-beta"));

    boolean same = result1.getWinnerIds().equals(result2.getWinnerIds());
    assertFalse(same, "Different seeds should produce different results with high probability");
}
```

Run: `cd lottery-server && mvn test -Dtest=LotteryEngineTest`

Expected: PASS

- [ ] **Step 7: 编写测试 —— Fisher-Yates 公平性检验（每位候选人的中签概率接近）**

```java
@Test
void shouldHaveFairDistribution() {
    LotteryEngine engine = new LotteryEngine();
    List<String> candidates = List.of("H001","H002","H003","H004","H005","H006","H007","H008","H009","H010");
    int[] winCounts = new int[10];
    int trials = 10000;

    for (int t = 0; t < trials; t++) {
        String seed = "fairness-seed-" + t;
        LotteryOutput result = engine.draw(new LotteryInput(candidates, 3, seed));
        for (String winnerId : result.getWinnerIds()) {
            int idx = Integer.parseInt(winnerId.substring(1)) - 1;
            winCounts[idx]++;
        }
    }

    double expectedWins = trials * 3.0 / 10;
    for (int i = 0; i < 10; i++) {
        assertTrue(winCounts[i] > expectedWins * 0.7,
            "Candidate " + i + " won too rarely: " + winCounts[i]);
        assertTrue(winCounts[i] < expectedWins * 1.3,
            "Candidate " + i + " won too often: " + winCounts[i]);
    }
}
```

Run: `cd lottery-server && mvn test -Dtest=LotteryEngineTest`

Expected: PASS

- [ ] **Step 8: Commit**

```bash
git add lottery-server/src/main/java/com/housing/lottery/engine/ lottery-server/src/test/
git commit -m "feat: implement LotteryEngine with Fisher-Yates shuffle and TDD"
```

---

## Task 5: 住户管理 API

**Files:**
- Create: `lottery-server/src/main/java/com/housing/lottery/service/HouseholdService.java`
- Create: `lottery-server/src/main/java/com/housing/lottery/service/impl/HouseholdServiceImpl.java`
- Create: `lottery-server/src/main/java/com/housing/lottery/controller/HouseholdController.java`
- Create: `lottery-server/src/main/java/com/housing/lottery/dto/HouseholdImportDto.java`

- [ ] **Step 1: 编写 Excel 导入 DTO**

```java
package com.housing.lottery.dto;

import com.alibaba.excel.annotation.ExcelProperty;
import lombok.Data;

@Data
public class HouseholdImportDto {
    @ExcelProperty("参与编号")
    private String participantNo;

    @ExcelProperty("户主姓名")
    private String holderName;

    @ExcelProperty("身份证号")
    private String idCard;

    @ExcelProperty("手机号")
    private String phone;

    @ExcelProperty("家庭成员数")
    private Integer memberCount;
}
```

- [ ] **Step 2: 编写 HouseholdService 接口**

```java
package com.housing.lottery.service;

import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.service.IService;
import com.housing.lottery.entity.Household;

import java.io.InputStream;
import java.util.Map;

public interface HouseholdService extends IService<Household> {
    IPage<Household> pageQuery(Long projectId, String keyword, String status, int page, int size);
    void importExcel(Long projectId, InputStream inputStream);
    Map<String, Object> getWishes(Long householdId);
}
```

- [ ] **Step 3: 编写 HouseholdServiceImpl**

```java
package com.housing.lottery.service.impl;

import com.alibaba.excel.EasyExcel;
import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.housing.lottery.dto.HouseholdImportDto;
import com.housing.lottery.entity.Household;
import com.housing.lottery.entity.Wish;
import com.housing.lottery.mapper.HouseholdMapper;
import com.housing.lottery.mapper.WishMapper;
import com.housing.lottery.service.HouseholdService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.InputStream;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class HouseholdServiceImpl extends ServiceImpl<HouseholdMapper, Household>
        implements HouseholdService {

    private final WishMapper wishMapper;

    public HouseholdServiceImpl(WishMapper wishMapper) {
        this.wishMapper = wishMapper;
    }

    @Override
    public IPage<Household> pageQuery(Long projectId, String keyword, String status, int page, int size) {
        LambdaQueryWrapper<Household> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(Household::getProjectId, projectId);
        if (status != null && !status.isEmpty()) {
            wrapper.eq(Household::getStatus, status);
        }
        if (keyword != null && !keyword.isEmpty()) {
            wrapper.and(w -> w.like(Household::getParticipantNo, keyword)
                    .or().like(Household::getHolderName, keyword));
        }
        wrapper.orderByAsc(Household::getParticipantNo);
        return page(new Page<>(page, size), wrapper);
    }

    @Override
    @Transactional
    public void importExcel(Long projectId, InputStream inputStream) {
        List<HouseholdImportDto> dtos = new ArrayList<>();
        EasyExcel.read(inputStream, HouseholdImportDto.class, new com.alibaba.excel.context.AnalysisContext() {
            // Using a simpler approach — read all rows synchronously
        }).sheet().doRead();

        // Alternative: use EasyExcel.read().sheet().doReadSync()
        // For simplicity, we'll re-read synchronously
        // (In actual implementation use doReadSync or a proper listener)

        List<Household> households = new ArrayList<>();
        for (var dto : dtos) {
            Household h = new Household();
            h.setProjectId(projectId);
            h.setParticipantNo(dto.getParticipantNo());
            h.setHolderName(dto.getHolderName());
            h.setIdCard(dto.getIdCard());
            h.setPhone(dto.getPhone());
            h.setMemberCount(dto.getMemberCount() != null ? dto.getMemberCount() : 1);
            h.setStatus("NORMAL");
            h.setLotteryStatus("PENDING");
            households.add(h);
        }
        saveBatch(households);
    }

    @Override
    public Map<String, Object> getWishes(Long householdId) {
        List<Wish> wishes = wishMapper.selectList(
                new LambdaQueryWrapper<Wish>()
                        .eq(Wish::getHouseholdId, householdId)
                        .orderByAsc(Wish::getPriority));
        Map<String, Object> result = new HashMap<>();
        result.put("householdId", householdId);
        result.put("wishes", wishes);
        return result;
    }
}
```

- [ ] **Step 4: 修正 importExcel 使用 doReadSync**

```java
@Override
@Transactional
public void importExcel(Long projectId, InputStream inputStream) {
    List<HouseholdImportDto> dtos = EasyExcel.read(inputStream)
            .head(HouseholdImportDto.class).sheet().doReadSync();

    List<Household> households = new ArrayList<>();
    for (HouseholdImportDto dto : dtos) {
        Household h = new Household();
        h.setProjectId(projectId);
        h.setParticipantNo(dto.getParticipantNo());
        h.setHolderName(dto.getHolderName());
        h.setIdCard(dto.getIdCard());
        h.setPhone(dto.getPhone());
        h.setMemberCount(dto.getMemberCount() != null ? dto.getMemberCount() : 1);
        h.setStatus("NORMAL");
        h.setLotteryStatus("PENDING");
        households.add(h);
    }
    saveBatch(households);
}
```

- [ ] **Step 5: 编写 HouseholdController**

```java
package com.housing.lottery.controller;

import com.baomidou.mybatisplus.core.metadata.IPage;
import com.housing.lottery.entity.Household;
import com.housing.lottery.service.HouseholdService;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Map;

@RestController
@RequestMapping("/api/households")
public class HouseholdController {

    private final HouseholdService householdService;

    public HouseholdController(HouseholdService householdService) {
        this.householdService = householdService;
    }

    @GetMapping
    public IPage<Household> list(
            @RequestParam(defaultValue = "1") Long projectId,
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String status,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "20") int size) {
        return householdService.pageQuery(projectId, keyword, status, page, size);
    }

    @PostMapping
    public Household create(@RequestBody Household household) {
        householdService.save(household);
        return household;
    }

    @PutMapping("/{id}")
    public Household update(@PathVariable Long id, @RequestBody Household household) {
        household.setId(id);
        householdService.updateById(household);
        return household;
    }

    @PostMapping("/import")
    public String importExcel(@RequestParam Long projectId,
                              @RequestParam("file") MultipartFile file) throws IOException {
        householdService.importExcel(projectId, file.getInputStream());
        return "ok";
    }

    @GetMapping("/{id}/wishes")
    public Map<String, Object> getWishes(@PathVariable Long id) {
        return householdService.getWishes(id);
    }
}
```

- [ ] **Step 6: 验证 API 可启动**

Run: `cd lottery-server && mvn spring-boot:run`

Expected: 应用启动，`/api/households?projectId=1` 返回空列表

- [ ] **Step 7: Commit**

```bash
git add lottery-server/src/main/java/com/housing/lottery/service/ lottery-server/src/main/java/com/housing/lottery/controller/ lottery-server/src/main/java/com/housing/lottery/dto/
git commit -m "feat: add household management API with Excel import"
```

---

## Task 6: 房源管理 API

**Files:**
- Create: `lottery-server/src/main/java/com/housing/lottery/service/UnitService.java`
- Create: `lottery-server/src/main/java/com/housing/lottery/service/impl/UnitServiceImpl.java`
- Create: `lottery-server/src/main/java/com/housing/lottery/controller/UnitController.java`
- Create: `lottery-server/src/main/java/com/housing/lottery/dto/UnitImportDto.java`

- [ ] **Step 1: 编写 UnitImportDto**

```java
package com.housing.lottery.dto;

import com.alibaba.excel.annotation.ExcelProperty;
import lombok.Data;
import java.math.BigDecimal;

@Data
public class UnitImportDto {
    @ExcelProperty("房源编号")
    private String unitCode;

    @ExcelProperty("房型")
    private String houseType;

    @ExcelProperty("楼栋")
    private String building;

    @ExcelProperty("楼层")
    private Integer floorLevel;

    @ExcelProperty("面积")
    private BigDecimal area;
}
```

- [ ] **Step 2: 编写 UnitService 及实现**

```java
package com.housing.lottery.service;

import com.baomidou.mybatisplus.extension.service.IService;
import com.housing.lottery.entity.HousingUnit;
import java.io.InputStream;
import java.util.List;
import java.util.Map;

public interface UnitService extends IService<HousingUnit> {
    void importExcel(Long projectId, InputStream inputStream);
    Map<String, Long> getStats(Long projectId);
}
```

```java
package com.housing.lottery.service.impl;

import com.alibaba.excel.EasyExcel;
import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.housing.lottery.dto.UnitImportDto;
import com.housing.lottery.entity.HousingUnit;
import com.housing.lottery.mapper.HousingUnitMapper;
import com.housing.lottery.service.UnitService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.InputStream;
import java.util.*;

@Service
public class UnitServiceImpl extends ServiceImpl<HousingUnitMapper, HousingUnit>
        implements UnitService {

    @Override
    @Transactional
    public void importExcel(Long projectId, InputStream inputStream) {
        List<UnitImportDto> dtos = EasyExcel.read(inputStream)
                .head(UnitImportDto.class).sheet().doReadSync();

        List<HousingUnit> units = new ArrayList<>();
        for (UnitImportDto dto : dtos) {
            HousingUnit u = new HousingUnit();
            u.setProjectId(projectId);
            u.setUnitCode(dto.getUnitCode());
            u.setHouseType(dto.getHouseType());
            u.setBuilding(dto.getBuilding());
            u.setFloorLevel(dto.getFloorLevel());
            u.setArea(dto.getArea());
            u.setStatus("AVAILABLE");
            units.add(u);
        }
        saveBatch(units);
    }

    @Override
    public Map<String, Long> getStats(Long projectId) {
        List<HousingUnit> units = list(
                new LambdaQueryWrapper<HousingUnit>()
                        .eq(HousingUnit::getProjectId, projectId));
        Map<String, Long> stats = new LinkedHashMap<>();
        stats.put("total", (long) units.size());
        for (String type : List.of("A", "B", "C", "D")) {
            long count = units.stream().filter(u -> type.equals(u.getHouseType())).count();
            stats.put("type" + type, count);
        }
        return stats;
    }
}
```

- [ ] **Step 3: 编写 UnitController**

```java
package com.housing.lottery.controller;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.housing.lottery.entity.HousingUnit;
import com.housing.lottery.service.UnitService;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Map;

@RestController
@RequestMapping("/api/units")
public class UnitController {

    private final UnitService unitService;

    public UnitController(UnitService unitService) {
        this.unitService = unitService;
    }

    @GetMapping
    public IPage<HousingUnit> list(
            @RequestParam(defaultValue = "1") Long projectId,
            @RequestParam(required = false) String houseType,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "20") int size) {
        LambdaQueryWrapper<HousingUnit> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(HousingUnit::getProjectId, projectId);
        if (houseType != null && !houseType.isEmpty()) {
            wrapper.eq(HousingUnit::getHouseType, houseType);
        }
        return unitService.page(new Page<>(page, size), wrapper);
    }

    @PostMapping
    public HousingUnit create(@RequestBody HousingUnit unit) {
        unitService.save(unit);
        return unit;
    }

    @PostMapping("/import")
    public String importExcel(@RequestParam Long projectId,
                              @RequestParam("file") MultipartFile file) throws IOException {
        unitService.importExcel(projectId, file.getInputStream());
        return "ok";
    }

    @GetMapping("/stats")
    public Map<String, Long> stats(@RequestParam(defaultValue = "1") Long projectId) {
        return unitService.getStats(projectId);
    }
}
```

- [ ] **Step 4: Commit**

```bash
git add lottery-server/src/main/java/com/housing/lottery/service/UnitService.java lottery-server/src/main/java/com/housing/lottery/service/impl/UnitServiceImpl.java lottery-server/src/main/java/com/housing/lottery/controller/UnitController.java lottery-server/src/main/java/com/housing/lottery/dto/UnitImportDto.java
git commit -m "feat: add housing unit management API with Excel import and stats"
```

---

## Task 7: 意愿与审核 API

**Files:**
- Create: `lottery-server/src/main/java/com/housing/lottery/service/WishService.java`
- Create: `lottery-server/src/main/java/com/housing/lottery/service/impl/WishServiceImpl.java`
- Create: `lottery-server/src/main/java/com/housing/lottery/controller/WishController.java`
- Create: `lottery-server/src/main/java/com/housing/lottery/controller/ReviewController.java`

- [ ] **Step 1: 编写 WishService 及实现**

```java
package com.housing.lottery.service;

import com.baomidou.mybatisplus.extension.service.IService;
import com.housing.lottery.entity.Wish;
import java.util.List;

public interface WishService extends IService<Wish> {
    void saveWishes(Long householdId, List<Wish> wishes);
}
```

```java
package com.housing.lottery.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.housing.lottery.entity.Wish;
import com.housing.lottery.mapper.WishMapper;
import com.housing.lottery.service.WishService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class WishServiceImpl extends ServiceImpl<WishMapper, Wish>
        implements WishService {

    @Override
    @Transactional
    public void saveWishes(Long householdId, List<Wish> wishes) {
        remove(new LambdaQueryWrapper<Wish>().eq(Wish::getHouseholdId, householdId));
        for (int i = 0; i < wishes.size(); i++) {
            Wish w = wishes.get(i);
            w.setHouseholdId(householdId);
            w.setPriority(i + 1);
            w.setIsActive(i == 0 ? 1 : 0);
        }
        saveBatch(wishes);
    }
}
```

- [ ] **Step 2: 编写 WishController**

```java
package com.housing.lottery.controller;

import com.housing.lottery.entity.Wish;
import com.housing.lottery.service.WishService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/wishes")
public class WishController {

    private final WishService wishService;

    public WishController(WishService wishService) {
        this.wishService = wishService;
    }

    @PostMapping
    public String save(@RequestParam Long householdId, @RequestBody List<Wish> wishes) {
        wishService.saveWishes(householdId, wishes);
        return "ok";
    }

    @GetMapping
    public List<Wish> list(@RequestParam Long householdId) {
        return wishService.list(
                new com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper<Wish>()
                        .eq(Wish::getHouseholdId, householdId)
                        .orderByAsc(Wish::getPriority));
    }
}
```

- [ ] **Step 3: 编写 ReviewController（锁定逻辑）**

```java
package com.housing.lottery.controller;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.housing.lottery.entity.*;
import com.housing.lottery.mapper.*;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.web.bind.annotation.*;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.LocalDateTime;
import java.util.HexFormat;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/review")
public class ReviewController {

    private final ProjectMapper projectMapper;
    private final HouseholdMapper householdMapper;
    private final HousingUnitMapper unitMapper;
    private final WishMapper wishMapper;
    private final AuditLogMapper auditLogMapper;
    private final ObjectMapper objectMapper;

    public ReviewController(ProjectMapper projectMapper, HouseholdMapper householdMapper,
                            HousingUnitMapper unitMapper, WishMapper wishMapper,
                            AuditLogMapper auditLogMapper, ObjectMapper objectMapper) {
        this.projectMapper = projectMapper;
        this.householdMapper = householdMapper;
        this.unitMapper = unitMapper;
        this.wishMapper = wishMapper;
        this.auditLogMapper = auditLogMapper;
        this.objectMapper = objectMapper;
    }

    @PostMapping("/lock")
    public Map<String, String> lock(@RequestParam Long projectId, @RequestParam String operator) {
        Project project = projectMapper.selectById(projectId);
        if (!"PREPARING".equals(project.getStatus())) {
            return Map.of("error", "项目当前状态不允许锁定");
        }

        try {
            List<Household> households = householdMapper.selectList(
                    new LambdaQueryWrapper<Household>().eq(Household::getProjectId, projectId));
            List<HousingUnit> units = unitMapper.selectList(
                    new LambdaQueryWrapper<HousingUnit>().eq(HousingUnit::getProjectId, projectId));
            List<Wish> wishes = wishMapper.selectList(
                    new com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper<Wish>()
                            .inSql(Wish::getHouseholdId,
                                    "SELECT id FROM household WHERE project_id = " + projectId));

            String snapshot = objectMapper.writeValueAsString(Map.of(
                    "households", households,
                    "units", units,
                    "wishes", wishes
            ));
            String hash = HexFormat.of().formatHex(
                    MessageDigest.getInstance("SHA-256")
                            .digest(snapshot.getBytes(StandardCharsets.UTF_8)));

            project.setDataHash(hash);
            project.setStatus("LOCKED");
            projectMapper.updateById(project);

            AuditLog log = new AuditLog();
            log.setProjectId(projectId);
            log.setAction("LOCK_DATA");
            log.setOperator(operator);
            log.setDetail("{\"hash\":\"" + hash + "\",\"households\":" + households.size() + "}");
            auditLogMapper.insert(log);

            return Map.of("hash", hash, "status", "LOCKED");
        } catch (Exception e) {
            return Map.of("error", e.getMessage());
        }
    }

    @GetMapping("/status")
    public Map<String, Object> status(@RequestParam Long projectId) {
        Project project = projectMapper.selectById(projectId);
        long householdCount = householdMapper.selectCount(
                new LambdaQueryWrapper<Household>().eq(Household::getProjectId, projectId));
        long unitCount = unitMapper.selectCount(
                new LambdaQueryWrapper<HousingUnit>().eq(HousingUnit::getProjectId, projectId));
        return Map.of(
                "status", project.getStatus(),
                "dataHash", project.getDataHash() != null ? project.getDataHash() : "",
                "householdCount", householdCount,
                "unitCount", unitCount
        );
    }
}
```

- [ ] **Step 4: Commit**

```bash
git add lottery-server/src/main/java/com/housing/lottery/service/WishService.java lottery-server/src/main/java/com/housing/lottery/service/impl/WishServiceImpl.java lottery-server/src/main/java/com/housing/lottery/controller/WishController.java lottery-server/src/main/java/com/housing/lottery/controller/ReviewController.java
git commit -m "feat: add wish management and data lock with SHA-256 hashing"
```

---

## Task 8: 摇号执行 API

**Files:**
- Create: `lottery-server/src/main/java/com/housing/lottery/service/LotteryService.java`
- Create: `lottery-server/src/main/java/com/housing/lottery/service/impl/LotteryServiceImpl.java`
- Create: `lottery-server/src/main/java/com/housing/lottery/controller/LotteryController.java`

- [ ] **Step 1: 编写 LotteryService 接口**

```java
package com.housing.lottery.service;

import com.housing.lottery.entity.LotteryRound;
import java.util.List;
import java.util.Map;

public interface LotteryService {
    List<LotteryRound> getRounds(Long projectId);
    Map<String, Object> startRound(Long roundId, String seed, String operator);
    List<Map<String, Object>> getRoundResults(Long roundId);
    Map<String, Object> getFinalResults(Long projectId);
}
```

- [ ] **Step 2: 编写 LotteryServiceImpl**

```java
package com.housing.lottery.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.housing.lottery.engine.LotteryEngine;
import com.housing.lottery.engine.LotteryInput;
import com.housing.lottery.engine.LotteryOutput;
import com.housing.lottery.entity.*;
import com.housing.lottery.mapper.*;
import com.housing.lottery.service.LotteryService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;

@Service
public class LotteryServiceImpl implements LotteryService {

    private final LotteryRoundMapper roundMapper;
    private final LotteryResultMapper resultMapper;
    private final HouseholdMapper householdMapper;
    private final WishMapper wishMapper;
    private final HousingUnitMapper unitMapper;
    private final AuditLogMapper auditLogMapper;
    private final LotteryEngine engine;

    public LotteryServiceImpl(LotteryRoundMapper roundMapper, LotteryResultMapper resultMapper,
                              HouseholdMapper householdMapper, WishMapper wishMapper,
                              HousingUnitMapper unitMapper, AuditLogMapper auditLogMapper) {
        this.roundMapper = roundMapper;
        this.resultMapper = resultMapper;
        this.householdMapper = householdMapper;
        this.wishMapper = wishMapper;
        this.unitMapper = unitMapper;
        this.auditLogMapper = auditLogMapper;
        this.engine = new LotteryEngine();
    }

    @Override
    public List<LotteryRound> getRounds(Long projectId) {
        return roundMapper.selectList(
                new LambdaQueryWrapper<LotteryRound>()
                        .eq(LotteryRound::getProjectId, projectId)
                        .orderByAsc(LotteryRound::getRoundOrder));
    }

    @Override
    @Transactional
    public Map<String, Object> startRound(Long roundId, String seed, String operator) {
        LotteryRound round = roundMapper.selectById(roundId);
        if (!"PENDING".equals(round.getStatus())) {
            return Map.of("error", "本轮已执行或状态不正确");
        }

        Long projectId = round.getProjectId();
        String houseType = round.getHouseType();

        // 找到本轮候选人：lottery_status != LOCKED（未被前序轮次锁定），并且当前活跃志愿为本轮房型
        List<Household> candidates = householdMapper.selectList(
                new LambdaQueryWrapper<Household>()
                        .eq(Household::getProjectId, projectId)
                        .eq(Household::getStatus, "NORMAL")
                        .ne(Household::getLotteryStatus, "LOCKED"));

        List<String> candidateIds = new ArrayList<>();
        for (Household h : candidates) {
            List<Wish> activeWishes = wishMapper.selectList(
                    new LambdaQueryWrapper<Wish>()
                            .eq(Wish::getHouseholdId, h.getId())
                            .eq(Wish::getIsActive, 1));
            if (!activeWishes.isEmpty() && houseType.equals(activeWishes.get(0).getHouseType())) {
                candidateIds.add(h.getParticipantNo());
            }
        }

        long unitCount = unitMapper.selectCount(
                new LambdaQueryWrapper<HousingUnit>()
                        .eq(HousingUnit::getProjectId, projectId)
                        .eq(HousingUnit::getHouseType, houseType)
                        .eq(HousingUnit::getStatus, "AVAILABLE"));
        int winnerCount = (int) Math.min(unitCount, candidateIds.size());

        round.setCandidateCount(candidateIds.size());
        round.setWinnerCount(winnerCount);
        round.setSeed(seed);
        round.setStatus("RUNNING");
        round.setStartedAt(LocalDateTime.now());
        roundMapper.updateById(round);

        LotteryOutput output = engine.draw(new LotteryInput(candidateIds, winnerCount, seed));

        // 保存中签结果
        List<LotteryResult> results = new ArrayList<>();
        for (int i = 0; i < output.getWinnerIds().size(); i++) {
            String pno = output.getWinnerIds().get(i);
            Household h = householdMapper.selectOne(
                    new LambdaQueryWrapper<Household>()
                            .eq(Household::getProjectId, projectId)
                            .eq(Household::getParticipantNo, pno));
            LotteryResult r = new LotteryResult();
            r.setRoundId(roundId);
            r.setHouseholdId(h.getId());
            r.setResult("WON");
            r.setSortOrder(i + 1);
            results.add(r);

            h.setLotteryStatus("LOCKED");
            householdMapper.updateById(h);

            // 将该户所有志愿标记为非活跃
            List<Wish> wishes = wishMapper.selectList(
                    new LambdaQueryWrapper<Wish>().eq(Wish::getHouseholdId, h.getId()));
            for (Wish w : wishes) {
                w.setIsActive(0);
                wishMapper.updateById(w);
            }
        }

        // 保存未中签结果，并激活下一有效志愿
        for (int i = 0; i < output.getLoserIds().size(); i++) {
            String pno = output.getLoserIds().get(i);
            Household h = householdMapper.selectOne(
                    new LambdaQueryWrapper<Household>()
                            .eq(Household::getProjectId, projectId)
                            .eq(Household::getParticipantNo, pno));
            LotteryResult r = new LotteryResult();
            r.setRoundId(roundId);
            r.setHouseholdId(h.getId());
            r.setResult("LOST");
            r.setSortOrder(winnerCount + i + 1);
            results.add(r);

            h.setLotteryStatus("ENTERED");
            householdMapper.updateById(h);

            // 激活下一志愿
            List<Wish> wishes = wishMapper.selectList(
                    new LambdaQueryWrapper<Wish>()
                            .eq(Wish::getHouseholdId, h.getId())
                            .orderByAsc(Wish::getPriority));
            for (Wish w : wishes) {
                if (w.getIsActive() == 1) {
                    w.setIsActive(0);
                    wishMapper.updateById(w);
                    // 找下一个志愿
                    Wish nextWish = wishMapper.selectList(
                            new LambdaQueryWrapper<Wish>()
                                    .eq(Wish::getHouseholdId, h.getId())
                                    .gt(Wish::getPriority, w.getPriority())
                                    .orderByAsc(Wish::getPriority)
                                    .last("LIMIT 1"))
                            .stream().findFirst().orElse(null);
                    if (nextWish != null) {
                        nextWish.setIsActive(1);
                        wishMapper.updateById(nextWish);
                    }
                    break;
                }
            }
        }

        resultMapper.insert(results);

        round.setStatus("COMPLETED");
        roundMapper.updateById(round);

        AuditLog log = new AuditLog();
        log.setProjectId(projectId);
        log.setAction("START_ROUND");
        log.setOperator(operator);
        log.setDetail("{\"roundId\":" + roundId + ",\"seed\":\"" + seed + "\",\"winners\":" + winnerCount + "}");
        auditLogMapper.insert(log);

        return Map.of("success", true, "candidateCount", candidateIds.size(), "winnerCount", winnerCount);
    }

    @Override
    public List<Map<String, Object>> getRoundResults(Long roundId) {
        List<LotteryResult> results = resultMapper.selectList(
                new LambdaQueryWrapper<LotteryResult>()
                        .eq(LotteryResult::getRoundId, roundId)
                        .orderByAsc(LotteryResult::getSortOrder));
        List<Map<String, Object>> enriched = new ArrayList<>();
        for (LotteryResult r : results) {
            Household h = householdMapper.selectById(r.getHouseholdId());
            Map<String, Object> item = new HashMap<>();
            item.put("participantNo", h.getParticipantNo());
            item.put("holderName", h.getHolderName());
            item.put("result", r.getResult());
            item.put("sortOrder", r.getSortOrder());
            enriched.add(item);
        }
        return enriched;
    }

    @Override
    public Map<String, Object> getFinalResults(Long projectId) {
        List<LotteryRound> rounds = getRounds(projectId);
        Map<String, Object> summary = new LinkedHashMap<>();
        for (LotteryRound r : rounds) {
            summary.put("round" + r.getRoundOrder(),
                    Map.of("houseType", r.getHouseType(),
                           "candidates", r.getCandidateCount(),
                           "winners", r.getWinnerCount(),
                           "seed", r.getSeed() != null ? r.getSeed() : ""));
        }
        List<Map<String, Object>> allWinners = new ArrayList<>();
        for (LotteryRound r : rounds) {
            if ("COMPLETED".equals(r.getStatus())) {
                allWinners.addAll(getRoundResults(r.getId()));
            }
        }
        summary.put("winners", allWinners);
        return summary;
    }
}
```

- [ ] **Step 3: 编写 LotteryController**

```java
package com.housing.lottery.controller;

import com.housing.lottery.entity.LotteryRound;
import com.housing.lottery.service.LotteryService;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/lottery")
public class LotteryController {

    private final LotteryService lotteryService;

    public LotteryController(LotteryService lotteryService) {
        this.lotteryService = lotteryService;
    }

    @GetMapping("/rounds")
    public List<LotteryRound> rounds(@RequestParam Long projectId) {
        return lotteryService.getRounds(projectId);
    }

    @PostMapping("/rounds/{id}/start")
    public Map<String, Object> start(@PathVariable Long id,
                                     @RequestParam String seed,
                                     @RequestParam String operator) {
        return lotteryService.startRound(id, seed, operator);
    }

    @GetMapping("/results")
    public List<Map<String, Object>> results(@RequestParam Long roundId) {
        return lotteryService.getRoundResults(roundId);
    }

    @GetMapping("/final-results")
    public Map<String, Object> finalResults(@RequestParam Long projectId) {
        return lotteryService.getFinalResults(projectId);
    }
}
```

- [ ] **Step 4: Commit**

```bash
git add lottery-server/src/main/java/com/housing/lottery/service/LotteryService.java lottery-server/src/main/java/com/housing/lottery/service/impl/LotteryServiceImpl.java lottery-server/src/main/java/com/housing/lottery/controller/LotteryController.java
git commit -m "feat: implement lottery execution with round management and result tracking"
```

---

## Task 9: 公开查询 API

**Files:**
- Create: `lottery-server/src/main/java/com/housing/lottery/controller/QueryController.java`
- Create: `lottery-server/src/main/java/com/housing/lottery/config/SecurityConfig.java`

- [ ] **Step 1: 编写 QueryController（公开访问）**

```java
package com.housing.lottery.controller;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.housing.lottery.entity.*;
import com.housing.lottery.mapper.*;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/api/query")
public class QueryController {

    private final HouseholdMapper householdMapper;
    private final WishMapper wishMapper;
    private final LotteryResultMapper resultMapper;
    private final LotteryRoundMapper roundMapper;

    public QueryController(HouseholdMapper householdMapper, WishMapper wishMapper,
                           LotteryResultMapper resultMapper, LotteryRoundMapper roundMapper) {
        this.householdMapper = householdMapper;
        this.wishMapper = wishMapper;
        this.resultMapper = resultMapper;
        this.roundMapper = roundMapper;
    }

    @PostMapping("/results")
    public Map<String, Object> query(@RequestBody Map<String, String> body) {
        String participantNo = body.get("participantNo");
        String idCardLast4 = body.get("idCardLast4");

        Household household = householdMapper.selectOne(
                new LambdaQueryWrapper<Household>()
                        .eq(Household::getParticipantNo, participantNo));

        if (household == null) {
            return Map.of("error", "未找到该参与编号");
        }

        String idCard = household.getIdCard();
        if (idCard == null || !idCard.endsWith(idCardLast4)) {
            return Map.of("error", "身份校验失败");
        }

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("participantNo", household.getParticipantNo());
        result.put("holderName", maskName(household.getHolderName()));

        List<Wish> wishes = wishMapper.selectList(
                new LambdaQueryWrapper<Wish>()
                        .eq(Wish::getHouseholdId, household.getId())
                        .orderByAsc(Wish::getPriority));
        List<String> wishList = new ArrayList<>();
        for (Wish w : wishes) {
            wishList.add(w.getPriority() + ": " + w.getHouseType() + "户型");
        }
        result.put("wishes", wishList);

        List<LotteryResult> myResults = resultMapper.selectList(
                new LambdaQueryWrapper<LotteryResult>()
                        .eq(LotteryResult::getHouseholdId, household.getId())
                        .orderByAsc(LotteryResult::getSortOrder));

        if (myResults.isEmpty()) {
            result.put("lotteryStatus", household.getLotteryStatus());
            result.put("message", "暂未参与摇号或尚未出结果");
        } else {
            for (LotteryResult r : myResults) {
                LotteryRound round = roundMapper.selectById(r.getRoundId());
                if ("WON".equals(r.getResult())) {
                    result.put("lotteryStatus", "WON");
                    result.put("wonRound", round.getHouseType() + "户型");
                    result.put("sortOrder", r.getSortOrder());
                    break;
                }
            }
            if (!"WON".equals(result.get("lotteryStatus"))) {
                result.put("lotteryStatus", "LOST");
                result.put("message", "暂未中签，请关注后续轮次或候补通知");
            }
        }

        return result;
    }

    private String maskName(String name) {
        if (name == null || name.length() <= 1) return name;
        return name.charAt(0) + "*";
    }
}
```

- [ ] **Step 2: 编写 SecurityConfig（查询接口公开，其余需认证）**

```java
package com.housing.lottery.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .csrf(csrf -> csrf.disable())
            .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/api/query/**").permitAll()
                .anyRequest().authenticated()
            )
            .httpBasic(basic -> {});
        return http.build();
    }
}
```

- [ ] **Step 3: Commit**

```bash
git add lottery-server/src/main/java/com/housing/lottery/controller/QueryController.java lottery-server/src/main/java/com/housing/lottery/config/SecurityConfig.java
git commit -m "feat: add public query API with identity verification and security config"
```

---

## Task 10: 前端管理端脚手架

**Files:**
- Create: `lottery-admin/` 下所有 Vite + Vue 3 项目文件

- [ ] **Step 1: 用 Vite 创建 Vue 3 项目**

```bash
cd /Users/apple/IdeaProjects/housing_lottery_system
npm create vite@latest lottery-admin -- --template vue-ts
cd lottery-admin
npm install
npm install element-plus @element-plus/icons-vue vue-router@4 pinia axios
```

- [ ] **Step 2: 配置 Element Plus 自动导入**

```bash
cd lottery-admin
npm install -D unplugin-vue-components unplugin-auto-import
```

Update `vite.config.ts`:

```typescript
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import AutoImport from 'unplugin-auto-import/vite'
import Components from 'unplugin-vue-components/vite'
import { ElementPlusResolver } from 'unplugin-vue-components/resolvers'

export default defineConfig({
  plugins: [
    vue(),
    AutoImport({ resolvers: [ElementPlusResolver()] }),
    Components({ resolvers: [ElementPlusResolver()] }),
  ],
  server: { port: 5173 }
})
```

- [ ] **Step 3: 搭建路由和布局框架**

Create `src/router/index.ts`:

```typescript
import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/admin',
      component: () => import('../layouts/AdminLayout.vue'),
      children: [
        { path: 'households', name: 'Households', component: () => import('../views/HouseholdsView.vue') },
        { path: 'units', name: 'Units', component: () => import('../views/UnitsView.vue') },
        { path: 'review', name: 'Review', component: () => import('../views/ReviewView.vue') },
        { path: 'lottery', name: 'Lottery', component: () => import('../views/LotteryView.vue') },
        { path: 'archive', name: 'Archive', component: () => import('../views/ArchiveView.vue') },
        { path: '', redirect: '/admin/lottery' },
      ]
    },
    { path: '/display', name: 'Display', component: () => import('../views/DisplayView.vue') },
    { path: '/', redirect: '/admin' },
  ]
})

export default router
```

Create `src/layouts/AdminLayout.vue`:

```vue
<template>
  <el-container style="min-height:100vh">
    <el-aside width="200px" style="background:#1d2329">
      <div style="color:#fff;padding:20px;font-size:18px;font-weight:700">还房摇号系统</div>
      <el-menu
        :default-active="route.path"
        router
        background-color="#1d2329"
        text-color="#9ca3af"
        active-text-color="#b9873d"
      >
        <el-menu-item index="/admin/households">
          <el-icon><User /></el-icon> 住户管理
        </el-menu-item>
        <el-menu-item index="/admin/units">
          <el-icon><OfficeBuilding /></el-icon> 房源管理
        </el-menu-item>
        <el-menu-item index="/admin/review">
          <el-icon><Checked /></el-icon> 意愿审核
        </el-menu-item>
        <el-menu-item index="/admin/lottery">
          <el-icon><TrophyBase /></el-icon> 摇号控制台
        </el-menu-item>
        <el-menu-item index="/admin/archive">
          <el-icon><Folder /></el-icon> 结果归档
        </el-menu-item>
      </el-menu>
    </el-aside>
    <el-main>
      <router-view />
    </el-main>
  </el-container>
</template>

<script setup lang="ts">
import { useRoute } from 'vue-router'
const route = useRoute()
</script>
```

- [ ] **Step 4: 封装 Axios**

Create `src/api/index.ts`:

```typescript
import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  timeout: 10000,
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Basic ${token}`
  }
  return config
})

export default api
```

- [ ] **Step 5: Commit**

```bash
git add lottery-admin/
git commit -m "feat: scaffold Vue 3 admin project with Element Plus, router, and layout"
```

---

## Task 11: 前端管理端核心页面

**Files:**
- Create: `lottery-admin/src/views/HouseholdsView.vue`
- Create: `lottery-admin/src/views/UnitsView.vue`
- Create: `lottery-admin/src/views/ReviewView.vue`
- Create: `lottery-admin/src/views/LotteryView.vue`
- Create: `lottery-admin/src/views/ArchiveView.vue`
- Create: `lottery-admin/src/views/DisplayView.vue`
- Create: `lottery-admin/src/stores/lottery.ts`

这些页面的核心交互逻辑参考已有原型 `prototype/` 目录中的对应页面。MVP 阶段页面以功能性为主，不做过度美化。

- [ ] **Step 1: 编写 Pinia store（摇号状态管理）**

Create `src/stores/lottery.ts`:

```typescript
import { defineStore } from 'pinia'
import { ref } from 'vue'
import api from '../api'

export const useLotteryStore = defineStore('lottery', () => {
  const projectId = ref(1)
  const rounds = ref<any[]>([])
  const currentRound = ref<any>(null)
  const isRolling = ref(false)

  async function fetchRounds() {
    const { data } = await api.get('/lottery/rounds', { params: { projectId: projectId.value } })
    rounds.value = data
  }

  async function startRound(roundId: number, seed: string, operator: string) {
    const { data } = await api.post(`/lottery/rounds/${roundId}/start`, null, {
      params: { seed, operator }
    })
    await fetchRounds()
    return data
  }

  async function fetchResults(roundId: number) {
    const { data } = await api.get('/lottery/results', { params: { roundId } })
    return data
  }

  return { projectId, rounds, currentRound, isRolling, fetchRounds, startRound, fetchResults }
})
```

- [ ] **Step 2: 编写 HouseholdsView.vue 住户管理页**

核心功能：分页表格、搜索框、Excel 导入按钮、新增/编辑弹窗。参照原型 `prototype/households.html` 的布局和数据字段。

- [ ] **Step 3: 编写 UnitsView.vue 房源管理页**

核心功能：分页表格、房型筛选、Excel 导入、统计卡片（各房型数量）。参照原型 `prototype/units.html`。

- [ ] **Step 4: 编写 ReviewView.vue 意愿与审核页**

核心功能：住户列表、志愿查看、数据锁定按钮（调用 `/api/review/lock`，锁定后显示 SHA-256 哈希）。参照原型 `prototype/review.html`。

- [ ] **Step 5: 编写 LotteryView.vue 摇号控制台**

```vue
<template>
  <div>
    <h2 style="margin-bottom:20px">摇号控制台</h2>
    <el-alert v-if="projectStatus !== 'LOCKED' && projectStatus !== 'LOTTERY'"
      title="请先在「意愿审核」页锁定数据后再执行摇号" type="warning" show-icon :closable="false"
      style="margin-bottom:20px" />

    <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:16px;margin-bottom:24px">
      <el-card v-for="r in store.rounds" :key="r.id" shadow="hover"
        :style="{border: r.status === 'COMPLETED' ? '2px solid #22c55e' : r.status === 'RUNNING' ? '2px solid #3b82f6' : ''}">
        <div style="font-size:24px;font-weight:800">{{ r.houseType }} 户型</div>
        <el-tag :type="r.status==='COMPLETED'?'success':r.status==='RUNNING'?'warning':'info'">
          {{ r.status === 'COMPLETED' ? '已完成' : r.status === 'RUNNING' ? '执行中' : '待执行' }}
        </el-tag>
        <div style="margin-top:12px;font-size:13px;color:var(--el-text-color-secondary)">
          <div>候选: {{ r.candidateCount }} 户</div>
          <div>中签: {{ r.winnerCount }} 户</div>
          <div v-if="r.seed" style="font-family:monospace;font-size:11px">种子: {{ r.seed.substring(0,16) }}...</div>
        </div>
        <el-button v-if="r.status === 'PENDING'" type="primary" style="margin-top:12px;width:100%"
          @click="showStartDialog(r)">执行摇号</el-button>
        <el-button v-if="r.status === 'COMPLETED'" style="margin-top:12px;width:100%"
          @click="viewResults(r)">查看结果</el-button>
      </el-card>
    </div>

    <el-dialog v-model="startDialog.visible" title="确认执行摇号" width="500px">
      <el-form>
        <el-form-item label="本轮">{{ startDialog.round?.houseType }} 户型（第 {{ startDialog.round?.roundOrder }} 轮）</el-form-item>
        <el-form-item label="种子">
          <el-input v-model="startDialog.seed" placeholder="输入随机种子或使用自动生成">
            <template #append><el-button @click="startDialog.seed = generateSeed()">自动生成</el-button></template>
          </el-input>
        </el-form-item>
        <el-form-item label="操作人"><el-input v-model="startDialog.operator" placeholder="操作人姓名" /></el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="startDialog.visible = false">取消</el-button>
        <el-button type="primary" @click="confirmStart" :loading="store.isRolling">确认执行</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="resultsDialog.visible" title="摇号结果" width="700px">
      <el-table :data="resultsDialog.data" max-height="400">
        <el-table-column prop="sortOrder" label="序号" width="80" />
        <el-table-column prop="participantNo" label="参与编号" width="120" />
        <el-table-column prop="holderName" label="户主" width="100" />
        <el-table-column prop="result" label="结果" width="100">
          <template #default="{row}">
            <el-tag :type="row.result==='WON'?'success':'warning'">{{ row.result === 'WON' ? '中签' : '未中签' }}</el-tag>
          </template>
        </el-table-column>
      </el-table>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, reactive } from 'vue'
import { useLotteryStore } from '../stores/lottery'
import api from '../api'
import { ElMessage } from 'element-plus'

const store = useLotteryStore()
const projectStatus = ref('')

const startDialog = reactive({ visible: false, round: null as any, seed: '', operator: '' })
const resultsDialog = reactive({ visible: false, data: [] as any[] })

function generateSeed() {
  return Array.from(crypto.getRandomValues(new Uint8Array(16)), b => b.toString(16).padStart(2,'0')).join('')
}

function showStartDialog(round: any) {
  startDialog.round = round
  startDialog.seed = generateSeed()
  startDialog.operator = ''
  startDialog.visible = true
}

async function confirmStart() {
  if (!startDialog.seed || !startDialog.operator) { ElMessage.warning('请填写完整信息'); return }
  await store.startRound(startDialog.round.id, startDialog.seed, startDialog.operator)
  startDialog.visible = false
  ElMessage.success('摇号完成')
}

async function viewResults(round: any) {
  resultsDialog.data = await store.fetchResults(round.id)
  resultsDialog.visible = true
}

onMounted(async () => {
  await store.fetchRounds()
  const { data } = await api.get('/review/status', { params: { projectId: store.projectId } })
  projectStatus.value = data.status
})
</script>
```

- [ ] **Step 6: 编写 ArchiveView.vue 结果归档页**

核心功能：最终结果汇总、导出按钮。参照原型 `prototype/archive.html`。

- [ ] **Step 7: 编写 DisplayView.vue 大屏展示页**

核心功能：全屏展示当前轮次、滚动号码、中签名单。定时轮询 `/api/lottery/final-results` 获取最新状态。参照原型中摇号控制台的「大屏监控」区域。

- [ ] **Step 8: Commit**

```bash
git add lottery-admin/src/
git commit -m "feat: implement admin pages for household, unit, review, lottery, archive, and display"
```

---

## Task 12: 住户查询端（独立应用）

**Files:**
- Create: `lottery-query/` 下所有文件

- [ ] **Step 1: 创建移动端查询应用**

```bash
cd /Users/apple/IdeaProjects/housing_lottery_system
npm create vite@latest lottery-query -- --template vue-ts
cd lottery-query
npm install
npm install axios
```

- [ ] **Step 2: 编写查询页面 App.vue**

```vue
<template>
  <div class="mobile-container">
    <div class="query-header">
      <h2>还房摇号结果查询</h2>
      <p style="opacity:0.8;font-size:14px">请输入参与编号和身份信息查看结果</p>
    </div>

    <div class="query-form" v-if="!result">
      <el-form @submit.prevent="doQuery">
        <el-form-item>
          <el-input v-model="participantNo" placeholder="参与编号" size="large" clearable />
        </el-form-item>
        <el-form-item>
          <el-input v-model="idCardLast4" placeholder="身份证后四位" size="large" maxlength="4" clearable />
        </el-form-item>
        <el-button type="primary" size="large" :loading="loading" @click="doQuery" style="width:100%">
          查询结果
        </el-button>
      </el-form>
    </div>

    <div v-if="errorMsg" class="result-card" style="background:#fef2f2;border-color:#fca5a5">
      <p style="color:#dc2626;text-align:center">{{ errorMsg }}</p>
    </div>

    <div v-if="result" class="result-card">
      <div class="result-item">
        <span class="result-label">参与编号</span>
        <span class="result-value">{{ result.participantNo }}</span>
      </div>
      <div class="result-item">
        <span class="result-label">户主</span>
        <span class="result-value">{{ result.holderName }}</span>
      </div>
      <div class="result-item">
        <span class="result-label">房型意愿</span>
        <span class="result-value">{{ (result.wishes || []).join(' / ') }}</span>
      </div>
      <div class="result-item">
        <span class="result-label">摇号状态</span>
        <span class="result-value" :style="{color: statusColor}">
          {{ statusText }}
        </span>
      </div>
      <div v-if="result.wonRound" class="result-item">
        <span class="result-label">中签户型</span>
        <span class="result-value" style="color:#16a34a;font-size:18px">{{ result.wonRound }}</span>
      </div>
      <div v-if="result.message" style="margin-top:12px;padding:12px;background:#f8fafc;border-radius:8px;font-size:13px">
        {{ result.message }}
      </div>
    </div>

    <el-button v-if="result" style="margin:0 20px" @click="reset">返回重新查询</el-button>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import axios from 'axios'

const participantNo = ref('')
const idCardLast4 = ref('')
const result = ref<any>(null)
const errorMsg = ref('')
const loading = ref(false)

const statusColor = computed(() => {
  if (!result.value) return ''
  const s = result.value.lotteryStatus
  if (s === 'WON') return '#16a34a'
  if (s === 'LOST') return '#ea580c'
  return '#6b7280'
})

const statusText = computed(() => {
  if (!result.value) return ''
  const s = result.value.lotteryStatus
  if (s === 'WON') return '已中签'
  if (s === 'LOST') return '未中签（可关注候补）'
  const map: Record<string, string> = { PENDING: '待参与', ENTERED: '已参与，等待结果', LOCKED: '已中签锁定' }
  return map[s] || s
})

async function doQuery() {
  errorMsg.value = ''
  result.value = null
  if (!participantNo.value || !idCardLast4.value) {
    errorMsg.value = '请填写参与编号和身份证后四位'
    return
  }
  loading.value = true
  try {
    const { data } = await axios.post('/api/query/results', {
      participantNo: participantNo.value,
      idCardLast4: idCardLast4.value,
    })
    if (data.error) { errorMsg.value = data.error } else { result.value = data }
  } catch {
    errorMsg.value = '查询失败，请稍后重试'
  } finally {
    loading.value = false
  }
}

function reset() {
  result.value = null
  errorMsg.value = ''
  participantNo.value = ''
  idCardLast4.value = ''
}
</script>

<style scoped>
.mobile-container { max-width:480px; margin:0 auto; background:#fff; min-height:100vh }
.query-header { background:linear-gradient(135deg,#1a5f3a,#b9873d); color:#fff; padding:30px 20px; text-align:center }
.query-form { padding:30px 20px }
.result-card { margin:20px; padding:24px; border-radius:12px; background:#fffbeb; border:1px solid #b9873d }
.result-item { display:flex; justify-content:space-between; padding:12px 0; border-bottom:1px solid rgba(0,0,0,0.05) }
.result-item:last-child { border-bottom:none }
.result-label { color:#6b7280; font-size:14px }
.result-value { font-weight:700; color:#1f2937 }
</style>
```

- [ ] **Step 3: 配置 vite.config.ts 代理到后端**

```typescript
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  server: {
    port: 5174,
    proxy: {
      '/api': 'http://localhost:8080'
    }
  }
})
```

- [ ] **Step 4: Commit**

```bash
git add lottery-query/
git commit -m "feat: scaffold mobile query app for resident result lookup"
```

---

## Task 13: 集成验证与修复

- [ ] **Step 1: 启动后端**

```bash
cd lottery-server && mvn spring-boot:run
```

- [ ] **Step 2: 启动管理端**

```bash
cd lottery-admin && npm run dev
```

- [ ] **Step 3: 启动查询端**

```bash
cd lottery-query && npm run dev
```

- [ ] **Step 4: 走通核心链路**

按原型演示路径验证完整流程：
1. 管理端导入住户和房源数据
2. 录入房型意愿
3. 锁定名单（确认 SHA-256 哈希生成）
4. 执行 A/B/C/D 四轮摇号（验证中签锁定和志愿流转）
5. 查询端输入编号查结果
6. 归档页查看最终结果

- [ ] **Step 5: 修复集成问题**

修复前后端联调中发现的任何问题。

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "fix: integration fixes for end-to-end lottery flow"
```

---

## 实现顺序说明

Task 1 → 2 → 3 → 4 必须顺序执行（项目基础 → 数据库 → 实体 → 引擎）。
Task 5、6、7 可并行（三个业务模块独立）。
Task 8 依赖 Task 4 和 Task 7（摇号执行需要引擎 + 锁定后的数据）。
Task 9 依赖 Task 8（查询需要摇号结果）。
Task 10 先于 Task 11。
Task 11 可部分并行（各页面独立）。
Task 12 独立于 Task 10-11。
Task 13 最后执行（集成验证）。

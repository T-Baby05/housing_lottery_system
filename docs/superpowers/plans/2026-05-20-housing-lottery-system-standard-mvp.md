# 还房摇号系统标准化 MVP 实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deliver a standard Spring Boot 3 + Vue 3 MVP for a single housing-lottery project, with stable migrations, deterministic draw logic, auditable locking, public query, and a front-end that can survive future expansion.

**Architecture:** Keep the repo as two standalone apps under one workspace: `lottery-server` for the API and business rules, `lottery-admin` for the Vue app. The backend is layered into `controller`, `service`, `mapper`, `entity`, `dto`, `engine`, and `config`, uses Flyway to evolve the MySQL schema, and keeps all lottery computation in a pure deterministic engine. The frontend uses Vue 3, Vite, TypeScript, Pinia, Vue Router, and Element Plus, with a thin `api` client and route-based pages that map directly to the business workflow. `prototype/` remains reference-only.

**Tech Stack:** Spring Boot 3, Java 17, MyBatis-Flex, Flyway, MySQL 8, H2 (tests only), JUnit 5, Mockito, MockMvc, Vue 3, Vite, TypeScript, Pinia, Vue Router, Element Plus, Axios, Vitest, ESLint, Prettier.

**Scope Guard:** MVP only. No multi-project switching UI, no full auth/role management, no SMS, no onsite check-in, no printing, no template-managed big screen, no external government integrations.

---

### Task 1: Standardize the backend baseline and health check

**Files:**
- Modify: `lottery-server/pom.xml`
- Modify: `lottery-server/src/main/resources/application.yml`
- Create: `lottery-server/src/main/java/com/housinglottery/lotteryserver/controller/HealthController.java`
- Create: `lottery-server/src/test/java/com/housinglottery/lotteryserver/controller/HealthControllerTest.java`

- [ ] **Step 1: Write the failing test**

```java
@WebMvcTest(HealthController.class)
class HealthControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Test
    void returnsUp() throws Exception {
        mockMvc.perform(get("/api/health"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("UP"));
    }
}
```

- [ ] **Step 2: Run the test and confirm it fails**

Run: `cd lottery-server && mvn -Dtest=HealthControllerTest test`
Expected: fail with 404 or missing controller.

- [ ] **Step 3: Implement the minimal backend baseline**

Add the Spring Boot dependencies needed for a standard project, expose a simple `/api/health` endpoint, and keep the response shape stable for the frontend to ping.

- [ ] **Step 4: Run the task test and full backend smoke check**

Run: `cd lottery-server && mvn -Dtest=HealthControllerTest test && mvn test`
Expected: both commands pass.

- [ ] **Step 5: Commit**

Commit this slice before moving on so later work stays easy to review.

---

### Task 2: Add Flyway migrations and a test database profile

**Files:**
- Modify: `lottery-server/pom.xml`
- Create: `lottery-server/src/main/resources/db/migration/V1__base_schema.sql`
- Create: `lottery-server/src/main/resources/db/migration/V2__seed_demo_project.sql`
- Create: `lottery-server/src/test/resources/application-test.yml`
- Create: `lottery-server/src/test/java/com/housinglottery/lotteryserver/db/FlywayMigrationTest.java`

Core tables in `V1__base_schema.sql`:
- `project`
- `household`
- `housing_unit`
- `wish`
- `lottery_round`
- `lottery_result`
- `audit_log`

Key fields to lock in now:
- `project`: `id`, `code`, `name`, `status`, `data_hash`, timestamps
- `household`: `project_id`, `participant_no`, `head_name`, `id_card_no`, `phone_no`, `family_size`, `qualification_status`, `lottery_status`
- `housing_unit`: `project_id`, `unit_code`, `building_no`, `room_no`, `house_type`, `status`
- `wish`: `household_id`, `priority`, `house_type`, `is_active`
- `lottery_round`: `project_id`, `round_code`, `seed`, `candidate_count`, `winner_count`, `executed_at`
- `lottery_result`: `project_id`, `round_id`, `household_id`, `assigned_unit_id`, `result`, `candidate_order`, `published`
- `audit_log`: `project_id`, `action`, `actor`, `payload_json`, `created_at`

- [ ] **Step 1: Write the failing migration test**

```java
@SpringBootTest
@ActiveProfiles("test")
class FlywayMigrationTest {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Test
    void createsCoreTables() {
        var tables = jdbcTemplate.queryForList(
                "select table_name from information_schema.tables where table_schema = 'PUBLIC'",
                String.class
        );
        assertThat(tables).contains("PROJECT", "HOUSEHOLD", "HOUSING_UNIT", "WISH", "LOTTERY_ROUND", "LOTTERY_RESULT", "AUDIT_LOG");
    }
}
```

- [ ] **Step 2: Run it and watch it fail**

Run: `cd lottery-server && mvn -Dtest=FlywayMigrationTest test`
Expected: fail because migrations and test profile are not wired yet.

- [ ] **Step 3: Add the Flyway scripts and test profile**

Use Flyway versioned migrations only. Keep the test datasource isolated in `application-test.yml` so migration verification does not depend on a local MySQL instance.

- [ ] **Step 4: Re-run the migration test and the full backend test suite**

Run: `cd lottery-server && mvn -Dtest=FlywayMigrationTest test && mvn test`
Expected: both commands pass.

- [ ] **Step 5: Commit**

Keep this commit limited to schema bootstrapping and the test profile.

---

### Task 3: Implement the deterministic lottery engine with TDD

**Files:**
- Create: `lottery-server/src/main/java/com/housinglottery/lotteryserver/engine/DeterministicRandom.java`
- Create: `lottery-server/src/main/java/com/housinglottery/lotteryserver/engine/LotteryCandidate.java`
- Create: `lottery-server/src/main/java/com/housinglottery/lotteryserver/engine/LotteryDrawResult.java`
- Create: `lottery-server/src/main/java/com/housinglottery/lotteryserver/engine/LotteryEngine.java`
- Create: `lottery-server/src/test/java/com/housinglottery/lotteryserver/engine/LotteryEngineTest.java`

Engine rule to lock in:
- The same input and the same seed must always produce the same draw order.
- The engine must be a pure function with no database or Spring dependency.
- Use a small in-house deterministic RNG so cross-JVM behavior does not depend on `SecureRandom`.

- [ ] **Step 1: Write the failing engine tests**

```java
@Test
void sameSeedProducesSameOrder() {
    var candidates = List.of(
            new LotteryCandidate(1L, "H001", "A"),
            new LotteryCandidate(2L, "H002", "A"),
            new LotteryCandidate(3L, "H003", "A")
    );

    var result1 = engine.draw(candidates, 2, "seed-001");
    var result2 = engine.draw(candidates, 2, "seed-001");

    assertThat(result1.orderedCandidateIds()).isEqualTo(result2.orderedCandidateIds());
}
```

- [ ] **Step 2: Run the engine test and confirm it fails**

Run: `cd lottery-server && mvn -Dtest=LotteryEngineTest test`
Expected: fail because the engine does not exist yet.

- [ ] **Step 3: Implement the minimal engine**

Add the deterministic RNG, Fisher-Yates shuffle, min-candidate winner count, duplicate prevention, and result payload.

- [ ] **Step 4: Re-run the focused engine test and the full backend suite**

Run: `cd lottery-server && mvn -Dtest=LotteryEngineTest test && mvn test`
Expected: both commands pass.

- [ ] **Step 5: Commit**

Do not fold later business rules into the engine yet.

---

### Task 4: Add project lifecycle and current-project APIs

**Files:**
- Create: `lottery-server/src/main/java/com/housinglottery/lotteryserver/controller/ProjectController.java`
- Create: `lottery-server/src/main/java/com/housinglottery/lotteryserver/service/ProjectService.java`
- Create: `lottery-server/src/main/java/com/housinglottery/lotteryserver/dto/project/ProjectSummaryResponse.java`
- Create: `lottery-server/src/main/java/com/housinglottery/lotteryserver/dto/project/ProjectStatusUpdateRequest.java`
- Create: `lottery-server/src/test/java/com/housinglottery/lotteryserver/service/ProjectServiceTest.java`

API shape to implement:
- `GET /api/projects/current`
- `POST /api/projects/{projectId}/status`

Status flow to enforce:
- `PREPARING -> LOCKED -> LOTTERY -> FINISHED -> ARCHIVED`

- [ ] **Step 1: Write the failing service test**

```java
@Test
void rejectsSkippingLifecycleStates() {
    assertThatThrownBy(() -> service.updateStatus(projectId, "FINISHED"))
            .isInstanceOf(IllegalStateException.class);
}
```

- [ ] **Step 2: Run the test and confirm it fails**

Run: `cd lottery-server && mvn -Dtest=ProjectServiceTest test`
Expected: fail because lifecycle validation is not implemented yet.

- [ ] **Step 3: Implement the project service and controller**

Return the seeded demo project, enforce legal transitions, and keep `project_id` in every downstream entity.

- [ ] **Step 4: Re-run the task test and backend suite**

Run: `cd lottery-server && mvn -Dtest=ProjectServiceTest test && mvn test`
Expected: both commands pass.

- [ ] **Step 5: Commit**

---

### Task 5: Build household and housing-unit management APIs

**Files:**
- Create: `lottery-server/src/main/java/com/housinglottery/lotteryserver/controller/HouseholdController.java`
- Create: `lottery-server/src/main/java/com/housinglottery/lotteryserver/controller/HousingUnitController.java`
- Create: `lottery-server/src/main/java/com/housinglottery/lotteryserver/service/HouseholdService.java`
- Create: `lottery-server/src/main/java/com/housinglottery/lotteryserver/service/HousingUnitService.java`
- Create: `lottery-server/src/main/java/com/housinglottery/lotteryserver/dto/household/*`
- Create: `lottery-server/src/main/java/com/housinglottery/lotteryserver/dto/unit/*`
- Create: `lottery-server/src/test/java/com/housinglottery/lotteryserver/service/HouseholdServiceTest.java`
- Create: `lottery-server/src/test/java/com/housinglottery/lotteryserver/service/HousingUnitServiceTest.java`

API shape to implement:
- Household import, list, detail, and qualification status update
- Housing unit import, list, detail, and availability status update

Validation rules to lock in now:
- Participant numbers are unique within a project.
- Unit codes are unique within a project.
- Qualification and unit status filters must be stable and pageable.

- [ ] **Step 1: Write the failing service tests**

```java
@Test
void householdImportRejectsDuplicateParticipantNo() {
    var rows = List.of(
            new HouseholdImportRow("20260001", "张三", "110101199001011234", "13800000000", 3),
            new HouseholdImportRow("20260001", "李四", "110101199201021234", "13800000001", 2)
    );

    assertThatThrownBy(() -> service.importRows(projectId, rows))
            .isInstanceOf(IllegalArgumentException.class);
}
```

- [ ] **Step 2: Run the tests and confirm they fail**

Run: `cd lottery-server && mvn -Dtest=HouseholdServiceTest,HousingUnitServiceTest test`
Expected: fail because import and query logic is not implemented yet.

- [ ] **Step 3: Implement the import/query services and controllers**

Use Apache POI for Excel import, MyBatis-Flex for persistence, and DTOs for request/response shapes.

- [ ] **Step 4: Re-run the focused tests and the backend suite**

Run: `cd lottery-server && mvn -Dtest=HouseholdServiceTest,HousingUnitServiceTest test && mvn test`
Expected: both commands pass.

- [ ] **Step 5: Commit**

---

### Task 6: Add wish entry, data lock, snapshot hash, and audit logging

**Files:**
- Create: `lottery-server/src/main/java/com/housinglottery/lotteryserver/controller/WishController.java`
- Create: `lottery-server/src/main/java/com/housinglottery/lotteryserver/controller/ReviewController.java`
- Create: `lottery-server/src/main/java/com/housinglottery/lotteryserver/service/WishService.java`
- Create: `lottery-server/src/main/java/com/housinglottery/lotteryserver/service/LockService.java`
- Create: `lottery-server/src/main/java/com/housinglottery/lotteryserver/service/SnapshotService.java`
- Create: `lottery-server/src/main/java/com/housinglottery/lotteryserver/service/AuditLogService.java`
- Create: `lottery-server/src/test/java/com/housinglottery/lotteryserver/service/LockServiceTest.java`

Locking rules to enforce:
- Each household can store 1 to 4 wishes in priority order.
- Locking generates a canonical snapshot and SHA-256 hash.
- Locked data becomes read-only for the core workflow.
- Audit logs must record who changed what and when.

- [ ] **Step 1: Write the failing lock test**

```java
@Test
void lockProducesStableHashRegardlessOfInputOrdering() {
    var hashA = service.lock(projectId, householdRowsA, unitRowsA, wishRowsA);
    var hashB = service.lock(projectId, householdRowsB, unitRowsB, wishRowsB);

    assertThat(hashA).isEqualTo(hashB);
}
```

- [ ] **Step 2: Run the test and confirm it fails**

Run: `cd lottery-server && mvn -Dtest=LockServiceTest test`
Expected: fail because canonical snapshot and lock state are not implemented yet.

- [ ] **Step 3: Implement wish persistence, locking, snapshot hashing, and audit logging**

Canonicalize the snapshot before hashing so ordering changes do not change the result, and block writes after the project is locked.

- [ ] **Step 4: Re-run the task test and backend suite**

Run: `cd lottery-server && mvn -Dtest=LockServiceTest test && mvn test`
Expected: both commands pass.

- [ ] **Step 5: Commit**

---

### Task 7: Implement lottery execution, public query, and export

**Files:**
- Create: `lottery-server/src/main/java/com/housinglottery/lotteryserver/controller/LotteryController.java`
- Create: `lottery-server/src/main/java/com/housinglottery/lotteryserver/controller/PublicQueryController.java`
- Create: `lottery-server/src/main/java/com/housinglottery/lotteryserver/controller/ExportController.java`
- Create: `lottery-server/src/main/java/com/housinglottery/lotteryserver/service/LotteryService.java`
- Create: `lottery-server/src/main/java/com/housinglottery/lotteryserver/service/QueryService.java`
- Create: `lottery-server/src/main/java/com/housinglottery/lotteryserver/service/ExportService.java`
- Create: `lottery-server/src/test/java/com/housinglottery/lotteryserver/service/LotteryServiceTest.java`
- Create: `lottery-server/src/test/java/com/housinglottery/lotteryserver/service/QueryServiceTest.java`

Business rules to lock in:
- Execute A/B/C/D rounds in order.
- Winners must be bound to concrete housing units.
- A winning household must not re-enter later rounds.
- Public query must require participant number plus ID-card last four digits.
- Query output must be masked and must stay hidden until results are published.

- [ ] **Step 1: Write the failing lottery and query tests**

```java
@Test
void lotteryBindsUnitsAndSkipsLaterRoundsForWinners() {
    var result = service.runRound(projectId, "A", "seed-001");

    assertThat(result.winners()).hasSize(2);
    assertThat(result.winners()).allMatch(r -> r.assignedUnitId() != null);
}
```

- [ ] **Step 2: Run the tests and confirm they fail**

Run: `cd lottery-server && mvn -Dtest=LotteryServiceTest,QueryServiceTest test`
Expected: fail because round execution and query publication are not implemented yet.

- [ ] **Step 3: Implement round execution, query masking, result publication, and export**

Persist round metadata, result rows, and unit assignment in the database, then expose export output in a spreadsheet-friendly format.

- [ ] **Step 4: Re-run the focused tests and the backend suite**

Run: `cd lottery-server && mvn -Dtest=LotteryServiceTest,QueryServiceTest test && mvn test`
Expected: both commands pass.

- [ ] **Step 5: Commit**

---

### Task 8: Scaffold the Vue 3 admin app and shared API client

**Files:**
- Create: `lottery-admin/package.json`
- Create: `lottery-admin/vite.config.ts`
- Create: `lottery-admin/tsconfig.json`
- Create: `lottery-admin/index.html`
- Create: `lottery-admin/src/main.ts`
- Create: `lottery-admin/src/App.vue`
- Create: `lottery-admin/src/router/index.ts`
- Create: `lottery-admin/src/layouts/AdminLayout.vue`
- Create: `lottery-admin/src/api/http.ts`
- Create: `lottery-admin/src/types/api.ts`
- Create: `lottery-admin/src/stores/app.ts`
- Create: `lottery-admin/.env.example`

Frontend foundation to lock in:
- Vite dev server proxies `/api` to the backend.
- The app boots with a shared admin layout and route outlet.
- The API client centralizes auth-free MVP requests and error normalization.
- The public query route exists in the same Vue app.

- [ ] **Step 1: Write the failing frontend build check**

Create the scaffold first, then let the first build fail before the actual pages exist.

- [ ] **Step 2: Run the build and confirm it fails**

Run: `cd lottery-admin && npm run build`
Expected: fail because the app scaffold is incomplete.

- [ ] **Step 3: Implement the Vue 3 scaffold and shared API client**

Add routing, layout, Pinia store, Axios wrapper, and Vite proxy configuration.

- [ ] **Step 4: Re-run the build**

Run: `cd lottery-admin && npm run build`
Expected: pass.

- [ ] **Step 5: Commit**

---

### Task 9: Build the dashboard, household, and housing-unit pages

**Files:**
- Create: `lottery-admin/src/views/DashboardView.vue`
- Create: `lottery-admin/src/views/HouseholdListView.vue`
- Create: `lottery-admin/src/views/HousingUnitListView.vue`
- Create: `lottery-admin/src/components/StatsCard.vue`
- Create: `lottery-admin/src/components/DataImportDialog.vue`

Pages to implement first:
- Project dashboard
- Household list and import
- Housing-unit list and import

UI rules:
- Use one shared table/filter pattern across the management pages.
- Keep import actions in a modal or drawer, not on the main table toolbar.
- Show loading, empty, and error states explicitly.

- [ ] **Step 1: Write the failing page rendering checks**

Add a small Vitest render test for the dashboard shell so the page exists before wiring data.

- [ ] **Step 2: Run the page test and confirm it fails**

Run: `cd lottery-admin && npm run test`
Expected: fail because the views and shared components are not in place yet.

- [ ] **Step 3: Implement the dashboard and list pages**

Wire the pages to the API client, shared table component, and import dialog.

- [ ] **Step 4: Re-run the frontend tests and build**

Run: `cd lottery-admin && npm run test && npm run build`
Expected: both commands pass.

- [ ] **Step 5: Commit**

---

### Task 10: Build the review, lottery, results, and public query pages

**Files:**
- Create: `lottery-admin/src/views/WishReviewView.vue`
- Create: `lottery-admin/src/views/LotteryView.vue`
- Create: `lottery-admin/src/views/ResultView.vue`
- Create: `lottery-admin/src/views/PublicQueryView.vue`
- Create: `lottery-admin/src/components/WishTable.vue`
- Create: `lottery-admin/src/components/StatusTimeline.vue`

Pages to implement next:
- Wish capture and review
- Lottery execution console
- Results and export page
- Public query page at `/query`

UI rules:
- The review page must make lock status obvious.
- The lottery console must require an intentional confirm step.
- The public query page must be mobile-friendly and show masked output only.

- [ ] **Step 1: Write the failing query-route test**

Add a router-level test that proves `/query` renders without admin-only assumptions.

- [ ] **Step 2: Run the test and confirm it fails**

Run: `cd lottery-admin && npm run test`
Expected: fail until the public route and pages are implemented.

- [ ] **Step 3: Implement the review, lottery, result, and query pages**

Bind the new pages to the backend APIs and reuse the shared empty/loading/error states from Task 9.

- [ ] **Step 4: Re-run frontend tests and build**

Run: `cd lottery-admin && npm run test && npm run build`
Expected: both commands pass.

- [ ] **Step 5: Commit**

---

### Task 11: Add documentation, CI, and a demo verification path

**Files:**
- Modify: `README.md`
- Modify: `lottery-server/README.md`
- Create: `lottery-admin/README.md`
- Create: `.github/workflows/ci.yml`
- Create: `docs/00-project/standard-mvp-runbook.md`

Documentation and automation to lock in:
- One command to start the backend.
- One command to start the frontend.
- One command to run backend tests.
- One command to run frontend tests and build.
- One short runbook for the demo path: import -> lock -> draw -> publish -> query -> export.

- [ ] **Step 1: Write the failing CI/build verification**

Make the workflow fail first by pointing it at the real backend and frontend commands before the docs exist.

- [ ] **Step 2: Run the local verification commands**

Run:
`cd lottery-server && mvn test`
`cd lottery-admin && npm run test && npm run build`
Expected: all pass before the CI file is finalized.

- [ ] **Step 3: Add the README and CI files**

Document the final repo shape and make the CI execute the same commands a developer would run locally.

- [ ] **Step 4: Re-run the full verification set**

Run:
`cd lottery-server && mvn test`
`cd lottery-admin && npm run test && npm run build`
Expected: all pass again after the docs and workflow changes.

- [ ] **Step 5: Commit**

---

### Self-Review Checklist

- [ ] Every MVP requirement has a task assigned.
- [ ] The plan starts with backend foundation, then schema, then engine, then API, then frontend.
- [ ] No task depends on an undefined class, method, or file.
- [ ] No step says "TODO" or leaves implementation vague.
- [ ] Verification commands exist for every task.
- [ ] `prototype/` is treated as reference-only, not as the implementation target.

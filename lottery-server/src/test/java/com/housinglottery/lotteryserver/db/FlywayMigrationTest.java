package com.housinglottery.lotteryserver.db;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.List;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.ActiveProfiles;

@SpringBootTest
@ActiveProfiles("test")
class FlywayMigrationTest {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Test
    void createsCoreTables() {
        List<String> tables = jdbcTemplate.queryForList(
                "select table_name from information_schema.tables where table_schema = 'PUBLIC'",
                String.class
        );

        assertThat(tables).contains(
                "PROJECT",
                "HOUSEHOLD",
                "HOUSING_UNIT",
                "WISH",
                "LOTTERY_ROUND",
                "LOTTERY_RESULT",
                "AUDIT_LOG"
        );
    }
}

package com.housinglottery.lotteryserver;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

@SpringBootTest(classes = LotteryServerApplication.class)
@ActiveProfiles("test")
class LotteryServerApplicationTests {

    @Test
    void contextLoads() {
    }
}

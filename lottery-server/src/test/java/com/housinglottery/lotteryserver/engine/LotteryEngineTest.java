package com.housinglottery.lotteryserver.engine;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.util.List;
import org.junit.jupiter.api.Test;

class LotteryEngineTest {

    private final LotteryEngine engine = new LotteryEngine();

    @Test
    void sameSeedProducesSameOrder() {
        List<LotteryCandidate> candidates = List.of(
                new LotteryCandidate(1L, "H001", "A"),
                new LotteryCandidate(2L, "H002", "A"),
                new LotteryCandidate(3L, "H003", "A")
        );

        LotteryDrawResult result1 = engine.draw(candidates, 2, "seed-001");
        LotteryDrawResult result2 = engine.draw(candidates, 2, "seed-001");

        assertThat(result1.orderedCandidateIds()).isEqualTo(result2.orderedCandidateIds());
        assertThat(result1.winnerIds()).isEqualTo(result2.winnerIds());
    }

    @Test
    void differentSeedsProduceDifferentOrder() {
        List<LotteryCandidate> candidates = List.of(
                new LotteryCandidate(1L, "H001", "A"),
                new LotteryCandidate(2L, "H002", "A"),
                new LotteryCandidate(3L, "H003", "A"),
                new LotteryCandidate(4L, "H004", "A"),
                new LotteryCandidate(5L, "H005", "A")
        );

        LotteryDrawResult result1 = engine.draw(candidates, 2, "seed-001");
        LotteryDrawResult result2 = engine.draw(candidates, 2, "seed-002");

        assertThat(result1.orderedCandidateIds()).isNotEqualTo(result2.orderedCandidateIds());
    }

    @Test
    void winnerCountDoesNotExceedCandidateCount() {
        List<LotteryCandidate> candidates = List.of(
                new LotteryCandidate(1L, "H001", "A"),
                new LotteryCandidate(2L, "H002", "A"),
                new LotteryCandidate(3L, "H003", "A")
        );

        LotteryDrawResult result = engine.draw(candidates, 5, "seed-003");

        assertThat(result.winnerIds()).hasSize(3);
    }

    @Test
    void emptyCandidatesReturnEmptyResult() {
        LotteryDrawResult result = engine.draw(List.of(), 2, "seed-004");

        assertThat(result.orderedCandidateIds()).isEmpty();
        assertThat(result.winnerIds()).isEmpty();
    }

    @Test
    void rejectsDuplicateHouseholdIds() {
        List<LotteryCandidate> candidates = List.of(
                new LotteryCandidate(1L, "H001", "A"),
                new LotteryCandidate(1L, "H001-DUP", "A")
        );

        assertThatThrownBy(() -> engine.draw(candidates, 1, "seed-005"))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("duplicate");
    }
}

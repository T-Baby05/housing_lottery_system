package com.housinglottery.lotteryserver.engine;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Objects;
import java.util.Set;

public class LotteryEngine {

    public LotteryDrawResult draw(List<LotteryCandidate> candidates, int winnerCount, String seed) {
        Objects.requireNonNull(candidates, "candidates must not be null");
        Objects.requireNonNull(seed, "seed must not be null");

        validateUniqueHouseholdIds(candidates);

        List<LotteryCandidate> shuffled = new ArrayList<>(candidates);
        DeterministicRandom random = new DeterministicRandom(seed);

        for (int index = shuffled.size() - 1; index > 0; index--) {
            int swapIndex = random.nextInt(index + 1);
            LotteryCandidate current = shuffled.get(index);
            shuffled.set(index, shuffled.get(swapIndex));
            shuffled.set(swapIndex, current);
        }

        int actualWinnerCount = Math.min(Math.max(winnerCount, 0), shuffled.size());
        List<Long> orderedCandidateIds = shuffled.stream()
                .map(LotteryCandidate::householdId)
                .toList();
        List<Long> winnerIds = shuffled.stream()
                .limit(actualWinnerCount)
                .map(LotteryCandidate::householdId)
                .toList();

        return new LotteryDrawResult(orderedCandidateIds, winnerIds);
    }

    private void validateUniqueHouseholdIds(List<LotteryCandidate> candidates) {
        Set<Long> householdIds = new HashSet<>();
        for (LotteryCandidate candidate : candidates) {
            if (candidate == null || candidate.householdId() == null) {
                throw new IllegalArgumentException("candidate householdId must not be null");
            }
            if (!householdIds.add(candidate.householdId())) {
                throw new IllegalArgumentException("duplicate householdId detected");
            }
        }
    }
}

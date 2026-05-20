package com.housinglottery.lotteryserver.engine;

import java.util.List;

public record LotteryDrawResult(List<Long> orderedCandidateIds, List<Long> winnerIds) {
}

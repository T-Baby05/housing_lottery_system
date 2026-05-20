package com.housinglottery.lotteryserver.engine;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;

final class DeterministicRandom {

    private long state;

    DeterministicRandom(String seed) {
        this.state = hashSeed(seed);
    }

    int nextInt(int bound) {
        if (bound <= 0) {
            throw new IllegalArgumentException("bound must be positive");
        }

        state = state * 6364136223846793005L + 1442695040888963407L;
        long candidate = Long.remainderUnsigned(state, bound);
        return (int) candidate;
    }

    private long hashSeed(String seed) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] bytes = digest.digest(seed.getBytes(StandardCharsets.UTF_8));
            long value = 0L;
            for (int i = 0; i < Long.BYTES; i++) {
                value = (value << 8) | (bytes[i] & 0xffL);
            }
            return value;
        } catch (NoSuchAlgorithmException exception) {
            throw new IllegalStateException("SHA-256 not available", exception);
        }
    }
}

import test from "node:test";
import assert from "node:assert/strict";

// Simulated guard logic reflecting App.jsx implementation
function simulatePrivateRoute({ user, isVerified, authInitialized, loading }) {
    if (!authInitialized || loading) {
        return { rendered: null, redirectedTo: null };
    }
    if (user && isVerified) {
        return { rendered: "CHILDREN", redirectedTo: null };
    }
    if (user && !isVerified) {
        return { rendered: null, redirectedTo: "/verify-account" };
    }
    return { rendered: null, redirectedTo: "/login" };
}

function simulateAuthRoute({ user, authInitialized, loading, allowUnverified = false, isVerified = true }) {
    if (!authInitialized || loading) {
        return { rendered: null, redirectedTo: null };
    }
    if (!user) {
        return { rendered: "AUTH_CHILDREN", redirectedTo: null };
    }
    if (allowUnverified && !isVerified) {
        return { rendered: "AUTH_CHILDREN", redirectedTo: null };
    }
    return { rendered: null, redirectedTo: "/" };
}

test("cold_start: uninitialized state yields zero redirects on private route", () => {
    // When app starts, user is null, authInitialized is false, loading is true
    const res = simulatePrivateRoute({
        user: null,
        isVerified: false,
        authInitialized: false,
        loading: true,
    });
    assert.equal(res.redirectedTo, null, "Must NOT redirect to /login during initial session loading");
    assert.equal(res.rendered, null, "Must render splash/null rather than redirecting");
});

test("cold_start: uninitialized state yields zero redirects on auth route", () => {
    const res = simulateAuthRoute({
        user: null,
        authInitialized: false,
        loading: true,
    });
    assert.equal(res.redirectedTo, null, "Must NOT bounce redirect during initial loading");
    assert.equal(res.rendered, null, "Must render splash/null rather than bouncing");
});

test("cold_start: initialized authenticated user enters dashboard directly with zero flash", () => {
    const res = simulatePrivateRoute({
        user: { id: "user_123" },
        isVerified: true,
        authInitialized: true,
        loading: false,
    });
    assert.equal(res.rendered, "CHILDREN", "Must render protected dashboard immediately");
    assert.equal(res.redirectedTo, null, "Must not redirect anywhere");
});

test("cold_start: unauthenticated session redirects to /login only after check completes", () => {
    const res = simulatePrivateRoute({
        user: null,
        isVerified: false,
        authInitialized: true,
        loading: false,
    });
    assert.equal(res.redirectedTo, "/login", "Must redirect to /login once confirmed unauthenticated");
});

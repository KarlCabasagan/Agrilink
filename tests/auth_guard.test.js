import test from "node:test";
import assert from "node:assert/strict";
import { resolveRouteAccess } from "../src/utils/authGuard.js";

test("resolveRouteAccess: unauthenticated user denied access to private route", () => {
    const res = resolveRouteAccess({ user: null, userRole: null, allowedRoles: [1, 2, 3] });
    assert.deepEqual(res, { allowed: false, redirectTo: "/login" });
});

test("resolveRouteAccess: authenticated role 1 (consumer) accessing consumer route", () => {
    const res = resolveRouteAccess({ user: { id: "u1" }, userRole: 1, allowedRoles: [1] });
    assert.deepEqual(res, { allowed: true, redirectTo: null });
});

test("resolveRouteAccess: consumer (role 1) attempting admin route (role 3) gets redirected home", () => {
    const res = resolveRouteAccess({ user: { id: "u1" }, userRole: 1, allowedRoles: [3] });
    assert.deepEqual(res, { allowed: false, redirectTo: "/" });
});

test("resolveRouteAccess: admin (role 3) accessing consumer-only route redirected to admin dashboard", () => {
    const res = resolveRouteAccess({ user: { id: "admin" }, userRole: 3, allowedRoles: [1] });
    assert.deepEqual(res, { allowed: false, redirectTo: "/admin/dashboard" });
});

test("resolveRouteAccess: admin (role 3) accessing admin route allowed", () => {
    const res = resolveRouteAccess({ user: { id: "admin" }, userRole: 3, allowedRoles: [3] });
    assert.deepEqual(res, { allowed: true, redirectTo: null });
});

test("resolveRouteAccess: producer (role 2) accessing producer route allowed", () => {
    const res = resolveRouteAccess({ user: { id: "farmer" }, userRole: 2, allowedRoles: [2] });
    assert.deepEqual(res, { allowed: true, redirectTo: null });
});

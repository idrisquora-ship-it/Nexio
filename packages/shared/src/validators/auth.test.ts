import { loginSchema, signupSchema } from "./auth";
import { usernameSchema } from "./profile";

describe("auth validators", () => {
  it("accepts valid login credentials", () => {
    const result = loginSchema.safeParse({
      email: "user@nexio.app",
      password: "password123",
    });
    expect(result.success).toBe(true);
  });

  it("rejects short passwords on signup", () => {
    const result = signupSchema.safeParse({
      email: "user@nexio.app",
      password: "short",
      confirmPassword: "short",
    });
    expect(result.success).toBe(false);
  });

  it("rejects mismatched passwords", () => {
    const result = signupSchema.safeParse({
      email: "user@nexio.app",
      password: "password123",
      confirmPassword: "password456",
    });
    expect(result.success).toBe(false);
  });
});

describe("username validator", () => {
  it("accepts valid usernames", () => {
    expect(usernameSchema.safeParse("nexio_user").success).toBe(true);
  });

  it("rejects invalid characters", () => {
    expect(usernameSchema.safeParse("Bad-User").success).toBe(false);
  });
});

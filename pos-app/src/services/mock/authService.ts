import type { IAuthService } from "../types";
import { mockUsers, mockCredentials } from "./mockData";

const delay = (ms = 400) => new Promise(r => setTimeout(r, ms));

export const authService: IAuthService = {
  async login(email, password) {
    await delay();
    const stored = mockCredentials[email];
    if (!stored || stored !== password) throw new Error("Invalid email or password");
    const user = mockUsers.find(u => u.email === email);
    if (!user) throw new Error("User not found");
    return { user, token: `mock-token-${user.id}-${Date.now()}` };
  },

  async logout() {
    await delay(200);
  },

  async me(token) {
    await delay(200);
    const userId = token.split("-")[2];
    const user = mockUsers.find(u => u.id === userId);
    if (!user) throw new Error("Invalid token");
    return user;
  },
};

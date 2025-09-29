// Mock the config module
jest.mock("../../Resources/Scripts/core/config.js", () => ({
  API_BASE_URL: "http://localhost:5000/api",
  DEV_API_URL: "http://localhost:5000/api/Dev",
}));

// Import the module after mocking
const AuthService = require("../../Resources/Scripts/core/auth.js");

describe("AuthService", () => {
  beforeEach(() => {
    localStorage.clear();
    fetch.mockClear();
  });

  describe("login", () => {
    test("should store token and user data on successful login", async () => {
      const mockResponse = {
        token: "fake-jwt-token",
        user: { email: "test@ua.edu", firstName: "Test", lastName: "User" },
      };

      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      await AuthService.login("test@ua.edu", "password123");

      expect(localStorage.setItem).toHaveBeenCalledWith(
        "authToken",
        "fake-jwt-token"
      );
      expect(localStorage.setItem).toHaveBeenCalledWith(
        "currentUser",
        JSON.stringify(mockResponse.user)
      );
    });

    test("should throw error on failed login", async () => {
      fetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ message: "Invalid credentials" }),
      });

      await expect(
        AuthService.login("test@ua.edu", "wrongpassword")
      ).rejects.toThrow("Invalid credentials");
    });

    test("should handle network errors", async () => {
      fetch.mockRejectedValueOnce(new Error("Network error"));

      await expect(
        AuthService.login("test@ua.edu", "password123")
      ).rejects.toThrow("Network error");
    });
  });

  describe("logout", () => {
    test("should clear stored data", () => {
      AuthService.logout();

      expect(localStorage.removeItem).toHaveBeenCalledWith("authToken");
      expect(localStorage.removeItem).toHaveBeenCalledWith("currentUser");
    });
  });

  describe("getCurrentUser", () => {
    test("should return current user from localStorage", () => {
      const mockUser = { email: "test@ua.edu", firstName: "Test" };
      localStorage.getItem.mockReturnValue(JSON.stringify(mockUser));

      const result = AuthService.getCurrentUser();

      expect(result).toEqual(mockUser);
    });

    test("should return null if no user stored", () => {
      localStorage.getItem.mockReturnValue(null);

      const result = AuthService.getCurrentUser();

      expect(result).toBeNull();
    });
  });

  describe("isAuthenticated", () => {
    test("should return true if token exists", () => {
      localStorage.getItem.mockReturnValue("fake-token");

      const result = AuthService.isAuthenticated();

      expect(result).toBe(true);
    });

    test("should return false if no token", () => {
      localStorage.getItem.mockReturnValue(null);

      const result = AuthService.isAuthenticated();

      expect(result).toBe(false);
    });
  });

  describe("getAuthHeaders", () => {
    test("should return headers with token", () => {
      localStorage.getItem.mockReturnValue("fake-token");

      const headers = AuthService.getAuthHeaders();

      expect(headers).toEqual({
        "Content-Type": "application/json",
        Authorization: "Bearer fake-token",
      });
    });

    test("should return headers without token if not authenticated", () => {
      localStorage.getItem.mockReturnValue(null);

      const headers = AuthService.getAuthHeaders();

      expect(headers).toEqual({
        "Content-Type": "application/json",
      });
    });
  });
});

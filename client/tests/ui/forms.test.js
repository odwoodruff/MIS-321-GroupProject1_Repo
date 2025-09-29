// Mock DOM environment
document.body.innerHTML = `
  <form id="testForm">
    <input type="email" id="email" required>
    <input type="password" id="password" required>
    <button type="submit">Submit</button>
  </form>
  <div id="errorContainer"></div>
`;

// Mock dependencies
jest.mock("../../Resources/Scripts/core/auth.js", () => ({
  login: jest.fn(),
  getCurrentUser: jest.fn(),
}));

// Import the module after mocking
const FormsService = require("../../Resources/Scripts/ui/forms.js");

describe("FormsService", () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <form id="testForm">
        <input type="email" id="email" required>
        <input type="password" id="password" required>
        <button type="submit">Submit</button>
      </form>
      <div id="errorContainer"></div>
    `;
  });

  describe("validateEmail", () => {
    test("should validate correct email format", () => {
      const validEmails = [
        "test@ua.edu",
        "user@crimson.ua.edu",
        "student@bama.ua.edu",
      ];

      validEmails.forEach((email) => {
        expect(FormsService.validateEmail(email)).toBe(true);
      });
    });

    test("should reject invalid email format", () => {
      const invalidEmails = [
        "invalid-email",
        "@ua.edu",
        "test@",
        "test@ua",
        "",
      ];

      invalidEmails.forEach((email) => {
        expect(FormsService.validateEmail(email)).toBe(false);
      });
    });
  });

  describe("validatePassword", () => {
    test("should validate strong password", () => {
      const strongPasswords = ["Password123!", "MySecurePass1", "Test123456"];

      strongPasswords.forEach((password) => {
        expect(FormsService.validatePassword(password)).toBe(true);
      });
    });

    test("should reject weak password", () => {
      const weakPasswords = ["123", "password", "PASSWORD", "Pass1", ""];

      weakPasswords.forEach((password) => {
        expect(FormsService.validatePassword(password)).toBe(false);
      });
    });
  });

  describe("showError", () => {
    test("should display error message", () => {
      const errorMessage = "Test error message";

      FormsService.showError("errorContainer", errorMessage);

      const errorElement = document.getElementById("errorContainer");
      expect(errorElement.textContent).toBe(errorMessage);
      expect(errorElement.classList.contains("alert-danger")).toBe(true);
    });
  });

  describe("clearErrors", () => {
    test("should clear error messages", () => {
      const errorContainer = document.getElementById("errorContainer");
      errorContainer.innerHTML =
        '<div class="alert alert-danger">Error message</div>';

      FormsService.clearErrors("errorContainer");

      expect(errorContainer.innerHTML).toBe("");
    });
  });

  describe("validateForm", () => {
    test("should validate required fields", () => {
      const form = document.getElementById("testForm");
      const emailInput = document.getElementById("email");
      const passwordInput = document.getElementById("password");

      // Empty form should be invalid
      expect(FormsService.validateForm(form)).toBe(false);

      // Fill required fields
      emailInput.value = "test@ua.edu";
      passwordInput.value = "Password123!";

      expect(FormsService.validateForm(form)).toBe(true);
    });

    test("should validate email format in form", () => {
      const form = document.getElementById("testForm");
      const emailInput = document.getElementById("email");
      const passwordInput = document.getElementById("password");

      emailInput.value = "invalid-email";
      passwordInput.value = "Password123!";

      expect(FormsService.validateForm(form)).toBe(false);
    });
  });

  describe("serializeForm", () => {
    test("should serialize form data to object", () => {
      const form = document.getElementById("testForm");
      const emailInput = document.getElementById("email");
      const passwordInput = document.getElementById("password");

      emailInput.value = "test@ua.edu";
      passwordInput.value = "Password123!";

      const formData = FormsService.serializeForm(form);

      expect(formData).toEqual({
        email: "test@ua.edu",
        password: "Password123!",
      });
    });
  });

  describe("resetForm", () => {
    test("should reset form fields", () => {
      const form = document.getElementById("testForm");
      const emailInput = document.getElementById("email");
      const passwordInput = document.getElementById("password");

      emailInput.value = "test@ua.edu";
      passwordInput.value = "Password123!";

      FormsService.resetForm(form);

      expect(emailInput.value).toBe("");
      expect(passwordInput.value).toBe("");
    });
  });
});

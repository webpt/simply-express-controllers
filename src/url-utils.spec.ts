import { joinURL } from "./url-utils";

describe("url-utils", () => {
  describe("joinURL", () => {
    it("should join a base URL with one path segment", () => {
      const result = joinURL("http://example.com", "api");
      expect(result).toBe("http://example.com/api");
    });

    it("should join a base URL with multiple path segments", () => {
      const result = joinURL("http://example.com", "api", "v1", "users");
      expect(result).toBe("http://example.com/api/v1/users");
    });

    it("should handle base URL with existing path", () => {
      const result = joinURL("http://example.com/base", "api", "users");
      expect(result).toBe("http://example.com/base/api/users");
    });

    it("should handle base URL with trailing slash", () => {
      const result = joinURL("http://example.com/", "api");
      expect(result).toBe("http://example.com/api");
    });

    it("should handle base URL without trailing slash", () => {
      const result = joinURL("http://example.com", "api");
      expect(result).toBe("http://example.com/api");
    });

    it("should handle empty path segments", () => {
      const result = joinURL("http://example.com", "");
      expect(result).toBe("http://example.com/");
    });

    it("should handle complex paths with query parameters", () => {
      const result = joinURL("http://example.com?foo=bar", "api", "users");
      expect(result).toBe("http://example.com/api/users?foo=bar");
    });

    it("should handle HTTPS URLs", () => {
      const result = joinURL("https://secure.example.com", "api", "v2");
      expect(result).toBe("https://secure.example.com/api/v2");
    });

    it("should handle URLs with ports", () => {
      const result = joinURL("http://example.com:8080", "api");
      expect(result).toBe("http://example.com:8080/api");
    });

    it("should handle localhost URLs", () => {
      const result = joinURL("http://localhost:3000", "health");
      expect(result).toBe("http://localhost:3000/health");
    });
  });
}); 
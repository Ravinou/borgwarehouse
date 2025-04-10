const ApiResponse = {
  success: vi.fn(),
  badRequest: vi.fn(),
  unauthorized: vi.fn(),
  forbidden: vi.fn(),
  notFound: vi.fn(),
  methodNotAllowed: vi.fn(),
  validationError: vi.fn(),
  serverError: vi.fn(),
};

export default ApiResponse;

export class ApiError extends Error {
  status: number;
  code: string;

  constructor(status: number, code: string, message: string) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

export const notFound = (message: string) => new ApiError(404, "NOT_FOUND", message);
export const unauthorized = (message = "Não autorizado") => new ApiError(401, "UNAUTHORIZED", message);
export const forbidden = (message = "Proibido") => new ApiError(403, "FORBIDDEN", message);
export const badRequest = (message: string) => new ApiError(400, "BAD_REQUEST", message);

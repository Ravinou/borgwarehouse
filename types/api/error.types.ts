export type ErrorResponse = {
  status?: number;
  message: string;
};

export type SuccessResponse = {
  message?: string;
};

export type BorgWarehouseApiResponse<T = any> = {
  status: number;
  message: string;
  data?: T;
};

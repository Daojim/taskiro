import { Response } from 'express';

export interface PaginationInfo {
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  message?: string;
  data?: T;
  pagination?: PaginationInfo;
}

export class ResponseFormatter {
  static success<T>(
    res: Response,
    data: T,
    message?: string,
    statusCode = 200
  ) {
    const response: ApiResponse<T> = {
      success: true,
      data,
      ...(message && { message }),
    };

    return res.status(statusCode).json(response);
  }

  static successWithPagination<T>(
    res: Response,
    data: T,
    pagination: PaginationInfo,
    message?: string,
    statusCode = 200
  ) {
    const response: ApiResponse<T> = {
      success: true,
      data,
      pagination,
      ...(message && { message }),
    };

    return res.status(statusCode).json(response);
  }

  static created<T>(
    res: Response,
    data: T,
    message = 'Resource created successfully'
  ) {
    return this.success(res, data, message, 201);
  }

  static deleted(res: Response, message = 'Resource deleted successfully') {
    const response: ApiResponse = {
      success: true,
      message,
    };

    return res.status(200).json(response);
  }
}

export const createPagination = (
  total: number,
  limit: number,
  offset: number
): PaginationInfo => ({
  total,
  limit,
  offset,
  hasMore: total > offset + limit,
});

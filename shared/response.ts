import { Response } from "express";

// Success responses
export const ok = <T>(res: Response, data: T, message?: string) => {
  return res
    .status(200)
    .json({ success: true, data, ...(message && { message }) });
};

export const created = <T>(res: Response, data: T) => {
  return res.status(201).json({ success: true, data });
};

export const noContent = (res: Response) => res.status(204).send();

export const paginated = <T>(
  res: Response,
  data: T[],
  total: number,
  page: number,
  limit: number
) => {
  return res.status(200).json({
    success: true,
    data,
    meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
  });
};

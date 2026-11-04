declare global {
  export type ListResponse<T> = {
    data: T;
    pagination: {
      page: number;
      limit: number;
      total: number;
    };
  };
}

export {};

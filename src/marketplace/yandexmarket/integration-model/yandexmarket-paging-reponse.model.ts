interface YandexMarketPagingResponse<T> {
  status: string;
  result?: T;
  errors?: {
    code: string;
    message: string;
  }[];
}

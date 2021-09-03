interface Result {
  hiddenOffers: {
    marketSku: number;
  }[];
  paging?: {
    nextPageToken?: string;
  };
}

export interface YandexMarketHiddenOffersPageResponse
  extends YandexMarketPagingResponse<Result> {}

interface Result {
  hiddenOffers: {
    offerId: string;
  }[];
  paging?: {
    nextPageToken?: string;
  };
}

export interface YandexMarketHiddenOffersPageResponse
  extends YandexMarketPagingResponse<Result> {}

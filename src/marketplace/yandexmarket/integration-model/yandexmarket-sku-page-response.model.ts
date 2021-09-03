interface Result {
  offerMappingEntries: {
    offer: {
      shopSku: string;
    };
    mapping?: {
      marketSku: number;
    };
  }[];
  paging?: {
    nextPageToken?: string;
  };
}

export interface YandexMarketSkuPageResponse
  extends YandexMarketPagingResponse<Result> {}

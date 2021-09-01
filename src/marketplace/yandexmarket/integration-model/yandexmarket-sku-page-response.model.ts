interface YandexMarketSkuPageResponse {
  status: string;
  result?: {
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
  };
  errors?: {
    code: string;
    message: string;
  }[];
}

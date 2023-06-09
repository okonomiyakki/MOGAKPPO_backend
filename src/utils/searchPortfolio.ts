import * as AppErrors from '../middlewares/errorHandler';
import * as portfolioRepo from '../database/repository/portfolioRepo';
import * as Portfolio from '../types/PortfolioType';

export const searchPortfoliosByQuery = async (inputQuery: Portfolio.QueryInput) => {
  try {
    // 전체 조회
    if (!inputQuery.portfolio_keyword) {
      const foundPortfolios = await portfolioRepo.findAllPortfolios();
      console.log('전체 검색 중');
      return foundPortfolios;
    }
    // 키워드 별 조회
    else if (inputQuery.portfolio_keyword) {
      const foundPortfolios = await portfolioRepo.findPortfoliosByKeyword(
        inputQuery.portfolio_keyword
      );
      console.log('키워드 검색 중');
      return foundPortfolios;
    } else AppErrors.handleBadRequest('키워드 검색 중 오류가 발생했습니다.');
  } catch (error) {
    throw error;
  }
};

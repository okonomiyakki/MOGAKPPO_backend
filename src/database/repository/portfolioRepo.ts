import db from '../../config/dbconfig';
import * as AppErrors from '../../middlewares/errorHandler';
import * as Portfolio from '../../types/PortfolioType';

/* 포트폴리오 등록 */
export const createPorfolio = async (inputData: Portfolio.CreateInput): Promise<Portfolio.Id> => {
  try {
    const createColumns = `
    user_id,
    portfolio_title, 
    portfolio_summary,
    portfolio_github,
    portfolio_stacks,
    portfolio_description,
    portfolio_thumbnail,
    portfolio_img
    `;

    const createValues = Object.values(inputData);

    const SQL = `
    INSERT INTO
    portfolio (${createColumns}) 
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const [result, _] = await db.execute(SQL, createValues);

    const createdPorfolioId = (result as { insertId: number }).insertId;

    return createdPorfolioId;
  } catch (error) {
    console.log(error);
    throw error;
  }
};

/* 포트폴리오 상세 정보 수정 */
export const updatePortfolioInfo = async (
  user_id: number,
  portfolio_id: number,
  inputData: Portfolio.UpdateInput
): Promise<number> => {
  try {
    const updateColums = Object.entries(inputData)
      .map(([key, _]) => `${key} = ?`)
      .join(', ');

    const updateValues = Object.values(inputData);

    const SQL = `
    UPDATE portfolio
    SET ${updateColums}
    WHERE user_id = ? AND portfolio_id = ?
    `;

    const [result, _] = await db.execute(SQL, [...updateValues, user_id, portfolio_id]);

    const isAffected = (result as { affectedRows: number }).affectedRows === 1 ? true : false;

    const isMatched = Number((result as { info: string }).info.split(' ')[2]) === 1 ? true : false;

    const isChanged = Number((result as { info: string }).info.split(' ')[5]) === 1 ? true : false;

    if (!isAffected && !isMatched && !isChanged)
      throw AppErrors.handleForbidden('본인만 수정 가능 합니다.');

    return portfolio_id;
  } catch (error) {
    console.log(error);
    throw error;
  }
};

/* 포트폴리오 삭제 */
export const deletePortfolioById = async (
  user_id: number,
  portfolio_id: number
): Promise<boolean> => {
  try {
    const SQL = `
    DELETE FROM portfolio
    WHERE user_id = ? AND portfolio_id = ?
    `;

    const [result, _] = await db.execute(SQL, [user_id, portfolio_id]);

    const isAffected = (result as { affectedRows: number }).affectedRows === 1 ? true : false;

    if (!isAffected) throw AppErrors.handleForbidden('본인만 삭제 가능 합니다.');

    return true;
  } catch (error) {
    console.log(error);
    throw error;
  }
};

/* 전체 포트폴리오 목록 조회 */
export const findAllPortfolios = async (): Promise<any> => {
  try {
    const selectColumns = `
    portfolio.portfolio_id,
    portfolio.portfolio_title,
    portfolio.portfolio_summary,
    portfolio.portfolio_thumbnail,
    portfolio.portfolio_github,
    portfolio.portfolio_stacks,
    COUNT(DISTINCT portfolio_bookmark.user_id) AS portfolio_bookmark_count,
    COUNT(DISTINCT portfolio_comment.comment_id) AS portfolio_comments_count,
    portfolio.portfolio_views_count,
    portfolio.portfolio_created_at
    `;

    const SQL = `
    SELECT ${selectColumns}
    FROM portfolio
    LEFT JOIN portfolio_bookmark ON portfolio_bookmark.portfolio_id = portfolio.portfolio_id
    LEFT JOIN portfolio_comment ON portfolio_comment.portfolio_id = portfolio.portfolio_id
    GROUP BY portfolio.portfolio_id
    `;

    const [portfolios]: any = await db.query(SQL);

    return portfolios; // TODO] as portfolios.ListByRole[]; 명시적으로 타입 선언
  } catch (error) {
    console.log(error);
    throw error;
  }
};

/* 키워드 별 포트폴리오 목록 조회 */
export const findPortfoliosByKeyword = async (portfolio_keyword: string): Promise<any> => {
  try {
    const selectColumns = `
    portfolio.portfolio_id,
    portfolio.portfolio_title,
    portfolio.portfolio_summary,
    portfolio.portfolio_thumbnail,
    portfolio.portfolio_github,
    portfolio.portfolio_stacks,
    COUNT(DISTINCT portfolio_bookmark.user_id) AS portfolio_bookmark_count,
    COUNT(DISTINCT portfolio_comment.comment_id) AS portfolio_comments_count,
    portfolio.portfolio_views_count,
    portfolio.portfolio_created_at
    `;

    const SQL = `
    SELECT ${selectColumns}
    FROM portfolio
    LEFT JOIN portfolio_bookmark ON portfolio_bookmark.portfolio_id = portfolio.portfolio_id
    LEFT JOIN portfolio_comment ON portfolio_comment.portfolio_id = portfolio.portfolio_id
    WHERE portfolio.portfolio_title LIKE CONCAT('%', ?, '%') 
    OR portfolio.portfolio_summary LIKE CONCAT('%', ?, '%') 
    OR portfolio.portfolio_description LIKE CONCAT('%', ?, '%')
    OR JSON_CONTAINS(portfolio.portfolio_stacks->'$.stackList', JSON_ARRAY(?))
    GROUP BY portfolio.portfolio_id
    `;

    const [portfolio]: any = await db.query(SQL, [
      portfolio_keyword,
      portfolio_keyword,
      portfolio_keyword,
      portfolio_keyword,
      portfolio_keyword,
    ]);

    return portfolio;
  } catch (error) {
    console.log(error);
    throw error;
  }
};

/* 댓글 등록 및 북마크 등록, 삭제 시 포트폴리오 유효성 검사 */
export const isPortfolioValid = async (portfolio_id: number): Promise<void> => {
  try {
    const SQL = `
    SELECT *
    FROM portfolio
    WHERE portfolio_id = ?
    `;

    const [portfolio]: any = await db.query(SQL, [portfolio_id]);

    const isPortfolioValid = portfolio[0];

    if (!isPortfolioValid) throw AppErrors.handleNotFound('이미 삭제된 포트폴리오 입니다.');
  } catch (error) {
    console.log(error);
    throw error;
  }
};

/* 포트폴리오 상세 정보 조회 */
export const findPortfolioById = async (portfolio_id: number): Promise<any> => {
  try {
    const selectColumns = `
    project_complete.project_id,
    portfolio.portfolio_id,
    portfolio.portfolio_title,
    portfolio.portfolio_summary,
    portfolio.portfolio_thumbnail,
    portfolio.portfolio_github,
    portfolio.portfolio_stacks,
    portfolio.portfolio_description,
    portfolio.portfolio_img,
    COUNT(DISTINCT portfolio_bookmark.user_id) AS portfolio_bookmark_count,
    COUNT(DISTINCT portfolio_comment.comment_id) AS portfolio_comments_count,
    portfolio.portfolio_views_count,
    portfolio.portfolio_created_at,
    user.user_id,
    user.user_name,
    user.user_introduction,
    user.user_img
    `;

    const SQL = `
    SELECT ${selectColumns}
    FROM portfolio
    LEFT JOIN portfolio_bookmark ON portfolio_bookmark.portfolio_id = portfolio.portfolio_id
    LEFT JOIN portfolio_comment ON portfolio_comment.portfolio_id = portfolio.portfolio_id
    LEFT JOIN project_complete ON project_complete.portfolio_id = portfolio.portfolio_id
    JOIN user ON user.user_id = portfolio.user_id
    WHERE portfolio.portfolio_id = ?
    `;

    const [portfolio]: any = await db.query(SQL, [portfolio_id]);

    const isPortfolioValid = portfolio[0].portfolio_id;

    if (!isPortfolioValid) throw AppErrors.handleNotFound('이미 삭제된 포트폴리오 입니다.');

    return portfolio[0];
  } catch (error) {
    console.log(error);
    throw error;
  }
};

/* 마이페이지 작성 포트폴리오 목록 조회 */
export const findMyPortfoliosById = async (user_id: number): Promise<any> => {
  try {
    const selectColumns = `
    portfolio.portfolio_id,
    portfolio.portfolio_title,
    portfolio.portfolio_summary,
    portfolio.portfolio_thumbnail,
    portfolio.portfolio_github,
    COUNT(DISTINCT portfolio_bookmark.user_id) AS portfolio_bookmark_count,
    COUNT(DISTINCT portfolio_comment.comment_id) AS portfolio_comments_count,
    portfolio.portfolio_views_count,
    portfolio.portfolio_created_at
    `;

    const SQL = `
    SELECT ${selectColumns}
    FROM portfolio
    LEFT JOIN portfolio_bookmark ON portfolio_bookmark.portfolio_id = portfolio.portfolio_id
    LEFT JOIN portfolio_comment ON portfolio_comment.portfolio_id = portfolio.portfolio_id
    WHERE portfolio.user_id = ?
    GROUP BY portfolio.portfolio_id
    `;

    const [portfolios]: any = await db.query(SQL, [user_id]);

    return portfolios;
  } catch (error) {
    console.log(error);
    throw error;
  }
};

/* 마이페이지 북마크 포트폴리오 목록 조회 */
export const findMyBookmarkedPortfoliosById = async (user_id: number): Promise<any> => {
  try {
    const selectColumns = `
    portfolio.portfolio_id,
    portfolio.portfolio_title,
    portfolio.portfolio_summary,
    portfolio.portfolio_thumbnail,
    portfolio.portfolio_github,
    COUNT(DISTINCT portfolio_bookmark.user_id) AS portfolio_bookmark_count,
    COUNT(DISTINCT portfolio_comment.comment_id) AS portfolio_comments_count,
    portfolio.portfolio_views_count,
    portfolio.portfolio_created_at
    `;

    const SQL = `
    SELECT ${selectColumns}
    FROM portfolio
    LEFT JOIN portfolio_bookmark ON portfolio_bookmark.portfolio_id = portfolio.portfolio_id
    LEFT JOIN portfolio_comment ON portfolio_comment.portfolio_id = portfolio.portfolio_id
    WHERE portfolio_bookmark.user_id = ?
    GROUP BY portfolio.portfolio_id
    `;

    const [portfolios]: any = await db.query(SQL, [user_id]);

    return portfolios;
  } catch (error) {
    console.log(error);
    throw error;
  }
};

/* 포트폴리오에 조회한 유저의 조회 날짜가 현재인지 조회 */
export const findUserViewDateById = async (
  user_id: number,
  portfolio_id: number,
  currentDate: string
): Promise<any> => {
  try {
    const SQL = `
    SELECT COUNT(*) AS portfolio_view_count
    FROM portfolio_view
    WHERE user_id = ? AND portfolio_id = ? AND portfolio_view_date = ?
    `;

    const [date]: any = await db.query(SQL, [user_id, portfolio_id, currentDate]);

    return Number(date[0].portfolio_view_count);
  } catch (error) {
    console.log(error);
    throw error;
  }
};

/* 포트폴리오 클릭 시 조회 수 증가 */
export const updatePortfolioViewsCount = async (
  user_id: number,
  portfolio_id: number,
  currentDate: string
): Promise<any> => {
  try {
    const SQL1 = `
    UPDATE portfolio
    SET portfolio_views_count = portfolio_views_count + 1
    WHERE portfolio_id = ?
    `;

    await db.execute(SQL1, [portfolio_id]);

    const SQL2 = `
    INSERT INTO portfolio_view (user_id, portfolio_id, portfolio_view_date)
    VALUES (?, ?, ?)
    `;

    await db.execute(SQL2, [user_id, portfolio_id, currentDate]);
  } catch (error) {
    console.log(error);
    throw error;
  }
};

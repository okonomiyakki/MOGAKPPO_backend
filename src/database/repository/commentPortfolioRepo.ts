import db from '../../config/dbconfig';
import * as AppErrors from '../../middlewares/errorHandler';
import * as CommentPortfolio from '../../types/CommentPortfolioType';

/* 포트폴리오 댓글 등록 */
export const createComment = async (
  inputData: CommentPortfolio.CreateInput
): Promise<CommentPortfolio.Id> => {
  try {
    const createColumn = `
    user_id,
    portfolio_id,
    comment_content
    `;

    const createValues = Object.values(inputData);

    const SQL = `
    INSERT INTO
    portfolio_comment (${createColumn}) 
    VALUES (?, ?, ?)
    `;

    const [createdInfo, _] = await db.execute(SQL, createValues);

    const createdCommentId: CommentPortfolio.Id = (createdInfo as { insertId: number }).insertId;

    return createdCommentId;
  } catch (error) {
    console.log(error);
    throw error;
  }
};

/* 포트폴리오 댓글 수정 */
export const updateComment = async (
  user_id: number,
  comment_id: number,
  inputData: CommentPortfolio.UpdateInput
): Promise<number> => {
  try {
    const updateColums = Object.entries(inputData)
      .filter(([_, value]) => value !== undefined)
      .map(([key, _]) => `${key} = ?`)
      .join(', ');

    const updateValues = Object.values(inputData).filter((value) => value !== undefined);

    const SQL = `
    UPDATE portfolio_comment
    SET ${updateColums}
    WHERE user_id = ? AND comment_id = ?
    `;

    const [result, _] = await db.execute(SQL, [...updateValues, user_id, comment_id]);

    const isAffected = (result as { affectedRows: number }).affectedRows === 1 ? true : false;

    const isMatched = Number((result as { info: string }).info.split(' ')[2]) === 1 ? true : false;

    const isChanged = Number((result as { info: string }).info.split(' ')[5]) === 1 ? true : false;

    if (!isAffected && !isMatched && !isChanged)
      AppErrors.handleForbidden('본인만 수정 가능 합니다.');

    return comment_id;
  } catch (error) {
    console.log(error);
    throw error;
  }
};

/* 포트폴리오 댓글 삭제 */
export const deleteCommentById = async (user_id: number, comment_id: number): Promise<boolean> => {
  try {
    const SQL = `
    DELETE FROM portfolio_comment
    WHERE user_id = ? AND comment_id = ?
    `;

    const [result, _] = await db.execute(SQL, [user_id, comment_id]);

    const isAffected = (result as { affectedRows: number }).affectedRows === 1 ? true : false;

    if (!isAffected) AppErrors.handleForbidden('본인만 삭제 가능 합니다.');

    return true;
  } catch (error) {
    console.log(error);
    throw error;
  }
};

/* 댓글 수정, 삭제 시 포트폴리오 유효성 검사 */
export const isPortfolioValid = async (comment_id: number): Promise<void> => {
  try {
    const SQL = `
    SELECT *
    FROM portfolio_comment
    JOIN portfolio ON portfolio.portfolio_id = portfolio_comment.portfolio_id
    WHERE comment_id = ?
    `;

    const [comment]: any = await db.query(SQL, [comment_id]);

    const isProjectValid = comment[0].portfolio_id;

    if (!isProjectValid) AppErrors.handleNotFound('이미 삭제된 포트폴리오 입니다.');
  } catch (error) {
    console.log(error);
    throw error;
  }
};

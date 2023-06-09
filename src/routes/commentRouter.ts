import { Router } from 'express';
import AuthenticateHandler from '../middlewares/authHandler';
import * as commentValidator from '../middlewares/validationHandler/commentValidator';
import * as commentProjectController from '../controllers/commentProjectController';
import * as commentPortfolioController from '../controllers/commentPortfolioController';

const commentRouter = Router();

/* 모집 글 댓글 등록 */
commentRouter.post(
  '/project',
  AuthenticateHandler,
  commentValidator.addProjectCommentValidateHandler,
  commentProjectController.addCommentHandler
);

/* 포트폴리오 댓글 등록 */
commentRouter.post(
  '/portfolio',
  AuthenticateHandler,
  commentValidator.addPortfolioCommentValidateHandler,
  commentPortfolioController.addCommentHandler
);

/* 모집 글 댓글 수정 */
commentRouter.put(
  '/project/:comment_id',
  AuthenticateHandler,
  commentValidator.editCommentValidateHandler,
  commentProjectController.editCommentHandler
);

/* 포트폴리오 댓글 수정 */
commentRouter.put(
  '/portfolio/:comment_id',
  AuthenticateHandler,
  commentValidator.editCommentValidateHandler,
  commentPortfolioController.editCommentHandler
);

/* 모집 글 댓글 삭제 */
commentRouter.delete(
  '/project/:comment_id',
  AuthenticateHandler,
  commentValidator.removeCommentValidateHandler,
  commentProjectController.removeCommentHandler
);

/* 포트폴리오 댓글 삭제 */
commentRouter.delete(
  '/portfolio/:comment_id',
  AuthenticateHandler,
  commentValidator.removeCommentValidateHandler,
  commentPortfolioController.removeCommentHandler
);

/* 마이페이지 모집 글 작성 댓글 목록 조회 */
commentRouter.get(
  '/project/user',
  AuthenticateHandler,
  commentValidator.getMyCommentsByIdValidateHandler,
  commentProjectController.getMyCommentsByIdHandler
);

/* 마이페이지 포트폴리오 작성 댓글 목록 조회 */
commentRouter.get(
  '/portfolio/user',
  AuthenticateHandler,
  commentValidator.getMyCommentsByIdValidateHandler,
  commentPortfolioController.getMyCommentsByIdHandler
);

export default commentRouter;

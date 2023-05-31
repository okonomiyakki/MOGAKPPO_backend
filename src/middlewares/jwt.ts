import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/errorHandler';
import { PayloadInfo } from '../database/types/UserType';
import { AuthRequest } from '../database/types/RequestType';
import jwt, { JsonWebTokenError } from 'jsonwebtoken';
import env from '../config/envconfig';

const AuthenticateHandler = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const authorization = req.cookies.Authorization;

    const accessToken = authorization && authorization.split(' ')[1]; // 유저 엑세스 토큰

    if (!accessToken || accessToken === undefined)
      throw new AppError(401, 'AccessToken을 제시해 주세요.');

    const accessTokenSecret = env.ACCESS_TOKEN_SECRET || 'MOGAKPPO_ACCESS_TOKEN_SECRET';

    const decodedAccessToken = jwt.verify(accessToken, accessTokenSecret) as PayloadInfo;

    req.user = decodedAccessToken;

    /* 엑세스 토큰 유효 시 통과 */
    next();
  } catch (accessTokenError: any) {
    // 엑세스 토큰 만료
    if (accessTokenError.name === 'TokenExpiredError') {
      const refreshToken = req.cookies.RefreshToken; // 유저 리프레시 토큰

      if (!refreshToken || refreshToken === undefined)
        throw new AppError(401, 'RefreshToken을 제시해 주세요.');

      try {
        const accessTokenSecret = env.ACCESS_TOKEN_SECRET || 'MOGAKPPO_ACCESS_TOKEN_SECRET';

        const refreshTokenSecret = env.REFRESH_TOKEN_SECRET || 'MOGAKPPO_REFRESH_TOKEN_SECRET';

        const decodedRefreshToken = jwt.verify(refreshToken, refreshTokenSecret) as PayloadInfo;

        const accessToken = jwt.sign({ user_id: decodedRefreshToken.user_id }, accessTokenSecret, {
          expiresIn: env.ACCESS_TOKEN_EXPIRES_IN,
        });

        res.setHeader('Authorization', `Bearer ${accessToken}`);

        /* 엑세스 토큰 재발급 후 통과 */
        next();
      } catch (RefreshTokenError: any) {
        // 리프레시 토큰 만료
        if (RefreshTokenError.name === 'TokenExpiredError') {
          res.clearCookie('refreshToken');
          next(new AppError(401, 'RefreshToken이 만료되었습니다. 다시 로그인해 주세요.'));
        }
        // 리프레시 토큰 유효성 문제
        else if (RefreshTokenError.name === 'JsonWebTokenError') {
          console.log(RefreshTokenError);
          next(new AppError(401, 'RefreshToken이 유효하지 않습니다. 토큰을 확인해 주세요.'));
        }
        // 리프레시 토큰 없는 경우
        else if (RefreshTokenError instanceof AppError) {
          if (RefreshTokenError.statusCode === 401) console.log(RefreshTokenError);
          next(RefreshTokenError);
        }
        // 서버 에러
        else {
          console.log(accessTokenError);
          next(new AppError(500, '[ 접근 불가 ] 사용자 인증 실패'));
        }
      }
    }
    // 엑세스 토큰 유효성 문제
    else if (accessTokenError.name === 'JsonWebTokenError') {
      console.log(accessTokenError);
      next(new AppError(401, 'AccessToken이 유효하지 않습니다. 토큰을 확인해 주세요.'));
    }
    // 엑세스 토큰 없는 경우
    else if (accessTokenError instanceof AppError) {
      if (accessTokenError.statusCode === 401) console.log(accessTokenError);
      next(accessTokenError);
    }
    // 서버 에러
    else {
      console.log(accessTokenError);
      next(new AppError(500, '[ 접근 불가 ] 사용자 인증 실패'));
    }
  }
};

export default AuthenticateHandler;

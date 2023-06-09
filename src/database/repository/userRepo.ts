import db from '../../config/dbconfig';
import * as AppErrors from '../../middlewares/errorHandler';
import * as User from '../../types/UserType';

/* 회원 가입 */
export const createUser = async (inputData: User.SignUpUserInput): Promise<User.Id> => {
  try {
    const createColums = `
    user_email,
    user_name,
    user_password
    `;

    const createValues = Object.values(inputData);

    const SQL = `
    INSERT INTO
    user (${createColums}) 
    VALUES (?, ?, ?)
    `;

    const [createdInfo, _] = await db.execute(SQL, createValues);

    const createdUserId: User.Id = (createdInfo as { insertId: number }).insertId;

    return createdUserId;
  } catch (error) {
    console.log(error);
    throw error;
  }
};

/* 카카오 회원 가입 */
export const createUserByKakao = async (inputData: User.KakaoLogInInput): Promise<User.Id> => {
  try {
    const createColums = `
    user_email,
    user_name
    `;

    const createValues = Object.values(inputData);

    const SQL = `
    INSERT INTO
    user (${createColums}) 
    VALUES (?, ?)
    `;

    const [createdInfo, _] = await db.execute(SQL, createValues);

    const createdUserId: User.Id = (createdInfo as { insertId: number }).insertId;

    return createdUserId;
  } catch (error) {
    console.log(error);
    throw error;
  }
};

/*  카카오 회원 존재 여부 검사 */
export const isUserEmailValid = async (user_email: string): Promise<any> => {
  try {
    const selectColumns = `
    user_id,
    user_name
    `;

    const SQL = `
    SELECT ${selectColumns}
    FROM user
    WHERE user_email = ?
    `;

    const [user]: any = await db.query(SQL, [user_email]);

    if (!user[0]) return null; // 같은 이메일 없을때
    else return user[0]; // 같은 이메일 있을때
  } catch (error) {
    console.log(error);
    throw error;
  }
};

/* 카카오 회원 기존 계정 통합하기 */
export const updateUserNameByKakao = async (
  user_id: number,
  user_name: string
): Promise<number> => {
  try {
    const updateColums = `
    user_name = ?
    `;

    const SQL = `
    UPDATE user
    SET ${updateColums}
    WHERE user_id = ?
    `;

    await db.execute(SQL, [user_name, user_id]);

    return user_id;
  } catch (error) {
    console.log(error);
    throw error;
  }
};

/*  회원 존재 여부 검사 */
export const isUserValid = async (user_id: number): Promise<any> => {
  try {
    const SQL = `
    SELECT *
    FROM user
    WHERE user_id = ?
    `;

    const [user]: any = await db.query(SQL, [user_id]);

    const isUserIdValid = user[0].user_id;

    return user[0];
  } catch (error) {
    console.log(error);
    throw AppErrors.handleNotFound('존재하지 않는 회원입니다.');
  }
};

/* 회원 payload, 기본 필드 조회  */
export const findUserPayloadByEmail = async (user_email: string): Promise<User.InfoWithPayload> => {
  try {
    const selectColumns = `
    user_id, 
    user_email,
    user_name, 
    user_img,
    user_career_goal,
    user_stacks,
    user_introduction,
    user_password
    `;

    const SQL = `
    SELECT ${selectColumns}
    FROM user
    WHERE user_email = ?
    `;

    const [user]: any = await db.query(SQL, [user_email]);

    const userInfoWithPayload = user[0].user_id;

    return user[0];
  } catch (error) {
    console.log(error);
    throw AppErrors.handleNotFound('존재하지 않는 회원입니다. 회원 가입 후 이용해 주세요.');
  }
};

/* 회원 비밀번호 수정 */
export const updateUserPassWord = async (
  user_id: number,
  user_new_password: string
): Promise<number> => {
  try {
    const updateColums = `
    user_password = ?
    `;

    const SQL = `
    UPDATE user
    SET ${updateColums}
    WHERE user_id = ?
    `;

    const [result, _] = await db.execute(SQL, [user_new_password, user_id]);

    const isAffected = (result as { affectedRows: number }).affectedRows === 1 ? true : false;

    const isMatched = Number((result as { info: string }).info.split(' ')[2]) === 1 ? true : false;

    const isChanged = Number((result as { info: string }).info.split(' ')[5]) === 1 ? true : false;

    if (!isAffected && !isMatched && !isChanged)
      throw AppErrors.handleForbidden('본인만 수정 가능 합니다.');

    return user_id;
  } catch (error) {
    console.log(error);
    throw error;
  }
};

/* 회원 상세 정보 수정 */
export const updateUserInfo = async (
  user_id: number,
  inputData: User.UpdatUserInput
): Promise<number> => {
  try {
    const updateColums = Object.entries(inputData)
      .map(([key, _]) => `${key} = ?`)
      .join(', ');

    const updateValues = Object.values(inputData);

    const SQL = `
    UPDATE user
    SET ${updateColums}
    WHERE user_id = ?
    `;

    const [result, _] = await db.execute(SQL, [...updateValues, user_id]);

    const isAffected = (result as { affectedRows: number }).affectedRows === 1 ? true : false;

    const isMatched = Number((result as { info: string }).info.split(' ')[2]) === 1 ? true : false;

    const isChanged = Number((result as { info: string }).info.split(' ')[5]) === 1 ? true : false;

    if (!isAffected && !isMatched && !isChanged)
      throw AppErrors.handleForbidden('본인만 수정 가능 합니다.');

    return user_id;
  } catch (error) {
    console.log(error);
    throw error;
  }
};

/* 회원 탈퇴 */
export const deleteUserById = async (user_id: number): Promise<boolean> => {
  try {
    const SQL = `
    DELETE FROM user
    WHERE user_id = ?
    `;

    const [result, _] = await db.execute(SQL, [user_id]);

    const isAffected = (result as { affectedRows: number }).affectedRows === 1 ? true : false;

    if (!isAffected) throw AppErrors.handleForbidden('본인만 삭제 가능 합니다.');

    return true;
  } catch (error) {
    console.log(error);
    throw error;
  }
};

/* 회원 마이페이지 상세 정보 조회  */
export const findUserInfoById = async (user_id: number): Promise<any> => {
  try {
    const selectColumns = `
    user_id,
    user_name,
    user_career_goal,
    user_stacks,
    user_introduction,
    user_img
    `;

    const SQL = `
    SELECT ${selectColumns}
    FROM user
    WHERE user_id = ?
    `;

    const [user]: any = await db.query(SQL, [user_id]);

    const userInfo = user[0].user_id;

    return user[0];
  } catch (error) {
    console.log(error);
    throw AppErrors.handleNotFound('존재하지 않는 회원입니다.');
  }
};

/* 회원 기술스택 조회  */
export const findBestStacks = async (): Promise<any> => {
  try {
    const selectColumns = `
    JSON_ARRAYAGG(
      JSON_EXTRACT(mogakppo_db.user.user_stacks, '$.stackList')
    ) AS stackLists
    `;

    const SQL = `
    SELECT ${selectColumns}
    FROM user
    `;

    const [user]: any = await db.query(SQL);

    const userStackList = user[0];

    return userStackList;
  } catch (error) {
    console.log(error);
    throw error;
  }
};

/* 키워드 별 회원 검색  */
export const findMembersBykeyword = async (user_keyword: string): Promise<any> => {
  try {
    const selectColumns = `
    user_id,
    user_email,
    user_name,
    user_career_goal,
    user.user_img
    `;

    const SQL = `
    SELECT ${selectColumns}
    FROM user
    WHERE user.user_name LIKE CONCAT('%', ?, '%')
    OR user.user_email LIKE CONCAT('%', ?, '%')
    GROUP BY user.user_id
    `;

    const [members]: any = await db.query(SQL, [user_keyword, user_keyword]);

    return members;
  } catch (error) {
    console.log(error);
    throw error;
  }
};

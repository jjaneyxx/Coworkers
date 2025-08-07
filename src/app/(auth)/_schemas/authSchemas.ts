import { z } from 'zod/v4';
import { validateEmail, validatePassword } from '@/utils/inputValidation';

export const authSchema = z
  .object({
    email: z
      .string()
      .min(1, '이메일을 입력해주세요.') // 빈값 에러
      // 빈 문자열이면 검증을 통과시키고 (true)
      // 빈 문자열이 아니면 유효성 검사 함수를 실행
      .refine((val) => val.length === 0 || validateEmail(val), {
        message: '올바른 이메일 형식이 아닙니다.',
      }),
    userName: z
      .string()
      .min(1, '닉네임을 입력해주세요.')
      .max(10, '닉네임은 10자 이하로 입력해주세요.'), // 닉네임 길이 제한
    password: z
      .string()
      .min(1, '비밀번호를 입력해주세요.')
      .refine((val) => val.length === 0 || validatePassword(val), {
        message:
          '비밀번호는 영문, 숫자, 특수문자를 포함한 8자 이상이어야 합니다.',
      }),
    passwordConfirm: z.string(),
  })
  .check((ctx) => {
    // 비밀번호와 비밀번호 확인이 일치하지 않으면 에러
    if (ctx.value.password !== ctx.value.passwordConfirm) {
      ctx.issues.push({
        code: 'custom', // 에러 코드
        message: '비밀번호가 일치하지 않습니다.', // 에러 메시지
        input: ctx, // 검증 중인 데이터 객체
      });
    }
  });

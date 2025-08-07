'use client';

import InputWithLabel from '@/components/auth/InputWithLabel';
import Button from '@/components/common/Button';
import {
  validateEmail,
  validateName,
  validatePassword,
  validatePasswordConfirm,
} from '@/utils/inputValidation';
import { useMemo, useState } from 'react';
import { toast } from 'react-toastify';
import Cookies from 'js-cookie';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import { signUp } from '@/lib/apis/auth';
import { InputType } from '@/components/auth/type';

// schema
const inputEmptySchema = z.object({
  email: z.string().nonempty({ message: '이메일은 필수 입력입니다.' }),
  password: z.string().nonempty({ message: '비밀번호는 필수 입력입니다.' }),
  userName: z.string().nonempty({ message: '이름은 필수 입력입니다.' }),
  passwordConfirm: z
    .string()
    .nonempty({ message: '비밀번호 확인은 필수 입력입니다.' }),
});

const inputValidSchema = z
  .object({
    email: z.string().refine(validateEmail, {
      message: '올바른 이메일 형식이 아닙니다.',
    }),
    password: z.string().refine(validatePassword, {
      message:
        '비밀번호는 영문, 숫자, 특수문자를 포함한 8자 이상이어야 합니다.',
    }),
    userName: z.string().refine(validateName, {
      message: '이름은 10자 이하로 입력해주세요.',
    }),
    passwordConfirm: z.string(), // 기본 정의
  })

  // 외부 유효성 검사 함수를 직접 호출해서 사용
  // ctx : Zod 내부 컨텍스트
  .superRefine(({ password, passwordConfirm }, ctx) => {
    const isMatch = validatePasswordConfirm({ password, passwordConfirm });

    if (!isMatch) {
      ctx.addIssue({
        path: ['passwordConfirm'],
        code: z.ZodIssueCode.custom, // 반드시 enum 값이어야 함
        message: '비밀번호가 일치하지 않습니다.',
      });
    }
  });

export default function SignupForm() {
  const [formValues, setFormValues] = useState<{
    email: string;
    password: string;
    userName: string;
    passwordConfirm: string;
  }>({
    email: '',
    password: '',
    userName: '',
    passwordConfirm: '',
  });

  const [formErrors, setFormErrors] = useState<{
    email: string[] | undefined;
    password: string[] | undefined;
    userName: string[] | undefined;
    passwordConfirm: string[] | undefined;
  }>({
    email: [],
    password: [],
    userName: [],
    passwordConfirm: [],
  });

  const router = useRouter();

  const isFormValid = useMemo(() => {
    return (
      formValues.email !== '' &&
      formValues.password !== '' &&
      formValues.userName !== '' &&
      formValues.passwordConfirm !== '' &&
      (formErrors.email?.length ?? 0) === 0 &&
      (formErrors.password?.length ?? 0) === 0 &&
      (formErrors.userName?.length ?? 0) === 0 &&
      (formErrors.passwordConfirm?.length ?? 0) === 0
    );
  }, [formValues, formErrors]);

  const handleInputBlur =
    (key: InputType) => (e: React.ChangeEvent<HTMLInputElement>) => {
      const newFormValues = { ...formValues, [key]: e.target.value };
      setFormValues(newFormValues);

      const result = inputEmptySchema.safeParse(newFormValues);

      if (!result.success) {
        const fieldErrors = result.error.flatten().fieldErrors;

        setFormErrors((prev) => ({
          ...prev,
          [key]: fieldErrors[key],
        }));
      } else {
        setFormErrors((prev) => ({
          ...prev,
          [key]: '',
        }));
      }
    };

  const handleInputChange =
    (key: InputType) => (e: React.ChangeEvent<HTMLInputElement>) => {
      const newFormValues = { ...formValues, [key]: e.target.value };
      const result = inputValidSchema.safeParse(newFormValues);

      if (!result.success) {
        const fieldErrors = result.error.flatten().fieldErrors;

        setFormErrors((prev) => ({
          ...prev,
          [key]: fieldErrors[key],
        }));
      } else {
        setFormErrors((prev) => ({
          ...prev,
          [key]: '',
        }));
      }
      setFormValues(newFormValues);
    };

  const handleFormSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!isFormValid) return;
    try {
      const data = await signUp({
        body: {
          email: formValues.email,
          password: formValues.password,
          nickname: formValues.userName,
          passwordConfirmation: formValues.passwordConfirm,
        },
      });

      if (!data) return;
      console.log(data);

      // 회원가입 성공
      const { accessToken, refreshToken, user } = data;

      Cookies.set('accessToken', accessToken, {
        path: '/',
        secure: true,
        sameSite: 'Strict',
      });

      Cookies.set('refreshToken', refreshToken, {
        path: '/',
        secure: true,
        sameSite: 'Strict',
      });

      Cookies.set('userId', user.id.toString(), {
        path: '/',
        secure: true,
        sameSite: 'Strict',
      });

      toast.success('회원가입 되었습니다.');
      router.push('/no-team');
    } catch (error) {
      if (error instanceof Error) {
        const errorMessage = error.message;

        // 회원가입 실패
        if (errorMessage.includes('이메일')) {
          setFormErrors((prev) => ({
            ...prev,
            email: [errorMessage], // 이미 사용중인 이메일입니다.
          }));
          return;
        } else if (errorMessage.includes('닉네임')) {
          setFormErrors((prev) => ({
            ...prev,
            userName: [errorMessage], // 이미 사용중인 닉네임입니다.
          }));
          return;
        }

        console.error(error);
        toast.error(
          <>
            문제가 발생했습니다. 잠시 후 다시 시도해주세요.
            <br />({errorMessage})
          </>
        );
      }
    }
  };

  return (
    <form onSubmit={handleFormSubmit}>
      <h1 className="text-4xl-medium mb-10 text-center">회원가입</h1>

      <div className="mb-10 flex flex-col gap-6">
        <InputWithLabel
          inputType="userName"
          errorMessage={formErrors.userName}
          onInputBlur={handleInputBlur}
          onInputChange={handleInputChange}
        />
        <InputWithLabel
          inputType="email"
          errorMessage={formErrors.email}
          onInputBlur={handleInputBlur}
          onInputChange={handleInputChange}
        />
        <InputWithLabel
          inputType="password"
          errorMessage={formErrors.password}
          onInputBlur={handleInputBlur}
          onInputChange={handleInputChange}
        />
        <InputWithLabel
          inputType="passwordConfirm"
          errorMessage={formErrors.passwordConfirm}
          onInputBlur={handleInputBlur}
          onInputChange={handleInputChange}
        />
      </div>

      <div className="mb-20 flex gap-3">
        <Button
          size="lg"
          variant="primary"
          styleType="filled"
          radius="sm"
          className="basis-1/3"
          onClick={() => {
            router.back();
          }}
          disabled={false}
        >
          취소
        </Button>

        <Button
          size="lg"
          variant="primary"
          styleType="filled"
          radius="sm"
          className="basis-2/3"
          disabled={!isFormValid}
        >
          회원가입
        </Button>
      </div>
    </form>
  );
}

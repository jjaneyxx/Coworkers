'use client';

import InputWithLabel from '@/components/auth/InputWithLabel';
import Button from '@/components/common/Button';
import { signIn } from '@/lib/apis/auth';
import { getUserGroups } from '@/lib/apis/user';
import { useMemo, useState } from 'react';
import { toast } from 'react-toastify';
import Cookies from 'js-cookie';
import { useRouter } from 'next/navigation';
import { ROUTES } from '@/constants/routes';
import { InputType } from '@/components/auth/type';
import OpenPasswordResetModal from '@/app/(auth)/login/_components/LoginForm/OpenPasswordResetModal';
import { authSchema } from '@/app/(auth)/_schemas/authSchemas';

export default function LoginForm() {
  const [formValues, setFormValues] = useState<{
    email: string;
    password: string;
  }>({
    email: '',
    password: '',
  });

  const [formErrors, setFormErrors] = useState<{
    email: string[] | undefined;
    password: string[] | undefined;
  }>({
    email: [],
    password: [],
  });

  const router = useRouter();

  const isFormValid = useMemo(() => {
    return (
      formValues.email !== '' &&
      formValues.password !== '' &&
      (formErrors.email?.length ?? 0) === 0 &&
      (formErrors.password?.length ?? 0) === 0
    );
  }, [formValues, formErrors]);

  const handleInputChange =
    (key: InputType) => (e: React.ChangeEvent<HTMLInputElement>) => {
      const newFormValues = { ...formValues, [key]: e.target.value };
      const result = authSchema.safeParse(newFormValues);

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
      const data = await signIn({
        body: {
          email: formValues.email,
          password: formValues.password,
        },
      });

      if (!data) return;

      // 로그인 성공
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
        secure: true, // HTTPS 쿠키 전송
        sameSite: 'Strict', // 사용자가 직접 사이트를 방문한 경우 쿠키 포함
      });

      toast.success('로그인 되었습니다.');
      const userGroupsData = await getUserGroups({});
      const firstGroupId = userGroupsData?.[0]?.id;

      if (firstGroupId) {
        router.push(ROUTES.TEAM(firstGroupId));
      } else {
        router.push(ROUTES.TEAM_NO);
      }
    } catch (error) {
      if (error instanceof Error) {
        const errorMessage = error.message;

        // 로그인 실패
        if (errorMessage.includes('이메일')) {
          setFormErrors((prev) => ({
            ...prev,
            email: [errorMessage], // 존재하지 않는 이메일입니다.
          }));
        } else if (errorMessage.includes('비밀번호')) {
          setFormErrors((prev) => ({
            ...prev,
            password: [errorMessage], // 비밀번호가 일치하지 않습니다.
          }));
        }
      }
    }
  };

  return (
    <form onSubmit={handleFormSubmit}>
      <h1 className="text-4xl-medium tablet:mb-20 mb-10 text-center">로그인</h1>

      <div className="flex flex-col gap-6">
        <InputWithLabel
          inputType="email"
          errorMessage={formErrors.email}
          onInputChange={handleInputChange}
        />
        <InputWithLabel
          inputType="password"
          errorMessage={formErrors.password}
          onInputChange={handleInputChange}
        />
      </div>

      <OpenPasswordResetModal />

      <Button
        size="lg"
        variant="primary"
        styleType="filled"
        radius="sm"
        className="w-full"
        disabled={!isFormValid}
      >
        로그인
      </Button>
    </form>
  );
}

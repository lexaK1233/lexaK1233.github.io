import { Form, Link, redirect, useActionData, useNavigation } from "react-router";
import { Button } from "../components/ui/button/button";
import { Input } from "../components/ui/input/input";
import { Label } from "../components/ui/label/label";
import { Card } from "../components/ui/card/card";
import { Alert } from "../components/ui/alert/alert";
import { AlertCircle, Home } from "lucide-react";
import type { Route } from "./+types/register";
import styles from "./register.module.css";

export async function loader({ request }: Route.LoaderArgs) {
  const { getOptionalUser } = await import("../lib/auth.server");
  const user = await getOptionalUser(request);
  if (user) {
    return redirect("/");
  }
  return null;
}

export async function action({ request }: Route.ActionArgs) {
  const { db } = await import("../lib/db.server");
  const { createUserSession, hashPassword } = await import("../lib/auth.server");

  const formData = await request.formData();
  const email = formData.get("email")?.toString();
  const password = formData.get("password")?.toString();
  const confirmPassword = formData.get("confirmPassword")?.toString();
  const name = formData.get("name")?.toString();
  const apartment = formData.get("apartment")?.toString();

  if (!email || !password || !confirmPassword || !name || !apartment) {
    return { error: "Пожалуйста, заполните все поля" };
  }

  if (password !== confirmPassword) {
    return { error: "Пароли не совпадают" };
  }

  if (password.length < 6) {
    return { error: "Пароль должен содержать минимум 6 символов" };
  }

  const existingUser = await db.getUserByEmail(email);
  if (existingUser) {
    return { error: "Пользователь с таким email уже существует" };
  }

  const hashedPassword = await hashPassword(password);
  const user = await db.createUser({
    email,
    password: hashedPassword,
    name,
    apartment,
    role: "resident",
  });

  return createUserSession(user.id, "/");
}

export default function Register() {
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";

  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <Link to="/" className={styles.homeLink}>
          <Home size={20} />
          На главную
        </Link>

        <Card className={styles.card}>
          <div className={styles.header}>
            <h1>Регистрация</h1>
            <p>Создайте аккаунт для подачи заявок</p>
          </div>

          <Form method="post" className={styles.form}>
            {actionData?.error && (
              <Alert variant="destructive">
                <AlertCircle size={16} />
                <span>{actionData.error}</span>
              </Alert>
            )}

            <div className={styles.field}>
              <Label htmlFor="name">Полное имя</Label>
              <Input id="name" name="name" type="text" required placeholder="Иван Иванов" />
            </div>

            <div className={styles.field}>
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" required placeholder="your@email.com" />
            </div>

            <div className={styles.field}>
              <Label htmlFor="apartment">Номер квартиры</Label>
              <Input id="apartment" name="apartment" type="text" required placeholder="42" />
            </div>

            <div className={styles.field}>
              <Label htmlFor="password">Пароль</Label>
              <Input
                id="password"
                name="password"
                type="password"
                required
                placeholder="Минимум 6 символов"
                minLength={6}
              />
            </div>

            <div className={styles.field}>
              <Label htmlFor="confirmPassword">Подтвердите пароль</Label>
              <Input id="confirmPassword" name="confirmPassword" type="password" required placeholder="••••••••" />
            </div>

            <Button type="submit" disabled={isSubmitting} className={styles.submitButton}>
              {isSubmitting ? "Регистрация..." : "Зарегистрироваться"}
            </Button>
          </Form>

          <div className={styles.footer}>
            <p>
              Уже есть аккаунт? <Link to="/login">Войти</Link>
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}

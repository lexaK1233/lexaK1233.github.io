import { Form, Link, redirect, useActionData, useNavigation } from "react-router";
import { Button } from "../components/ui/button/button";
import { Input } from "../components/ui/input/input";
import { Label } from "../components/ui/label/label";
import { Card } from "../components/ui/card/card";
import { Alert } from "../components/ui/alert/alert";
import { AlertCircle, Home } from "lucide-react";
import type { Route } from "./+types/login";
import styles from "./login.module.css";

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
  const { createUserSession, verifyPassword } = await import("../lib/auth.server");

  const formData = await request.formData();
  const email = formData.get("email")?.toString();
  const password = formData.get("password")?.toString();

  if (!email || !password) {
    return { error: "Пожалуйста, заполните все поля" };
  }

  const user = await db.getUserByEmail(email);
  if (!user) {
    return { error: "Неверный email или пароль" };
  }

  const isValid = await verifyPassword(password, user.password);
  if (!isValid) {
    return { error: "Неверный email или пароль" };
  }

  return createUserSession(user.id, user.role === "staff" ? "/staff" : "/");
}

export default function Login() {
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
            <h1>Вход в систему</h1>
            <p>Введите свои учетные данные для входа</p>
          </div>

          <Form method="post" className={styles.form}>
            {actionData?.error && (
              <Alert variant="destructive">
                <AlertCircle size={16} />
                <span>{actionData.error}</span>
              </Alert>
            )}

            <div className={styles.field}>
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" required placeholder="your@email.com" />
            </div>

            <div className={styles.field}>
              <Label htmlFor="password">Пароль</Label>
              <Input id="password" name="password" type="password" required placeholder="••••••••" />
            </div>

            <Button type="submit" disabled={isSubmitting} className={styles.submitButton}>
              {isSubmitting ? "Вход..." : "Войти"}
            </Button>
          </Form>

          <div className={styles.footer}>
            <p>
              Нет аккаунта? <Link to="/register">Зарегистрироваться</Link>
            </p>
          </div>

          <div className={styles.demoCredentials}>
            <h4>Демо-доступ:</h4>
            <div className={styles.demoGrid}>
              <div>
                <strong>Жилец:</strong>
                <div>Email: resident@demo.com</div>
                <div>Пароль: password123</div>
              </div>
              <div>
                <strong>Персонал:</strong>
                <div>Email: staff@demo.com</div>
                <div>Пароль: password123</div>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

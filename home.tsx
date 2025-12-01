import { Link } from "react-router";
import type { Route } from "./+types/home";
import styles from "./home.module.css";
import { Button } from "~/components/ui/button/button";
import { Badge } from "~/components/ui/badge/badge";
import { Bot, Plus, FileText, Clock, AlertCircle, LogOut } from "lucide-react";

export async function loader({ request }: Route.LoaderArgs) {
  const { getOptionalUser } = await import("~/lib/auth.server");
  const { db } = await import("~/lib/db.server");
  const user = await getOptionalUser(request);
  const requests = user ? await db.getRequestsByUserId(user.id) : [];
  return { user, requests: requests.slice(0, 3) };
}

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Домовой - Умная система приема заявок" },
    {
      name: "description",
      content: "AI-powered система для управления заявками жильцов",
    },
  ];
}

const getPriorityVariant = (priority: string) => {
  switch (priority) {
    case "urgent":
    case "high":
      return "destructive";
    case "medium":
      return "default";
    case "low":
      return "secondary";
    default:
      return "default";
  }
};

const getStatusVariant = (status: string) => {
  switch (status) {
    case "resolved":
    case "closed":
      return "default";
    case "in_progress":
      return "secondary";
    case "new":
      return "outline";
    default:
      return "outline";
  }
};

const getPriorityLabel = (priority: string) => {
  const labels: Record<string, string> = {
    urgent: "Срочно",
    high: "Высокий",
    medium: "Средний",
    low: "Низкий",
  };
  return labels[priority] || priority;
};

const getStatusLabel = (status: string) => {
  const labels: Record<string, string> = {
    new: "Новая",
    in_progress: "В работе",
    resolved: "Решена",
    closed: "Закрыта",
  };
  return labels[status] || status;
};

const getCategoryLabel = (category: string) => {
  const labels: Record<string, string> = {
    leak: "Протечка",
    elevator: "Лифт",
    heating: "Отопление",
    electrical: "Электрика",
    plumbing: "Сантехника",
    other: "Другое",
  };
  return labels[category] || category;
};

export default function Home({ loaderData }: Route.ComponentProps) {
  const { user, requests: recentRequests } = loaderData;

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.headerContent}>
          <Link to="/" className={styles.logo}>
            <Bot className={styles.logoIcon} />
            <span>Домовой</span>
          </Link>
          <nav className={styles.nav}>
            {user ? (
              <>
                <span className={styles.userName}>{user.name}</span>
                <Button asChild variant="outline">
                  <Link to="/my-requests">Мои заявки</Link>
                </Button>
                {user.role === "staff" && (
                  <Button asChild variant="outline">
                    <Link to="/staff">Панель персонала</Link>
                  </Button>
                )}
                <Button asChild variant="outline">
                  <Link to="/logout">
                    <LogOut style={{ width: "16px", height: "16px" }} />
                  </Link>
                </Button>
              </>
            ) : (
              <>
                <Button asChild variant="outline">
                  <Link to="/login">Войти</Link>
                </Button>
                <Button asChild>
                  <Link to="/register">Регистрация</Link>
                </Button>
              </>
            )}
          </nav>
        </div>
      </header>

      <main className={styles.content}>
        <section className={styles.hero}>
          <h1 className={styles.heroTitle}>Добро пожаловать в Домовой</h1>
          <p className={styles.heroSubtitle}>
            Умная система приема заявок с искусственным интеллектом. Опишите проблему, и наш AI-помощник поможет создать
            заявку с правильным приоритетом.
          </p>
          <div className={styles.heroActions}>
            <Button asChild size="lg">
              <Link to="/submit">
                <Plus style={{ width: "20px", height: "20px", marginRight: "8px" }} />
                Создать заявку
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link to="/my-requests">
                <FileText style={{ width: "20px", height: "20px", marginRight: "8px" }} />
                Мои заявки
              </Link>
            </Button>
          </div>
        </section>

        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Последние заявки</h2>
            <Button asChild variant="link">
              <Link to="/my-requests">Смотреть все</Link>
            </Button>
          </div>

          {recentRequests.length > 0 ? (
            <div className={styles.requestsGrid}>
              {recentRequests.map((request) => (
                <Link key={request.id} to={`/request/${request.id}`} className={styles.requestCard}>
                  <div className={styles.requestHeader}>
                    <span className={styles.requestId}>#{request.id.slice(4, 12)}</span>
                    <Badge variant={getPriorityVariant(request.priority)}>{getPriorityLabel(request.priority)}</Badge>
                  </div>
                  <div className={styles.requestType}>{getCategoryLabel(request.category)}</div>
                  <p className={styles.requestDescription}>{request.description}</p>
                  <div className={styles.requestFooter}>
                    <div className={styles.requestMeta}>
                      <Clock className={styles.metaIcon} />
                      <span>{new Date(request.createdAt).toLocaleDateString("ru-RU")}</span>
                    </div>
                    <Badge variant={getStatusVariant(request.status)}>{getStatusLabel(request.status)}</Badge>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className={styles.emptyState}>
              <AlertCircle className={styles.emptyIcon} />
              <h3 className={styles.emptyTitle}>Заявок пока нет</h3>
              <p className={styles.emptyText}>Создайте свою первую заявку, и она появится здесь</p>
              <Button asChild>
                <Link to="/submit">Создать заявку</Link>
              </Button>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

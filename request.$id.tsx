import { useState } from "react";
import { Form, Link, redirect, useActionData, useLoaderData } from "react-router";
import type { Route } from "./+types/request.$id";
import styles from "./request.$id.module.css";
import { Button } from "~/components/ui/button/button";
import { Badge } from "~/components/ui/badge/badge";
import { Textarea } from "~/components/ui/textarea/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "~/components/ui/select/select";
import { ArrowLeft, Bot, User } from "lucide-react";

export async function loader({ request, params }: Route.LoaderArgs) {
  const { requireUser } = await import("~/lib/auth.server");
  const { db } = await import("~/lib/db.server");

  const user = await requireUser(request);
  const requestData = await db.getRequestById(params.id!);

  if (!requestData) {
    throw new Response("Request not found", { status: 404 });
  }

  const resident = await db.getUserById(requestData.userId);

  return {
    request: requestData,
    resident,
    user,
    isStaff: user.role === "staff",
  };
}

export async function action({ request, params }: Route.ActionArgs) {
  const { requireUser } = await import("~/lib/auth.server");
  const { db } = await import("~/lib/db.server");

  const user = await requireUser(request);
  const formData = await request.formData();
  const intent = formData.get("intent");

  if (intent === "updateNotes") {
    const staffNotes = formData.get("staffNotes")?.toString();
    await db.updateRequest(params.id!, { staffNotes });
    return { success: true, message: "Заметки сохранены" };
  }

  if (intent === "updateStatus") {
    const status = formData.get("status")?.toString() as "new" | "in_progress" | "resolved" | "closed";
    await db.updateRequest(params.id!, { status });
    return { success: true, message: "Статус обновлён" };
  }

  return null;
}

export function meta({}: Route.MetaArgs) {
  return [{ title: "Детали заявки - Домовой" }];
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

export default function RequestDetail() {
  const { request, resident, user, isStaff } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [staffNotes, setStaffNotes] = useState(request.staffNotes || "");

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.headerContent}>
          <Button asChild variant="link">
            <Link to="/staff">
              <ArrowLeft style={{ width: "20px", height: "20px", marginRight: "8px" }} />
              Назад
            </Link>
          </Button>
          <h1 className={styles.headerTitle}>Заявка #{request.id.slice(4, 12)}</h1>
        </div>
      </header>

      <main className={styles.content}>
        <div className={styles.grid}>
          <div>
            <div className={styles.card}>
              <h2 className={styles.cardTitle}>Информация о заявке</h2>
              <div className={styles.detailsGrid}>
                <div className={styles.detailRow}>
                  <span className={styles.detailLabel}>ID заявки:</span>
                  <span className={styles.detailValue}>#{request.id.slice(4, 12)}</span>
                </div>
                <div className={styles.detailRow}>
                  <span className={styles.detailLabel}>Жилец:</span>
                  <span className={styles.detailValue}>{resident?.name}</span>
                </div>
                <div className={styles.detailRow}>
                  <span className={styles.detailLabel}>Квартира:</span>
                  <span className={styles.detailValue}>{request.apartment}</span>
                </div>
                <div className={styles.detailRow}>
                  <span className={styles.detailLabel}>Тип проблемы:</span>
                  <span className={styles.detailValue}>{getCategoryLabel(request.category)}</span>
                </div>
                <div className={styles.detailRow}>
                  <span className={styles.detailLabel}>Описание:</span>
                  <span className={styles.detailValue}>{request.description}</span>
                </div>
                <div className={styles.detailRow}>
                  <span className={styles.detailLabel}>Статус:</span>
                  <Badge variant={getStatusVariant(request.status)}>{getStatusLabel(request.status)}</Badge>
                </div>
                <div className={styles.detailRow}>
                  <span className={styles.detailLabel}>Приоритет:</span>
                  <Badge variant={getPriorityVariant(request.priority)}>{getPriorityLabel(request.priority)}</Badge>
                </div>
                <div className={styles.detailRow}>
                  <span className={styles.detailLabel}>Дата создания:</span>
                  <span className={styles.detailValue}>{new Date(request.createdAt).toLocaleString("ru-RU")}</span>
                </div>
                <div className={styles.detailRow}>
                  <span className={styles.detailLabel}>Последнее обновление:</span>
                  <span className={styles.detailValue}>{new Date(request.updatedAt).toLocaleString("ru-RU")}</span>
                </div>
                {isStaff && (
                  <div className={styles.detailRow}>
                    <span className={styles.detailLabel}>Изменить статус:</span>
                    <Form method="post">
                      <input type="hidden" name="intent" value="updateStatus" />
                      <Select name="status" defaultValue={request.status}>
                        <SelectTrigger style={{ width: "200px" }}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="new">Новая</SelectItem>
                          <SelectItem value="in_progress">В работе</SelectItem>
                          <SelectItem value="resolved">Решена</SelectItem>
                          <SelectItem value="closed">Закрыта</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button type="submit" size="sm" style={{ marginTop: "var(--space-2)" }}>
                        Обновить
                      </Button>
                    </Form>
                  </div>
                )}
              </div>
            </div>

            <div className={styles.card} style={{ marginTop: "var(--space-6)" }}>
              <h2 className={styles.cardTitle}>История диалога с AI</h2>
              <div className={styles.conversation}>
                {request.conversation.map((msg, index) => (
                  <div
                    key={index}
                    className={`${styles.message} ${msg.role === "user" ? styles.messageUser : styles.messageAi}`}
                  >
                    <div
                      className={`${styles.messageAvatar} ${msg.role === "user" ? styles.avatarUser : styles.avatarAi}`}
                    >
                      {msg.role === "user" ? (
                        <User style={{ width: "18px", height: "18px" }} />
                      ) : (
                        <Bot style={{ width: "18px", height: "18px" }} />
                      )}
                    </div>
                    <div
                      className={`${styles.messageBubble} ${msg.role === "user" ? styles.bubbleUser : styles.bubbleAi}`}
                    >
                      <p className={styles.messageText}>{msg.content}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div>
            {request.photos && request.photos.length > 0 && (
              <div className={styles.card} style={{ marginBottom: "var(--space-6)" }}>
                <h2 className={styles.cardTitle}>Фотографии</h2>
                <div className={styles.photosGrid}>
                  {request.photos.map((photo, index) => (
                    <img key={index} src={photo} alt={`Photo ${index + 1}`} className={styles.photo} />
                  ))}
                </div>
              </div>
            )}

            {isStaff && (
              <div className={styles.card}>
                <h2 className={styles.cardTitle}>Заметки персонала</h2>
                {actionData?.success && (
                  <div className={styles.successMessage}>{actionData.message}</div>
                )}
                {isEditingNotes ? (
                  <Form method="post" className={styles.notesForm}>
                    <input type="hidden" name="intent" value="updateNotes" />
                    <Textarea
                      name="staffNotes"
                      value={staffNotes}
                      onChange={(e) => setStaffNotes(e.target.value)}
                      rows={8}
                      placeholder="Добавьте заметки о заявке..."
                    />
                    <div style={{ display: "flex", gap: "var(--space-2)" }}>
                      <Button type="submit">Сохранить</Button>
                      <Button type="button" variant="outline" onClick={() => setIsEditingNotes(false)}>
                        Отмена
                      </Button>
                    </div>
                  </Form>
                ) : (
                  <>
                    <div className={styles.notesDisplay}>
                      {staffNotes ? <p>{staffNotes}</p> : <p className={styles.emptyNotes}>Заметок пока нет</p>}
                    </div>
                    <Button onClick={() => setIsEditingNotes(true)} style={{ marginTop: "var(--space-4)" }}>
                      {staffNotes ? "Редактировать" : "Добавить заметки"}
                    </Button>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

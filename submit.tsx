import { useState, useRef, useEffect } from "react";
import { Form, Link, redirect, useActionData, useLoaderData } from "react-router";
import type { Route } from "./+types/submit";
import styles from "./submit.module.css";
import { Button } from "~/components/ui/button/button";
import { Textarea } from "~/components/ui/textarea/textarea";
import { Badge } from "~/components/ui/badge/badge";
import { ArrowLeft, Bot, User, Send, CheckCircle, Upload, X } from "lucide-react";

export async function loader({ request }: Route.LoaderArgs) {
  const { requireUser } = await import("~/lib/auth.server");
  const user = await requireUser(request);
  return { user };
}

export async function action({ request }: Route.ActionArgs) {
  const { requireUser } = await import("~/lib/auth.server");
  const { db } = await import("~/lib/db.server");
  const { saveMultipleFiles } = await import("~/lib/upload.server");

  const user = await requireUser(request);
  const formData = await request.formData();

  const category = formData.get("category")?.toString() || "other";
  const description = formData.get("description")?.toString() || "";
  const priority = formData.get("priority")?.toString() as "low" | "medium" | "high" | "urgent";
  const conversation = JSON.parse(formData.get("conversation")?.toString() || "[]");

  // Handle file uploads
  const files = formData.getAll("photos") as File[];
  const validFiles = files.filter((file) => file.size > 0);
  let photoUrls: string[] = [];

  if (validFiles.length > 0) {
    try {
      photoUrls = await saveMultipleFiles(validFiles);
    } catch (error) {
      return { error: "Ошибка при загрузке файлов" };
    }
  }

  // Create request
  await db.createRequest({
    userId: user.id,
    category,
    description,
    priority,
    status: "new",
    apartment: user.apartment || "N/A",
    conversation,
    photos: photoUrls,
  });

  return redirect("/my-requests");
}

export function meta({}: Route.MetaArgs) {
  return [{ title: "Создать заявку - Домовой" }];
}

interface Message {
  role: "user" | "ai";
  message: string;
  timestamp: Date;
}

interface RequestData {
  problemType?: string;
  description?: string;
  priority?: string;
  apartmentNumber?: string;
}

export default function Submit() {
  const { user } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "ai",
      message:
        "Здравствуйте! Я AI-помощник Домовой. Опишите, пожалуйста, вашу проблему, и я помогу создать заявку.",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [requestData, setRequestData] = useState<RequestData>({});
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [conversationStep, setConversationStep] = useState(0);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const classifyProblem = (text: string): string => {
    const lowerText = text.toLowerCase();
    if (lowerText.includes("течь") || lowerText.includes("протечка") || lowerText.includes("вода")) {
      return "leak";
    }
    if (lowerText.includes("лифт")) {
      return "elevator";
    }
    if (lowerText.includes("отопление") || lowerText.includes("батарея") || lowerText.includes("холодно")) {
      return "heating";
    }
    if (lowerText.includes("свет") || lowerText.includes("электр") || lowerText.includes("розетка")) {
      return "electrical";
    }
    if (lowerText.includes("сантехник") || lowerText.includes("раковина") || lowerText.includes("унитаз")) {
      return "plumbing";
    }
    return "other";
  };

  const determinePriority = (problemType: string, description: string): string => {
    if (problemType === "elevator" || description.toLowerCase().includes("застрял")) {
      return "critical";
    }
    if (problemType === "leak" || problemType === "heating") {
      return "high";
    }
    if (problemType === "electrical") {
      return "medium";
    }
    return "low";
  };

  const getAIResponse = (userMessage: string, step: number): string => {
    if (step === 0) {
      const problemType = classifyProblem(userMessage);
      setRequestData((prev) => ({ ...prev, problemType, description: userMessage }));

      const responses: Record<string, string> = {
        leak: "Понимаю, это серьезная ситуация с протечкой. Скажите, пожалуйста, насколько интенсивная протечка? Это капли или сильный поток?",
        elevator: "Понял, проблема с лифтом. Есть ли кто-то внутри лифта? Это критически важно.",
        heating: "Понимаю вашу проблему с отоплением. Батареи совсем холодные или чуть теплые? Это во всех комнатах?",
        electrical: "Понял, проблема с электричеством. Вы проверили, не выбило ли автомат в электрощитке?",
        plumbing: "Понимаю. Вода совсем не уходит или уходит медленно?",
        other: "Спасибо за описание. Можете уточнить, когда началась проблема?",
      };

      return responses[problemType] || responses.other;
    }

    if (step === 1) {
      return "Спасибо за уточнение. Укажите, пожалуйста, номер вашей квартиры.";
    }

    if (step === 2) {
      const apartmentMatch = userMessage.match(/\d+/);
      if (apartmentMatch) {
        setRequestData((prev) => ({ ...prev, apartmentNumber: apartmentMatch[0] }));
      }
      return "Отлично! Я собрал всю необходимую информацию. Сейчас подготовлю заявку для вас.";
    }

    return "Спасибо!";
  };

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage: Message = {
      role: "user",
      message: input,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsTyping(true);

    setTimeout(() => {
      const aiResponse = getAIResponse(input, conversationStep);
      const aiMessage: Message = {
        role: "ai",
        message: aiResponse,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, aiMessage]);
      setIsTyping(false);
      setConversationStep((prev) => prev + 1);

      if (conversationStep === 2) {
        setTimeout(() => {
          const priority = determinePriority(requestData.problemType || "other", requestData.description || "");
          setRequestData((prev) => ({ ...prev, priority, apartmentNumber: user.apartment }));
          setShowConfirmation(true);
        }, 1000);
      }
    }, 1500);
  };

  const validateImageFile = (file: File): { valid: boolean; error?: string } => {
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      return { valid: false, error: "Файл слишком большой. Максимальный размер: 5 МБ" };
    }
    const validTypes = ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"];
    if (!validTypes.includes(file.type)) {
      return { valid: false, error: "Недопустимый тип файла. Разрешены: JPEG, PNG, GIF, WebP" };
    }
    return { valid: true };
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const validFiles = files.filter((file) => {
      const validation = validateImageFile(file);
      if (!validation.valid) {
        alert(validation.error);
        return false;
      }
      return true;
    });
    setUploadedFiles((prev) => [...prev, ...validFiles].slice(0, 5)); // Max 5 files
  };

  const removeFile = (index: number) => {
    setUploadedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleConfirm = () => {
    if (formRef.current) {
      formRef.current.requestSubmit();
    }
  };

  const getProblemTypeLabel = (type?: string) => {
    const labels: Record<string, string> = {
      leak: "Протечка",
      elevator: "Лифт",
      heating: "Отопление",
      electrical: "Электрика",
      plumbing: "Сантехника",
      other: "Другое",
    };
    return type ? labels[type] || type : "Не определено";
  };

  const getPriorityLabel = (priority?: string) => {
    const labels: Record<string, string> = {
      critical: "Критический",
      high: "Высокий",
      medium: "Средний",
      low: "Низкий",
    };
    return priority ? labels[priority] || priority : "Не определен";
  };

  const getPriorityVariant = (priority?: string) => {
    switch (priority) {
      case "critical":
      case "high":
        return "destructive";
      case "medium":
        return "default";
      case "low":
        return "secondary";
      default:
        return "outline";
    }
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.headerContent}>
          <Button asChild variant="link" className={styles.backButton}>
            <Link to="/">
              <ArrowLeft style={{ width: "20px", height: "20px" }} />
              Назад
            </Link>
          </Button>
          <h1 className={styles.headerTitle}>Создание заявки</h1>
        </div>
      </header>

      <main className={styles.content}>
        <div className={styles.chatContainer}>
          <div className={styles.messagesArea}>
            {messages.map((msg, index) => (
              <div
                key={index}
                className={`${styles.message} ${msg.role === "user" ? styles.messageUser : styles.messageAi}`}
              >
                <div className={`${styles.messageAvatar} ${msg.role === "user" ? styles.avatarUser : styles.avatarAi}`}>
                  {msg.role === "user" ? (
                    <User style={{ width: "20px", height: "20px" }} />
                  ) : (
                    <Bot style={{ width: "20px", height: "20px" }} />
                  )}
                </div>
                <div className={`${styles.messageBubble} ${msg.role === "user" ? styles.bubbleUser : styles.bubbleAi}`}>
                  <p className={styles.messageText}>{msg.message}</p>
                  <div className={styles.messageTime}>
                    {msg.timestamp.toLocaleTimeString("ru-RU", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </div>
                </div>
              </div>
            ))}

            {isTyping && (
              <div className={`${styles.message} ${styles.messageAi}`}>
                <div className={`${styles.messageAvatar} ${styles.avatarAi}`}>
                  <Bot style={{ width: "20px", height: "20px" }} />
                </div>
                <div className={`${styles.messageBubble} ${styles.bubbleAi}`}>
                  <div className={styles.typing}>
                    <div className={styles.typingDot}></div>
                    <div className={styles.typingDot}></div>
                    <div className={styles.typingDot}></div>
                  </div>
                </div>
              </div>
            )}

            {showConfirmation && (
              <Form
                ref={formRef}
                method="post"
                encType="multipart/form-data"
                onSubmit={(e) => {
                  // Append files to form data
                  const formData = new FormData(e.currentTarget);
                  uploadedFiles.forEach((file) => {
                    formData.append("photos", file);
                  });
                }}
              >
                <input type="hidden" name="category" value={requestData.problemType} />
                <input type="hidden" name="description" value={requestData.description} />
                <input type="hidden" name="priority" value={requestData.priority} />
                <input type="hidden" name="conversation" value={JSON.stringify(messages)} />

                <div className={styles.confirmationCard}>
                  <h3 className={styles.confirmationTitle}>
                    <CheckCircle style={{ width: "20px", height: "20px" }} />
                    Подтверждение заявки
                  </h3>
                  <div className={styles.confirmationDetails}>
                    <div className={styles.detailRow}>
                      <span className={styles.detailLabel}>Тип проблемы:</span>
                      <span className={styles.detailValue}>{getProblemTypeLabel(requestData.problemType)}</span>
                    </div>
                    <div className={styles.detailRow}>
                      <span className={styles.detailLabel}>Описание:</span>
                      <span className={styles.detailValue}>{requestData.description}</span>
                    </div>
                    <div className={styles.detailRow}>
                      <span className={styles.detailLabel}>Квартира:</span>
                      <span className={styles.detailValue}>{requestData.apartmentNumber || "Не указана"}</span>
                    </div>
                    <div className={styles.detailRow}>
                      <span className={styles.detailLabel}>Приоритет:</span>
                      <Badge variant={getPriorityVariant(requestData.priority)}>
                        {getPriorityLabel(requestData.priority)}
                      </Badge>
                    </div>

                    {uploadedFiles.length > 0 && (
                      <div className={styles.detailRow}>
                        <span className={styles.detailLabel}>Фотографии:</span>
                        <div className={styles.photoPreviewGrid}>
                          {uploadedFiles.map((file, index) => (
                            <div key={index} className={styles.photoPreview}>
                              <img
                                src={URL.createObjectURL(file)}
                                alt={`Photo ${index + 1}`}
                                className={styles.previewImage}
                              />
                              <button
                                type="button"
                                onClick={() => removeFile(index)}
                                className={styles.removePhoto}
                              >
                                <X size={16} />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className={styles.uploadSection}>
                    <label htmlFor="photo-upload" className={styles.uploadLabel}>
                      <Upload style={{ width: "16px", height: "16px" }} />
                      Загрузить фото ({uploadedFiles.length}/5)
                    </label>
                    <input
                      id="photo-upload"
                      type="file"
                      name="photos"
                      accept="image/*"
                      multiple
                      onChange={handleFileSelect}
                      disabled={uploadedFiles.length >= 5}
                      style={{ display: "none" }}
                    />
                  </div>

                  <div className={styles.confirmationActions}>
                    <Button type="button" variant="outline" onClick={() => setShowConfirmation(false)}>
                      Отменить
                    </Button>
                    <Button type="submit">Подтвердить заявку</Button>
                  </div>
                </div>
              </Form>
            )}

            <div ref={messagesEndRef} />
          </div>

          {!showConfirmation && (
            <div className={styles.inputArea}>
              <form
                className={styles.inputForm}
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSend();
                }}
              >
                <div className={styles.inputWrapper}>
                  <Textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Введите ваше сообщение..."
                    rows={2}
                    disabled={isTyping}
                  />
                </div>
                <Button type="submit" disabled={!input.trim() || isTyping}>
                  <Send style={{ width: "20px", height: "20px" }} />
                </Button>
              </form>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

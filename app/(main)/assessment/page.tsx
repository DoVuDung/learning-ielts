"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Award,
  CheckCircle2,
  Clock,
  Headphones,
  BookOpen,
  Sparkles,
  ArrowRight,
  RefreshCw,
  Target,
  ShieldCheck,
  AlertCircle,
} from "lucide-react";
import { usersApi, type AssessmentResult } from "@/lib/api-client";

interface Question {
  id: string;
  skill: "listening" | "vocabulary" | "grammar";
  skillLabel: string;
  questionText: string;
  context?: string;
  options: { key: string; text: string }[];
}

const QUESTIONS: Question[] = [
  {
    id: "q1",
    skill: "listening",
    skillLabel: "Listening & Context",
    questionText: "Chọn từ đúng để hoàn thành câu nghe được trong bối cảnh giao tiếp hằng ngày:",
    context: "\"Could you please _____ the deadline for submitting the quarterly financial report?\"",
    options: [
      { key: "A", text: "expand" },
      { key: "B", text: "extend" },
      { key: "C", text: "enlarge" },
      { key: "D", text: "exceed" },
    ],
  },
  {
    id: "q2",
    skill: "listening",
    skillLabel: "Listening & Dictation",
    questionText: "Cụm từ nào diễn đạt chính xác ý nghĩa 'hoàn toàn đồng ý' trong thảo luận học thuật?",
    context: "\"I couldn't agree _____ with your perspective on renewable energy transition.\"",
    options: [
      { key: "A", text: "much" },
      { key: "B", text: "better" },
      { key: "C", text: "more" },
      { key: "D", text: "higher" },
    ],
  },
  {
    id: "q3",
    skill: "listening",
    skillLabel: "Listening Comprehension",
    questionText: "Chọn cách phản hồi tự nhiên và lịch sự nhất cho lời mời:",
    context: "\"Would you like to join us for the international marketing conference tomorrow?\"",
    options: [
      { key: "A", text: "I'd love to, but I have a prior commitment." },
      { key: "B", text: "No, I don't want to come tomorrow." },
      { key: "C", text: "Yes, you must invite me now." },
      { key: "D", text: "Never mind, I am busy." },
    ],
  },
  {
    id: "q4",
    skill: "vocabulary",
    skillLabel: "Academic Vocabulary",
    questionText: "Chọn từ đồng nghĩa tốt nhất với 'meticulous' trong ngữ cảnh nghiên cứu:",
    context: "\"The researcher conducted a meticulous analysis of the experimental data.\"",
    options: [
      { key: "A", text: "superficial" },
      { key: "B", text: "hasty" },
      { key: "C", text: "ambiguous" },
      { key: "D", text: "thorough and precise" },
    ],
  },
  {
    id: "q5",
    skill: "vocabulary",
    skillLabel: "Collocations",
    questionText: "Chọn từ kết hợp đúng (collocation) với 'an impact':",
    context: "\"Artificial intelligence is expected to _____ a profound impact on global employment.\"",
    options: [
      { key: "A", text: "do" },
      { key: "B", text: "have" },
      { key: "C", text: "make" },
      { key: "D", text: "take" },
    ],
  },
  {
    id: "q6",
    skill: "vocabulary",
    skillLabel: "Idiomatic Expressions",
    questionText: "Ý nghĩa của thành ngữ 'hit the nail on the head' là gì?",
    context: "\"When Sarah explained the root cause of the system failure, she really hit the nail on the head.\"",
    options: [
      { key: "A", text: "Đóng đinh vào tường cẩn thận" },
      { key: "B", text: "Làm tổn thương ai đó" },
      { key: "C", text: "Nói hoặc mô tả chính xác bản chất vấn đề" },
      { key: "D", text: "Hoãn công việc lại vào phút chót" },
    ],
  },
  {
    id: "q7",
    skill: "grammar",
    skillLabel: "Advanced Grammar",
    questionText: "Chọn cấu trúc đảo ngữ đúng:",
    context: "\"Not only _____ the project on time, but they also reduced costs by 20%.\"",
    options: [
      { key: "A", text: "did the team complete" },
      { key: "B", text: "the team completed" },
      { key: "C", text: "had the team complete" },
      { key: "D", text: "the team did complete" },
    ],
  },
  {
    id: "q8",
    skill: "grammar",
    skillLabel: "Conditional Sentences",
    questionText: "Hoàn thành câu điều kiện loại hỗn hợp (Mixed Conditional):",
    context: "\"If we had invested in early-stage automation five years ago, our efficiency today _____ significantly higher.\"",
    options: [
      { key: "A", text: "will be" },
      { key: "B", text: "would be" },
      { key: "C", text: "had been" },
      { key: "D", text: "is" },
    ],
  },
  {
    id: "q9",
    skill: "grammar",
    skillLabel: "Relative Clauses",
    questionText: "Chọn đại từ quan hệ phù hợp cho câu chuẩn học thuật:",
    context: "\"The laboratory _____ the clinical trials were conducted has state-of-the-art instruments.\"",
    options: [
      { key: "A", text: "which" },
      { key: "B", text: "that" },
      { key: "C", text: "in which" },
      { key: "D", text: "who" },
    ],
  },
  {
    id: "q10",
    skill: "grammar",
    skillLabel: "Passive Voice & Modals",
    questionText: "Chọn động từ đúng trong cấu trúc bị động chỉ phỏng đoán:",
    context: "\"The ancient manuscript is believed _____ by scholars in the 14th century.\"",
    options: [
      { key: "A", text: "to write" },
      { key: "B", text: "writing" },
      { key: "C", text: "to be writing" },
      { key: "D", text: "to have been written" },
    ],
  },
];

export default function AssessmentPage() {
  const [started, setStarted] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<AssessmentResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const currentQ = QUESTIONS[currentIndex];
  const progressPercent = Math.round(((currentIndex + 1) / QUESTIONS.length) * 100);

  const handleSelectOption = (key: string) => {
    setAnswers((prev) => ({ ...prev, [currentQ.id]: key }));
  };

  const handleNext = async () => {
    if (currentIndex < QUESTIONS.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      await handleSubmit();
    }
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    setError(null);
    try {
      const payload = QUESTIONS.map((q) => ({
        questionId: q.id,
        selectedAnswer: answers[q.id] || "A",
      }));
      const res = await usersApi.submitAssessment(payload);
      setResult(res);
    } catch (err: any) {
      setError(err.message || "Lỗi khi nộp bài đánh giá");
    } finally {
      setSubmitting(false);
    }
  };

  const handleRestart = () => {
    setStarted(true);
    setCurrentIndex(0);
    setAnswers({});
    setResult(null);
  };

  return (
    <div className="flex-1 overflow-y-auto bg-gradient-to-b from-background via-background/95 to-background p-6 lg:p-10">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/60 pb-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold mb-3">
              <Sparkles className="size-3.5" />
              AI Proficiency Assessment
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight text-foreground">
              Kiểm Tra Năng Lực Tiếng Anh & IELTS
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Đánh giá chuẩn xác trình độ CEFR (A1 - C1) và quy đổi điểm IELTS tương đương trong 5 phút.
            </p>
          </div>
          {result && (
            <button
              onClick={handleRestart}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-border bg-card hover:bg-muted text-sm font-semibold transition-colors"
            >
              <RefreshCw className="size-4" />
              Làm lại bài test
            </button>
          )}
        </div>

        {error && (
          <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm font-medium flex items-center gap-2.5">
            <AlertCircle className="size-5 shrink-0" />
            <span className="flex-1">{error}</span>
          </div>
        )}

        {/* Screen 1: Start Overview */}
        {!started && !result && (
          <div className="bg-card/80 backdrop-blur-xl border border-border/80 rounded-3xl p-8 lg:p-12 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-80 h-80 bg-primary/10 rounded-full blur-3xl -z-10" />
            <div className="max-w-2xl space-y-6">
              <div className="size-14 rounded-2xl bg-gradient-to-tr from-primary to-emerald-500 flex items-center justify-center text-white shadow-lg shadow-primary/30">
                <Award className="size-7" />
              </div>

              <h2 className="text-2xl font-bold text-foreground">
                Chuẩn Bị Kiểm Tra Trình Độ Toàn Diện
              </h2>

              <p className="text-muted-foreground leading-relaxed">
                Bài đánh giá gồm <strong>10 câu hỏi chuẩn học thuật</strong> được thiết kế bởi chuyên gia, phân tích sâu năng lực Nghe, Từ vựng chuyên sâu và Ngữ pháp nâng cao để định vị chính xác vị trí của bạn trên thang điểm IELTS và CEFR.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                <div className="flex items-start gap-3 p-4 rounded-2xl bg-muted/50 border border-border/50">
                  <Headphones className="size-5 text-primary mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-sm">Listening</h4>
                    <p className="text-xs text-muted-foreground mt-0.5">Hiểu ngữ cảnh & từ vựng giao tiếp</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-4 rounded-2xl bg-muted/50 border border-border/50">
                  <BookOpen className="size-5 text-emerald-500 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-sm">Vocabulary</h4>
                    <p className="text-xs text-muted-foreground mt-0.5">Từ học thuật & Collocations</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-4 rounded-2xl bg-muted/50 border border-border/50">
                  <Clock className="size-5 text-amber-500 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-sm">Thời gian</h4>
                    <p className="text-xs text-muted-foreground mt-0.5">Dự kiến ~ 3 - 5 phút</p>
                  </div>
                </div>
              </div>

              <div className="pt-4">
                <button
                  onClick={() => setStarted(true)}
                  className="inline-flex items-center gap-3 px-8 py-4 rounded-2xl bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-base shadow-xl shadow-primary/25 transition-all hover:scale-[1.02] active:scale-[0.98]"
                >
                  Bắt Đầu Bài Kiểm Tra Ngay
                  <ArrowRight className="size-5" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Screen 2: Active Question */}
        {started && !result && (
          <div className="space-y-6">
            {/* Progress indicator */}
            <div className="flex items-center justify-between text-sm font-semibold text-muted-foreground">
              <span>
                Câu hỏi {currentIndex + 1} / {QUESTIONS.length}
              </span>
              <span>{progressPercent}% hoàn thành</span>
            </div>
            <div className="h-2.5 w-full bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-primary to-emerald-500 transition-all duration-300 ease-out"
                style={{ width: `${progressPercent}%` }}
              />
            </div>

            {/* Question Card */}
            <div className="bg-card/90 backdrop-blur-xl border border-border/80 rounded-3xl p-6 lg:p-10 shadow-xl space-y-6">
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 rounded-lg bg-primary/10 text-primary text-xs font-bold uppercase tracking-wider">
                  {currentQ.skillLabel}
                </span>
              </div>

              <div className="space-y-3">
                <h3 className="text-xl lg:text-2xl font-bold text-foreground leading-snug">
                  {currentQ.questionText}
                </h3>
                {currentQ.context && (
                  <div className="p-4 rounded-2xl bg-muted/70 border border-border/60 font-mono text-base text-foreground/90 italic">
                    {currentQ.context}
                  </div>
                )}
              </div>

              {/* Options */}
              <div className="grid grid-cols-1 gap-3.5 pt-2">
                {currentQ.options.map((opt) => {
                  const isSelected = answers[currentQ.id] === opt.key;
                  return (
                    <button
                      key={opt.key}
                      onClick={() => handleSelectOption(opt.key)}
                      className={`
                        w-full flex items-center gap-4 p-4 lg:p-5 rounded-2xl border text-left transition-all
                        ${
                          isSelected
                            ? "bg-primary/10 border-primary shadow-md shadow-primary/10 text-foreground font-semibold"
                            : "bg-background/60 border-border hover:border-primary/50 text-foreground/80 hover:bg-muted/40"
                        }
                      `}
                    >
                      <span
                        className={`
                          size-9 rounded-xl flex items-center justify-center font-bold text-sm shrink-0 transition-colors
                          ${
                            isSelected
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted text-muted-foreground"
                          }
                        `}
                      >
                        {opt.key}
                      </span>
                      <span className="text-base flex-1">{opt.text}</span>
                    </button>
                  );
                })}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-6 border-t border-border/60">
                <button
                  onClick={() => setCurrentIndex(Math.max(0, currentIndex - 1))}
                  disabled={currentIndex === 0 || submitting}
                  className="px-5 py-2.5 rounded-xl border border-border bg-card hover:bg-muted font-semibold text-sm disabled:opacity-40 transition-colors"
                >
                  Quay lại
                </button>

                <button
                  onClick={handleNext}
                  disabled={submitting}
                  className="inline-flex items-center gap-2 px-7 py-3 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-sm shadow-lg shadow-primary/25 transition-all"
                >
                  {submitting
                    ? "Đang chấm điểm..."
                    : currentIndex === QUESTIONS.length - 1
                      ? "Nộp bài đánh giá"
                      : "Câu tiếp theo →"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Screen 3: Scorecard Results */}
        {result && (
          <div className="bg-card/90 backdrop-blur-xl border border-border/80 rounded-3xl p-8 lg:p-12 shadow-2xl space-y-8 animate-in fade-in zoom-in-95 duration-300">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-6 border-b border-border/60 pb-8">
              <div className="flex items-center gap-4">
                <div className="size-16 rounded-2xl bg-gradient-to-tr from-primary to-emerald-500 flex items-center justify-center text-white shadow-xl shadow-primary/30">
                  <CheckCircle2 className="size-8" />
                </div>
                <div>
                  <div className="text-xs font-bold uppercase tracking-widest text-primary">
                    BÁO CÁO NĂNG LỰC ĐẦU VÀO
                  </div>
                  <h2 className="text-2xl font-black text-foreground mt-0.5">
                    Chúc mừng bạn đã hoàn thành bài kiểm tra!
                  </h2>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="px-5 py-3 rounded-2xl bg-primary/10 border border-primary/20 text-center">
                  <div className="text-xs text-muted-foreground font-semibold">CEFR LEVEL</div>
                  <div className="text-2xl font-black text-primary">{result.cefrLevel}</div>
                </div>
                <div className="px-5 py-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-center">
                  <div className="text-xs text-muted-foreground font-semibold">IELTS BAND</div>
                  <div className="text-2xl font-black text-emerald-500">{result.ieltsBand.toFixed(1)}</div>
                </div>
              </div>
            </div>

            {/* Score Breakdown */}
            <div className="space-y-6">
              <h3 className="font-bold text-lg text-foreground">
                Phân tích chi tiết theo từng kỹ năng:
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div className="p-6 rounded-2xl bg-muted/40 border border-border/60 space-y-3">
                  <div className="flex items-center justify-between text-sm font-semibold">
                    <span className="text-muted-foreground">Listening Context</span>
                    <span className="text-primary font-bold">{result.listeningScore}%</span>
                  </div>
                  <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary transition-all duration-700"
                      style={{ width: `${result.listeningScore}%` }}
                    />
                  </div>
                </div>

                <div className="p-6 rounded-2xl bg-muted/40 border border-border/60 space-y-3">
                  <div className="flex items-center justify-between text-sm font-semibold">
                    <span className="text-muted-foreground">Vocabulary & Collocations</span>
                    <span className="text-emerald-500 font-bold">{result.vocabularyScore}%</span>
                  </div>
                  <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 transition-all duration-700"
                      style={{ width: `${result.vocabularyScore}%` }}
                    />
                  </div>
                </div>

                <div className="p-6 rounded-2xl bg-muted/40 border border-border/60 space-y-3">
                  <div className="flex items-center justify-between text-sm font-semibold">
                    <span className="text-muted-foreground">Advanced Grammar</span>
                    <span className="text-amber-500 font-bold">{result.grammarScore}%</span>
                  </div>
                  <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-amber-500 transition-all duration-700"
                      style={{ width: `${result.grammarScore}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Call To Action Target */}
            <div className="p-6 lg:p-8 rounded-3xl bg-gradient-to-r from-primary/15 via-emerald-500/10 to-transparent border border-primary/20 flex flex-col sm:flex-row items-center justify-between gap-6">
              <div className="space-y-1">
                <div className="inline-flex items-center gap-2 text-xs font-bold text-primary uppercase">
                  <Target className="size-4" />
                  BƯỚC TIẾP THEO
                </div>
                <h4 className="text-xl font-extrabold text-foreground">
                  Thiết lập Mục tiêu học tập cá nhân hóa
                </h4>
                <p className="text-sm text-muted-foreground">
                  Dựa trên điểm IELTS hiện tại ({result.ieltsBand.toFixed(1)}), hãy đặt mục tiêu band tiếp theo để hệ thống tự động gợi ý bài tập.
                </p>
              </div>

              <Link
                href="/target"
                className="inline-flex items-center gap-2 px-7 py-3.5 rounded-2xl bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-sm shadow-xl shadow-primary/25 transition-all shrink-0"
              >
                Cài đặt Mục tiêu ngay
                <ArrowRight className="size-4" />
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

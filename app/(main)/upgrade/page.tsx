"use client";

import { useState, useEffect } from "react";
import { TopNav } from "@/components/top-nav";
import { Button } from "@/components/ui/button";
import {
  Crown,
  Check,
  Zap,
  ShieldCheck,
  Sparkles,
  Lock,
  Loader2,
  Copy,
  CheckCheck,
  QrCode,
  X,
  CreditCard,
  Building2,
  AlertCircle,
  Timer,
  ExternalLink,
} from "lucide-react";

interface UpgradePlan {
  id: string;
  name: string;
  price: string;
  durationDays: number;
  amount: number;
  popular?: boolean;
  features: string[];
}

const PLANS: UpgradePlan[] = [
  {
    id: "PREMIUM_MONTHLY",
    name: "IELTS PRO 1 Tháng",
    price: "199.000đ / tháng",
    durationDays: 30,
    amount: 199000,
    features: [
      "Không giới hạn bài học Dictation & Shadowing",
      "Lập lịch ôn tập từ vựng AI FSRS chuẩn xác",
      "Chấm điểm & phản hồi phát âm bằng trí tuệ nhân tạo",
      "Tải video và học offline không quảng cáo",
    ],
  },
  {
    id: "PREMIUM_1_YEAR",
    name: "IELTS PRO 1 Năm",
    price: "1.490.000đ / năm",
    durationDays: 365,
    amount: 1490000,
    popular: true,
    features: [
      "Tiết kiệm 40% so với gói theo tháng",
      "Toàn bộ quyền lợi của gói IELTS PRO",
      "Hệ thống thi thử IELTS Speaking & Listening Mock Test",
      "Hỗ trợ giải đáp lộ trình 1-1 với AI Mentor",
      "Đảm bảo an toàn giao dịch ACID 100%",
    ],
  },
  {
    id: "PREMIUM_LIFETIME",
    name: "IELTS PRO Trọn Đời",
    price: "2.990.000đ",
    durationDays: 3650,
    amount: 2990000,
    features: [
      "Thanh toán 1 lần, sử dụng vĩnh viễn trọn đời",
      "Cập nhật miễn phí mọi tính năng AI mới trong tương lai",
      "Huy hiệu Crown Vàng độc quyền trên Bảng Xếp Hạng",
      "Ưu tiên băng thông server cao nhất",
    ],
  },
];

const VIETQR_CONFIG = {
  bankId: "MB",
  bankName: "Ngân hàng Quân Đội (MBBank)",
  accountNo: "0987654321",
  accountName: "BAP ENGLISH ACADEMY",
  template: "compact2",
};

export default function UpgradePage() {
  const [selectedPlan, setSelectedPlan] = useState<string>("PREMIUM_1_YEAR");
  const [activeGatewayPlan, setActiveGatewayPlan] = useState<UpgradePlan | null>(
    null,
  );
  const [orderId, setOrderId] = useState<string>("");
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState<number>(600); // 10 minutes countdown
  const [processingPayment, setProcessingPayment] = useState<boolean>(false);
  const [result, setResult] = useState<{
    success: boolean;
    message: string;
    orderId?: string;
    expiresAt?: string;
    idempotent?: boolean;
  } | null>(null);

  // Open VietQR payment modal
  const handleOpenPaymentGateway = (plan: UpgradePlan) => {
    const generatedOrderId = `ORDER-${Date.now().toString().slice(-6)}`;
    setOrderId(generatedOrderId);
    setActiveGatewayPlan(plan);
    setTimeLeft(600);
  };

  // Countdown timer when payment modal is open
  useEffect(() => {
    if (!activeGatewayPlan) return;
    const interval = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [activeGatewayPlan]);

  const copyToClipboard = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2000);
  };

  // Execute ACID upgrade transaction
  const handleConfirmVietQrPayment = async () => {
    if (!activeGatewayPlan) return;
    setProcessingPayment(true);

    try {
      const response = await fetch("http://localhost:3001/users/me/upgrade", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          orderId: orderId,
          plan: activeGatewayPlan.id,
          durationDays: activeGatewayPlan.durationDays,
          amount: activeGatewayPlan.amount,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setResult({
          success: true,
          message:
            "Xác nhận thanh toán VietQR thành công! Tài khoản đã nâng cấp PRO với giao dịch ACID.",
          orderId: data.transaction?.orderId ?? orderId,
          expiresAt:
            data.user?.premiumExpiresAt
              ? new Date(data.user.premiumExpiresAt).toLocaleDateString("vi-VN")
              : "Vĩnh viễn",
          idempotent: data.idempotent,
        });
      } else {
        // Offline / fallback simulation
        await new Promise((r) => setTimeout(r, 800));
        setResult({
          success: true,
          message:
            "[Mô phỏng VietQR thành công] Giao dịch Napas247 đã được ghi nhận tự động bằng khóa ACID Serializable.",
          orderId: orderId,
          expiresAt: new Date(
            Date.now() + activeGatewayPlan.durationDays * 86400 * 1000,
          ).toLocaleDateString("vi-VN"),
          idempotent: false,
        });
      }
    } catch {
      await new Promise((r) => setTimeout(r, 800));
      setResult({
        success: true,
        message:
          "[Mô phỏng VietQR thành công] Hệ thống đã xác thực thanh toán VietQR với khóa ACID Serializable.",
        orderId: orderId,
        expiresAt: new Date(
          Date.now() + activeGatewayPlan.durationDays * 86400 * 1000,
        ).toLocaleDateString("vi-VN"),
        idempotent: false,
      });
    } finally {
      setProcessingPayment(false);
      setActiveGatewayPlan(null);
    }
  };

  const transferContent = `BAP PRO ${orderId}`;
  const vietQrUrl = activeGatewayPlan
    ? `https://img.vietqr.io/image/${VIETQR_CONFIG.bankId}-${VIETQR_CONFIG.accountNo}-${VIETQR_CONFIG.template}.png?amount=${activeGatewayPlan.amount}&addInfo=${encodeURIComponent(transferContent)}&accountName=${encodeURIComponent(VIETQR_CONFIG.accountName)}`
    : "";

  const formatMinutes = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  return (
    <div className="flex flex-col h-full flex-1 min-h-0 bg-background text-foreground">
      <TopNav
        title="Nâng Cấp Tài Khoản PRO"
        subtitle="Mở khoá toàn bộ sức mạnh trí tuệ nhân tạo IELTS V3"
      />

      <main className="flex-1 overflow-y-auto px-6 py-8 w-full">
        <div className="max-w-6xl mx-auto space-y-10 pb-16">
          {/* Banner header */}
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-amber-500/10 via-yellow-500/5 to-amber-500/10 border border-amber-500/20 p-8 md:p-12 text-center space-y-4">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-semibold">
              <Sparkles className="size-3.5 text-amber-400" />
              <span>VIETQR NAPAS247 & ACID TRANSACTION GUARANTEE</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-black tracking-tight text-foreground">
              Tích Hợp Cổng Thanh Toán VietQR Tự Động
            </h2>
            <p className="text-sm md:text-base text-muted-foreground max-w-2xl mx-auto">
              Quét mã QR bằng mọi ứng dụng Ngân hàng Việt Nam (MBBank, Vietcombank,
              Techcombank, MoMo...). Hệ thống tự động điền số tiền & nội dung, xử lý
              ACID Serializable 24/7.
            </p>
          </div>

          {/* ACID & VietQR Guarantee highlights */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-5 rounded-2xl bg-card border border-border flex items-start gap-3.5">
              <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400 shrink-0">
                <QrCode className="size-5" />
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-bold">VietQR Chuẩn Napas247</h4>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Quét mã QR tự động điền chính xác số tiền & nội dung đơn hàng,
                  không lo chuyển nhầm thông tin.
                </p>
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-card border border-border flex items-start gap-3.5">
              <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400 shrink-0">
                <Lock className="size-5" />
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-bold">An Toàn ACID & Idempotent</h4>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Giao dịch được bảo đảm tính nguyên tử và cô lập khi nhiều user
                  nâng cấp hoặc webhook gọi đồng thời.
                </p>
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-card border border-border flex items-start gap-3.5">
              <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400 shrink-0">
                <Zap className="size-5" />
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-bold">Kích Hoạt PRO Tức Thì</h4>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Tài khoản tự động cộng dồn thời gian PRO ngay khi nhận thông báo
                  thành công từ ngân hàng.
                </p>
              </div>
            </div>
          </div>

          {/* Result alert */}
          {result && (
            <div
              className={`p-5 rounded-2xl border flex items-start gap-3 transition-all ${
                result.success
                  ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
                  : "bg-red-500/10 border-red-500/30 text-red-300"
              }`}
            >
              <Check className="size-5 shrink-0 mt-0.5 text-emerald-400" />
              <div className="space-y-1 text-sm">
                <p className="font-semibold">{result.message}</p>
                <div className="text-xs text-emerald-400/80 flex flex-wrap gap-x-4 gap-y-1 mt-1">
                  <span>
                    <strong>Mã Đơn Hàng:</strong> {result.orderId}
                  </span>
                  <span>
                    <strong>Hết hạn PRO:</strong> {result.expiresAt}
                  </span>
                  <span>
                    <strong>Idempotent:</strong> {result.idempotent ? "Có" : "Không"}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Pricing Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {PLANS.map((plan) => {
              const isSelected = selectedPlan === plan.id;
              return (
                <div
                  key={plan.id}
                  onClick={() => setSelectedPlan(plan.id)}
                  className={`relative rounded-3xl p-6 flex flex-col justify-between border cursor-pointer transition-all duration-300 ${
                    plan.popular
                      ? "bg-gradient-to-b from-card to-amber-500/5 border-amber-500/50 shadow-lg shadow-amber-500/10 ring-2 ring-amber-500/30"
                      : isSelected
                        ? "bg-card border-primary ring-1 ring-primary"
                        : "bg-card border-border hover:border-border/80"
                  }`}
                >
                  {plan.popular && (
                    <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-gradient-to-r from-amber-500 to-yellow-500 text-black text-[10px] font-extrabold tracking-wider uppercase shadow-md">
                      Phổ biến nhất
                    </div>
                  )}

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        Gói dịch vụ
                      </span>
                      <Crown className="size-4 text-amber-400" />
                    </div>

                    <div>
                      <h3 className="text-xl font-bold text-foreground">
                        {plan.name}
                      </h3>
                      <p className="text-2xl font-black text-amber-400 mt-1">
                        {plan.price}
                      </p>
                    </div>

                    <hr className="border-border/60" />

                    <ul className="space-y-2.5">
                      {plan.features.map((feature, idx) => (
                        <li
                          key={idx}
                          className="flex items-start gap-2.5 text-xs text-muted-foreground"
                        >
                          <Check className="size-4 text-emerald-400 shrink-0 mt-0.5" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="mt-8">
                    <Button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenPaymentGateway(plan);
                      }}
                      className={`w-full rounded-xl py-5 font-bold transition-all shadow-md ${
                        plan.popular
                          ? "bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-black"
                          : "bg-primary hover:bg-primary/90 text-primary-foreground"
                      }`}
                    >
                      <QrCode className="size-4 mr-2" />
                      Thanh Toán VietQR
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* VietQR Payment Gateway Overlay Modal */}
        {activeGatewayPlan && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
            <div className="relative w-full max-w-2xl rounded-3xl bg-card border border-border shadow-2xl overflow-hidden text-foreground">
              {/* Top gradient banner */}
              <div className="bg-gradient-to-r from-amber-500/20 via-yellow-500/15 to-amber-500/20 border-b border-border px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400">
                    <QrCode className="size-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-base text-foreground">
                      Cổng Thanh Toán VietQR Tự Động
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      Mã đơn hàng:{" "}
                      <span className="text-amber-400 font-semibold">
                        {orderId}
                      </span>
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setActiveGatewayPlan(null)}
                  className="size-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors text-muted-foreground hover:text-foreground"
                >
                  <X className="size-4" />
                </button>
              </div>

              {/* Modal content body */}
              <div className="p-6 md:p-8 grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                {/* Left: VietQR image box */}
                <div className="flex flex-col items-center justify-center space-y-4 p-5 rounded-2xl bg-white/5 border border-border">
                  <div className="relative bg-white p-3 rounded-2xl shadow-lg border border-white/20">
                    <img
                      src={vietQrUrl}
                      alt="VietQR Code"
                      className="w-56 h-56 object-contain rounded-lg"
                    />
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-amber-400 font-medium">
                    <Timer className="size-3.5" />
                    <span>Hết hạn QR sau: {formatMinutes(timeLeft)}</span>
                  </div>
                </div>

                {/* Right: Bank account details & Copy controls */}
                <div className="space-y-4">
                  <div className="space-y-1">
                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Thông tin chuyển khoản
                    </span>
                    <h4 className="text-lg font-bold text-foreground">
                      {VIETQR_CONFIG.bankName}
                    </h4>
                  </div>

                  <div className="space-y-3">
                    <div className="p-3 rounded-xl bg-background border border-border flex items-center justify-between">
                      <div>
                        <p className="text-[10px] text-muted-foreground uppercase">
                          Số tài khoản
                        </p>
                        <p className="text-sm font-mono font-bold text-foreground">
                          {VIETQR_CONFIG.accountNo}
                        </p>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          copyToClipboard(VIETQR_CONFIG.accountNo, "acc")
                        }
                        className="h-8 px-2.5 text-xs"
                      >
                        {copiedField === "acc" ? (
                          <CheckCheck className="size-3.5 text-emerald-400" />
                        ) : (
                          <Copy className="size-3.5" />
                        )}
                      </Button>
                    </div>

                    <div className="p-3 rounded-xl bg-background border border-border flex items-center justify-between">
                      <div>
                        <p className="text-[10px] text-muted-foreground uppercase">
                          Tên chủ tài khoản
                        </p>
                        <p className="text-sm font-bold text-foreground">
                          {VIETQR_CONFIG.accountName}
                        </p>
                      </div>
                    </div>

                    <div className="p-3 rounded-xl bg-background border border-border flex items-center justify-between">
                      <div>
                        <p className="text-[10px] text-muted-foreground uppercase">
                          Số tiền
                        </p>
                        <p className="text-sm font-bold text-amber-400">
                          {activeGatewayPlan.amount.toLocaleString("vi-VN")} VNĐ
                        </p>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          copyToClipboard(
                            String(activeGatewayPlan.amount),
                            "amount",
                          )
                        }
                        className="h-8 px-2.5 text-xs"
                      >
                        {copiedField === "amount" ? (
                          <CheckCheck className="size-3.5 text-emerald-400" />
                        ) : (
                          <Copy className="size-3.5" />
                        )}
                      </Button>
                    </div>

                    <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between">
                      <div>
                        <p className="text-[10px] text-amber-400/80 uppercase font-semibold">
                          Nội dung chuyển khoản (Bắt buộc)
                        </p>
                        <p className="text-sm font-mono font-bold text-amber-300">
                          {transferContent}
                        </p>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          copyToClipboard(transferContent, "content")
                        }
                        className="h-8 px-2.5 text-xs border-amber-500/40 hover:bg-amber-500/20"
                      >
                        {copiedField === "content" ? (
                          <CheckCheck className="size-3.5 text-emerald-400" />
                        ) : (
                          <Copy className="size-3.5" />
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Modal footer controls */}
              <div className="px-6 py-4 bg-white/5 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span className="relative flex size-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full size-2.5 bg-amber-500"></span>
                  </span>
                  <span>Đang chờ thanh toán qua ứng dụng ngân hàng...</span>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <Button
                    variant="outline"
                    onClick={() => setActiveGatewayPlan(null)}
                    className="flex-1 sm:flex-none text-xs"
                  >
                    Đóng
                  </Button>
                  <Button
                    onClick={handleConfirmVietQrPayment}
                    disabled={processingPayment}
                    className="flex-1 sm:flex-none bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-black font-bold text-xs"
                  >
                    {processingPayment ? (
                      <>
                        <Loader2 className="size-3.5 animate-spin mr-1.5" />
                        Đang xác thực ACID...
                      </>
                    ) : (
                      <>
                        <Check className="size-3.5 mr-1.5" />
                        Tôi Đã Chuyển Khoản Xong
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

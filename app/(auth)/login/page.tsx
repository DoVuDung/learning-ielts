import { GoogleSignInButton } from "@/components/google-sign-in-button";
import { Separator } from "@/components/ui/separator";

export const metadata = {
  title: "Đăng nhập – BapEnglish",
};

export default function LoginPage() {
  return (
    <div className="w-full max-w-sm flex flex-col gap-8">
      {/* Logo */}
      <div className="flex flex-col items-center gap-3">
        <div className="flex items-center justify-center size-12 rounded-2xl bg-primary shadow-lg shadow-primary/30">
          <span className="text-white font-bold text-xl">B</span>
        </div>
        <div className="flex flex-col items-center gap-1">
          <h1 className="text-2xl font-bold text-foreground tracking-tight">BapEnglish</h1>
          <p className="text-sm text-muted-foreground">Luyện tiếng Anh thông minh cùng AI</p>
        </div>
      </div>

      {/* Card */}
      <div className="flex flex-col gap-6 rounded-2xl border border-border bg-card p-8">
        <div className="flex flex-col gap-1 text-center">
          <h2 className="text-lg font-semibold text-foreground">Chào mừng trở lại</h2>
          <p className="text-sm text-muted-foreground">
            Đăng nhập để tiếp tục hành trình học tiếng Anh của bạn
          </p>
        </div>

        <GoogleSignInButton />

        <div className="flex items-center gap-3">
          <Separator className="flex-1 bg-border" />
          <span className="text-xs text-muted-foreground">Chỉ hỗ trợ Google</span>
          <Separator className="flex-1 bg-border" />
        </div>

        <p className="text-xs text-muted-foreground text-center leading-relaxed">
          Bằng cách đăng nhập, bạn đồng ý với{" "}
          <span className="text-primary cursor-pointer hover:underline">Điều khoản dịch vụ</span>
          {" "}và{" "}
          <span className="text-primary cursor-pointer hover:underline">Chính sách bảo mật</span>
          {" "}của BapEnglish.
        </p>
      </div>
    </div>
  );
}

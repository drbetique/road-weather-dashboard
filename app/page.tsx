import { LoginForm } from "@/components/auth/LoginForm";

export default function LoginPage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-900 via-blue-800 to-blue-700 p-4">
      <div className="w-full max-w-md">
        <LoginForm />
        <p className="text-center text-blue-200 text-xs mt-4">
          Digitraffic · Ilmatieteen laitos
        </p>
      </div>
    </main>
  );
}

import { useState } from "react";
import { useAuth } from "../../../supabase/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useNavigate, Link } from "react-router-dom";
import AuthLayout from "./AuthLayout";
import { useToast } from "@/components/ui/use-toast";
import { useTranslation } from "react-i18next";
import { ConnectionStatus } from "../ui/connection-status";

export default function SignUpForm() {
  const { t } = useTranslation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [error, setError] = useState("");
  const { signUp } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      console.log("Attempting to sign up with:", { email, password, fullName });
      await signUp(email, password, fullName);
      toast({
        title: t("auth.accountCreated"),
        description: t("auth.verifyEmail"),
        duration: 5000,
      });
      navigate("/login");
    } catch (error) {
      console.error("Signup error:", error);
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError(t("auth.errorCreatingAccount"));
      }
    }
  };

  return (
    <AuthLayout>
      <div className="bg-white rounded-2xl shadow-sm p-8 w-full max-w-md mx-auto">
        <div className="mb-6">
          <ConnectionStatus />
        </div>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label
              htmlFor="fullName"
              className="text-sm font-medium text-gray-700"
            >
              {t("common.fullName")}
            </Label>
            <Input
              id="fullName"
              placeholder="John Doe"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
              className="h-12 rounded-lg border-gray-300 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div className="space-y-2">
            <Label
              htmlFor="email"
              className="text-sm font-medium text-gray-700"
            >
              {t("common.email")}
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="name@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="h-12 rounded-lg border-gray-300 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div className="space-y-2">
            <Label
              htmlFor="password"
              className="text-sm font-medium text-gray-700"
            >
              {t("common.password")}
            </Label>
            <Input
              id="password"
              type="password"
              placeholder="Create a password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="h-12 rounded-lg border-gray-300 focus:ring-blue-500 focus:border-blue-500"
            />
            <p className="text-xs text-gray-500 mt-1">
              Senha deve ter pelo menos 6 caracteres
            </p>
          </div>
          {error && <p className="text-sm text-red-500">{error}</p>}

          <Button
            type="submit"
            className="w-full h-12 rounded-full bg-black text-white hover:bg-gray-800 text-sm font-medium"
          >
            {t("common.createAccount")}
          </Button>

          <div className="text-xs text-center text-gray-500 mt-6">
            {t("common.byCreatingAccount")}{" "}
            <Link to="/" className="text-blue-600 hover:underline">
              {t("common.termsOfService")}
            </Link>{" "}
            {t("common.and")}{" "}
            <Link to="/" className="text-blue-600 hover:underline">
              {t("common.privacyPolicy")}
            </Link>
          </div>

          <div className="text-sm text-center text-gray-600 mt-6">
            {t("common.alreadyHaveAccount")}{" "}
            <Link
              to="/login"
              className="text-blue-600 hover:underline font-medium"
            >
              {t("common.signIn")}
            </Link>
          </div>
        </form>
      </div>
    </AuthLayout>
  );
}

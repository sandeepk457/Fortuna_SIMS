import SignInForm from "@/components/auth/SignInForm";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Fortuna SIMS | Supply & Inventory Management System",
  description: "A Product From Fortuna Global Supply Chain Systems",
};

export default function SignIn() {
  return <SignInForm />;
}

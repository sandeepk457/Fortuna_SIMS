import SignUpForm from "@/components/auth/SignUpForm";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "FORTUNA SIMS | Supply & Inventory Management System",
  description: "A Product From Fortuna Global Supply Chain Systems",
  // other metadata
};

export default function SignUp() {
  return <SignUpForm />;
}

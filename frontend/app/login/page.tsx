"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit() {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });
      const token = await response.json();
      localStorage.setItem("token", token);
      router.push("/dashboard");
    } catch (error) {
      setError("Invalid email or password");
    }
  }
  return (
    <>
      <input
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="border border-gray-300 p-2 rounded w-full"
        placeholder="Email"
      />
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        className="border border-gray-300 p-2 rounded w-full"
        placeholder="Password"
      />
      {error && <p>{error}</p>}
      <button onClick={handleSubmit}>Login</button>
    </>
  );
}

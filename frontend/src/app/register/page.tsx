"use client";
import { useState } from "react";

export default function RegisterPage() {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<string | null>(null);

  async function handleSubmit(e: React.SubmitEvent) {
    e.preventDefault();
    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ firstName, lastName, email }),
      });
      const json = await res.json();
      json.ok ? setStatus("Registered!") : setStatus(json.message);
    } catch {
      setStatus("An unexpected error occurred. Please try again later.");
    }
  }

  return (
    <main className="flex flex-col min-h-screen">
      <div className="flex flex-col items-center gap-8">
        <h1 className="text-4xl font-semibold">Register</h1>
        <form onSubmit={handleSubmit}>
          <div className="flex flex-col items-center">
            <div className="flex flex-col mb-4">
              <label htmlFor="firstName" className="mb-2">
                First Name
              </label>
              <input
                type="text"
                id="firstName"
                autoComplete="off"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="rounded-md border border-gray-300 p-2 w-md"
              />
            </div>
            <div className="flex flex-col mb-4">
              <label htmlFor="lastName" className="mb-2">
                Last Name
              </label>
              <input
                type="text"
                id="lastName"
                autoComplete="off"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="rounded-md border border-gray-300 p-2 w-md"
              />
            </div>
            <div className="flex flex-col mb-4">
              <label htmlFor="email" className="mb-2">
                Email
              </label>
              <input
                type="email"
                id="email"
                autoComplete="off"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="rounded-md border border-gray-300 p-2 w-md"
              />
            </div>
            <button
              className="mt-4 rounded-md bg-black px-4 py-2 hover:bg-gray-800 hover:cursor-pointer w-32 disabled:cursor-wait"
              type="submit"
            >
              Register
            </button>
            {status && <p>{status}</p>}
          </div>
        </form>
      </div>
    </main>
  );
}

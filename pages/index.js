import { useSession, signIn, signOut } from "next-auth/react";
import Link from "next/link";

export default function Home() {
  const { data: session, status } = useSession();
  if (status === "loading") return <p>Loading...</p>;

  if (!session) {
    return <button onClick={() => signIn("cognito")}>Sign in</button>;
  }
  return (
    <div style={{ padding: "2rem" }}>
      <p>Signed in as {session.user.email}</p>
      <button onClick={() => signOut()}>Sign out</button>
      <div>
        <Link href="/upload">
          <a>Go to Upload</a>
        </Link>
      </div>
    </div>
  );
}
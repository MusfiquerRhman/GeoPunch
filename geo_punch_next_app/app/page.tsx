

import { redirect } from "next/navigation";

export default function Home() {
  redirect(`/attendance/check-in`);

  return (
    <main>
      hi
    </main>
  );
}

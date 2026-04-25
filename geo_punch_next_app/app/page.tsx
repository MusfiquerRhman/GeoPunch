

import { redirect } from "next/navigation";

export default function Home() {
  redirect(`/library/departments/`);

  return (
    <main>
      hi
    </main>
  );
}

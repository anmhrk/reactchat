"use client";

import { Input } from "~/components/ui/input";
import { Button } from "~/components/ui/button";

export default function HomePage() {
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const searchQuery = formData.get("searchQuery") as string;
    console.log(searchQuery);
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6">
      <form
        className="flex flex-row items-center justify-center gap-3"
        onSubmit={handleSubmit}
      >
        <Input
          placeholder="Enter GitHub repository URL"
          name="searchQuery"
          required
        />
        <Button type="submit">Submit</Button>
      </form>
    </main>
  );
}

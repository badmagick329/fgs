import Image from "next/image";

export default function Home() {
  return (
    <main className="flex flex-col gap-8 pt-12 items-center bg-gray-700 text-white min-h-screen">
      <h1 className="text-4xl font-semibold">🚧 Under Construction 🚧</h1>

      <Image
        src="/penguin.gif"
        alt="Description of GIF"
        width={300}
        height={200}
        unoptimized
        className="rounded-md"
      />
    </main>
  );
}

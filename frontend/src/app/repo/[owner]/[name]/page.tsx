export default async function Page({
  params,
}: {
  params: Promise<{ owner: string; name: string }>;
}) {
  const { owner, name } = await params;

  return (
    <div>
      repo/{owner}/{name}
    </div>
  );
}

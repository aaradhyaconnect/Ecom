interface Props {
  children: React.ReactNode;
  params: Promise<{ category: string }>;
}

export default async function CategoryLayout({ children }: Props) {
  return <>{children}</>;
}

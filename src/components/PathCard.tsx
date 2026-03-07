import Link from "next/link";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface PathCardProps {
  icon: string;
  title: string;
  description: string;
  details: string[];
  id: string;
  language?: string;
}

export function PathCard({ icon, title, description, details, id, language = 'french' }: PathCardProps) {
  
  const href = id === 'alphabet' 
    ? `/alphabet/${language.toLowerCase()}/1/1`
    : `/lessons/${language.toLowerCase()}/${id}/1/1`;

  return (
    <Card className="flex flex-col">
      <CardHeader>
        <div className="flex items-center gap-4">
          <span className="text-4xl">{icon}</span>
          <h3 className="font-headline text-xl font-bold">{title}</h3>
        </div>
        <p className="pt-2 text-muted-foreground">{description}</p>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col justify-between gap-6">
        <ul className="space-y-2 text-sm text-muted-foreground">
          {details.map((detail, index) => (
            <li key={index}>- {detail}</li>
          ))}
        </ul>
        <Button asChild variant="secondary">
          <Link href={href}>Start Path</Link>
        </Button>
      </CardContent>
    </Card>
  );
}

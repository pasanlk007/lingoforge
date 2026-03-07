type LessonPageProps = {
  params: {
    language: string;
    path: string;
    week: string;
    day: string;
  };
};

export default function LessonPage({ params }: LessonPageProps) {
  return (
    <div>
      <h1>Lesson</h1>
      <p>Language: {params.language}</p>
      <p>Path: {params.path}</p>
      <p>Week: {params.week}</p>
      <p>Day: {params.day}</p>
    </div>
  );
}

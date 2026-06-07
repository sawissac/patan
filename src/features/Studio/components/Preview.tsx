interface PreviewProps {
  svg: string;
}

export default function Preview({ svg }: PreviewProps) {
  return (
    <div className="flex items-center justify-center w-full h-full">
      <div dangerouslySetInnerHTML={{ __html: svg }} />
    </div>
  );
}

type Props = {
  lines: string[];
};

export default function ScreenplayPage({ lines }: Props) {
  return (
    <div className="screenplay-page">
      {lines.map((line, i) => (
        <div key={i} className="screenplay-line">
          {line || " "}
        </div>
      ))}
    </div>
  );
}

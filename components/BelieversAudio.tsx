export default function BelieversAudio({ id, title }: { id: string; title: string }) {
  const url = "https://drive.google.com/file/d/" + id;
  return (
    <div>
      <iframe src={url + "/preview"} title={title} loading="lazy"
        style={{ width: "100%", height: 100, border: 0 }} />
      <p><a href={url + "/view"} target="_blank" rel="noreferrer">Open {title.toLowerCase()} in Google Drive ↗</a></p>
    </div>
  );
}

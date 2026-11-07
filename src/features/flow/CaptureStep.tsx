import { useEffect, useRef, useState } from "react";
import { Camera, Upload, RotateCcw } from "lucide-react";
import { SHOTS } from "../shared/catalog";
import { Action } from "../shared/Controls";
export function CaptureStep({
  photos,
  onChange,
}: {
  photos: string[];
  onChange: (photos: string[]) => void;
}) {
  const [index, setIndex] = useState(0);
  const [error, setError] = useState("");
  const video = useRef<HTMLVideoElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const count = photos.filter(Boolean).length;
  useEffect(() => {
    let alive = true;
    let stream: MediaStream | undefined;
    if (photos[index] || index === 4) return;
    async function start() {
      try {
        if (!navigator.mediaDevices?.getUserMedia) throw new Error();
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "user" },
          audio: false,
        });
        if (!alive) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        if (video.current) video.current.srcObject = stream;
        setError("");
      } catch {
        if (alive) setError("Não foi possível abrir a câmera. Use Subir da galeria.");
      }
    }
    void start();
    return () => {
      alive = false;
      stream?.getTracks().forEach((t) => t.stop());
    };
  }, [index, photos]);
  function save(data: string) {
    const next = [...photos];
    next[index] = data;
    onChange(next);
    const missing = SHOTS.findIndex((_, i) => !next[i]);
    if (missing >= 0) setIndex(missing);
  }
  function snap() {
    if (photos[index]) {
      const next = [...photos];
      next[index] = "";
      onChange(next);
      return;
    }
    const v = video.current;
    if (!v?.videoWidth) {
      setError("Câmera indisponível. Escolha uma foto da galeria.");
      return;
    }
    const canvas = document.createElement("canvas");
    canvas.width = v.videoWidth;
    canvas.height = v.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(v, 0, 0);
    save(canvas.toDataURL("image/jpeg", 0.85));
  }
  function upload(file?: File) {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("Selecione uma imagem JPG, PNG ou WebP.");
      return;
    }
    if (file.size > 15 * 1024 * 1024) {
      setError("Escolha uma imagem de até 15 MB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        save(reader.result);
        setError("");
      }
    };
    reader.readAsDataURL(file);
  }
  return (
    <>
      <h1>Fotos guiadas</h1>
      <p className="ff-sub">{count} de 5 fotos. Boa luz e sem óculos escuros ajudam muito.</p>
      <div className="ff-camera">
        {photos[index] ? (
          <img src={photos[index]} alt={SHOTS[index]?.[0]} />
        ) : (
          <video ref={video} autoPlay playsInline muted />
        )}
        <div className={`ff-guide ${index === 4 ? "body" : ""}`} />
        <div className="ff-camera-hint">
          <b>{SHOTS[index]?.[0]}</b>
          <br />
          {error || SHOTS[index]?.[1]}
        </div>
      </div>
      <div className="ff-thumbs">
        {SHOTS.map((shot, i) => (
          <Action
            key={shot[0]}
            className={`ff-thumb ${i === index ? "on" : ""} ${photos[i] ? "complete" : ""}`}
            aria-label={shot[0]}
            onClick={() => setIndex(i)}
          >
            {photos[i] ? <img src={photos[i]} alt={shot[0]} /> : shot[0]}
          </Action>
        ))}
      </div>
      <div className="ff-row">
        {index !== 4 && (
          <Action className="ff-small" onClick={snap}>
            {photos[index] ? <RotateCcw size={16} /> : <Camera size={16} />}
            {photos[index] ? "Refazer" : "Tirar foto"}
          </Action>
        )}
        <Action className="ff-small" onClick={() => input.current?.click()}>
          <Upload size={16} />
          Subir da galeria
        </Action>
      </div>
      <input
        ref={input}
        type="file"
        accept="image/*"
        hidden
        onChange={(e) => {
          upload(e.target.files?.[0]);
          e.target.value = "";
        }}
      />
    </>
  );
}

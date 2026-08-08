import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Lock, Plus, Image as ImageIcon, Music, Calendar, Trash2, X,
  Edit2, ChevronLeft, ChevronRight, LogOut, Upload, Link2, Check,
} from "lucide-react";
import { storageGet, storageSet } from "./storage";

const PASSWORD = "16052024";
const STORAGE_KEY = "lila-journal-entries";

const COLORS = {
  bgFrom: "#F4EFFB",
  bgTo: "#E7DBF6",
  ink: "#2E1F4D",
  inkSoft: "#5B4B7A",
  muted: "#8B7FA6",
  violet: "#7C4DDA",
  violetDeep: "#5B2FBF",
  violetDark: "#3D1E80",
  violetSoft: "#EAE0FB",
  violetLine: "#DDD0F5",
  white: "#FFFFFF",
  danger: "#C15D6C",
};

const heading = { fontFamily: "'Poppins', sans-serif" };
const body = { fontFamily: "'Montserrat', sans-serif" };

// ---------- helpers ----------

function resizeImage(file, maxW = 1000, quality = 0.75) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new window.Image();
      img.onload = () => {
        let { width, height } = img;
        if (width > maxW) {
          height = Math.round((height * maxW) / width);
          width = maxW;
        }
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL("image/jpeg", quality));
      };
      img.onerror = reject;
      img.src = e.target.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function readFileAsDataURL(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function parseMusicLink(url) {
  if (!url) return null;
  try {
    if (url.includes("open.spotify.com")) {
      const m = url.match(/open\.spotify\.com\/(track|album|playlist|episode)\/([a-zA-Z0-9]+)/);
      if (m) return { type: "spotify", embed: `https://open.spotify.com/embed/${m[1]}/${m[2]}` };
    }
    if (url.includes("youtube.com/watch")) {
      const id = new URL(url).searchParams.get("v");
      if (id) return { type: "youtube", embed: `https://www.youtube.com/embed/${id}` };
    }
    if (url.includes("youtu.be/")) {
      const id = url.split("youtu.be/")[1]?.split(/[?&]/)[0];
      if (id) return { type: "youtube", embed: `https://www.youtube.com/embed/${id}` };
    }
    if (url.includes("soundcloud.com")) {
      return { type: "soundcloud", embed: `https://w.soundcloud.com/player/?url=${encodeURIComponent(url)}&color=%237c4dda&auto_play=false` };
    }
  } catch (e) {}
  return { type: "link", embed: null };
}

function formatDate(d) {
  try {
    return new Date(d + "T00:00:00").toLocaleDateString("en-US", {
      weekday: "long", year: "numeric", month: "long", day: "numeric",
    });
  } catch {
    return d;
  }
}

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

// ---------- logo mark ----------

function LilaMark({ size = 34 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none">
      <circle cx="20" cy="16" r="11" fill={COLORS.violetSoft} />
      <circle cx="14" cy="24" r="9" fill={COLORS.violet} opacity="0.85" />
      <circle cx="25" cy="25" r="7" fill={COLORS.violetDeep} />
    </svg>
  );
}

const SPOTIFY_GREEN = "#1DB954";

function SpotifyIcon({ size = 16, color = SPOTIFY_GREEN }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="12" fill={color} />
      <path
        d="M17.9 10.9c-3.2-1.9-8.5-2.1-11.6-1.1a.8.8 0 11-.5-1.5c3.5-1.1 9.4-.9 13.1 1.3a.8.8 0 11-.9 1.3zm-.1 3.1c-2.7-1.6-6.8-2.1-10-1.2a.7.7 0 11-.4-1.3c3.6-1 8.2-.5 11.3 1.4a.7.7 0 11-.9 1.1zm-.9 3c-2.4-1.4-5.4-1.7-8.9-.9a.6.6 0 11-.3-1.2c3.9-.9 7.2-.5 9.9 1.1a.6.6 0 01-.7 1z"
        fill="#fff"
      />
    </svg>
  );
}

// ---------- Lock screen ----------

function LockScreen({ onUnlock }) {
  const [value, setValue] = useState("");
  const [error, setError] = useState(false);

  const submit = (e) => {
    e.preventDefault();
    if (value === PASSWORD) {
      onUnlock();
    } else {
      setError(true);
      setValue("");
      setTimeout(() => setError(false), 500);
    }
  };

  return (
    <div
      className="w-full h-full min-h-screen flex items-center justify-center p-6 relative overflow-hidden"
      style={{ background: `linear-gradient(140deg, ${COLORS.bgFrom}, ${COLORS.bgTo})` }}
    >
      <div
        className="absolute rounded-full"
        style={{ width: 380, height: 380, background: COLORS.violet, opacity: 0.16, top: -120, left: -100, filter: "blur(40px)" }}
      />
      <div
        className="absolute rounded-full"
        style={{ width: 320, height: 320, background: COLORS.violetDeep, opacity: 0.14, bottom: -100, right: -80, filter: "blur(40px)" }}
      />

      <form
        onSubmit={submit}
        className={`relative z-10 w-full max-w-sm rounded-3xl p-9 flex flex-col items-center gap-5 ${error ? "shake" : ""}`}
        style={{ background: COLORS.white, boxShadow: "0 20px 60px -15px rgba(91,47,191,0.35)" }}
      >
        <LilaMark size={48} />
        <div className="text-center">
          <h1 style={{ ...heading, color: COLORS.ink, fontWeight: 600, fontSize: 22, lineHeight: 1.25 }}>
            Los Pensamientos de Jime
          </h1>
          <p style={{ ...body, color: COLORS.muted, fontSize: 13.5, marginTop: 6 }}>
            Your private space for words, photos and songs.
          </p>
        </div>

        <div className="w-full flex flex-col gap-2 mt-2">
          <label style={{ ...body, color: COLORS.inkSoft, fontSize: 12.5, fontWeight: 600 }}>
            Enter password
          </label>
          <div
            className="w-full flex items-center gap-2 rounded-xl px-3.5 py-3"
            style={{ background: COLORS.violetSoft, border: `1.5px solid ${error ? COLORS.danger : COLORS.violetLine}` }}
          >
            <Lock size={16} color={COLORS.violet} />
            <input
              autoFocus
              type="password"
              inputMode="numeric"
              value={value}
              onChange={(ev) => setValue(ev.target.value)}
              placeholder="••••••••"
              style={{ ...body, background: "transparent", outline: "none", border: "none", width: "100%", color: COLORS.ink, fontSize: 15, letterSpacing: 2 }}
            />
          </div>
          {error && (
            <span style={{ ...body, color: COLORS.danger, fontSize: 12 }}>That password isn't right. Try again.</span>
          )}
        </div>

        <button
          type="submit"
          className="w-full rounded-xl py-3 mt-1 transition-transform active:scale-[0.98]"
          style={{ ...heading, background: `linear-gradient(135deg, ${COLORS.violet}, ${COLORS.violetDeep})`, color: "#fff", fontWeight: 600, fontSize: 14.5, letterSpacing: 0.3 }}
        >
          Unlock journal
        </button>
      </form>

      <style>{`
        @keyframes shakeKf {
          10%, 90% { transform: translateX(-1px); }
          20%, 80% { transform: translateX(2px); }
          30%, 50%, 70% { transform: translateX(-4px); }
          40%, 60% { transform: translateX(4px); }
        }
        .shake { animation: shakeKf 0.5s; }
      `}</style>
    </div>
  );
}

// ---------- Entry card ----------

function EntryCard({ entry, onOpen, onEdit, onDelete }) {
  return (
    <div
      onClick={() => onOpen(entry)}
      className="rounded-2xl overflow-hidden cursor-pointer flex flex-col transition-transform hover:-translate-y-1"
      style={{ background: COLORS.white, border: `1px solid ${COLORS.violetLine}`, boxShadow: "0 8px 24px -12px rgba(91,47,191,0.18)" }}
    >
      {entry.images?.length > 0 ? (
        <div className="w-full h-36 overflow-hidden" style={{ background: COLORS.violetSoft }}>
          <img src={entry.images[0]} alt="" className="w-full h-full object-cover" />
        </div>
      ) : (
        <div className="w-full h-36 flex items-center justify-center" style={{ background: `linear-gradient(135deg, ${COLORS.violetSoft}, ${COLORS.bgTo})` }}>
          <LilaMark size={30} />
        </div>
      )}
      <div className="p-4 flex flex-col gap-1.5 flex-1">
        <div className="flex items-center gap-1.5" style={{ color: COLORS.muted }}>
          <Calendar size={12} />
          <span style={{ ...body, fontSize: 11.5, fontWeight: 500 }}>
            {new Date(entry.date + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
          </span>
        </div>
        <h3 style={{ ...heading, color: COLORS.ink, fontWeight: 600, fontSize: 16.5, lineHeight: 1.3 }}>
          {entry.title || "Untitled"}
        </h3>
        <p style={{ ...body, color: COLORS.inkSoft, fontSize: 13, lineHeight: 1.5 }} className="line-clamp-2">
          {entry.text}
        </p>
        <div className="flex items-center justify-between mt-2 pt-2" style={{ borderTop: `1px solid ${COLORS.violetSoft}` }}>
          <div className="flex items-center gap-2.5" style={{ color: COLORS.violet }}>
            {entry.images?.length > 0 && (
              <span className="flex items-center gap-1" style={{ ...body, fontSize: 11.5 }}>
                <ImageIcon size={13} /> {entry.images.length}
              </span>
            )}
            {entry.musicLink && (
              <span className="flex items-center gap-1" style={{ ...body, fontSize: 11.5 }}>
                <SpotifyIcon size={13} />
              </span>
            )}
            {!entry.musicLink && entry.musicFile && (
              <span className="flex items-center gap-1" style={{ ...body, fontSize: 11.5 }}>
                <Music size={13} />
              </span>
            )}
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={(e) => { e.stopPropagation(); onEdit(entry); }}
              className="p-1.5 rounded-lg transition-colors"
              style={{ color: COLORS.muted }}
              onMouseEnter={(e) => (e.currentTarget.style.background = COLORS.violetSoft)}
              onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
            >
              <Edit2 size={14} />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onDelete(entry); }}
              className="p-1.5 rounded-lg transition-colors"
              style={{ color: COLORS.muted }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "#FBEAEC")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
            >
              <Trash2 size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------- Music block (shared by editor + viewer) ----------

function MusicBlock({ musicLink, musicFile, musicFileName }) {
  const parsed = musicLink ? parseMusicLink(musicLink) : null;
  return (
    <div className="flex flex-col gap-2">
      {musicFile && (
        <div className="rounded-xl p-3" style={{ background: COLORS.violetSoft }}>
          <div className="flex items-center gap-2 mb-1.5" style={{ color: COLORS.violetDeep }}>
            <Music size={14} />
            <span style={{ ...body, fontSize: 12.5, fontWeight: 600 }}>{musicFileName || "Audio track"}</span>
          </div>
          <audio controls src={musicFile} style={{ width: "100%", height: 36 }} />
        </div>
      )}
      {musicLink && parsed?.embed && (
        <iframe
          src={parsed.embed}
          title="music"
          style={{ width: "100%", height: parsed.type === "spotify" ? 152 : parsed.type === "soundcloud" ? 120 : 190, border: "none", borderRadius: 12 }}
          allow="autoplay; encrypted-media"
        />
      )}
      {musicLink && !parsed?.embed && (
        <a
          href={musicLink}
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-2 rounded-xl p-3"
          style={{ background: "#191414", color: "#fff", textDecoration: "none" }}
        >
          <SpotifyIcon size={18} />
          <span style={{ ...body, fontSize: 12.5, fontWeight: 600 }}>Open in Spotify ↗</span>
        </a>
      )}
    </div>
  );
}

// ---------- Editor ----------

function Editor({ initial, onSave, onCancel }) {
  const [title, setTitle] = useState(initial?.title || "");
  const [date, setDate] = useState(initial?.date || new Date().toISOString().slice(0, 10));
  const [text, setText] = useState(initial?.text || "");
  const [images, setImages] = useState(initial?.images || []);
  const [musicLink, setMusicLink] = useState(initial?.musicLink || "");
  const [musicFile, setMusicFile] = useState(initial?.musicFile || "");
  const [musicFileName, setMusicFileName] = useState(initial?.musicFileName || "");
  const [busy, setBusy] = useState(false);
  const [warn, setWarn] = useState("");
  const imgInputRef = useRef(null);
  const audioInputRef = useRef(null);

  const handleImages = async (files) => {
    setBusy(true);
    const arr = Array.from(files).slice(0, 8 - images.length);
    const resized = [];
    for (const f of arr) {
      try {
        resized.push(await resizeImage(f));
      } catch (e) {}
    }
    setImages((prev) => [...prev, ...resized]);
    setBusy(false);
  };

  const handleAudio = async (file) => {
    if (!file) return;
    if (file.size > 4.2 * 1024 * 1024) {
      setWarn("That audio file is too large to store (max ~4MB). Try a shorter clip, or paste a music link instead.");
      return;
    }
    setWarn("");
    setBusy(true);
    try {
      const data = await readFileAsDataURL(file);
      setMusicFile(data);
      setMusicFileName(file.name);
    } catch (e) {}
    setBusy(false);
  };

  const save = () => {
    if (!title.trim() && !text.trim()) return;
    onSave({
      id: initial?.id || uid(),
      title: title.trim(),
      date,
      text,
      images,
      musicLink: musicLink.trim(),
      musicFile,
      musicFileName,
      createdAt: initial?.createdAt || Date.now(),
    });
  };

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center p-4" style={{ background: "rgba(46,31,77,0.45)" }}>
      <div
        className="w-full max-w-xl max-h-[88vh] rounded-3xl flex flex-col overflow-hidden"
        style={{ background: COLORS.white, boxShadow: "0 30px 80px -20px rgba(46,31,77,0.5)" }}
      >
        <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: `1px solid ${COLORS.violetSoft}` }}>
          <h2 style={{ ...heading, color: COLORS.ink, fontWeight: 600, fontSize: 18 }}>
            {initial ? "Edit entry" : "New entry"}
          </h2>
          <button onClick={onCancel} style={{ color: COLORS.muted }}>
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-4">
          <div className="flex gap-3">
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              style={{ ...body, color: COLORS.ink, fontSize: 13, background: COLORS.violetSoft, borderRadius: 10, padding: "9px 12px", border: "none", outline: "none" }}
            />
          </div>

          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Title your entry..."
            style={{ ...heading, color: COLORS.ink, fontSize: 20, fontWeight: 600, border: "none", outline: "none" }}
          />

          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="What's on your mind today?"
            rows={7}
            style={{ ...body, color: COLORS.inkSoft, fontSize: 14.5, lineHeight: 1.6, border: "none", outline: "none", resize: "vertical" }}
          />

          {/* images */}
          <div className="flex flex-col gap-2">
            <span style={{ ...body, color: COLORS.inkSoft, fontSize: 12, fontWeight: 600 }}>Photos</span>
            <div className="flex flex-wrap gap-2">
              {images.map((src, i) => (
                <div key={i} className="relative w-16 h-16 rounded-xl overflow-hidden group">
                  <img src={src} alt="" className="w-full h-full object-cover" />
                  <button
                    onClick={() => setImages((prev) => prev.filter((_, idx) => idx !== i))}
                    className="absolute top-0.5 right-0.5 rounded-full p-0.5"
                    style={{ background: "rgba(46,31,77,0.7)" }}
                  >
                    <X size={11} color="#fff" />
                  </button>
                </div>
              ))}
              {images.length < 8 && (
                <button
                  onClick={() => imgInputRef.current?.click()}
                  className="w-16 h-16 rounded-xl flex items-center justify-center"
                  style={{ background: COLORS.violetSoft, color: COLORS.violet, border: `1.5px dashed ${COLORS.violetLine}` }}
                >
                  <Plus size={18} />
                </button>
              )}
            </div>
            <input
              ref={imgInputRef}
              type="file"
              accept="image/*"
              multiple
              hidden
              onChange={(e) => e.target.files && handleImages(e.target.files)}
            />
          </div>

          {/* music */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-1.5">
              <SpotifyIcon size={14} />
              <span style={{ ...body, color: COLORS.inkSoft, fontSize: 12, fontWeight: 600 }}>Spotify track</span>
            </div>
            <div
              className="flex items-center gap-2 rounded-xl px-3 py-2.5"
              style={{ background: COLORS.violetSoft, border: `1.5px solid ${COLORS.violetLine}` }}
            >
              <input
                value={musicLink}
                onChange={(e) => setMusicLink(e.target.value)}
                placeholder="Paste a Spotify song, album or playlist link"
                style={{ ...body, background: "transparent", border: "none", outline: "none", width: "100%", fontSize: 13, color: COLORS.ink }}
              />
              {musicLink && (
                <a
                  href={musicLink}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1 rounded-lg px-2 py-1 shrink-0"
                  style={{ background: "#191414", color: "#fff" }}
                >
                  <SpotifyIcon size={12} />
                  <span style={{ ...body, fontSize: 10.5, fontWeight: 600 }}>Open</span>
                </a>
              )}
            </div>
            {musicLink && (
              <span style={{ ...body, color: COLORS.muted, fontSize: 11 }}>
                Tip: in Spotify, tap Share → Copy Link on the song you want.
              </span>
            )}

            <div className="flex items-center gap-2 mt-1">
              <div className="flex-1 h-px" style={{ background: COLORS.violetLine }} />
              <span style={{ ...body, color: COLORS.muted, fontSize: 10.5 }}>or</span>
              <div className="flex-1 h-px" style={{ background: COLORS.violetLine }} />
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => audioInputRef.current?.click()}
                className="flex items-center gap-1.5 rounded-lg px-3 py-2"
                style={{ background: COLORS.violetSoft, color: COLORS.violetDeep }}
              >
                <Upload size={13} />
                <span style={{ ...body, fontSize: 12, fontWeight: 600 }}>
                  {musicFileName || "Upload an audio file"}
                </span>
              </button>
              {musicFile && (
                <button onClick={() => { setMusicFile(""); setMusicFileName(""); }} style={{ color: COLORS.muted }}>
                  <X size={15} />
                </button>
              )}
            </div>
            <input
              ref={audioInputRef}
              type="file"
              accept="audio/*"
              hidden
              onChange={(e) => handleAudio(e.target.files?.[0])}
            />
            {warn && <span style={{ ...body, color: COLORS.danger, fontSize: 11.5 }}>{warn}</span>}
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 px-6 py-4" style={{ borderTop: `1px solid ${COLORS.violetSoft}` }}>
          <button
            onClick={onCancel}
            style={{ ...body, color: COLORS.inkSoft, fontSize: 13.5, fontWeight: 600, padding: "9px 16px", borderRadius: 10 }}
          >
            Cancel
          </button>
          <button
            onClick={save}
            disabled={busy}
            className="flex items-center gap-1.5 transition-transform active:scale-[0.98]"
            style={{ ...heading, background: `linear-gradient(135deg, ${COLORS.violet}, ${COLORS.violetDeep})`, color: "#fff", fontWeight: 600, fontSize: 13.5, padding: "9px 18px", borderRadius: 10, opacity: busy ? 0.7 : 1 }}
          >
            <Check size={14} /> {busy ? "Saving..." : "Save entry"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ---------- Viewer ----------

function Viewer({ entry, onClose, onEdit }) {
  const [imgIdx, setImgIdx] = useState(0);
  const images = entry.images || [];

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center p-4" style={{ background: "rgba(46,31,77,0.45)" }}>
      <div
        className="w-full max-w-xl max-h-[88vh] rounded-3xl flex flex-col overflow-hidden"
        style={{ background: COLORS.white, boxShadow: "0 30px 80px -20px rgba(46,31,77,0.5)" }}
      >
        <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: `1px solid ${COLORS.violetSoft}` }}>
          <div className="flex items-center gap-1.5" style={{ color: COLORS.muted }}>
            <Calendar size={13} />
            <span style={{ ...body, fontSize: 12.5, fontWeight: 500 }}>{formatDate(entry.date)}</span>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => onEdit(entry)} style={{ color: COLORS.violet }}>
              <Edit2 size={17} />
            </button>
            <button onClick={onClose} style={{ color: COLORS.muted }}>
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-4">
          <h2 style={{ ...heading, color: COLORS.ink, fontWeight: 700, fontSize: 24 }}>
            {entry.title || "Untitled"}
          </h2>

          {images.length > 0 && (
            <div className="relative w-full rounded-2xl overflow-hidden flex items-center justify-center" style={{ background: COLORS.violetSoft, minHeight: 220, maxHeight: 480 }}>
  <img src={images[imgIdx]} alt="" className="w-full" style={{ maxHeight: 480, objectFit: "contain" }} />
                <>
                  <button
                    onClick={() => setImgIdx((i) => (i - 1 + images.length) % images.length)}
                    className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full p-1.5"
                    style={{ background: "rgba(46,31,77,0.55)" }}
                  >
                    <ChevronLeft size={16} color="#fff" />
                  </button>
                  <button
                    onClick={() => setImgIdx((i) => (i + 1) % images.length)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-1.5"
                    style={{ background: "rgba(46,31,77,0.55)" }}
                  >
                    <ChevronRight size={16} color="#fff" />
                  </button>
                  <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
                    {images.map((_, i) => (
                      <div
                        key={i}
                        className="rounded-full"
                        style={{ width: 5, height: 5, background: i === imgIdx ? "#fff" : "rgba(255,255,255,0.5)" }}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>
          )}

          <p style={{ ...body, color: COLORS.inkSoft, fontSize: 14.5, lineHeight: 1.75, whiteSpace: "pre-wrap" }}>
            {entry.text}
          </p>

          {(entry.musicLink || entry.musicFile) && (
            <MusicBlock musicLink={entry.musicLink} musicFile={entry.musicFile} musicFileName={entry.musicFileName} />
          )}
        </div>
      </div>
    </div>
  );
}

// ---------- App ----------

export default function App() {
  const [unlocked, setUnlocked] = useState(false);
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingEntry, setEditingEntry] = useState(null);
  const [viewingEntry, setViewingEntry] = useState(null);
  const [showEditor, setShowEditor] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [storageError, setStorageError] = useState(false);

  useEffect(() => {
    if (!unlocked) return;
    (async () => {
      setLoading(true);
      try {
        const res = await storageGet(STORAGE_KEY);
        const parsed = res?.value ? JSON.parse(res.value) : [];
        setEntries(parsed.sort((a, b) => (b.date + b.createdAt).localeCompare(a.date + a.createdAt)));
      } catch (e) {
        setEntries([]);
      }
      setLoading(false);
    })();
  }, [unlocked]);

  const persist = useCallback(async (next) => {
    setEntries(next);
    try {
      const result = await storageSet(STORAGE_KEY, JSON.stringify(next));
      if (!result) setStorageError(true);
    } catch (e) {
      setStorageError(true);
    }
  }, []);

  const handleSave = (entry) => {
    const exists = entries.some((e) => e.id === entry.id);
    const next = exists ? entries.map((e) => (e.id === entry.id ? entry : e)) : [entry, ...entries];
    next.sort((a, b) => (b.date + b.createdAt).localeCompare(a.date + a.createdAt));
    persist(next);
    setShowEditor(false);
    setEditingEntry(null);
    setViewingEntry(null);
  };

  const handleDelete = (entry) => {
    persist(entries.filter((e) => e.id !== entry.id));
    setConfirmDelete(null);
    setViewingEntry(null);
  };

  if (!unlocked) {
    return <LockScreen onUnlock={() => setUnlocked(true)} />;
  }

  return (
    <div
      className="w-full min-h-screen"
      style={{ background: `linear-gradient(160deg, ${COLORS.bgFrom}, ${COLORS.bgTo})`, ...body }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;800&family=Montserrat:wght@400;500;600;700&display=swap');
        .line-clamp-2 { display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
        * { box-sizing: border-box; }
        input:focus, textarea:focus { outline: none; }
      `}</style>

      <header className="flex items-center justify-between px-6 md:px-10 py-5 sticky top-0 z-30" style={{ background: "rgba(244,239,251,0.85)", backdropFilter: "blur(8px)" }}>
        <div className="flex items-center gap-2.5 min-w-0">
          <LilaMark size={30} />
          <span
            style={{ ...heading, color: COLORS.ink, fontWeight: 700, fontSize: 16 }}
            className="truncate"
          >
            Los Pensamientos de Jime
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => { setEditingEntry(null); setShowEditor(true); }}
            className="flex items-center gap-1.5 transition-transform active:scale-[0.97]"
            style={{ ...heading, background: `linear-gradient(135deg, ${COLORS.violet}, ${COLORS.violetDeep})`, color: "#fff", fontWeight: 600, fontSize: 13.5, padding: "9px 16px", borderRadius: 12 }}
          >
            <Plus size={15} /> New entry
          </button>
          <button
            onClick={() => setUnlocked(false)}
            className="p-2.5 rounded-xl"
            style={{ color: COLORS.violetDeep, background: COLORS.violetSoft }}
            title="Lock"
          >
            <LogOut size={16} />
          </button>
        </div>
      </header>

      <main className="px-6 md:px-10 pb-16 max-w-5xl mx-auto">
        {storageError && (
          <div className="rounded-xl p-3 mb-5" style={{ background: "#FBEAEC", color: COLORS.danger }}>
            <span style={{ ...body, fontSize: 12.5 }}>Couldn't save your last change. Check your connection and try again.</span>
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-24">
            <span style={{ ...body, color: COLORS.muted, fontSize: 13.5 }}>Loading your entries...</span>
          </div>
        ) : entries.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 gap-3 text-center">
            <LilaMark size={44} />
            <h3 style={{ ...heading, color: COLORS.ink, fontWeight: 600, fontSize: 18 }}>Your journal is empty</h3>
            <p style={{ ...body, color: COLORS.muted, fontSize: 13.5, maxWidth: 320 }}>
              Write your first entry, and add the photos and songs that go with it.
            </p>
            <button
              onClick={() => { setEditingEntry(null); setShowEditor(true); }}
              className="mt-2 flex items-center gap-1.5"
              style={{ ...heading, background: `linear-gradient(135deg, ${COLORS.violet}, ${COLORS.violetDeep})`, color: "#fff", fontWeight: 600, fontSize: 13.5, padding: "10px 18px", borderRadius: 12 }}
            >
              <Plus size={15} /> Start writing
            </button>
          </div>
        ) : (
          <div className="grid gap-4 pt-6" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(230px, 1fr))" }}>
            {entries.map((entry) => (
              <EntryCard
                key={entry.id}
                entry={entry}
                onOpen={setViewingEntry}
                onEdit={(e) => { setEditingEntry(e); setShowEditor(true); }}
                onDelete={setConfirmDelete}
              />
            ))}
          </div>
        )}
      </main>

      {showEditor && (
        <Editor
          initial={editingEntry}
          onSave={handleSave}
          onCancel={() => { setShowEditor(false); setEditingEntry(null); }}
        />
      )}

      {viewingEntry && !showEditor && (
        <Viewer
          entry={viewingEntry}
          onClose={() => setViewingEntry(null)}
          onEdit={(e) => { setEditingEntry(e); setShowEditor(true); }}
        />
      )}

      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(46,31,77,0.45)" }}>
          <div className="w-full max-w-xs rounded-2xl p-6 flex flex-col gap-4" style={{ background: COLORS.white }}>
            <h3 style={{ ...heading, color: COLORS.ink, fontWeight: 600, fontSize: 16 }}>Delete this entry?</h3>
            <p style={{ ...body, color: COLORS.muted, fontSize: 13 }}>This can't be undone.</p>
            <div className="flex justify-end gap-2">
              <button onClick={() => setConfirmDelete(null)} style={{ ...body, color: COLORS.inkSoft, fontWeight: 600, fontSize: 13, padding: "8px 14px", borderRadius: 10 }}>
                Cancel
              </button>
              <button
                onClick={() => handleDelete(confirmDelete)}
                style={{ ...heading, background: COLORS.danger, color: "#fff", fontWeight: 600, fontSize: 13, padding: "8px 14px", borderRadius: 10 }}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

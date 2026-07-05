"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { Bold, Heading2, Images, Italic, Link2, List, ListOrdered, Loader2, Pencil, Quote, Redo2, RemoveFormatting, Search, Trash2, Underline, Undo2, Upload, X } from "lucide-react";
import axios from "axios";
import { ConfirmDialog } from "@/components/common/confirm-dialog";
import { resolveBackendAssetUrl } from "@/lib/avatar";
import { adminMediaService, getAdminMediaId, getAdminMediaName, getAdminMediaUrl, type AdminMedia } from "@/services/admin-media.service";
import { Pagination } from "@/components/common/pagination";
import { Button } from "@/components/ui/button";

export function RichTextEditor({
  label = "Content",
  placeholder = "Write your content here...",
  value,
  message,
  onChange
}: {
  label?: string;
  placeholder?: string;
  value: string;
  message?: string;
  onChange: (value: string) => void;
}) {
  const editorRef = useRef<HTMLDivElement>(null);
  const initialValue = useRef(value);
  const selectionRef = useRef<Range | null>(null);
  const [mediaOpen, setMediaOpen] = useState(false);

  useEffect(() => {
    if (editorRef.current) editorRef.current.innerHTML = sanitizeRichTextHtml(initialValue.current);
  }, []);

  function emitChange() {
    if (editorRef.current) onChange(sanitizeRichTextHtml(editorRef.current.innerHTML));
  }

  function runCommand(command: string, commandValue?: string) {
    editorRef.current?.focus();
    document.execCommand(command, false, commandValue);
    emitChange();
  }

  function openMediaLibrary() {
    const selection = window.getSelection();
    if (selection?.rangeCount && editorRef.current?.contains(selection.anchorNode)) {
      selectionRef.current = selection.getRangeAt(0).cloneRange();
    }
    setMediaOpen(true);
  }

  function insertMedia(media: AdminMedia) {
    const src = resolveBackendAssetUrl(getAdminMediaUrl(media));
    if (!src) return;
    insertImage(src, getAdminMediaName(media));
  }

  function insertImageUrl(src: string) {
    insertImage(src, "Description image");
  }

  function insertImage(src: string, alt: string) {
    editorRef.current?.focus();
    const selection = window.getSelection();
    if (selectionRef.current && selection) {
      selection.removeAllRanges();
      selection.addRange(selectionRef.current);
    }
    document.execCommand("insertHTML", false, `<img src="${escapeHtmlAttribute(src)}" alt="${escapeHtmlAttribute(alt)}"><p><br></p>`);
    emitChange();
    setMediaOpen(false);
  }

  const tools = [
    { label: "Heading", icon: Heading2, command: "formatBlock", value: "h2" },
    { label: "Bold", icon: Bold, command: "bold" },
    { label: "Italic", icon: Italic, command: "italic" },
    { label: "Underline", icon: Underline, command: "underline" },
    { label: "Bulleted list", icon: List, command: "insertUnorderedList" },
    { label: "Numbered list", icon: ListOrdered, command: "insertOrderedList" },
    { label: "Quote", icon: Quote, command: "formatBlock", value: "blockquote" },
    { label: "Clear formatting", icon: RemoveFormatting, command: "removeFormat" },
    { label: "Undo", icon: Undo2, command: "undo" },
    { label: "Redo", icon: Redo2, command: "redo" }
  ] as const;

  return <div>
    <p className="text-sm font-semibold">{label}</p>
    <div className={`mt-2 overflow-hidden rounded-lg border bg-white ${message ? "border-rose-500" : "border-slate-200 focus-within:border-brand-600"}`}>
      <div className="flex flex-wrap gap-1 border-b border-slate-200 bg-slate-50 p-2">
        {tools.map((tool) => {
          const Icon = tool.icon;
          const commandValue = "value" in tool ? tool.value : undefined;
          return <button key={tool.label} type="button" title={tool.label} aria-label={tool.label} onMouseDown={(event) => { event.preventDefault(); runCommand(tool.command, commandValue); }} className="grid size-8 place-items-center rounded-md text-slate-600 hover:bg-white hover:text-brand-600"><Icon size={16} /></button>;
        })}
        <span className="mx-1 w-px bg-slate-200" />
        <button type="button" title="Insert image" aria-label="Insert image" onMouseDown={(event) => { event.preventDefault(); openMediaLibrary(); }} className="grid size-8 place-items-center rounded-md text-slate-600 hover:bg-white hover:text-brand-600"><Images size={16} /></button>
      </div>
      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        role="textbox"
        aria-multiline="true"
        aria-label={label}
        data-placeholder={placeholder}
        onInput={emitChange}
        onBlur={emitChange}
        onPaste={(event) => {
          event.preventDefault();
          const pastedHtml = event.clipboardData.getData("text/html");
          if (pastedHtml) {
            document.execCommand("insertHTML", false, sanitizeRichTextHtml(pastedHtml));
          } else {
            document.execCommand("insertText", false, event.clipboardData.getData("text/plain"));
          }
          emitChange();
        }}
        className="min-h-56 px-4 py-3 text-sm leading-7 outline-none empty:before:pointer-events-none empty:before:text-slate-400 empty:before:content-[attr(data-placeholder)] [&_blockquote]:my-3 [&_blockquote]:border-l-4 [&_blockquote]:border-brand-200 [&_blockquote]:pl-4 [&_h2]:my-3 [&_h2]:text-xl [&_h2]:font-bold [&_img]:my-4 [&_img]:max-h-96 [&_img]:max-w-full [&_img]:rounded-lg [&_ol]:ml-6 [&_ol]:list-decimal [&_ul]:ml-6 [&_ul]:list-disc"
      />
    </div>
    {message ? <p className="mt-2 text-xs font-semibold text-rose-600">{message}</p> : null}
    {mediaOpen ? <MediaLibrary onClose={() => setMediaOpen(false)} onInsert={insertMedia} onInsertUrl={insertImageUrl} /> : null}
  </div>;
}

function MediaLibrary({
  onClose,
  onInsert,
  onInsertUrl
}: {
  onClose: () => void;
  onInsert: (media: AdminMedia) => void;
  onInsertUrl: (url: string) => void;
}) {
  const [items, setItems] = useState<AdminMedia[]>([]);
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [pageCount, setPageCount] = useState(1);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [imageUrlError, setImageUrlError] = useState("");
  const [renaming, setRenaming] = useState<AdminMedia | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [deleting, setDeleting] = useState<AdminMedia | null>(null);
  const [processing, setProcessing] = useState(false);
  const pageSize = 20;

  const loadMedia = useCallback(async (nextPage = 1, nextQuery = "") => {
    setLoading(true);
    setError("");
    try {
      const result = await adminMediaService.list({ page: nextPage, limit: pageSize, search: nextQuery || undefined });
      const total = result.data.length > 0 ? result.pagination?.total ?? result.data.length : result.data.length;
      setItems(result.data);
      setTotalItems(total);
      setPageCount(result.pagination?.totalPages ?? Math.max(1, Math.ceil(total / pageSize)));
      setPage(nextPage);
    } catch (err) {
      setError("Cannot load the media library.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadMedia();
  }, [loadMedia]);

  function submitSearch() {
    const nextQuery = search.trim();
    setQuery(nextQuery);
    void loadMedia(1, nextQuery);
  }

  function changePage(nextPage: number) {
    void loadMedia(nextPage, query);
  }

  async function uploadMedia(file?: File) {
    if (!file) return;
    setUploading(true);
    setError("");
    try {
      const created = await adminMediaService.upload(file);
      if (created && getAdminMediaUrl(created)) {
        setItems((current) => [created, ...current.filter((item) => getAdminMediaId(item) !== getAdminMediaId(created))].slice(0, pageSize));
        setTotalItems((current) => current + 1);
        setPageCount((current) => Math.max(current, Math.ceil((totalItems + 1) / pageSize)));
      } else {
        await loadMedia(1, query);
      }
    } catch (err) {
      setError("Cannot upload this image.");
    } finally {
      setUploading(false);
    }
  }

  function insertUrl() {
    const value = imageUrl.trim();
    try {
      const parsedUrl = new URL(value);
      if (parsedUrl.protocol !== "http:" && parsedUrl.protocol !== "https:") throw new Error("Invalid protocol");
      setImageUrlError("");
      onInsertUrl(parsedUrl.toString());
    } catch {
      setImageUrlError("Enter a valid http or https image URL.");
    }
  }

  async function renameMedia() {
    if (!renaming || !renameValue.trim()) return;
    setProcessing(true);
    setError("");
    try {
      const updated = await adminMediaService.rename(getAdminMediaId(renaming), renameValue.trim());
      setItems((current) => current.map((item) => getAdminMediaId(item) === getAdminMediaId(renaming) ? { ...item, ...updated, original_name: updated?.original_name ?? renameValue.trim() } : item));
      setRenaming(null);
    } catch (err) {
      setError(getMediaApiError(err, "Cannot rename this image."));
    } finally {
      setProcessing(false);
    }
  }

  async function deleteMedia() {
    if (!deleting) return;
    setProcessing(true);
    setError("");
    try {
      await adminMediaService.remove(getAdminMediaId(deleting));
      setItems((current) => current.filter((item) => getAdminMediaId(item) !== getAdminMediaId(deleting)));
      setTotalItems((current) => Math.max(0, current - 1));
      setDeleting(null);
    } catch (err) {
      setError(getMediaApiError(err, "Cannot delete this image. It may currently be used by a blog."));
      setDeleting(null);
    } finally {
      setProcessing(false);
    }
  }

  return <div className="fixed inset-0 z-[70] grid place-items-center bg-black/55 p-4">
    <div className="max-h-[88vh] w-full max-w-4xl overflow-auto rounded-lg bg-white p-6 shadow-soft">
      <div className="flex items-start justify-between gap-4"><div><h3 className="text-xl font-bold">Media Library</h3><p className="mt-1 text-sm text-slate-500">Upload an image or choose one already stored by the backend.</p></div><button type="button" onClick={onClose} className="grid size-9 place-items-center rounded-full hover:bg-slate-100" aria-label="Close media library"><X size={18} /></button></div>
      {error ? <div className="mt-4 rounded-lg bg-rose-50 p-3 text-sm font-semibold text-rose-700">{error}</div> : null}
      <div className="mt-5 rounded-lg border border-slate-200 bg-slate-50 p-4">
        <label htmlFor="rich-text-image-url" className="text-sm font-semibold">Insert image from URL</label>
        <div className="mt-2 flex flex-col gap-2 sm:flex-row">
          <div className="relative min-w-0 flex-1">
            <Link2 className="absolute left-3 top-3 size-5 text-slate-400" />
            <input
              id="rich-text-image-url"
              type="url"
              value={imageUrl}
              onChange={(event) => { setImageUrl(event.target.value); setImageUrlError(""); }}
              onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); insertUrl(); } }}
              className={`h-11 w-full rounded-lg border bg-white pl-10 pr-3 text-sm outline-none focus:border-brand-600 ${imageUrlError ? "border-rose-500" : "border-slate-200"}`}
              placeholder="https://example.com/image.jpg"
            />
          </div>
          <Button type="button" onClick={insertUrl} disabled={!imageUrl.trim()}><Images size={16} /> Insert URL</Button>
        </div>
        {imageUrlError ? <p className="mt-2 text-xs font-semibold text-rose-600">{imageUrlError}</p> : null}
      </div>
      <div className="mt-5 flex flex-col gap-3 sm:flex-row">
        <div className="flex min-w-0 flex-1 gap-2"><div className="relative min-w-0 flex-1"><Search className="absolute left-3 top-3 size-5 text-slate-400" /><input value={search} onChange={(event) => setSearch(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); submitSearch(); } }} className="h-11 w-full rounded-lg border border-slate-200 pl-10 pr-3 text-sm outline-none focus:border-brand-600" placeholder="Search media..." /></div><Button type="button" variant="outline" disabled={loading} onClick={submitSearch}>Search</Button></div>
        <label className={`inline-flex h-11 cursor-pointer items-center justify-center gap-2 rounded-lg bg-brand-600 px-5 text-sm font-semibold text-white ${uploading ? "pointer-events-none opacity-60" : ""}`}>{uploading ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />} Upload Image<input type="file" accept="image/*" className="hidden" disabled={uploading} onChange={(event) => { void uploadMedia(event.target.files?.[0]); event.currentTarget.value = ""; }} /></label>
      </div>
      <div className="mt-5 grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {loading ? <div className="col-span-full p-10 text-center text-sm text-slate-500"><Loader2 className="mr-2 inline size-5 animate-spin" /> Loading media...</div>
          : items.length === 0 ? <div className="col-span-full p-10 text-center text-sm text-slate-500">No images found.</div>
            : items.map((media) => { const mediaUrl = resolveBackendAssetUrl(getAdminMediaUrl(media)); return <div key={getAdminMediaId(media)} className="group overflow-hidden rounded-lg border border-slate-200 hover:border-brand-500 hover:shadow-sm"><button type="button" onClick={() => onInsert(media)} disabled={!mediaUrl} className="block w-full text-left disabled:opacity-50"><span className="block h-36 bg-slate-100">{mediaUrl ? <Image src={mediaUrl} alt={getAdminMediaName(media)} width={320} height={144} unoptimized className="h-full w-full object-cover" /> : null}</span><span className="block truncate px-3 pt-3 text-sm font-semibold">{getAdminMediaName(media)}</span><span className="block px-3 pb-2 text-xs text-brand-600">Insert into blog</span></button><div className="flex justify-end gap-1 border-t border-slate-100 p-2"><button type="button" onClick={() => { setRenaming(media); setRenameValue(getAdminMediaName(media)); }} className="grid size-8 place-items-center rounded-md text-slate-500 hover:bg-slate-100 hover:text-brand-600" aria-label={`Rename ${getAdminMediaName(media)}`}><Pencil size={15} /></button><button type="button" onClick={() => setDeleting(media)} className="grid size-8 place-items-center rounded-md text-slate-500 hover:bg-rose-50 hover:text-rose-600" aria-label={`Delete ${getAdminMediaName(media)}`}><Trash2 size={15} /></button></div></div>; })}
      </div>
      <Pagination page={page} pageCount={pageCount} totalItems={totalItems} pageSize={pageSize} itemLabel="images" onPageChange={changePage} />
    </div>
    {renaming ? <div className="fixed inset-0 z-[80] grid place-items-center bg-black/45 p-4"><form className="w-full max-w-md rounded-lg bg-white p-6 shadow-soft" onSubmit={(event) => { event.preventDefault(); void renameMedia(); }}><div className="flex items-center justify-between"><h4 className="text-lg font-bold">Rename image</h4><button type="button" onClick={() => setRenaming(null)} disabled={processing} className="grid size-9 place-items-center rounded-full hover:bg-slate-100" aria-label="Close"><X size={18} /></button></div><label className="mt-5 block text-sm font-semibold">Display name<input autoFocus value={renameValue} maxLength={255} onChange={(event) => setRenameValue(event.target.value)} className="mt-2 h-11 w-full rounded-lg border border-slate-200 px-3 outline-none focus:border-brand-600" /></label><div className="mt-6 flex justify-end gap-3"><Button type="button" variant="outline" onClick={() => setRenaming(null)} disabled={processing}>Cancel</Button><Button type="submit" disabled={processing || !renameValue.trim()}>{processing ? <Loader2 size={16} className="animate-spin" /> : null} Save</Button></div></form></div> : null}
    {deleting ? <ConfirmDialog title="Delete media image?" message={`Delete “${getAdminMediaName(deleting)}”? Images currently used by a blog cannot be deleted.`} onCancel={() => setDeleting(null)} onConfirm={() => void deleteMedia()} /> : null}
  </div>;
}

function getMediaApiError(error: unknown, fallback: string) {
  if (!axios.isAxiosError(error)) return fallback;
  const data = error.response?.data as { message?: string; error?: string } | undefined;
  return data?.message ?? data?.error ?? fallback;
}

export function getRichTextPlainText(value?: string) {
  return (value ?? "")
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;|&#160;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/\s+/g, " ")
    .trim();
}

function sanitizeRichTextHtml(value: string) {
  if (typeof window === "undefined") return value;
  const documentNode = new DOMParser().parseFromString(value, "text/html");
  const allowedTags = new Set(["P", "BR", "DIV", "H2", "STRONG", "B", "EM", "I", "U", "UL", "OL", "LI", "BLOCKQUOTE", "IMG"]);

  Array.from(documentNode.body.querySelectorAll("*")).forEach((element) => {
    if (!allowedTags.has(element.tagName)) {
      element.replaceWith(...Array.from(element.childNodes));
      return;
    }
    if (element.tagName === "IMG") {
      const src = getPastedImageSource(element);
      if (!/^(https?:\/\/|\/)/i.test(src)) {
        element.remove();
        return;
      }
      element.setAttribute("src", src);
      Array.from(element.attributes).forEach((attribute) => {
        if (attribute.name !== "src" && attribute.name !== "alt") element.removeAttribute(attribute.name);
      });
      return;
    }
    Array.from(element.attributes).forEach((attribute) => element.removeAttribute(attribute.name));
  });

  return documentNode.body.innerHTML;
}

function getPastedImageSource(element: Element) {
  const directSource = element.getAttribute("src")
    || element.getAttribute("data-src")
    || element.getAttribute("data-original")
    || element.getAttribute("data-lazy-src");

  if (directSource && !directSource.startsWith("data:image")) return directSource;

  const srcSet = element.getAttribute("srcset") || element.getAttribute("data-srcset") || "";
  const largestSource = srcSet
    .split(",")
    .map((candidate) => candidate.trim().split(/\s+/)[0])
    .filter(Boolean)
    .at(-1);

  return largestSource ?? directSource ?? "";
}

function escapeHtmlAttribute(value: string) {
  return value.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

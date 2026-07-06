import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bug,
  X,
  Paperclip,
  Send,
  Loader2,
  Image as ImageIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { useAuth } from "@/hooks/use-auth";

interface BugReportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function BugReportModal({ open, onOpenChange }: BugReportModalProps) {
  const { user } = useAuth();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (selectedFile.size > 5 * 1024 * 1024) {
        toast.error("O arquivo deve ter no máximo 5MB.");
        return;
      }
      setFile(selectedFile);
      if (selectedFile.type.startsWith("image/")) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setFilePreview(reader.result as string);
        };
        reader.readAsDataURL(selectedFile);
      } else {
        setFilePreview(null);
      }
    }
  };

  const handleRemoveFile = () => {
    setFile(null);
    setFilePreview(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) {
      toast.error("Por favor, preencha o título e a descrição.");
      return;
    }

    setSubmitting(true);
    let attachmentUrl = "";

    try {
      // 1. Upload attachment to Supabase Storage if file exists
      if (file) {
        const fileExt = file.name.split(".").pop();
        const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
        const filePath = `bug-reports/${fileName}`;

        // Attempt upload (resilient to bucket not existing yet or permissions issues)
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from("attachments")
          .upload(filePath, file, { cacheControl: "3600", upsert: true });

        if (uploadError) {
          console.warn(
            "Storage upload failed, trying to save report anyway:",
            uploadError.message,
          );
        } else if (uploadData) {
          const {
            data: { publicUrl },
          } = supabase.storage.from("attachments").getPublicUrl(filePath);
          attachmentUrl = publicUrl;
        }
      }

      // 2. Save report to Supabase Table (Best effort - if table doesn't exist, we still mailto)
      try {
        await supabase.from("bug_reports").insert({
          title: title.trim(),
          description: description.trim(),
          attachment_url: attachmentUrl || null,
          user_email: user?.email || "anonymous",
          created_at: new Date().toISOString(),
        });
      } catch (dbErr) {
        console.warn("Could not save bug report to Supabase table:", dbErr);
      }

      // 3. Enviar e-mail de forma silenciosa via AJAX usando FormSubmit
      const emailRecipient = "victorwolfegan@gmail.com";
      try {
        await fetch(`https://formsubmit.co/ajax/${emailRecipient}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({
            _subject: `[Zenfi Bug Report] ${title.trim()}`,
            "E-mail do Usuário": user?.email || "Não identificado",
            "Título do Reporte": title.trim(),
            Descrição: description.trim(),
            "Link do Anexo": attachmentUrl || "Nenhum",
            _honey: "",
          }),
        });
      } catch (mailErr) {
        console.warn(
          "FormSubmit failed, report was still saved in DB:",
          mailErr,
        );
      }

      toast.success(
        "Muito obrigado! Seu reporte foi enviado diretamente ao desenvolvedor.",
      );

      // Reset form
      setTitle("");
      setDescription("");
      setFile(null);
      setFilePreview(null);
      onOpenChange(false);
    } catch (err: any) {
      toast.error(
        "Ocorreu um erro ao processar o reporte: " +
          (err.message || "Tente novamente."),
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px] rounded-2xl bg-card border text-foreground p-6">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 rounded-lg bg-destructive/10 flex items-center justify-center">
              <Bug className="w-4 h-4 text-destructive" />
            </div>
            <DialogTitle className="text-base font-semibold">
              Reportar Bug / Sugestão
            </DialogTitle>
          </div>
          <DialogDescription className="text-xs text-muted-foreground">
            Encontrou algum problema ou tem sugestões de melhoria? Descreva
            abaixo para que possamos corrigir.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-3">
          <div className="space-y-1.5">
            <Label htmlFor="bug-title" className="text-xs font-semibold">
              Título do problema <span className="text-destructive">*</span>
            </Label>
            <Input
              id="bug-title"
              placeholder="Ex: Erro ao cadastrar transação no débito"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="h-10 rounded-xl border bg-background text-sm"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="bug-desc" className="text-xs font-semibold">
              Descrição detalhada <span className="text-destructive">*</span>
            </Label>
            <textarea
              id="bug-desc"
              rows={4}
              placeholder="Descreva o que aconteceu, o que você estava fazendo e o comportamento esperado..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              className="w-full text-sm rounded-xl border bg-background p-3 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">
              Anexo{" "}
              <span className="text-muted-foreground font-normal">
                (Imagem ou arquivo, máx 5MB)
              </span>
            </Label>

            {!file ? (
              <label className="flex flex-col items-center justify-center border-2 border-dashed border-border hover:border-primary/40 rounded-xl p-4 cursor-pointer hover:bg-secondary/40 transition-all duration-200">
                <Paperclip className="w-5 h-5 text-muted-foreground mb-1" />
                <span className="text-xs text-muted-foreground font-medium">
                  Clique para selecionar arquivo
                </span>
                <input
                  type="file"
                  accept="image/*,application/pdf,text/plain"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>
            ) : (
              <div className="flex items-center gap-3 p-3 rounded-xl border bg-secondary/30">
                {filePreview ? (
                  <img
                    src={filePreview}
                    alt="Preview"
                    className="w-12 h-12 rounded-lg object-cover border shrink-0"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-lg bg-secondary flex items-center justify-center shrink-0 border">
                    <ImageIcon className="w-5 h-5 text-muted-foreground" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium truncate">{file.name}</p>
                  <p className="text-[10px] text-muted-foreground">
                    {(file.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleRemoveFile}
                  className="p-1.5 rounded-lg hover:bg-destructive/10 hover:text-destructive text-muted-foreground transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          <DialogFooter className="gap-2 pt-2 border-t mt-4">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="rounded-xl h-10 text-xs font-medium"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              size="sm"
              className="rounded-xl h-10 text-xs font-semibold flex-1 flex items-center justify-center gap-1.5"
              disabled={submitting || !title.trim() || !description.trim()}
            >
              {submitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Processando...
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  Reportar Bug
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

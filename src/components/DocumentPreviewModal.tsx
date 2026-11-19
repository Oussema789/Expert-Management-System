import { Download, FileText, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { getAttachmentBlob } from '../storage/localDb';
import { DOCUMENT_CATEGORY_LABELS, DocumentAttachmentMeta } from '../types/database';

interface DocumentPreviewModalProps {
  attachment: DocumentAttachmentMeta | null;
  expertName: string;
  onClose: () => void;
}

export function DocumentPreviewModal({
  attachment,
  expertName,
  onClose,
}: DocumentPreviewModalProps) {
  const [objectUrl, setObjectUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let active = true;
    let createdUrl: string | null = null;

    async function load() {
      if (!attachment) {
        setObjectUrl(null);
        return;
      }
      setLoading(true);
      const blob = await getAttachmentBlob(attachment.id);
      if (!active) return;
      if (blob) {
        createdUrl = URL.createObjectURL(blob);
        setObjectUrl(createdUrl);
      } else {
        setObjectUrl(null);
      }
      setLoading(false);
    }

    load();
    return () => {
      active = false;
      if (createdUrl) {
        URL.revokeObjectURL(createdUrl);
      }
    };
  }, [attachment]);

  if (!attachment) return null;

  const isPdf =
    attachment.mimeType === 'application/pdf' ||
    attachment.fileName.toLowerCase().endsWith('.pdf');
  const isImage = attachment.mimeType.startsWith('image/');

  const handleDownload = () => {
    if (!objectUrl) return;
    const link = document.createElement('a');
    link.href = objectUrl;
    link.download = attachment.fileName;
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
    >
      <div className="bg-white border border-slate-200 rounded-xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden shadow-xl">
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between gap-4">
          <div className="min-w-0">
            <div className="text-xs text-slate-500">
              {DOCUMENT_CATEGORY_LABELS[attachment.category]} · {expertName}
            </div>
            <h3 className="text-base font-semibold text-slate-900 truncate mt-0.5">
              {attachment.fileName}
            </h3>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {objectUrl && (
              <button
                type="button"
                onClick={handleDownload}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-white bg-gerep-blue rounded-lg hover:bg-gerep-blue-dark transition-colors whitespace-nowrap"
              >
                <Download className="w-3.5 h-3.5" />
                Télécharger
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
              aria-label="Fermer l’aperçu"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="flex-1 bg-slate-100 p-4 overflow-auto min-h-[420px] flex items-center justify-center">
          {loading ? (
            <div className="text-sm text-slate-500">Chargement du document local...</div>
          ) : !objectUrl ? (
            <div className="text-center max-w-md space-y-2">
              <FileText className="w-10 h-10 text-slate-400 mx-auto" />
              <p className="text-sm font-medium text-slate-700">
                Fichier binaire introuvable dans le stockage local.
              </p>
              <p className="text-xs text-slate-500">
                Importez à nouveau ce document depuis la fiche de l’expert pour l’archiver localement.
              </p>
            </div>
          ) : isPdf ? (
            <iframe
              src={objectUrl}
              title={attachment.fileName}
              className="w-full h-[68vh] rounded-lg border border-slate-200 bg-white"
            />
          ) : isImage ? (
            <img
              src={objectUrl}
              alt={attachment.fileName}
              referrerPolicy="no-referrer"
              className="max-w-full max-h-[68vh] rounded-lg border border-slate-200 object-contain bg-white"
            />
          ) : (
            <div className="bg-white border border-slate-200 rounded-xl p-8 text-center max-w-md space-y-3">
              <FileText className="w-10 h-10 text-emerald-700 mx-auto" />
              <h4 className="text-sm font-semibold text-slate-900">
                Aperçu direct indisponible pour ce format
              </h4>
              <p className="text-xs text-slate-600">
                Le fichier <span className="font-mono">{attachment.fileName}</span> est bien archivé
                localement ({(attachment.fileSize / 1024).toFixed(1)} Ko).
              </p>
              <button
                type="button"
                onClick={handleDownload}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-white bg-emerald-700 rounded-lg hover:bg-emerald-800 transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                Télécharger le fichier
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

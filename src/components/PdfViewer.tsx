'use client';

import { FileText, ExternalLink, Download } from 'lucide-react';

interface PdfViewerProps {
  blobUrl: string;
  filename: string;
}

export function PdfViewer({ blobUrl, filename }: PdfViewerProps) {
  const isDataUrl = blobUrl.startsWith('data:');

  return (
    <div className="flex flex-col h-full bg-slate-900 rounded-xl overflow-hidden border border-slate-800 shadow-sm">
      <div className="bg-slate-800 px-4 py-2.5 flex items-center justify-between border-b border-slate-700 text-white">
        <div className="flex items-center space-x-2 overflow-hidden">
          <FileText className="w-4 h-4 text-blue-400 flex-shrink-0" />
          <span className="text-xs font-semibold truncate" title={filename}>
            {filename}
          </span>
        </div>

        <div className="flex items-center space-x-2">
          {!isDataUrl && (
            <a
              href={blobUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="p-1.5 hover:bg-slate-700 text-slate-300 hover:text-white rounded-md transition"
              title="Open in new tab"
            >
              <ExternalLink className="w-4 h-4" />
            </a>
          )}
          <a
            href={blobUrl}
            download={filename}
            className="p-1.5 hover:bg-slate-700 text-slate-300 hover:text-white rounded-md transition"
            title="Download PDF"
          >
            <Download className="w-4 h-4" />
          </a>
        </div>
      </div>

      <div className="flex-1 w-full h-[600px] min-h-[500px] relative bg-slate-950">
        <iframe
          src={blobUrl}
          className="w-full h-full border-0"
          title={filename}
        />
      </div>
    </div>
  );
}

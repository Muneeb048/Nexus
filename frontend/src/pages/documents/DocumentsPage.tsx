import React, { useState, useEffect, useRef } from 'react';
import { FileText, Upload, Download, Trash2, Share2, PenTool, X } from 'lucide-react';
import { Card, CardHeader, CardBody } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { useAuth } from '../../context/AuthContext';
import { documentsAPI } from '../../services/api';
import toast from 'react-hot-toast';
import { Document as PdfDocument, Page, pdfjs } from 'react-pdf';
import SignatureCanvas from 'react-signature-canvas';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

// Configure pdfjs worker
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface DocumentMeta {
  _id: string;
  originalName: string;
  filename: string;
  mimetype: string;
  size: number;
  url: string;
  signatureUrl: string | null;
  uploadedBy: any;
  createdAt: string;
}

export const DocumentsPage: React.FC = () => {
  const { user } = useAuth();
  const [documents, setDocuments] = useState<DocumentMeta[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Preview & Sign Modal State
  const [selectedDoc, setSelectedDoc] = useState<DocumentMeta | null>(null);
  const [numPages, setNumPages] = useState<number | null>(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [showSignPad, setShowSignPad] = useState(false);
  const sigCanvas = useRef<any>(null);

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    try {
      const response = await documentsAPI.getDocuments();
      setDocuments(response.data.documents);
    } catch (error) {
      toast.error('Failed to fetch documents');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('document', file);

    try {
      const loadingToast = toast.loading('Uploading document...');
      await documentsAPI.uploadDocument(formData);
      toast.dismiss(loadingToast);
      toast.success('Document uploaded successfully');
      fetchDocuments();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to upload document');
    }
    
    // Reset file input
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this document?')) return;
    try {
      await documentsAPI.deleteDocument(id);
      toast.success('Document deleted');
      fetchDocuments();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to delete document');
    }
  };

  const handleSign = async () => {
    if (!selectedDoc || !sigCanvas.current) return;
    
    if (sigCanvas.current.isEmpty()) {
      toast.error('Please provide a signature first');
      return;
    }

    const signatureDataUrl = sigCanvas.current.getTrimmedCanvas().toDataURL('image/png');
    
    try {
      const loadingToast = toast.loading('Saving signature...');
      await documentsAPI.signDocument(selectedDoc._id, signatureDataUrl);
      toast.dismiss(loadingToast);
      toast.success('Document signed successfully');
      
      // Close modal and refresh
      setShowSignPad(false);
      setSelectedDoc(null);
      fetchDocuments();
    } catch (error) {
      toast.error('Failed to sign document');
    }
  };

  const clearSignature = () => {
    sigCanvas.current?.clear();
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  function onDocumentLoadSuccess({ numPages }: { numPages: number }) {
    setNumPages(numPages);
    setPageNumber(1);
  }

  // Helper to build full URL dynamically
  const getFullUrl = (url: string) => {
    const baseUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
    return `${baseUrl}${url}`;
  };

  return (
    <div className="space-y-6 animate-fade-in relative">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Documents</h1>
          <p className="text-gray-600">Manage your startup's important files and contracts</p>
        </div>
        
        <input 
          type="file" 
          ref={fileInputRef} 
          onChange={handleFileUpload} 
          className="hidden" 
          accept=".pdf,.doc,.docx,.xls,.xlsx,image/*" 
        />
        <Button 
          leftIcon={<Upload size={18} />}
          onClick={() => fileInputRef.current?.click()}
        >
          Upload Document
        </Button>
      </div>
      
      <Card>
        <CardHeader className="flex justify-between items-center">
          <h2 className="text-lg font-medium text-gray-900">All Documents</h2>
        </CardHeader>
        <CardBody>
          {isLoading ? (
            <div className="p-4 text-center">Loading documents...</div>
          ) : documents.length === 0 ? (
            <div className="p-8 text-center text-gray-500 border-2 border-dashed border-gray-300 rounded-lg">
              No documents found. Upload one to get started.
            </div>
          ) : (
            <div className="space-y-2">
              {documents.map(doc => (
                <div
                  key={doc._id}
                  className="flex flex-col sm:flex-row items-start sm:items-center p-4 hover:bg-gray-50 rounded-lg transition-colors duration-200 border border-transparent hover:border-gray-200"
                >
                  <div className="p-2 bg-primary-50 rounded-lg mr-4 mb-2 sm:mb-0">
                    <FileText size={24} className="text-primary-600" />
                  </div>
                  
                  <div className="flex-1 min-w-0 cursor-pointer" onClick={() => setSelectedDoc(doc)}>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-medium text-gray-900 truncate hover:text-primary-600 transition-colors">
                        {doc.originalName}
                      </h3>
                      {doc.signatureUrl && (
                        <Badge variant="success" size="sm">Signed</Badge>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-4 mt-1 text-xs text-gray-500">
                      <span>{formatFileSize(doc.size)}</span>
                      <span>Uploaded {new Date(doc.createdAt).toLocaleDateString()}</span>
                      {doc.uploadedBy && doc.uploadedBy._id !== user?.id && (
                        <span>By {doc.uploadedBy.name}</span>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 ml-0 sm:ml-4 mt-3 sm:mt-0">
                    <a
                      href={getFullUrl(doc.url)}
                      download={doc.originalName}
                      target="_blank"
                      rel="noreferrer"
                      className="p-2 text-gray-500 hover:text-primary-600 hover:bg-primary-50 rounded-md transition-colors"
                      title="Download"
                    >
                      <Download size={18} />
                    </a>
                    
                    <button
                      onClick={() => { setSelectedDoc(doc); setShowSignPad(true); }}
                      className="p-2 text-gray-500 hover:text-green-600 hover:bg-green-50 rounded-md transition-colors"
                      title="Sign Document"
                    >
                      <PenTool size={18} />
                    </button>
                    
                    {doc.uploadedBy?._id === user?.id && (
                      <button
                        onClick={() => handleDelete(doc._id)}
                        className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                        title="Delete"
                      >
                        <Trash2 size={18} />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardBody>
      </Card>

      {/* Preview / Sign Modal */}
      {selectedDoc && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl">
            
            {/* Modal Header */}
            <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
              <div className="flex items-center gap-3">
                <FileText className="text-primary-600" />
                <h3 className="font-semibold text-gray-900 truncate">{selectedDoc.originalName}</h3>
                {selectedDoc.signatureUrl && <Badge variant="success">Signed</Badge>}
              </div>
              <button 
                onClick={() => { setSelectedDoc(null); setShowSignPad(false); }}
                className="p-1 hover:bg-gray-200 rounded-full transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-6 bg-gray-100 flex flex-col items-center">
              
              {/* Document Preview Area */}
              {!showSignPad ? (
                <div className="bg-white p-4 shadow-sm border border-gray-200 inline-block min-w-[300px]">
                  {selectedDoc.mimetype === 'application/pdf' ? (
                    <div className="flex flex-col items-center">
                      <PdfDocument
                        file={getFullUrl(selectedDoc.url)}
                        onLoadSuccess={onDocumentLoadSuccess}
                        loading={<div className="p-10">Loading PDF...</div>}
                        error={<div className="p-10 text-red-500">Failed to load PDF.</div>}
                      >
                        <Page pageNumber={pageNumber} width={Math.min(window.innerWidth * 0.8, 800)} />
                      </PdfDocument>
                      {numPages && (
                        <div className="mt-4 flex gap-4 items-center">
                          <Button 
                            size="sm" variant="outline" 
                            disabled={pageNumber <= 1} 
                            onClick={() => setPageNumber(prev => prev - 1)}
                          >Previous</Button>
                          <span className="text-sm">Page {pageNumber} of {numPages}</span>
                          <Button 
                            size="sm" variant="outline" 
                            disabled={pageNumber >= numPages} 
                            onClick={() => setPageNumber(prev => prev + 1)}
                          >Next</Button>
                        </div>
                      )}
                    </div>
                  ) : selectedDoc.mimetype.startsWith('image/') ? (
                    <img src={getFullUrl(selectedDoc.url)} alt="Document preview" className="max-w-full h-auto" />
                  ) : (
                    <div className="p-10 text-center flex flex-col items-center gap-4">
                      <FileText size={48} className="text-gray-400" />
                      <p className="text-gray-600">Preview not available for this file type.</p>
                      <a href={getFullUrl(selectedDoc.url)} target="_blank" rel="noreferrer" className="text-primary-600 hover:underline">
                        Download to view
                      </a>
                    </div>
                  )}

                  {/* Show existing signature if any */}
                  {selectedDoc.signatureUrl && (
                    <div className="mt-8 pt-4 border-t border-gray-200">
                      <p className="text-sm font-medium text-gray-500 mb-2">E-Signature</p>
                      <img src={getFullUrl(selectedDoc.signatureUrl)} alt="Signature" className="h-20 bg-gray-50 border border-gray-100 p-2 rounded" />
                    </div>
                  )}
                </div>
              ) : (
                /* Signature Pad Area */
                <div className="bg-white p-6 shadow-sm border border-gray-200 rounded-lg w-full max-w-2xl">
                  <h4 className="text-lg font-medium mb-4">Sign Document</h4>
                  <p className="text-sm text-gray-600 mb-4">Please draw your signature below:</p>
                  
                  <div className="border-2 border-dashed border-gray-300 rounded-lg bg-gray-50 relative">
                    <SignatureCanvas 
                      ref={sigCanvas}
                      canvasProps={{
                        className: 'signature-canvas w-full h-64',
                      }}
                      backgroundColor="rgba(255,255,255,1)"
                    />
                  </div>
                  
                  <div className="mt-6 flex justify-between">
                    <Button variant="outline" onClick={clearSignature}>
                      Clear
                    </Button>
                    <div className="flex gap-2">
                      <Button variant="ghost" onClick={() => setShowSignPad(false)}>
                        Cancel
                      </Button>
                      <Button onClick={handleSign}>
                        Save Signature
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer (only show if not signing) */}
            {!showSignPad && (
               <div className="p-4 border-t border-gray-200 bg-white flex justify-end gap-3">
                 <Button variant="outline" onClick={() => setSelectedDoc(null)}>Close</Button>
                 <Button onClick={() => setShowSignPad(true)} leftIcon={<PenTool size={18} />}>
                   Sign Document
                 </Button>
               </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
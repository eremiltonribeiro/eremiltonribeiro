import * as React from "react";
import { useDropzone } from "react-dropzone";
import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";
import { Upload, FileImage } from "lucide-react";

export interface FileInputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  required?: boolean;
  description?: string;
  maxSize?: number; // in MB
  accept?: string[];
  onFileChange?: (file: File | null) => void;
  defaultPreview?: string;
  error?: string;
}

export const FileInput = React.forwardRef<HTMLInputElement, FileInputProps>(
  (
    {
      className,
      label,
      required = false,
      description = "PNG, JPG, GIF até 10MB",
      maxSize = 10, // 10MB default
      accept = ["image/jpeg", "image/png", "image/gif"],
      onFileChange,
      defaultPreview,
      error,
      ...props
    },
    ref
  ) => {
    const [preview, setPreview] = React.useState<string | null>(defaultPreview || null);
    const [fileError, setFileError] = React.useState<string | null>(null);

    const onDrop = React.useCallback(
      (acceptedFiles: File[]) => {
        if (acceptedFiles.length > 0) {
          const file = acceptedFiles[0];
          
          // Check file size
          if (file.size > maxSize * 1024 * 1024) {
            setFileError(`O arquivo é muito grande. Tamanho máximo: ${maxSize}MB`);
            return;
          }
          
          // Create preview
          const objectUrl = URL.createObjectURL(file);
          setPreview(objectUrl);
          setFileError(null);
          
          // Call parent callback
          if (onFileChange) {
            onFileChange(file);
          }
        }
      },
      [maxSize, onFileChange]
    );

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
      onDrop,
      accept: accept.reduce((obj, curr) => {
        return { ...obj, [curr]: [] };
      }, {}),
      maxFiles: 1,
      multiple: false,
    });

    // Cleanup preview URL when component unmounts
    React.useEffect(() => {
      return () => {
        if (preview && !preview.startsWith("/uploads/")) {
          URL.revokeObjectURL(preview);
        }
      };
    }, [preview]);

    // Reset preview if defaultPreview changes
    React.useEffect(() => {
      if (defaultPreview) {
        setPreview(defaultPreview);
      }
    }, [defaultPreview]);

    return (
      <div className="space-y-2">
        {label && (
          <Label className={cn(required && "after:content-['*'] after:text-red-500 after:ml-0.5")}>
            {label}
          </Label>
        )}
        
        <div
          {...getRootProps()}
          className={cn(
            "flex flex-col items-center justify-center w-full p-6 border-2 border-dashed rounded-lg transition-colors cursor-pointer",
            isDragActive
              ? "border-primary-500 bg-primary-50"
              : error || fileError
              ? "border-red-300 bg-red-50"
              : "border-gray-300 bg-gray-50 hover:bg-gray-100",
            className
          )}
        >
          <input ref={ref} {...getInputProps()} {...props} />
          
          {preview ? (
            <div className="flex flex-col items-center gap-2">
              <img
                src={preview}
                alt="Preview"
                className="max-h-40 max-w-full rounded shadow-sm"
              />
              <p className="text-sm text-gray-500 mt-2">
                Clique ou arraste para trocar a imagem
              </p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              {isDragActive ? (
                <FileImage className="w-10 h-10 text-primary-500" />
              ) : (
                <Upload className="w-10 h-10 text-gray-400" />
              )}
              <p className="text-sm font-medium text-gray-700">
                {isDragActive
                  ? "Solte o arquivo aqui"
                  : "Clique ou arraste um arquivo"}
              </p>
              <p className="text-xs text-gray-500">{description}</p>
            </div>
          )}
        </div>
        
        {(error || fileError) && (
          <p className="text-sm text-red-500 mt-1">{error || fileError}</p>
        )}
      </div>
    );
  }
);

FileInput.displayName = "FileInput";

import * as React from "react";
import { useState, useRef } from "react";
import { useFetcher } from "react-router";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Textarea } from "~/components/ui/textarea";
import { Label } from "~/components/ui/label";
import { Input } from "~/components/ui/input";
import { Separator } from "~/components/ui/separator";
import { Toaster } from "~/components/ui/sonner";
import { Upload, FileText, Download } from "lucide-react";
import { Alert, AlertDescription } from "~/components/ui/alert";

export function meta() {
  return [
    { title: "Import Data" },
    { name: "description", content: "Import portfolio data from JSON files" },
  ];
}

interface ImportResult {
  success: boolean;
  message: string;
  imported?: {
    portfolios: number;
    institutions: number;
    transactions: number;
  };
  errors?: string[];
}

export default function Import() {
  const [jsonContent, setJsonContent] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const fetcher = useFetcher<ImportResult>();

  const handleFileUpload = (file: File) => {
    if (file.type !== "application/json") {
      toast.error("Please upload a JSON file");
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        JSON.parse(content); // Validate JSON
        setJsonContent(content);
        toast.success("JSON file loaded successfully");
      } catch (error) {
        toast.error("Invalid JSON file");
      }
    };
    reader.readAsText(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileUpload(files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => {
    setDragOver(false);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileUpload(files[0]);
    }
  };

  const handleImport = () => {
    if (!jsonContent.trim()) {
      toast.error("Please provide JSON content to import");
      return;
    }

    try {
      JSON.parse(jsonContent); // Validate JSON before sending
      
      const formData = new FormData();
      formData.append("jsonData", jsonContent);
      
      fetcher.submit(formData, {
        method: "POST",
        action: "/api/import",
      });
    } catch (error) {
      toast.error("Invalid JSON format");
    }
  };

  const clearContent = () => {
    setJsonContent("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Handle fetcher responses
  React.useEffect(() => {
    if (fetcher.state === "idle" && fetcher.data) {
      if (fetcher.data.success) {
        toast.success(fetcher.data.message);
        if (fetcher.data.imported) {
          const { portfolios, institutions, transactions } = fetcher.data.imported;
          toast.success(
            `Import completed: ${portfolios} portfolios, ${institutions} institutions, ${transactions} transactions`
          );
        }
        clearContent();
      } else {
        toast.error(fetcher.data.message);
        if (fetcher.data.errors && fetcher.data.errors.length > 0) {
          fetcher.data.errors.forEach(error => toast.error(error));
        }
      }
    }
  }, [fetcher.state, fetcher.data]);

  return (
    <div className="container mx-auto p-4 sm:p-6 space-y-4 sm:space-y-6">
      <div className="space-y-1 sm:space-y-2">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Import Data</h1>
        <p className="text-muted-foreground text-sm sm:text-base">
          Import portfolio data from Ghostfolio or compatible JSON files.
        </p>
      </div>

      <div className="grid gap-4 sm:gap-6">
        {/* File Upload Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Upload JSON File
            </CardTitle>
            <CardDescription>
              Drag and drop a JSON file or click to select one
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                dragOver 
                  ? "border-primary bg-primary/5" 
                  : "border-muted-foreground/25 hover:border-muted-foreground/50"
              }`}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
            >
              <FileText className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <div className="space-y-2">
                <p className="text-sm font-medium">
                  Drop your JSON file here, or click to browse
                </p>
                <p className="text-xs text-muted-foreground">
                  Supports Ghostfolio export files and compatible formats
                </p>
              </div>
              <Input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={handleFileInput}
                className="hidden"
              />
              <Button 
                variant="outline" 
                className="mt-4"
                onClick={() => fileInputRef.current?.click()}
              >
                Browse Files
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Manual JSON Input Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Paste JSON Data
            </CardTitle>
            <CardDescription>
              Alternatively, paste your JSON data directly
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="json-content">JSON Content</Label>
              <Textarea
                id="json-content"
                placeholder="Paste your JSON data here..."
                value={jsonContent}
                onChange={(e) => setJsonContent(e.target.value)}
                className="min-h-[200px] font-mono text-sm"
              />
            </div>
            
            {jsonContent && (
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={clearContent}
                >
                  Clear
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => {
                    try {
                      const formatted = JSON.stringify(JSON.parse(jsonContent), null, 2);
                      setJsonContent(formatted);
                      toast.success("JSON formatted");
                    } catch (error) {
                      toast.error("Invalid JSON format");
                    }
                  }}
                >
                  Format JSON
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Import Actions */}
        {jsonContent && (
          <Card>
            <CardHeader>
              <CardTitle>Import Preview</CardTitle>
              <CardDescription>
                Review your data before importing
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <AlertDescription>
                  This will import data from the provided JSON file. The import process will:
                  <ul className="list-disc list-inside mt-2 space-y-1">
                    <li>Create new portfolios and institutions if they don't exist</li>
                    <li>Import all transactions and map them to your schema</li>
                    <li>Handle currency mappings and conversions</li>
                    <li>Skip duplicate entries based on existing data</li>
                  </ul>
                </AlertDescription>
              </Alert>
              
              <Separator />
              
              <div className="flex gap-2">
                <Button 
                  onClick={handleImport}
                  disabled={fetcher.state === "submitting" || !jsonContent.trim()}
                  className="flex-1"
                >
                  {fetcher.state === "submitting" ? "Importing..." : "Import Data"}
                </Button>
                <Button variant="outline" onClick={clearContent}>
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Information Section */}
        <Card>
          <CardHeader>
            <CardTitle>Supported Formats</CardTitle>
            <CardDescription>
              Information about compatible JSON formats
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div>
                <h4 className="font-medium">Ghostfolio Export</h4>
                <p className="text-sm text-muted-foreground">
                  JSON files exported from Ghostfolio with portfolios, transactions, and account data.
                </p>
              </div>
              
              <Separator />
              
              <div>
                <h4 className="font-medium">Required Fields</h4>
                <p className="text-sm text-muted-foreground">
                  The JSON should contain: accounts, platforms, activities, and user settings.
                </p>
              </div>
              
              <Separator />
              
              <div>
                <h4 className="font-medium">Data Mapping</h4>
                <div className="text-sm text-muted-foreground space-y-2">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <div className="font-medium text-foreground">Platforms → Institutions</div>
                      <div className="text-xs">
                        • name → name<br/>
                        • url → website
                      </div>
                    </div>
                    <div>
                      <div className="font-medium text-foreground">Accounts → Portfolios</div>
                      <div className="text-xs">
                        • name → name<br/>
                        • currency → currency<br/>
                        • balance → cashBalance<br/>
                        • comment → tags
                      </div>
                    </div>
                    <div>
                      <div className="font-medium text-foreground">Activities → Transactions</div>
                      <div className="text-xs">
                        • type → type (BUY/SELL/DIVIDEND)<br/>
                        • symbol → asset.symbol<br/>
                        • quantity → quantity<br/>
                        • unitPrice → price<br/>
                        • fee → commission<br/>
                        • comment → notes
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Toaster />
    </div>
  );
}

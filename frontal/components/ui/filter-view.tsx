import React, { forwardRef, useImperativeHandle, useRef, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTrigger } from './dialog';
import Editor from '@monaco-editor/react';

type FilterFunction = (data: any[]) => Promise<any[]>;

const TableFilter = forwardRef(({ open, onClose }: { open: boolean; onClose: () => void; }, ref) => {
  const editorRef = useRef<any>(null);
  const workerRef = useRef<Worker | null>(null);

  useEffect(() => {
    const workerScript = `
      self.onmessage = function (e) {
        try {
          const func = new Function("data", e.data.code);
          const result = func(e.data.data);
          self.postMessage({ result });
        } catch (error) {
          self.postMessage({ error: error.message });
        }
      };
    `;
    const blob = new Blob([workerScript], { type: 'application/javascript' });
    workerRef.current = new Worker(URL.createObjectURL(blob));
    
    return () => {
      workerRef.current?.terminate();
    };
  }, []);

  useImperativeHandle(ref, () => ({
    getValue: (): FilterFunction | null => {
      if (editorRef.current && workerRef.current) {
        const code = editorRef.current.getValue();
        return (data: any[]): Promise<any[]> => new Promise((resolve, reject) => {
          if (!workerRef.current) {
            return reject(new Error('Worker is not initialized'));
          }
          workerRef.current.onmessage = e => {
            if (e.data.error) {
              reject(new Error(e.data.error));
            } else {
              resolve(e.data.result);
            }
          };
          workerRef.current.postMessage({ code, data });
        });
      }
      return null;
    },
  }));

  const handleEditorDidMount = (editor: any) => {
    editorRef.current = editor;
  };

  return (
    <Dialog open={open} onOpenChange={state => !state && onClose()}>
      <DialogTrigger></DialogTrigger>
      <DialogContent className="lg:max-w-screen-lg overflow-y-scroll max-h-screen-80">
        <DialogHeader>Filter Editor</DialogHeader>
        <Editor
          onMount={handleEditorDidMount}
          height="70vh"
          defaultLanguage="javascript"
          defaultValue=""
        />
      </DialogContent>
    </Dialog>
  );
});

export default TableFilter;

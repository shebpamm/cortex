import React, {
  forwardRef,
  useImperativeHandle,
  useRef,
  useEffect,
} from "react";
import { Dialog, DialogContent, DialogHeader, DialogTrigger } from "./dialog";
import Editor, { useMonaco } from "@monaco-editor/react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./tabs";

import { CodeBlock } from "react-code-blocks";

type FilterFunction = (data: any[]) => Promise<any[]>;

const TableFilter = forwardRef(
  (
    {
      open,
      onClose,
      sample,
    }: { open: boolean; onClose: () => void; sample: any },
    ref,
  ) => {
    const editorRef = useRef<any>(null);
    const workerRef = useRef<Worker | null>(null);
    const monaco = useMonaco();

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
      const blob = new Blob([workerScript], { type: "application/javascript" });
      workerRef.current = new Worker(URL.createObjectURL(blob));

      return () => {
        workerRef.current?.terminate();
      };
    }, []);

    useImperativeHandle(ref, () => ({
      getValue: (): FilterFunction | null => {
        if (editorRef.current && workerRef.current) {
          const code = editorRef.current.getValue();
          return (data: any[]): Promise<any[]> =>
            new Promise((resolve, reject) => {
              if (!workerRef.current) {
                return reject(new Error("Worker is not initialized"));
              }
              workerRef.current.onmessage = (e) => {
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
      <Dialog open={open} onOpenChange={(state) => !state && onClose()}>
        <DialogTrigger></DialogTrigger>
        <DialogContent className="lg:max-w-screen-lg overflow-y-scroll max-h-screen-80">
          <DialogHeader>Filter Editor</DialogHeader>
          <Tabs defaultValue="node">
            <TabsList>
              <TabsTrigger value="editor">Editor</TabsTrigger>
              <TabsTrigger value="data">Data</TabsTrigger>
            </TabsList>
            <TabsContent value="editor">
              <Editor
                onMount={handleEditorDidMount}
                height="70vh"
                defaultLanguage="javascript"
                defaultValue="return data"
              />
            </TabsContent>
            <TabsContent value="data">
              <CodeBlock text={JSON.stringify(sample, null, 2)} language="json" showLineNumbers={false}/>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>
    );
  },
);

export default TableFilter;

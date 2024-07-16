import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTrigger } from "./dialog";

interface StatCardProps {
  title: string;
  elements: {
    value: string | React.ReactNode;
    label: string | React.ReactNode;
    dialog?: {
      content: React.ReactNode;
      title: string;
    };
  }[];
}

export function StatCard(props: StatCardProps) {
  const elements = props.elements.map((element, index) => (
    <div key={index}>
      {element.dialog && (
        <Dialog>
          <DialogTrigger>
            <div className="hover:-translate-y-1 transition-all ease-in-out">
              <div className="text-4xl font-bold">{element.value}</div>
              <div className="text-sm text-muted-foreground">
                {element.label}
              </div>
            </div>
          </DialogTrigger>
          <DialogContent
            className={"lg:max-w-screen-lg overflow-y-scroll max-h-screen-80"}
          >
            <DialogHeader>{element.dialog.title}</DialogHeader>
            {element.dialog.content}
          </DialogContent>
        </Dialog>
      )}
      {!element.dialog && (
        <div className="hover:-translate-y-1 transition-all ease-in-out">
          <div className="text-3xl font-bold">{element.value}</div>
          <div className="text-sm text-muted-foreground">{element.label}</div>
        </div>
      )}
    </div>
  ));
  return (
    <Card>
      <CardHeader>
        <CardTitle>{props.title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-4">{elements}</div>
      </CardContent>
    </Card>
  );
}

import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

interface StatCardProps {
  title: string;
  elements: {
    value: string | React.ReactNode;
    label: string | React.ReactNode;
  }[];
}


export function StatCard(props: StatCardProps) {
  const elements = props.elements.map((element, index) => (
    <div key={index} className="flex flex-col items-center justify-center">
      <div className="text-4xl font-bold">{element.value}</div>
      <div className="text-sm text-muted-foreground">{element.label}</div>
    </div>
  ));

  return (
    <Card>
      <CardHeader>
        <CardTitle>{props.title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-4">
          {elements}
        </div>
      </CardContent>
    </Card>
  );
}

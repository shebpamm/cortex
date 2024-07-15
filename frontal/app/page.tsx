"use client";

import { Dashboard } from "@/components/dashboard";
import { ApolloClient, InMemoryCache, ApolloProvider } from "@apollo/client";

const client = new ApolloClient({
  uri: process.env.NEXT_PUBLIC_APP_MODE == "production" ? "/graphql" : "http://localhost:3030/graphql",
  cache: new InMemoryCache(),
});

export default function Home() {
  return (
    <main>
      <ApolloProvider client={client}>
        <Dashboard />
      </ApolloProvider>
    </main>
  );
}

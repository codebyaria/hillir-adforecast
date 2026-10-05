import express from "express";

import { configureApp } from "../server/app.js";

const app = express();

app.use((request, _response, next) => {
  const requestUrl = new URL(request.url, "http://vercel.local");
  const rewrittenPath = requestUrl.searchParams.get("__path");

  if (rewrittenPath) {
    requestUrl.searchParams.delete("__path");
    const normalizedPath = rewrittenPath.replace(/^\/+/, "");
    const query = requestUrl.searchParams.toString();
    request.url = `/api/${normalizedPath}${query ? `?${query}` : ""}`;
  }

  next();
});

configureApp(app);

export default app;

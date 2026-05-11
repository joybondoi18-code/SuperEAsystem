"use client";

import { useState } from "react";

export default function IBUploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState("");

  const upload = async () => {
    if (!file) return;

    setLoading(true);
    setResult("");

    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch("/api/ib-sync", {
      method: "POST",
      body: formData,
    });

    const data = await res.json();

    setResult(data.message || "done");
    setLoading(false);
  };

  return (
    <div className="p-6 text-white">
      <h1 className="text-xl mb-4">📊 IB Sync Upload</h1>

      <input
        type="file"
        accept=".csv"
        onChange={(e) => setFile(e.target.files?.[0] || null)}
      />

      <button
        onClick={upload}
        disabled={loading}
        className="ml-3 bg-green-600 px-4 py-2 rounded"
      >
        {loading ? "Uploading..." : "Upload CSV"}
      </button>

      {result && (
        <div className="mt-4 text-yellow-300">
          {result}
        </div>
      )}
    </div>
  );
}
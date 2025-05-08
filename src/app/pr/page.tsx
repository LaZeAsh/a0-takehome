'use client';
import { useState, useEffect } from "react";
import { DiffItem } from "../page";

const PR = () => {
    const [data, setData] = useState<DiffItem | null>(null);
    const [codeResponse, setCodeResponse] = useState<string | null>(null);
    const [marketResponse, setMarketResponse] = useState<string | null>(null);

    useEffect(() => {
        const storedData = localStorage.getItem("diffData");
        if (storedData) {
            setData(JSON.parse(storedData));
        }
    }, []);

    useEffect(() => {
        if (data) {
            const fetchCode = async () => {
                try {
                    const response = await fetch(`/api/stream`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({ 
                            diffItem: data.diff,
                            sysPrompt: `Given github pull request diffs generate concise, technical, notes that focus on the what and why of the change. Give your response as plain string don't use markdown. Your response should be 100 tokens or less. Here's an example of a good response: Refactored \`useFetchDiffs\` hook to use \`useSWR\` for improved caching and reduced re-renders.`
                        }), // Send the diff item
                    });

                    if (!response.ok) {
                        throw new Error(`HTTP error! status: ${response.status}`);
                    }

                    const reader = response.body?.getReader();
                    const decoder = new TextDecoder("utf-8");

                    while (true) {
                        const { done, value } = await reader?.read() || {};
                        if (done) break;
                        setCodeResponse((prev) => (prev || "") + decoder.decode(value, { stream: true }));
                    }
                } catch (error) {
                    console.error("Error fetching code:", error);
                    setCodeResponse("Error fetching PR details");
                }
            };

            // Only difference is system prompt that's passed in
            const fetchMarket = async () => {
                try {
                    const response = await fetch(`/api/stream`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({ 
                            diffItem: data.diff,
                            sysPrompt: `Given github pull request diffs generate user-centric message that highlights the benefit of the change, and use simpler language. Give your response as plain string don't use markdown. Your response should be 100 tokens or less. Here's an example of a good response: "Loading pull requests is now faster and smoother thanks to improved data fetching!"`
                        }), // Send the diff item
                    });

                    if (!response.ok) {
                        throw new Error(`HTTP error! status: ${response.status}`);
                    }

                    const reader = response.body?.getReader();
                    const decoder = new TextDecoder("utf-8");

                    while (true) {
                        const { done, value } = await reader?.read() || {};
                        if (done) break;
                        setMarketResponse((prev) => (prev || "") + decoder.decode(value, { stream: true }));
                    }
                } catch (error) {
                    console.error("Error fetching code:", error);
                    setMarketResponse("Error fetching PR details");
                }
            }

            fetchCode();
            fetchMarket();
        }
    }, [data]);  // Run when data is available

    return (
        <div className="p-6 bg-background text-foreground rounded-2xl shadow-lg space-y-4">
            <h1 className="text-3xl font-bold">PR #{data?.id} Analysis</h1>
            {data ? (
                <div className="grid gap-4 md:grid-cols-2">
                    <div className="p-4 bg-card text-card-foreground rounded-xl shadow-md">
                        <h2 className="text-xl font-semibold">Code Response</h2>
                        <p className="mt-2 text-secondary-foreground">{codeResponse || "Loading..."}</p>
                    </div>
                    <div className="p-4 bg-card text-card-foreground rounded-xl shadow-md">
                        <h2 className="text-xl font-semibold">Market Response</h2>
                        <p className="mt-2 text-secondary-foreground">{marketResponse || "Loading..."}</p>
                    </div>
                </div>
            ) : (
                <p className="text-muted-foreground">No data available / Loading...</p>
            )}
        </div>
    );
};

export default PR;

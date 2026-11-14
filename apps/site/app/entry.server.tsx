import { renderToReadableStream } from "react-dom/server";
import type { EntryContext } from "react-router";
import { ServerRouter } from "react-router";

export default async function handleRequest(
	request: Request,
	responseStatusCode: number,
	responseHeaders: Headers,
	routerContext: EntryContext,
) {
	const body = await renderToReadableStream(<ServerRouter context={routerContext} url={request.url} />, {
		onError(error) {
			console.error(error);
			responseStatusCode = 500;
		},
	});

	// prerender で書き出すので、全部を描き終えてから返す
	await body.allReady;

	responseHeaders.set("Content-Type", "text/html");
	return new Response(body, {
		headers: responseHeaders,
		status: responseStatusCode,
	});
}
